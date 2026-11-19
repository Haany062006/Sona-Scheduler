import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseArrearPdf, SONA_ADS_R2023_CATALOG } from '@/lib/parsers/pdf-parser';
import { DataStore } from '@/lib/db/data-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Session Authentication Check
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('sona_admin_session');
    let isAuthenticated = false;
    if (sessionCookie?.value) {
      try {
        const parsed = JSON.parse(sessionCookie.value);
        if (parsed && parsed.expires && parsed.expires > Date.now()) {
          isAuthenticated = true;
        }
      } catch {}
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Administrative session required to upload arrears document.' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const queryDeptId = url.searchParams.get('department_id');
    const queryBatchId = url.searchParams.get('batch_id');
    const queryBatchName = url.searchParams.get('batch_name');
    const queryCommit = url.searchParams.get('commit') === 'true';
    const queryAutoCreate = url.searchParams.get('auto_create_missing') !== 'false';
    const queryFileName = url.searchParams.get('filename') || 'arrears_result.pdf';

    let buffer: Buffer | null = null;
    let fileName = queryFileName;
    let departmentId: string | null = queryDeptId;
    let batchId: string | null = queryBatchId;
    let batchName: string | null = queryBatchName;
    let commit = queryCommit;
    let autoCreateMissing = queryAutoCreate;

    const contentType = req.headers.get('content-type') || '';

    // Direct binary PDF stream
    if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
      const arrayBuffer = await req.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        const base64Data = body.file_base64 || body.file;
        fileName = body.filename || fileName;
        departmentId = body.department_id || departmentId;
        batchId = body.batch_id || batchId;
        batchName = body.batch_name || batchName;
        commit = body.commit !== undefined ? Boolean(body.commit) : commit;

        if (base64Data) {
          const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
          buffer = Buffer.from(cleanBase64, 'base64');
        }
      } catch (jsonErr: any) {
        return NextResponse.json(
          { error: `Invalid JSON upload payload: ${jsonErr.message}` },
          { status: 400 }
        );
      }
    } else {
      try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        departmentId = (formData.get('department_id') as string | null) || departmentId;
        batchId = (formData.get('batch_id') as string | null) || batchId;
        batchName = (formData.get('batch_name') as string | null) || batchName;
        commit = formData.get('commit') === 'true' || commit;

        if (file) {
          fileName = file.name;
          const ab = await file.arrayBuffer();
          buffer = Buffer.from(ab);
        }
      } catch {
        try {
          const rawBuffer = Buffer.from(await req.arrayBuffer());
          if (rawBuffer.length > 0) {
            buffer = rawBuffer;
          }
        } catch {
          // ignore
        }
      }
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: 'Please select an arrear publication PDF file.' }, { status: 400 });
    }

    // Resolve batch if batchName was supplied instead of batchId
    if (!batchId && batchName) {
      const allBatches = DataStore.getBatches();
      const found = allBatches.find((b) => b.name.toLowerCase() === batchName.trim().toLowerCase());
      if (found) {
        batchId = found.id;
      } else {
        const parts = batchName.trim().split('-');
        const sYear = parseInt(parts[0], 10) || new Date().getFullYear();
        const eYear = parts[1] ? parseInt(parts[1], 10) : sYear + 4;
        const newBatch = DataStore.addBatch(batchName.trim(), sYear, eYear);
        batchId = newBatch.id;
      }
    }

    if (!departmentId || !batchId) {
      return NextResponse.json(
        { error: 'Department and Batch are required for arrear reconciliation.' },
        { status: 400 }
      );
    }

    // Parse items from PDF
    const parsed = await parseArrearPdf(buffer);

    if (parsed.items.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid register number and arrear subject pairs detected in PDF.',
          warnings: parsed.warnings,
        },
        { status: 422 }
      );
    }

    // Load students with fallback from target batch -> department-wide -> college-wide
    const targetBatchStudents = DataStore.getStudents({ department_id: departmentId, batch_id: batchId });
    const allDeptStudents = DataStore.getStudents({ department_id: departmentId });
    const allStudents = DataStore.getStudents();

    const studentMap = new Map<string, (typeof allStudents)[0]>();
    for (const s of allStudents) studentMap.set(s.register_number.trim().toUpperCase(), s);
    for (const s of allDeptStudents) studentMap.set(s.register_number.trim().toUpperCase(), s);
    for (const s of targetBatchStudents) studentMap.set(s.register_number.trim().toUpperCase(), s);

    const subjects = DataStore.getSubjects();
    const existingArrears = DataStore.getArrears(departmentId, batchId);

    const subjectMap = new Map<string, (typeof subjects)[0]>();
    for (const sub of subjects) {
      subjectMap.set(sub.code.trim().toUpperCase(), sub);
    }

    // Auto-create missing catalog subjects so they match seamlessly
    const allRegs = DataStore.getRegulations();
    const defaultRegId = allRegs.find((r) => r.code.toUpperCase().includes('2023'))?.id || allRegs[0]?.id || 'reg-r2023';

    for (const item of parsed.items) {
      const codeClean = item.subject_code.trim().toUpperCase();
      if (!subjectMap.has(codeClean)) {
        const subKey = Object.keys(SONA_ADS_R2023_CATALOG).find(
          (k) => k.toUpperCase() === codeClean
        );
        const catInfo = subKey ? SONA_ADS_R2023_CATALOG[subKey] : undefined;
        if (catInfo) {
          try {
            const addedSub = DataStore.addSubject(
              codeClean,
              catInfo.name,
              defaultRegId,
              item.semester || catInfo.semester || 1,
              [departmentId],
              catInfo.is_common ?? false
            );
            subjectMap.set(codeClean, addedSub);
          } catch {}
        }
      }
    }

    // Existing active arrears set: key = `${student_id}_${subject_id}`
    const activeArrearKeys = new Set(
      existingArrears
        .filter((a: any) => a.status === 'active')
        .map((a: any) => `${a.student_id}_${a.subject_id}`)
    );

    // Reconcile each parsed item
    const reconciledItems = parsed.items.map((item, idx) => {
      const regClean = item.register_number.trim().toUpperCase();
      const codeClean = item.subject_code.trim().toUpperCase();

      const matchedStudent = studentMap.get(regClean);
      const matchedSubject = subjectMap.get(codeClean);

      let status: 'ready' | 'unknown_student' | 'unknown_subject' | 'duplicate_active' = 'ready';
      let message = 'Ready to import';

      if (!matchedStudent) {
        status = 'unknown_student';
        message = `Register number "${regClean}" is not in the student master list for this department/batch.`;
      } else if (!matchedSubject) {
        status = 'unknown_subject';
        message = `Subject code "${codeClean}" is not found in the syllabus catalog.`;
      } else if (activeArrearKeys.has(`${matchedStudent.id}_${matchedSubject.id}`)) {
        status = 'duplicate_active';
        message = `Active arrear already recorded for this student and subject.`;
      }

      return {
        id: `row-${idx + 1}`,
        register_number: regClean,
        student_id: matchedStudent?.id || null,
        student_name: matchedStudent?.name || item.student_name || 'Unknown Student',
        section: matchedStudent?.section || '—',
        subject_code: codeClean,
        subject_id: matchedSubject?.id || null,
        subject_name: matchedSubject?.name || 'Unknown Subject',
        semester_number: item.semester || (matchedSubject ? (matchedSubject.semester_number || (matchedSubject as any).semester || 1) : 1),
        result_status: item.result_status,
        status,
        message,
        raw_line: item.raw_line,
      };
    });

    const readyCount = reconciledItems.filter((r) => r.status === 'ready').length;
    const unknownStudentCount = reconciledItems.filter((r) => r.status === 'unknown_student').length;
    const unknownSubjectCount = reconciledItems.filter((r) => r.status === 'unknown_subject').length;
    const duplicateCount = reconciledItems.filter((r) => r.status === 'duplicate_active').length;

    if (!commit) {
      return NextResponse.json({
        success: true,
        preview_mode: true,
        totalPages: parsed.totalPages,
        totalExtracted: reconciledItems.length,
        summary: {
          ready: readyCount,
          unknownStudents: unknownStudentCount,
          unknownSubjects: unknownSubjectCount,
          duplicates: duplicateCount,
          canAutoCreate: autoCreateMissing,
        },
        items: reconciledItems,
        warnings: parsed.warnings,
      });
    }

    // Commit items (auto-creating missing students/subjects if enabled)
    let committedCount = 0;
    const errors: string[] = [];

    for (const item of reconciledItems) {
      let finalStudentId = item.student_id;
      let finalSubjectId = item.subject_id;

      if (!finalStudentId && autoCreateMissing) {
        try {
          const s = DataStore.addStudent(
            item.register_number,
            item.student_name !== 'Unknown Student' ? item.student_name : `Student ${item.register_number}`,
            departmentId,
            batchId,
            'A'
          );
          finalStudentId = s.id;
          studentMap.set(item.register_number, s);
        } catch (e: any) {
          console.warn('Auto-create student warning:', e.message);
        }
      }

      if (!finalSubjectId && autoCreateMissing) {
        try {
          const regs = DataStore.getRegulations();
          let regId = regs[0]?.id;
          if (!regId) {
            const newReg = DataStore.addRegulation('R2023', 2023, 'Curriculum Regulation R2023');
            regId = newReg.id;
          }
          const isCommon = /ENG|MAT|PHY|CHE|TAM|GE|BEE|CPR|EGR|CPL/i.test(item.subject_code);
          const sub = DataStore.addSubject(
            item.subject_code,
            item.subject_name !== 'Unknown Subject' ? item.subject_name : `${item.subject_code} Course`,
            regId,
            item.semester_number || 1,
            isCommon ? [] : [departmentId],
            isCommon
          );
          finalSubjectId = sub.id;
          subjectMap.set(item.subject_code, sub);
        } catch (e: any) {
          console.warn('Auto-create subject warning:', e.message);
        }
      }

      if (finalStudentId && finalSubjectId && !activeArrearKeys.has(`${finalStudentId}_${finalSubjectId}`)) {
        try {
          DataStore.addArrear({
            student_id: finalStudentId,
            subject_id: finalSubjectId,
            status: 'active',
            source_file: fileName,
          });
          activeArrearKeys.add(`${finalStudentId}_${finalSubjectId}`);
          committedCount++;
        } catch (err: any) {
          errors.push(`Row ${item.register_number} - ${item.subject_code}: ${err.message}`);
        }
      }
    }

    DataStore.logAction(
      'IMPORT_ARREARS_PDF',
      'arrear',
      `batch_${batchId}`,
      {
        fileName,
        extracted: reconciledItems.length,
        committed: committedCount,
        duplicatesSkipped: duplicateCount,
        unknownStudents: unknownStudentCount,
        unknownSubjects: unknownSubjectCount,
      }
    );

    return NextResponse.json({
      success: true,
      committed: true,
      arrears_added: committedCount,
      duplicates_skipped: duplicateCount,
      unresolved_count: unknownStudentCount + unknownSubjectCount,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to process arrear PDF.' }, { status: 500 });
  }
}
