import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseSyllabusPdf } from '@/lib/parsers/pdf-parser';
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
        { error: 'Unauthorized. Administrative session required to upload syllabus.' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const queryRegCode = url.searchParams.get('regulation_code');
    const queryRegId = url.searchParams.get('regulation_id');
    const queryDeptId = url.searchParams.get('department_id');
    const queryCommit = url.searchParams.get('commit') === 'true';
    const queryFileName = url.searchParams.get('filename') || 'syllabus.pdf';

    let buffer: Buffer | null = null;
    let fileName = queryFileName;
    let regulationId: string | null = queryRegId;
    let regulationCode: string | null = queryRegCode;
    let departmentId: string | null = queryDeptId;
    let commit = queryCommit;

    const contentType = req.headers.get('content-type') || '';

    // Direct binary PDF stream (Most efficient, handles files up to 100MB+ with zero overhead)
    if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
      const arrayBuffer = await req.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        const base64Data = body.file_base64 || body.file;
        fileName = body.filename || fileName;
        regulationId = body.regulation_id || regulationId;
        regulationCode = body.regulation_code || regulationCode;
        departmentId = body.department_id || departmentId;
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
      // Try form-data or raw buffer
      try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        regulationId = (formData.get('regulation_id') as string | null) || regulationId;
        regulationCode = (formData.get('regulation_code') as string | null) || regulationCode;
        departmentId = (formData.get('department_id') as string | null) || departmentId;
        commit = formData.get('commit') === 'true' || commit;

        if (file) {
          fileName = file.name;
          const ab = await file.arrayBuffer();
          buffer = Buffer.from(ab);
        }
      } catch {
        // Fallback to reading raw body bytes
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
      return NextResponse.json({ error: 'Please select a valid syllabus PDF file to upload.' }, { status: 400 });
    }

    // Resolve regulation (either from regulationId or manual regulationCode)
    let finalRegId = regulationId;
    if (!finalRegId && regulationCode) {
      const cleanCode = regulationCode.trim().toUpperCase();
      const existing = DataStore.getRegulations();
      const matched = existing.find((r) => r.code.toUpperCase() === cleanCode);
      if (matched) {
        finalRegId = matched.id;
        regulationCode = matched.code;
      } else {
        const yearMatch = cleanCode.match(/\d{4}/);
        const startYear = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();
        const created = DataStore.addRegulation(cleanCode, startYear, `Curriculum Regulation ${cleanCode}`);
        finalRegId = created.id;
        regulationCode = created.code;
      }
    } else if (finalRegId && !regulationCode) {
      const reg = DataStore.getRegulations().find((r) => r.id === finalRegId);
      if (reg) regulationCode = reg.code;
    }

    if (!finalRegId) {
      return NextResponse.json({ error: 'Please specify an academic regulation code (e.g. R2021).' }, { status: 400 });
    }

    // Parse syllabus text from PDF
    const parsed = await parseSyllabusPdf(buffer);

    if (parsed.subjects.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid course codes were found in the uploaded PDF.',
          warnings: parsed.warnings,
        },
        { status: 422 }
      );
    }

    // Check against existing subjects
    const existingSubjects = DataStore.getSubjects();
    const existingCodes = new Set(existingSubjects.map((s) => s.code.toUpperCase()));

    const preview = parsed.subjects.map((s) => ({
      ...s,
      is_existing: existingCodes.has(s.code.toUpperCase()),
    }));

    if (!commit) {
      return NextResponse.json({
        success: true,
        preview_mode: true,
        regulation_id: finalRegId,
        regulation_code: regulationCode,
        detected_regulation_year: parsed.regulation_year,
        detected_semester: parsed.detected_semester,
        total_subjects_found: parsed.subjects.length,
        new_subjects_count: preview.filter((p) => !p.is_existing).length,
        existing_subjects_count: preview.filter((p) => p.is_existing).length,
        subjects: preview,
        warnings: parsed.warnings,
      });
    }

    // Commit to database
    let addedCount = 0;
    const committed: any[] = [];

    for (const item of preview) {
      if (!item.is_existing) {
        try {
          const subject = DataStore.addSubject(
            item.code,
            item.name,
            finalRegId,
            item.semester,
            item.is_common ? [] : (departmentId ? [departmentId] : []),
            item.is_common
          );
          committed.push(subject);
          addedCount++;
        } catch (err: any) {
          console.warn(`Could not add subject ${item.code}:`, err.message);
        }
      }
    }

    DataStore.logAction(
      'IMPORT_SYLLABUS_PDF',
      'regulation',
      finalRegId,
      {
        fileName,
        subjectsParsed: preview.length,
        subjectsAdded: addedCount,
      }
    );

    return NextResponse.json({
      success: true,
      committed: true,
      regulation_id: finalRegId,
      regulation_code: regulationCode,
      subjects_added: addedCount,
      total_subjects_in_doc: preview.length,
      subjects: committed,
    });
  } catch (err: any) {
    console.error('Error processing syllabus PDF:', err);
    return NextResponse.json({ error: err.message || 'Failed to process syllabus PDF.' }, { status: 500 });
  }
}
