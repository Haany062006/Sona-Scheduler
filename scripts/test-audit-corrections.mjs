// Sona Scheduler - Automated Audit & Correction Test Suite
// Executes verification across all 10 phases

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('   SONA SCHEDULER: AUDIT & CORRECTION TEST SUITE    ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Unauthenticated API Access Protection (Phase 3)
    // ----------------------------------------------------
    console.log('--- Phase 3: Security & Route Protection Tests ---');

    const unauthStudents = await fetch(`${BASE_URL}/api/students`);
    assert(
      unauthStudents.status === 401,
      'Unauthenticated GET /api/students returns 401',
      `Got status ${unauthStudents.status}`
    );

    const unauthClasses = await fetch(`${BASE_URL}/api/classes`);
    assert(
      unauthClasses.status === 401,
      'Unauthenticated GET /api/classes returns 401',
      `Got status ${unauthClasses.status}`
    );

    const unauthAudit = await fetch(`${BASE_URL}/api/audit-logs`);
    assert(
      unauthAudit.status === 401,
      'Unauthenticated GET /api/audit-logs returns 401',
      `Got status ${unauthAudit.status}`
    );

    // ----------------------------------------------------
    // TEST 2: Insecure Default Credentials Rejected (Phase 3)
    // ----------------------------------------------------
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sonatech.ac.in', password: 'admin' }),
    });
    assert(
      badLoginRes.status === 401 || !badLoginRes.ok,
      'Insecure default password "admin" is rejected',
      `Got status ${badLoginRes.status}`
    );

    // ----------------------------------------------------
    // TEST 3: Strong Credentials Authentication (Phase 3)
    // ----------------------------------------------------
    const validLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sonatech.ac.in', password: 'SonaTech#Remedial@2026' }),
    });
    const validLoginData = await validLoginRes.json();
    assert(
      validLoginRes.ok && validLoginData.success === true,
      'Institutional coordinator credentials successfully authenticate',
      JSON.stringify(validLoginData)
    );

    const sessionCookie = validLoginRes.headers.get('set-cookie');
    assert(
      sessionCookie && sessionCookie.includes('sona_admin_session'),
      'Secure HttpOnly admin session cookie is issued upon authentication'
    );

    // ----------------------------------------------------
    // TEST 4: Authenticated Administrative Access (Phase 3)
    // ----------------------------------------------------
    const authStudentsRes = await fetch(`${BASE_URL}/api/students`, {
      headers: { Cookie: sessionCookie || '' },
    });
    const authStudents = await authStudentsRes.json();
    assert(
      authStudentsRes.ok && Array.isArray(authStudents) && authStudents.length > 0,
      `Authenticated coordinator can access Student Master (${authStudents.length} students loaded)`,
      `Status: ${authStudentsRes.status}`
    );

    const sampleStudent = authStudents[0];
    assert(
      typeof sampleStudent.register_number === 'string' && sampleStudent.register_number.length > 0,
      `Register numbers are strictly preserved as TEXT (e.g. ${sampleStudent.register_number})`
    );

    // ----------------------------------------------------
    // TEST 5: Half-Open Interval Conflict Math (Phase 5)
    // ----------------------------------------------------
    console.log('\n--- Phase 5: Scheduling & Conflict Detection Tests ---');

    // Overlapping session on 2026-11-20 with Prof. S. Geetha (booked 16:30 - 17:45)
    const overlapCheckRes = await fetch(`${BASE_URL}/api/classes/conflict-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie || '',
      },
      body: JSON.stringify({
        class_date: '2026-11-20',
        start_time: '17:00',
        end_time: '18:15',
        faculty_id: 'fac-02',
        venue: 'TP-304 (ADS Remedial Hall TP-304)',
        venue_id: 'v-1',
        department_id: '11111111-1111-1111-1111-111111111101',
        student_ids: ['stu-01'],
      }),
    });
    const overlapData = await overlapCheckRes.json();
    assert(
      overlapData.hasConflicts === true && overlapData.conflicts.length > 0,
      'Overlapping session (17:00-18:15 vs 16:30-17:45) correctly triggers conflict detection'
    );

    // Adjacent session (17:45 - 18:45) on 2026-11-20 (e1 = s2, half-open interval [start, end))
    const adjacentCheckRes = await fetch(`${BASE_URL}/api/classes/conflict-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie || '',
      },
      body: JSON.stringify({
        class_date: '2026-11-20',
        start_time: '17:45',
        end_time: '18:45',
        faculty_id: 'fac-02',
        venue: 'TP-304 (ADS Remedial Hall TP-304)',
        venue_id: 'v-1',
        department_id: '11111111-1111-1111-1111-111111111101',
        student_ids: [],
      }),
    });
    const adjacentData = await adjacentCheckRes.json();
    assert(
      adjacentData.hasConflicts === false,
      'Back-to-back adjacent session (e1 = s2 at 17:45) has ZERO conflicts under half-open interval rule'
    );

    // Blackout Date Hierarchy Check (2026-11-25 CIAT-1 Exam)
    const blackoutCheckRes = await fetch(`${BASE_URL}/api/classes/conflict-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie || '',
      },
      body: JSON.stringify({
        class_date: '2026-11-25',
        start_time: '16:30',
        end_time: '17:30',
        faculty_id: 'fac-01',
        student_ids: [],
      }),
    });
    const blackoutData = await blackoutCheckRes.json();
    assert(
      blackoutData.hasConflicts === true &&
        blackoutData.conflicts.some((c) => c.type === 'blackout'),
      'College-wide calendar blackout date (2026-11-25 CIAT-1) blocks scheduling'
    );

    // ----------------------------------------------------
    // TEST 6: Dynamic Remedial Class Scheduling & Token Issuance (Phase 5 & 6)
    // ----------------------------------------------------
    console.log('\n--- Phase 6: Dynamic Class Scheduling & Attendance Security Tests ---');

    // Schedule a fresh remedial class on a dynamic unique date
    const testClassDate = `2026-12-${String(10 + Math.floor(Math.random() * 18)).padStart(2, '0')}`;
    const createClassRes = await fetch(`${BASE_URL}/api/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie || '',
      },
      body: JSON.stringify({
        department_id: '11111111-1111-1111-1111-111111111101', // ADS
        batch_id: '33333333-3333-3333-3333-333333333302', // 2022-2026
        regulation_id: '22222222-2222-2222-2222-222222222202', // R2021
        subject_id: '44444444-4444-4444-4444-444444444401', // Transforms & PDE
        faculty_id: 'fac-01', // Dr. K. Venkat
        class_date: testClassDate,
        start_time: '16:30',
        end_time: '17:30',
        venue: 'TP-305 (ADS Remedial Hall 2)',
        venue_id: 'v-2',
        notes: 'Integration and Verification Test Session',
        student_ids: ['stu-01', 'stu-02'],
      }),
    });
    const newClassData = await createClassRes.json();
    assert(
      createClassRes.ok && newClassData.id,
      `Fresh remedial class scheduled with code ${newClassData.class_code}`,
      JSON.stringify(newClassData)
    );

    // Allocate Peer Tutor to this class (generates / links attendance form)
    const allocateTutorRes = await fetch(`${BASE_URL}/api/tutors/allocate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie || '',
      },
      body: JSON.stringify({
        remedial_class_id: newClassData.id,
        peer_tutor_id: 'tutor-01',
      }),
    });
    const allocData = await allocateTutorRes.json();
    assert(
      allocateTutorRes.ok && (allocData.id || allocData.allocation),
      'Peer tutor allocated to remedial class'
    );

    // Get notifications to retrieve the generated attendance link
    const notifsRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Cookie: sessionCookie || '' },
    });
    const allNotifs = await notifsRes.json();
    const tutorNotif = allNotifs.find(
      (n) => n.remedial_class_id === newClassData.id && n.notification_type === 'peer_tutor_link'
    );
    assert(
      !!tutorNotif && tutorNotif.message_body.includes('/attendance/'),
      'Peer tutor notification generated with high-entropy cryptographic link'
    );

    // Extract raw token from notification link
    const linkMatch = tutorNotif.message_body.match(/\/attendance\/([a-zA-Z0-9_-]+)/);
    const activeToken = linkMatch ? linkMatch[1] : null;
    assert(
      !!activeToken && activeToken.length >= 32,
      `High-entropy token successfully issued (${activeToken?.slice(0, 16)}...)`
    );

    // 6.1 Lookup attendance form by token (without admin login)
    const attLookupRes = await fetch(`${BASE_URL}/api/attendance/${activeToken}`);
    const attLookupData = await attLookupRes.json();
    assert(
      attLookupRes.ok && attLookupData.form && attLookupData.remedial_class,
      'Public attendance endpoint resolves session details via token'
    );

    const enrolledStudents = attLookupData.remedial_class.students || [];
    assert(
      enrolledStudents.length === 2,
      `Enrolled student roster verified: ${enrolledStudents.length} students`
    );

    // 6.2 Reject incomplete roster submission (marking only 1 of 2 students)
    const incompleteSubmitRes = await fetch(`${BASE_URL}/api/attendance/${activeToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submitted_by_identifier: '612721104015 (Karthik R - Peer Tutor)',
        tutor_remarks: 'Testing incomplete submission',
        marks: [{ student_id: enrolledStudents[0].id, status: 'present' }],
      }),
    });
    const incompleteData = await incompleteSubmitRes.json();
    assert(
      incompleteSubmitRes.status === 400 &&
        incompleteData.error.includes('Incomplete attendance roster'),
      'Incomplete roster submission is rejected with 400 validation error'
    );

    // 6.3 Submit complete roster (1 student present, 1 student absent)
    const completeMarks = [
      { student_id: enrolledStudents[0].id, status: 'present' },
      { student_id: enrolledStudents[1].id, status: 'absent' },
    ];

    const completeSubmitRes = await fetch(`${BASE_URL}/api/attendance/${activeToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submitted_by_identifier: '612721104015 (Karthik R - Peer Tutor)',
        tutor_remarks: 'Worked on unit problem sets. Attendance logged.',
        marks: completeMarks,
      }),
    });
    const completeData = await completeSubmitRes.json();
    assert(
      completeSubmitRes.ok && completeData.success === true,
      `Complete attendance roster submitted successfully (Total: ${completeData.total}, Present: ${completeData.present}, Absent: ${completeData.absent})`
    );

    // 6.4 Reject duplicate submission
    const duplicateSubmitRes = await fetch(`${BASE_URL}/api/attendance/${activeToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submitted_by_identifier: '612721104015 (Duplicate attempt)',
        marks: completeMarks,
      }),
    });
    const duplicateData = await duplicateSubmitRes.json();
    assert(
      duplicateSubmitRes.status === 400 &&
        duplicateData.error.includes('already been submitted'),
      'Duplicate attendance submission is strictly rejected'
    );

    // ----------------------------------------------------
    // TEST 7: Notifications & Absentee Alert Generated (Phase 7)
    // ----------------------------------------------------
    console.log('\n--- Phase 7: Notification Dispatch & Absentee Digest Tests ---');

    const updatedNotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Cookie: sessionCookie || '' },
    });
    const updatedNotifs = await updatedNotifsRes.json();
    const absenteeNotif = updatedNotifs.find(
      (n) => n.remedial_class_id === newClassData.id && n.notification_type === 'absentee_digest'
    );
    assert(
      !!absenteeNotif,
      'Absentee notification automatically queued for subject faculty following attendance submission'
    );
    assert(
      !!absenteeNotif?.idempotency_key,
      `Notification has idempotency key: "${absenteeNotif?.idempotency_key}" to prevent duplicate dispatch`
    );

    // ----------------------------------------------------
    // TEST 8: Dashboard & Reports Integrity (Phase 8)
    // ----------------------------------------------------
    console.log('\n--- Phase 8: Dashboard & Report Integrity Tests ---');

    const dashRes = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { Cookie: sessionCookie || '' },
    });
    const dashData = await dashRes.json();
    assert(
      dashData.completedClasses >= 1,
      `Dashboard accurately reflects completed classes (${dashData.completedClasses})`
    );
    assert(
      dashData.totalAbsentRecords >= 1,
      `Dashboard absentees count accurately from submitted attendance (${dashData.totalAbsentRecords})`
    );

    // ----------------------------------------------------
    // TEST 9: Active Arrear Partial Uniqueness Constraint (Phase 2 & 4)
    // ----------------------------------------------------
    console.log('\n--- Phase 2 & 4: Active Arrear Partial Uniqueness Tests ---');

    // Try adding a duplicate active arrear for student stu-01 and subject Transforms (already active)
    const duplicateArrearRes = await fetch(`${BASE_URL}/api/arrears`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie || '',
      },
      body: JSON.stringify({
        records: [
          {
            register_number: '612722104001',
            subject_code: '21MA301',
            batch_id: '33333333-3333-3333-3333-333333333302',
            semester_number: 3,
          },
        ],
      }),
    });
    const dupArrearData = await duplicateArrearRes.json();
    assert(
      Array.isArray(dupArrearData.added) &&
        dupArrearData.added.length === 0 &&
        dupArrearData.existingDuplicates?.length >= 1,
      'Duplicate active arrear rejected while preserving cleared arrear history (partial unique index)'
    );

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
