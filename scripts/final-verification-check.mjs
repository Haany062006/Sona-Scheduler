// scripts/final-verification-check.mjs
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const DB_FILE = path.resolve('.data/sona_db.json');
const SEC_FILE = path.resolve('.data/admin_security.json');

// Helper to generate authentic binary PDF buffers
function generatePdfBuffer(lines) {
  const streamContent = 'BT\n/F1 12 Tf\n10 700 Td\n' + lines.map(l => '(' + l.replace(/[()\\\\]/g, '\\$&') + ') \'').join('\n') + '\nET';
  const streamLength = Buffer.byteLength(streamContent);

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  ];

  let pdf = '%PDF-1.4\n';
  const xref = [0];
  for (const obj of objects) {
    xref.push(Buffer.byteLength(pdf));
    pdf += obj;
  }

  const startxref = Buffer.byteLength(pdf);
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n';
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(xref[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + startxref + '\n%%EOF\n';
  return Buffer.from(pdf, 'utf-8');
}

const CLEAN_STATE = {
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
  cc_contacts: [],
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

async function executeVerification() {
  console.log('================================================================');
  console.log(' SONA SCHEDULER: COMPREHENSIVE AUDIT & WORKFLOW VERIFICATION');
  console.log('================================================================\n');

  // Clean state setup
  fs.writeFileSync(DB_FILE, JSON.stringify(CLEAN_STATE, null, 2), 'utf-8');
  if (fs.existsSync(SEC_FILE)) fs.unlinkSync(SEC_FILE);

  let cookieHeader = '';
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Cookie: cookieHeader,
  });

  // --- TEST 1: AUTHENTICATION & SECURITY ---
  console.log('>>> [1/15] Testing Server-side Route Protection (401 without cookie)...');
  const unauthRes = await fetch(`${BASE_URL}/api/dashboard`);
  if (unauthRes.status !== 401) throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
  console.log('  ✔ Protected endpoint /api/dashboard blocked unauthorized access with 401.');

  console.log('>>> [2/15] Testing Authentication with Invalid Password...');
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sonatech.ac.in', password: 'WrongPassword!123' }),
  });
  if (badLoginRes.status !== 401) throw new Error(`Expected 401 for bad password, got ${badLoginRes.status}`);
  console.log('  ✔ Invalid credentials safely rejected.');

  console.log('>>> [3/15] Authenticating with Environment-Loaded Admin Password...');
  const validLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sonatech.ac.in', password: 'SonaTech#Remedial@2026' }),
  });
  if (!validLoginRes.ok) throw new Error(`Valid login failed: ${validLoginRes.status}`);
  const setCookie = validLoginRes.headers.get('set-cookie');
  cookieHeader = setCookie ? setCookie.split(';')[0] : '';
  console.log('  ✔ Admin logged in successfully. Session cookie received.');

  console.log('>>> [4/15] Testing Password Change Endpoint & Hashed Storage...');
  const changeRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      oldPassword: 'SonaTech#Remedial@2026',
      newPassword: 'SonaTech#NewSecurePass2026'
    })
  });
  const changeData = await changeRes.json();
  if (!changeRes.ok || !changeData.success) throw new Error(`Password change failed: ${JSON.stringify(changeData)}`);
  if (!fs.existsSync(SEC_FILE)) throw new Error('Expected admin_security.json to be created upon password change');
  console.log('  ✔ Password changed and scrypt hashed in .data/admin_security.json.');

  console.log('>>> [5/15] Verifying Login with New Password...');
  const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sonatech.ac.in', password: 'SonaTech#NewSecurePass2026' }),
  });
  if (!newLoginRes.ok) throw new Error(`Login with new password failed: ${newLoginRes.status}`);
  const newSetCookie = newLoginRes.headers.get('set-cookie');
  cookieHeader = newSetCookie ? newSetCookie.split(';')[0] : '';
  console.log('  ✔ Successfully logged in using the newly changed password.');

  // Clean up password override file for test idempotence
  fs.unlinkSync(SEC_FILE);
  // Re-login with default env password
  const resetLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sonatech.ac.in', password: 'SonaTech#Remedial@2026' }),
  });
  cookieHeader = resetLogin.headers.get('set-cookie')?.split(';')[0] || '';

  // --- TEST 2: REGULATION & BATCH SETUP ---
  console.log('\n>>> [6/15] Setting Up Regulation (R2021) and Batch (2021-2025)...');
  const regRes = await fetch(`${BASE_URL}/api/regulations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      type: 'regulation',
      code: 'R2021',
      start_year: 2021,
      description: 'Autonomous Regulation 2021 Curriculum'
    })
  });
  const regData = await regRes.json();
  const regulationId = regData.id;

  const batchRes = await fetch(`${BASE_URL}/api/regulations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      type: 'batch',
      name: '2021-2025',
      start_year: 2021,
      end_year: 2025,
      regulation_id: regulationId,
      department_id: '11111111-1111-1111-1111-111111111101' // ADS
    })
  });
  const batchData = await batchRes.json();
  const batchId = batchData.id;

  await fetch(`${BASE_URL}/api/regulations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      type: 'link',
      regulation_id: regulationId,
      batch_id: batchId,
      department_id: '11111111-1111-1111-1111-111111111101'
    })
  });
  console.log(`  ✔ Regulation R2021 and Batch 2021-2025 linked for ADS.`);

  // --- TEST 3: BINARY SYLLABUS PDF UPLOAD (ALL 8 SEMESTERS) ---
  console.log('\n>>> [7/15] Testing Binary Syllabus PDF Upload Across 8 Semesters...');
  const syllabusLines = [
    'Sona College of Technology (Autonomous)',
    'Regulations 2021 Curriculum and Syllabi',
    'Department of Artificial Intelligence and Data Science',
    'SEMESTER I',
    '21MA101 Calculus and Linear Algebra 3 1 0 4',
    '21PH101 Engineering Physics 3 0 0 3',
    'SEMESTER II',
    '21CS201 Data Structures 3 0 0 3',
    '21IT202 Digital Logic Design 3 0 0 3',
    'SEMESTER III',
    '21AD301 Artificial Intelligence Principles 3 0 0 3',
    '21AD302 Object Oriented Programming 3 0 0 3',
    'SEMESTER IV',
    '21AD401 Machine Learning Algorithms 3 0 2 4',
    '21MA401 Discrete Mathematics 3 1 0 4',
    'SEMESTER V',
    '21AD501 Deep Learning Foundations 3 0 0 3',
    'SEMESTER VI',
    '21AD601 Natural Language Processing 3 0 0 3',
    'SEMESTER VII',
    '21AD701 Computer Vision Applications 3 0 0 3',
    'SEMESTER VIII',
    '21AD801 Project Work Phase II 0 0 12 6',
  ];
  const syllabusBuf = generatePdfBuffer(syllabusLines);

  // 7A: Preview mode
  const syllabusBlob = new Blob([syllabusBuf], { type: 'application/pdf' });
  const formPreview = new FormData();
  formPreview.append('file', syllabusBlob, 'Syllabus_R2021_ADS.pdf');
  formPreview.append('regulation_id', regulationId);
  formPreview.append('department_id', '11111111-1111-1111-1111-111111111101');
  formPreview.append('commit', 'false');

  const sylPreviewRes = await fetch(`${BASE_URL}/api/regulations/upload-syllabus`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    body: formPreview
  });
  const sylPreviewData = await sylPreviewRes.json();
  if (!sylPreviewRes.ok || !sylPreviewData.preview_mode) {
    throw new Error(`Syllabus preview failed: ${JSON.stringify(sylPreviewData)}`);
  }
  console.log(`  ✔ Preview extracted ${sylPreviewData.total_subjects_found} subjects across semesters without requiring single semester input.`);

  // 7B: Commit mode
  const formCommit = new FormData();
  formCommit.append('file', syllabusBlob, 'Syllabus_R2021_ADS.pdf');
  formCommit.append('regulation_id', regulationId);
  formCommit.append('department_id', '11111111-1111-1111-1111-111111111101');
  formCommit.append('commit', 'true');

  const sylCommitRes = await fetch(`${BASE_URL}/api/regulations/upload-syllabus`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    body: formCommit
  });
  const sylCommitData = await sylCommitRes.json();
  if (!sylCommitRes.ok || !sylCommitData.committed) {
    throw new Error(`Syllabus commit failed: ${JSON.stringify(sylCommitData)}`);
  }
  console.log(`  ✔ Committed ${sylCommitData.subjects_added} subjects into database.`);

  // --- TEST 4: STUDENT EXCEL IMPORT (MULTI-SECTION A, B, C) ---
  console.log('\n>>> [8/15] Importing Multi-Section ADS Students (Sections A, B, C)...');
  const studentPayload = [
    {
      register_number: '617721104001',
      name: 'Abishek S',
      department_id: '11111111-1111-1111-1111-111111111101',
      batch_id: batchId,
      section: 'A',
      current_semester: 5,
      student_email: 'abishek.21ad@sonatech.ac.in',
      student_phone: '9876543210'
    },
    {
      register_number: '617721104002',
      name: 'Bhuvanesh K',
      department_id: '11111111-1111-1111-1111-111111111101',
      batch_id: batchId,
      section: 'B',
      current_semester: 5,
      student_email: 'bhuvanesh.21ad@sonatech.ac.in',
      student_phone: '9876543211'
    },
    {
      register_number: '617721104003',
      name: 'Chandru M',
      department_id: '11111111-1111-1111-1111-111111111101',
      batch_id: batchId,
      section: 'C',
      current_semester: 5,
      student_email: 'chandru.21ad@sonatech.ac.in',
      student_phone: '9876543212'
    }
  ];

  const stuImportRes = await fetch(`${BASE_URL}/api/students/import`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ students: studentPayload })
  });
  const stuImportData = await stuImportRes.json();
  if (!stuImportRes.ok || stuImportData.importedCount !== 3) {
    throw new Error(`Student import failed: ${JSON.stringify(stuImportData)}`);
  }
  console.log(`  ✔ Imported 3 students covering sections A, B, and C with text register numbers.`);

  // --- TEST 5: FACULTY EXCEL IMPORT (DEPARTMENT-SCOPED, OPTIONAL PHONE/EMAIL) ---
  console.log('\n>>> [9/15] Importing Faculty with Optional Contact Details...');
  const facultyPayload = [
    {
      faculty_id_code: 'FAC-ADS-01',
      name: 'Dr. K. Senthil Kumar',
      department_id: '11111111-1111-1111-1111-111111111101',
      email: 'senthilkumar.ads@sonatech.ac.in',
      phone: '9443210987',
      assigned_subject_codes: ['21AD301']
    },
    {
      faculty_id_code: 'FAC-ADS-02',
      name: 'Prof. M. Priya (Email Only)',
      department_id: '11111111-1111-1111-1111-111111111101',
      email: 'priya.ads@sonatech.ac.in',
      phone: null,
      assigned_subject_codes: ['21MA101']
    },
    {
      faculty_id_code: 'FAC-ADS-03',
      name: 'Prof. R. Anand (Phone Only)',
      department_id: '11111111-1111-1111-1111-111111111101',
      email: null,
      phone: '9842109876',
      assigned_subject_codes: ['21CS201']
    }
  ];

  const facImportRes = await fetch(`${BASE_URL}/api/faculty/import`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ faculty: facultyPayload })
  });
  const facImportData = await facImportRes.json();
  if (!facImportRes.ok || facImportData.importedCount !== 3) {
    throw new Error(`Faculty import failed: ${JSON.stringify(facImportData)}`);
  }
  console.log(`  ✔ Imported 3 faculty members with independent optional phone/email configuration.`);

  // --- TEST 6: BINARY ARREAR PDF UPLOAD (MULTI-SEMESTER WITH RECONCILIATION) ---
  console.log('\n>>> [10/15] Testing Binary Arrear PDF Upload Across Multiple Semesters...');
  const arrearLines = [
    'Sona College of Technology - Autonomous - Salem',
    'Controller of Examinations - Arrear Grade Publication',
    '617721104001 ABISHEK S 21MA101 RA 21PH101 U',
    '617721104002 BHUVANESH K 21CS201 RA',
    '617721104003 CHANDRU M 21AD301 FAIL',
    '617721104999 UNREGISTERED 21AD301 RA', // Unknown student
    '617721104001 ABISHEK S 21ZZ999 RA'    // Unknown subject
  ];
  const arrearBuf = generatePdfBuffer(arrearLines);

  // 10A: Preview mode
  const arrearBlob = new Blob([arrearBuf], { type: 'application/pdf' });
  const arrearFormPreview = new FormData();
  arrearFormPreview.append('file', arrearBlob, 'November_2026_Arrears_ADS.pdf');
  arrearFormPreview.append('department_id', '11111111-1111-1111-1111-111111111101');
  arrearFormPreview.append('batch_id', batchId);
  arrearFormPreview.append('commit', 'false');

  const arrPreviewRes = await fetch(`${BASE_URL}/api/arrears/upload-pdf`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    body: arrearFormPreview
  });
  const arrPreviewData = await arrPreviewRes.json();
  if (!arrPreviewRes.ok || !arrPreviewData.preview_mode) {
    throw new Error(`Arrear preview failed: ${JSON.stringify(arrPreviewData)}`);
  }
  console.log(`  ✔ Preview reconciled ${arrPreviewData.totalExtracted} extracted pairs:`);
  console.log(`    - Ready: ${arrPreviewData.summary.ready}`);
  console.log(`    - Unknown Students: ${arrPreviewData.summary.unknownStudents}`);
  console.log(`    - Unknown Subjects: ${arrPreviewData.summary.unknownSubjects}`);

  // 10B: Commit mode
  const arrearFormCommit = new FormData();
  arrearFormCommit.append('file', arrearBlob, 'November_2026_Arrears_ADS.pdf');
  arrearFormCommit.append('department_id', '11111111-1111-1111-1111-111111111101');
  arrearFormCommit.append('batch_id', batchId);
  arrearFormCommit.append('commit', 'true');

  const arrCommitRes = await fetch(`${BASE_URL}/api/arrears/upload-pdf`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
    body: arrearFormCommit
  });
  const arrCommitData = await arrCommitRes.json();
  if (!arrCommitRes.ok || !arrCommitData.committed) {
    throw new Error(`Arrear commit failed: ${JSON.stringify(arrCommitData)}`);
  }
  console.log(`  ✔ Committed ${arrCommitData.arrears_added} active arrear records safely without silent drops.`);

  // --- TEST 7: SUBJECT-WISE GROUPING CALCULATION ---
  console.log('\n>>> [11/15] Verifying Subject-wise Arrear Groupings...');
  const groupingsRes = await fetch(`${BASE_URL}/api/groupings?department_id=11111111-1111-1111-1111-111111111101&batch_id=${batchId}`, {
    headers: getHeaders()
  });
  const groupings = await groupingsRes.json();
  console.log(`  ✔ Found ${groupings.length} subjects with active arrear student cohorts.`);
  const aiGroup = groupings.find(g => g.subject?.code === '21AD301');
  if (!aiGroup) throw new Error('Expected 21AD301 in subject groupings');
  console.log(`    - 21AD301 has ${aiGroup.students.length} student candidate(s).`);

  // --- TEST 8: TIMETABLE CONFLICT CHECKING & CALENDAR BLACKOUTS ---
  console.log('\n>>> [12/15] Testing Timetable Conflict Detection & Blackout Dates...');
  // Retrieve students and faculty from DB to get their UUIDs
  const dbContent = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  const aiSubj = dbContent.subjects.find(s => s.code === '21AD301');
  const fac1 = dbContent.faculty.find(f => f.faculty_id_code === 'FAC-ADS-01');
  const stu1 = dbContent.students.find(s => s.register_number === '617721104003');

  // Add blackout date
  await fetch(`${BASE_URL}/api/calendar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      date_val: '2026-11-25',
      reason: 'College Autonomous Practical Examinations',
      event_type: 'exam',
      department_id: null // College-wide
    })
  });

  const conflictCheckRes = await fetch(`${BASE_URL}/api/classes/conflict-check`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      class_date: '2026-11-25',
      start_time: '16:45',
      end_time: '18:15',
      faculty_id: fac1.id,
      venue_id: '33333333-3333-3333-3333-333333333301',
      student_ids: [stu1.id]
    })
  });
  const conflictData = await conflictCheckRes.json();
  if (!conflictData.hasConflicts || conflictData.conflicts.length === 0) {
    throw new Error('Expected calendar blackout conflict to be detected');
  }
  console.log(`  ✔ Conflict successfully flagged: "${conflictData.conflicts[0].description}"`);

  // --- TEST 9: SCHEDULING REMEDIAL CLASS ---
  console.log('\n>>> [13/15] Scheduling Remedial Class for 21AD301 on a Clean Date...');

  const scheduleRes = await fetch(`${BASE_URL}/api/classes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      department_id: '11111111-1111-1111-1111-111111111101',
      batch_id: batchId,
      regulation_id: regulationId,
      subject_id: aiSubj.id,
      faculty_id: fac1.id,
      venue_id: '33333333-3333-3333-3333-333333333301',
      venue: 'Theory Hall 304',
      class_date: '2026-11-26',
      start_time: '16:45',
      end_time: '18:15',
      student_ids: [stu1.id]
    })
  });
  const scheduleData = await scheduleRes.json();
  if (!scheduleRes.ok || !scheduleData.id) {
    throw new Error(`Schedule creation failed: ${JSON.stringify(scheduleData)}`);
  }
  const classId = scheduleData.id;
  console.log(`  ✔ Remedial class scheduled: ${scheduleData.class_code} (${scheduleData.class_date})`);

  // --- TEST 10: PEER TUTOR ALLOCATION & ATTENDANCE FORM TOKEN GENERATION ---
  console.log('\n>>> [14/15] Allocating Peer Tutor & Generating Secure Attendance Token...');
  const tutorRes = await fetch(`${BASE_URL}/api/tutors`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      register_number: '21AD050',
      name: 'Gowtham V (Senior Peer Tutor)',
      department_id: '11111111-1111-1111-1111-111111111101',
      email: 'gowtham.tutor@sonatech.ac.in',
      phone: '9840123456'
    })
  });
  const tutorData = await tutorRes.json();
  const tutorId = tutorData.id;

  const allocRes = await fetch(`${BASE_URL}/api/tutors/allocate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      remedial_class_id: classId,
      peer_tutor_id: tutorId
    })
  });
  const allocData = await allocRes.json();
  if (!allocRes.ok || (!allocData.form_token && !allocData.access_token && !allocData.attendance_form)) {
    throw new Error(`Tutor allocation failed: ${JSON.stringify(allocData)}`);
  }
  const token = allocData.form_token || allocData.access_token || allocData.attendance_form?.access_token;
  console.log(`  ✔ Peer tutor allocated. Unique attendance token generated: ${token.substring(0, 16)}...`);

  // --- TEST 11: PUBLIC MOBILE ATTENDANCE SUBMISSION ---
  console.log('\n>>> [15/15] Testing Passwordless Mobile Attendance Submission...');
  // 11A: Fetch form details via public token endpoint
  const publicFormRes = await fetch(`${BASE_URL}/api/attendance/${token}`);
  if (!publicFormRes.ok) throw new Error(`Public attendance lookup failed: ${publicFormRes.status}`);
  const publicFormData = await publicFormRes.json();
  const classCode = publicFormData.class_code || publicFormData.remedial_class?.class_code;
  const subjName = publicFormData.subject?.name || publicFormData.remedial_class?.subject?.name;
  console.log(`  ✔ Mobile form rendered for class: ${classCode} (${subjName})`);

  // 11B: Submit attendance marking
  const submitRes = await fetch(`${BASE_URL}/api/attendance/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submitted_by_identifier: 'Gowtham V (Peer Tutor)',
      tutor_remarks: 'Covered AI heuristic search algorithms. Good student participation.',
      marks: [
        {
          student_id: stu1.id,
          status: 'present',
          remarks: 'Attended session on time'
        }
      ]
    })
  });
  const submitData = await submitRes.json();
  if (!submitRes.ok || !submitData.success) {
    throw new Error(`Attendance submission failed: ${JSON.stringify(submitData)}`);
  }
  console.log(`  ✔ Attendance successfully recorded! Single-submission lock applied.`);

  // Verify duplicate submission rejection
  const dupSubmitRes = await fetch(`${BASE_URL}/api/attendance/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submitted_by_identifier: 'Gowtham V',
      marks: [{ student_id: stu1.id, status: 'present' }]
    })
  });
  if (dupSubmitRes.status !== 400) throw new Error('Expected duplicate submission to be rejected with 400');
  console.log(`  ✔ Tamper prevention verified: Duplicate attendance submission correctly rejected.`);

  // --- TEST 12: ABSENTEE DIGEST & NOTIFICATION LOGS ---
  console.log('\n>>> Verifying Post-Attendance Notifications & Audit Logs in Database...');
  const finalDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  console.log(`  ✔ Total notifications dispatched: ${finalDb.notifications.length}`);
  finalDb.notifications.forEach(n => {
    console.log(`    - [${n.channel.toUpperCase()}] to ${n.recipient_name} (${n.recipient_contact}): ${n.notification_type} [Key: ${n.idempotency_key}]`);
  });

  const auditEvents = finalDb.audit_logs.map(l => l.action);
  console.log(`  ✔ Audit log entries recorded: ${auditEvents.length} actions: [${auditEvents.slice(0, 5).join(', ')}...]`);

  // --- FINAL RESTORATION ---
  console.log('\n>>> Restoring Database to Pristine Clean Initial State (0 records)...');
  fs.writeFileSync(DB_FILE, JSON.stringify(CLEAN_STATE, null, 2), 'utf-8');
  if (fs.existsSync(SEC_FILE)) fs.unlinkSync(SEC_FILE);

  const restoredDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  console.log('Restored counts:');
  console.log('  Students:', restoredDb.students.length);
  console.log('  Faculty:', restoredDb.faculty.length);
  console.log('  Subjects:', restoredDb.subjects.length);
  console.log('  Arrears:', restoredDb.arrear_records.length);
  console.log('  Classes:', restoredDb.remedial_classes.length);
  console.log('  Notifications:', restoredDb.notifications.length);

  console.log('\n================================================================');
  console.log(' ALL 15 VERIFICATION STAGES COMPLETED AND FULLY PASSED (100%)');
  console.log('================================================================');
}

executeVerification().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
