import { PDFParse } from 'pdf-parse';
import { parseSyllabusPdf, parseArrearPdf } from '../src/lib/parsers/pdf-parser.ts';

export function generatePdfBuffer(lines) {
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

async function runVerification() {
  console.log('--- 1. Testing Syllabus PDF Extraction Across 8 Semesters ---');
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
  const syllabusResult = await parseSyllabusPdf(syllabusBuf);
  console.log('Regulation year detected:', syllabusResult.regulation_year);
  console.log('Total subjects extracted:', syllabusResult.subjects.length);
  syllabusResult.subjects.forEach(s => {
    console.log(`  Sem ${s.semester} | [${s.code}] ${s.name} (Credits: ${s.credits}, Common: ${s.is_common})`);
  });

  console.log('\n--- 2. Testing Arrear Publication PDF Extraction Multi-Semester ---');
  const arrearLines = [
    'Sona College of Technology - Office of the Controller of Examinations',
    'Arrear Results Publication - November 2026 Examinations',
    '617721104001 ABISHEK S 21MA101 RA 21PH101 U',
    '617721104002 BHUVANESH K 21CS201 RA',
    '617721104003 CHANDRU M 21AD301 FAIL 21AD401 RA',
  ];

  const arrearBuf = generatePdfBuffer(arrearLines);
  const arrearResult = await parseArrearPdf(arrearBuf);
  console.log('Total arrear items extracted:', arrearResult.items.length);
  arrearResult.items.forEach(a => {
    console.log(`  Student: ${a.register_number} (${a.student_name || 'N/A'}) -> Subject: ${a.subject_code} [Status: ${a.result_status}]`);
  });
}

runVerification().catch(console.error);
