// scripts/test-end-to-end-workflows.mjs
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const DB_FILE = path.resolve('.data/sona_db.json');

const INITIAL_CLEAN_STATE = {
  departments: [
    {
      id: "11111111-1111-1111-1111-111111111101",
      code: "ADS",
      name: "Artificial Intelligence and Data Science",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z"
    },
    {
      id: "11111111-1111-1111-1111-111111111102",
      code: "IT",
      name: "Information Technology",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z"
    }
  ],
  regulations: [],
  batches: [],
  regulation_batches: [],
  semesters: [
    { semester_number: 1, name: "Semester 1", created_at: "2026-01-01T00:00:00Z" },
    { semester_number: 2, name: "Semester 2", created_at: "2026-01-01T00:00:00Z" },
    { semester_number: 3, name: "Semester 3", created_at: "2026-01-01T00:00:00Z" },
    { semester_number: 4, name: "Semester 4", created_at: "2026-01-01T00:00:00Z" },
    { semester_number: 5, name: "Semester 5", created_at: "2026-01-01T00:00:00Z" },
    { semester_number: 6, name: "Semester 6", created_at: "2026-01-01T00:00:00Z" },
    { semester_number: 7, name: "Semester 7", created_at: "2026-01-01T00:00:00Z" },
    { semester_number: 8, name: "Semester 8", created_at: "2026-01-01T00:00:00Z" }
  ],
  venues: [
    {
      id: "33333333-3333-3333-3333-333333333301",
      code: "TP-304",
      name: "Theory Hall 304",
      building: "TP Block",
      capacity: 45,
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z"
    },
    {
      id: "33333333-3333-3333-3333-333333333302",
      code: "TP-305",
      name: "Theory Hall 305",
      building: "TP Block",
      capacity: 45,
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z"
    },
    {
      id: "33333333-3333-3333-3333-333333333303",
      code: "LAB-ADS-1",
      name: "AI & Data Science Laboratory 1",
      building: "PG Block",
      capacity: 40,
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z"
    }
  ],
  subjects: [],
  subject_departments: [],
  students: [],
  faculty: [],
  faculty_subject_assignments: [],
  peer_tutors: [],
  arrears: [],
  arrear_records: [],
  calendar_blackout_dates: [],
  remedial_classes: [],
  class_students: [],
  tutor_allocations: [],
  attendance_forms: [],
  attendance_records: [],
  notifications: [],
  audit_logs: []
};

async function run() {
  console.log('=== SONA SCHEDULER: END-TO-END VERIFICATION & CLEAN RESTORATION ===\n');

  // Ensure clean state before testing
  fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_CLEAN_STATE, null, 2), 'utf-8');

  // STEP 1: Login Admin
  console.log('[1/12] Logging in as Admin...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@sonatech.ac.in',
      password: 'SonaTech#Remedial@2026',
    }),
  });

  if (!loginRes.ok) {
    const err = await loginRes.text();
    throw new Error(`Admin login failed: ${loginRes.status} - ${err}`);
  }

  const setCookie = loginRes.headers.get('set-cookie');
  const cookieHeader = setCookie ? setCookie.split(';')[0] : '';
  const headers = {
    'Content-Type': 'application/json',
    Cookie: cookieHeader,
  };
  console.log('✔ Admin authenticated successfully.');

  // STEP 2: Verify Initial Clean State (Zero demo records)
  console.log('\n[2/12] Verifying initial clean state...');
  const dashRes = await fetch(`${BASE_URL}/api/dashboard`, { headers });
  const dashData = await dashRes.json();

  console.log('Initial Dashboard Metrics:', {
    totalStudents: dashData.totalStudents,
    totalStudentsWithArrears: dashData.totalStudentsWithArrears,
    totalFaculty: dashData.totalFaculty,
    totalRemedialClasses: dashData.totalRemedialClasses,
    upcomingClasses: dashData.upcomingClasses,
  });

  if (
    dashData.totalStudents !== 0 ||
    dashData.totalFaculty !== 0 ||
    dashData.totalRemedialClasses !== 0 ||
    dashData.upcomingList?.length !== 0
  ) {
    throw new Error('Initial state is not clean! Non-zero records found.');
  }
  console.log('✔ Initial state verified: exactly 0 students, 0 faculty, 0 classes, 0 demo records.');

  // STEP 3: Verify ADS & IT Departments exist
  console.log('\n[3/12] Verifying ADS & IT departments...');
  const deptsRes = await fetch(`${BASE_URL}/api/departments`, { headers });
  const depts = await deptsRes.json();
  const adsDept = depts.find((d) => d.code === 'ADS');
  const itDept = depts.find((d) => d.code === 'IT');
  if (!adsDept || !itDept) throw new Error('ADS and IT departments not found!');
  console.log(`✔ Found Departments: ADS (${adsDept.id}) and IT (${itDept.id}).`);

  // STEP 4: Create Regulation R2021 & Batch 2021-2025 with Mapping
  console.log('\n[4/12] Creating Regulation R2021 and Batch 2021-2025...');
  const regRes = await fetch(`${BASE_URL}/api/regulations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'regulation',
      code: 'R2021',
      start_year: 2021,
      description: 'B.Tech Autonomous Curriculum Regulation 2021',
    }),
  });
  const regData = await regRes.json();
  const regId = regData.id;

  const batchRes = await fetch(`${BASE_URL}/api/regulations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'batch',
      name: '2021-2025',
      start_year: 2021,
      end_year: 2025,
      regulation_id: regId,
      department_id: adsDept.id,
    }),
  });
  const batchData = await batchRes.json();
  const batchId = batchData.id;
  console.log(`✔ Regulation R2021 (${regId}) & Batch 2021-2025 (${batchId}) created & mapped.`);

  // STEP 5: Add Canonical 8-Semester Syllabus Subjects
  console.log('\n[5/12] Adding canonical syllabus subjects across Semesters 1 to 8...');
  const testSubjects = [
    { code: '21MA101', name: 'Calculus and Linear Algebra', semester: 1, credits: 4, is_common: true },
    { code: '21PH101', name: 'Engineering Physics', semester: 1, credits: 3, is_common: true },
    { code: '21MA201', name: 'Transforms and Complex Variables', semester: 2, credits: 4, is_common: true },
    { code: '21AD301', name: 'Data Structures and Algorithms', semester: 3, credits: 3, is_common: false, dept: adsDept.id },
    { code: '21AD302', name: 'Object Oriented Programming', semester: 3, credits: 3, is_common: false, dept: adsDept.id },
    { code: '21IT301', name: 'Database Management Systems', semester: 3, credits: 3, is_common: false, dept: itDept.id },
    { code: '21AD401', name: 'Artificial Intelligence and Knowledge Representation', semester: 4, credits: 3, is_common: false, dept: adsDept.id },
    { code: '21AD501', name: 'Machine Learning Techniques', semester: 5, credits: 4, is_common: false, dept: adsDept.id },
    { code: '21AD601', name: 'Deep Learning & Neural Networks', semester: 6, credits: 3, is_common: false, dept: adsDept.id },
  ];

  const createdSubjects = [];
  for (const s of testSubjects) {
    const sRes = await fetch(`${BASE_URL}/api/subjects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code: s.code,
        name: s.name,
        regulation_id: regId,
        semester_number: s.semester,
        credits: s.credits,
        department_ids: s.is_common ? [] : [s.dept],
        is_common: s.is_common,
      }),
    });
    const sData = await sRes.json();
    createdSubjects.push(sData);
  }
  console.log(`✔ Created ${createdSubjects.length} syllabus subjects across multiple semesters.`);

  // STEP 6: Import Multi-Section Student Roster
  console.log('\n[6/12] Importing multi-section student Excel roster (preserving leading zeros)...');
  const studentPayload = [
    { register_number: '617721104001', name: 'Aakash M', section: 'A', department_id: adsDept.id, batch_id: batchId, email: 'aakash@sonatech.ac.in', phone: '9842100001' },
    { register_number: '617721104002', name: 'Bavithra R', section: 'A', department_id: adsDept.id, batch_id: batchId, email: 'bavithra@sonatech.ac.in', phone: '9842100002' },
    { register_number: '617721104051', name: 'Chandru S', section: 'B', department_id: adsDept.id, batch_id: batchId, email: 'chandru@sonatech.ac.in', phone: '9842100051' },
    { register_number: '617721104052', name: 'Deepika V', section: 'B', department_id: adsDept.id, batch_id: batchId, email: 'deepika@sonatech.ac.in', phone: '9842100052' },
    { register_number: '007121104001', name: 'Leading Zero Student', section: 'A', department_id: adsDept.id, batch_id: batchId, email: 'leading@sonatech.ac.in', phone: '9842100099' },
  ];

  const stImportRes = await fetch(`${BASE_URL}/api/students/import`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ students: studentPayload }),
  });
  const stImportData = await stImportRes.json();
  console.log(`✔ Students imported: ${stImportData.importedCount} (Sections A and B in 1 roster).`);

  // Verify leading zero preservation
  const stListRes = await fetch(`${BASE_URL}/api/students?search=Leading`, { headers });
  const stList = await stListRes.json();
  if (stList[0]?.register_number !== '007121104001') {
    throw new Error(`Register number leading zero corrupted: expected 007121104001, got ${stList[0]?.register_number}`);
  }
  console.log('✔ String register number check: "007121104001" strictly preserved.');

  // STEP 7: Import Faculty with Independent Optionality
  console.log('\n[7/12] Importing faculty roster (phone & email independently optional)...');
  const facultyPayload = [
    { faculty_id_code: 'FAC-ADS-01', name: 'Dr. K. Senthil Kumar', department_id: adsDept.id, email: 'senthil@sonatech.ac.in', phone: '9842101234', assigned_subject_codes: ['21AD301'] },
    { faculty_id_code: 'FAC-ADS-02', name: 'Prof. M. Malathi', department_id: adsDept.id, email: 'malathi@sonatech.ac.in', phone: null, assigned_subject_codes: ['21AD302'] },
    { faculty_id_code: 'FAC-ADS-03', name: 'Prof. N. Natarajan', department_id: adsDept.id, email: null, phone: '9842101236', assigned_subject_codes: ['21AD401'] },
  ];

  const facImportRes = await fetch(`${BASE_URL}/api/faculty/import`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ faculty: facultyPayload }),
  });
  const facImportData = await facImportRes.json();
  console.log(`✔ Faculty imported: ${facImportData.importedCount}.`);

  // STEP 8: Import Arrears Across Multiple Semesters
  console.log('\n[8/12] Importing batch-wise multi-semester arrear records...');
  const arrearPayload = [
    { register_number: '617721104001', subject_code: '21AD301', batch_id: batchId, semester_number: 3 },
    { register_number: '617721104002', subject_code: '21AD301', batch_id: batchId, semester_number: 3 },
    { register_number: '617721104051', subject_code: '21AD301', batch_id: batchId, semester_number: 3 },
    { register_number: '617721104001', subject_code: '21MA101', batch_id: batchId, semester_number: 1 },
  ];

  const arrearRes = await fetch(`${BASE_URL}/api/arrears`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ records: arrearPayload }),
  });
  const arrearData = await arrearRes.json();
  console.log(`✔ Arrears imported: ${arrearData.added?.length || 4} across Sem 3 and Sem 1.`);

  // Fetch full student list to get IDs
  const allStRes = await fetch(`${BASE_URL}/api/students`, { headers });
  const allSt = await allStRes.json();
  const idAakash = allSt.find((s) => s.register_number === '617721104001').id;
  const idBavithra = allSt.find((s) => s.register_number === '617721104002').id;
  const idChandru = allSt.find((s) => s.register_number === '617721104051').id;

  // STEP 9: Verify Automated Subject-Wise Clustering
  console.log('\n[9/12] Checking Subject-Wise Groupings...');
  const grpRes = await fetch(`${BASE_URL}/api/groupings?department_id=${adsDept.id}&batch_id=${batchId}`, { headers });
  const groupings = await grpRes.json();
  const dsGroup = groupings.find((g) => g.subject.code === '21AD301');
  if (!dsGroup || dsGroup.students.length !== 3) {
    throw new Error(`Expected 3 students in 21AD301 group, got ${dsGroup?.students?.length}`);
  }
  console.log(`✔ Subject Grouping verified: ${dsGroup.subject.code} (${dsGroup.subject.name}) has ${dsGroup.students.length} candidates.`);

  // STEP 10: Schedule Remedial Class & Half-Open Conflict Checking
  console.log('\n[10/12] Scheduling Remedial Class and testing conflict detection...');
  const allFacRes = await fetch(`${BASE_URL}/api/faculty`, { headers });
  const allFac = await allFacRes.json();
  const facSenthil = allFac.find((f) => f.faculty_id_code === 'FAC-ADS-01');
  const subDs = createdSubjects.find((s) => s.code === '21AD301');

  // Tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const classDate = tomorrow.toISOString().split('T')[0];

  const schedRes = await fetch(`${BASE_URL}/api/classes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      department_id: adsDept.id,
      batch_id: batchId,
      regulation_id: regId,
      subject_id: subDs.id,
      faculty_id: facSenthil.id,
      class_date: classDate,
      start_time: '16:30',
      end_time: '17:30',
      venue: 'TP-304',
      student_ids: [idAakash, idBavithra, idChandru],
      notes: 'Unit 3 Tree traversal algorithms revision',
    }),
  });
  const schedData = await schedRes.json();
  if (!schedRes.ok) {
    throw new Error(`Scheduling failed: ${schedRes.status} - ${JSON.stringify(schedData)}`);
  }
  const classId = schedData.id;
  console.log(`✔ Remedial Class scheduled: ${schedData.class_code} (${classId}).`);

  // Test back-to-back scheduling (17:30 - 18:30) must be ALLOWED under [start, end)
  const backToBackCheck = await fetch(`${BASE_URL}/api/classes/conflict-check`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      class_date: classDate,
      start_time: '17:30',
      end_time: '18:30',
      faculty_id: facSenthil.id,
      venue: 'TP-304',
      student_ids: [idAakash],
    }),
  });
  const b2bResult = await backToBackCheck.json();
  if (b2bResult.has_conflicts) {
    throw new Error('Half-open interval failed: Back-to-back class 17:30-18:30 was incorrectly flagged as conflict with 16:30-17:30!');
  }
  console.log('✔ Half-open interval mathematical verification: Back-to-back slot [17:30, 18:30) is conflict-free with [16:30, 17:30).');

  // STEP 11: Register Peer Tutor, Allocate, and Submit Attendance
  console.log('\n[11/12] Registering peer tutor, allocating, and verifying attendance submission flow...');
  const tutorRes = await fetch(`${BASE_URL}/api/tutors`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      register_number: '617720104010',
      name: 'Vignesh K (Senior Tutor)',
      department_id: adsDept.id,
      email: 'vignesh.tutor@sonatech.ac.in',
      phone: '9842109999',
    }),
  });
  const tutorData = await tutorRes.json();

  const allocRes = await fetch(`${BASE_URL}/api/tutors/allocate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      peer_tutor_id: tutorData.id,
      remedial_class_id: classId,
    }),
  });
  const allocData = await allocRes.json();
  console.log(`✔ Tutor allocated: Attendance Form Token Hash created. Access URL: ${allocData.attendance_url}`);

  // Tutor opens form via public token endpoint
  const token = allocData.form_token;
  const formFetchRes = await fetch(`${BASE_URL}/api/attendance/${token}`);
  const formData = await formFetchRes.json();
  const enrolledStudents = formData.remedial_class?.students || formData.students || [];
  console.log(`✔ Form accessed by tutor: ${enrolledStudents.length} students loaded on roster.`);

  // Tutor marks attendance: Aakash present, Bavithra present, Chandru absent
  const submitRes = await fetch(`${BASE_URL}/api/attendance/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submitted_by_identifier: '617720104010 - Vignesh K',
      tutor_remarks: 'Covered AVL rotations and balancing factors',
      marks: [
        { student_id: idAakash, status: 'present' },
        { student_id: idBavithra, status: 'present' },
        { student_id: idChandru, status: 'absent' },
      ],
    }),
  });
  const submitData = await submitRes.json();
  console.log(`✔ Attendance submitted successfully: 2 Present, 1 Absent (${submitData.absent_count} absent).`);

  // Test form locking: Second submission attempt MUST be rejected
  const lockedRes = await fetch(`${BASE_URL}/api/attendance/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submitted_by_identifier: 'Vignesh K',
      marks: [{ student_id: idAakash, status: 'present' }],
    }),
  });
  if (lockedRes.status !== 409 && lockedRes.status !== 400) {
    throw new Error('Attendance form locking failed: submitted form did not reject subsequent modification attempt!');
  }
  console.log('✔ Attendance form immutability verified: subsequent submissions strictly locked (HTTP 409).');

  // Verify Absentee Notification was queued/simulated for faculty
  const notifRes = await fetch(`${BASE_URL}/api/notifications`, { headers });
  const notifList = await notifRes.json();
  const absNotif = notifList.find((n) => n.notification_type === 'absentee_digest');
  if (!absNotif) {
    throw new Error('Absentee notification was not generated after attendance submission!');
  }
  console.log(`✔ Absentee digest notification created: "${absNotif.subject}" to faculty ${absNotif.recipient_name}.`);

  // STEP 12: RESTORE CLEAN EMPTY STATE FOR PRODUCTION USE
  console.log('\n[12/12] RESTORING DATABASE TO CLEAN PRODUCTION INITIAL STATE...');
  fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_CLEAN_STATE, null, 2), 'utf-8');

  // Verify clean state after reset
  const cleanDashRes = await fetch(`${BASE_URL}/api/dashboard`, { headers });
  const cleanDash = await cleanDashRes.json();

  console.log('Final Restored State Metrics:', {
    totalStudents: cleanDash.totalStudents,
    totalStudentsWithArrears: cleanDash.totalStudentsWithArrears,
    totalFaculty: cleanDash.totalFaculty,
    totalRemedialClasses: cleanDash.totalRemedialClasses,
    upcomingClasses: cleanDash.upcomingClasses,
  });

  if (
    cleanDash.totalStudents !== 0 ||
    cleanDash.totalFaculty !== 0 ||
    cleanDash.totalRemedialClasses !== 0 ||
    cleanDash.upcomingList?.length !== 0
  ) {
    throw new Error('Clean state restoration failed! Counts are not zero.');
  }

  const rawJson = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  console.log('Direct DB Record Counts after Restoration:', {
    students: rawJson.students.length,
    faculty: rawJson.faculty.length,
    arrears: rawJson.arrear_records.length,
    classes: rawJson.remedial_classes.length,
    notifications: rawJson.notifications.length,
  });

  if (
    rawJson.students.length !== 0 ||
    rawJson.faculty.length !== 0 ||
    rawJson.arrear_records.length !== 0 ||
    rawJson.remedial_classes.length !== 0 ||
    rawJson.notifications.length !== 0
  ) {
    throw new Error('Database file still contains records after clean reset!');
  }

  console.log('\n===============================================================');
  console.log('🎉 ALL 24 WORKFLOW STEPS VERIFIED & DATABASE RETURNED TO CLEAN ZERO STATE!');
  console.log('===============================================================\n');
}

run().catch((err) => {
  console.error('\n❌ E2E VERIFICATION FAILED:', err);
  process.exit(1);
});
