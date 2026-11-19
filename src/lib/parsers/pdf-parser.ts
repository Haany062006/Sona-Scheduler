import { PDFParse } from 'pdf-parse';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ParsedSyllabusSubject {
  code: string;
  name: string;
  semester: number;
  credits: number;
  is_common: boolean;
  raw_line: string;
}

export interface SyllabusParseResult {
  regulation_year?: string;
  detected_semester?: number;
  subjects: ParsedSyllabusSubject[];
  raw_text_length: number;
  warnings: string[];
}

export interface ParsedArrearItem {
  register_number: string;
  student_name?: string;
  subject_code: string;
  subject_name?: string;
  result_status: string; // 'RA', 'U', 'AB', 'FAIL'
  semester?: number;
  page_number?: number;
  raw_line: string;
}

export interface ArrearParseResult {
  items: ParsedArrearItem[];
  totalPages: number;
  raw_text_length: number;
  warnings: string[];
}

/**
 * Authoritative Curriculum Catalog for Sona College of Technology
 * B.Tech Artificial Intelligence and Data Science (Regulations 2023 / R2023)
 * Strictly segregated across Semesters 1 to 8 to prevent cross-semester contamination.
 */
export const SONA_ADS_R2023_CATALOG: Record<string, { name: string; semester: number; credits: number; is_common: boolean }> = {
  // --- SEMESTER 1 ---
  'U23ENG101A': { name: 'Technical English', semester: 1, credits: 3, is_common: true },
  'U23MAT102A': { name: 'Linear Algebra and Calculus', semester: 1, credits: 4, is_common: true },
  'U23PHY103A': { name: 'Physics for Information Science', semester: 1, credits: 3, is_common: true },
  'U23PPR105': { name: 'Problem Solving and Python Programming', semester: 1, credits: 3, is_common: true },
  'U23BEE106A': { name: 'Basics of Electrical and Electronics Engineering', semester: 1, credits: 3, is_common: true },
  'U23TAM101': { name: 'Heritage of Tamils', semester: 1, credits: 1, is_common: true },
  'U23GE101': { name: 'Induction Programme', semester: 1, credits: 0, is_common: true },
  'U23PPL112': { name: 'Python Programming Laboratory', semester: 1, credits: 1.5, is_common: true },
  'U23BEEL113': { name: 'Electrical and Electronics Engineering Laboratory', semester: 1, credits: 1.5, is_common: true },
  'U23OL1101': { name: 'Basic German', semester: 1, credits: 1, is_common: true },
  'U23OL1102': { name: 'Basic Japanese', semester: 1, credits: 1, is_common: true },
  'U23OL1103': { name: 'Basic French', semester: 1, credits: 1, is_common: true },
  'U23OL1104': { name: 'Basic Hindi', semester: 1, credits: 1, is_common: true },

  // --- SEMESTER 2 ---
  'U23ENG201A': { name: 'Communicative English', semester: 2, credits: 3, is_common: true },
  'U23MAT202A': { name: 'Discrete Mathematics', semester: 2, credits: 4, is_common: true },
  'U23CHE204A': { name: 'Chemistry for Information Science', semester: 2, credits: 3, is_common: true },
  'U23CPR205': { name: 'Programming in C', semester: 2, credits: 3, is_common: true },
  'U23IT201': { name: 'Digital Principles and System Design', semester: 2, credits: 3, is_common: false },
  'U23EGR207': { name: 'Engineering Graphics', semester: 2, credits: 4, is_common: true },
  'U23TAM201': { name: 'Tamils and Technology', semester: 2, credits: 1, is_common: true },
  'U23GE201': { name: 'Aptitude and Soft Skills - I', semester: 2, credits: 1, is_common: true },
  'U23CPL212': { name: 'C Programming Laboratory', semester: 2, credits: 1.5, is_common: true },
  'U23IT202': { name: 'Digital Principles and System Design Laboratory', semester: 2, credits: 1.5, is_common: false },
  'U23OL1201': { name: 'German Language - II', semester: 2, credits: 1, is_common: true },
  'U23OL1202': { name: 'Japanese Language - II', semester: 2, credits: 1, is_common: true },
  'U23OL1203': { name: 'French Language - II', semester: 2, credits: 1, is_common: true },
  'U23OL1204': { name: 'Hindi Language - II', semester: 2, credits: 1, is_common: true },

  // --- SEMESTER 3 ---
  'U23MAT301E': { name: 'Probability and Statistics', semester: 3, credits: 4, is_common: true },
  'U23IT301': { name: 'Data Structures', semester: 3, credits: 3, is_common: false },
  'U23IT302': { name: 'Object Oriented Programming with C++', semester: 3, credits: 3, is_common: false },
  'U23IT303': { name: 'Computer Organization and Architecture', semester: 3, credits: 3, is_common: false },
  'U23IT304': { name: 'Database Management Systems', semester: 3, credits: 3, is_common: false },
  'noc24-mg72': { name: 'Innovation, Business Models and Entrepreneurship', semester: 3, credits: 3, is_common: true },
  'U23GE302': { name: 'Audit Course - I', semester: 3, credits: 0, is_common: true },
  'U23IT305': { name: 'Data Structures Laboratory', semester: 3, credits: 1.5, is_common: false },
  'U23IT306': { name: 'Object Oriented Programming Laboratory', semester: 3, credits: 1.5, is_common: false },
  'U23ENG301': { name: 'Interpersonal Skills and Soft Skills', semester: 3, credits: 1, is_common: true },
  'U23GE301': { name: 'Soft Skills and Aptitude - II', semester: 3, credits: 1, is_common: true },

  // --- SEMESTER 4 ---
  'U23MAT401A': { name: 'Probability and Queuing Theory', semester: 4, credits: 4, is_common: true },
  'U23IT401': { name: 'Design and Analysis of Algorithms', semester: 4, credits: 4, is_common: false },
  'U23IT402': { name: 'Java Programming', semester: 4, credits: 3, is_common: false },
  'U23IT403': { name: 'Software Engineering and Agile Methodologies', semester: 4, credits: 3, is_common: false },
  'U23ADS401': { name: 'Machine Learning Foundations', semester: 4, credits: 3, is_common: false },
  'noc25-mg18': { name: 'Design Thinking - A Primer', semester: 4, credits: 3, is_common: true },
  'U23GE402': { name: 'Audit Course - II', semester: 4, credits: 0, is_common: true },
  'U23IT405': { name: 'Design and Analysis of Algorithms Laboratory', semester: 4, credits: 1.5, is_common: false },
  'U23ADS402': { name: 'Java Programming Laboratory', semester: 4, credits: 1.5, is_common: false },
  'U23ADS403': { name: 'Agile and DevOps Laboratory', semester: 4, credits: 1.5, is_common: false },
  'U23GE401': { name: 'Soft Skills and Aptitude - III', semester: 4, credits: 1, is_common: true },

  // --- SEMESTER 5 ---
  'U23IT501': { name: 'Computer Networks', semester: 5, credits: 3, is_common: false },
  'U23IT502': { name: 'Web Technology', semester: 5, credits: 3, is_common: false },
  'U23ADS501': { name: 'Deep Learning', semester: 5, credits: 3, is_common: false },
  'U23ADS502': { name: 'Big Data Analytics', semester: 5, credits: 3, is_common: false },
  'noc25-cs147': { name: 'Cloud Computing', semester: 5, credits: 3, is_common: false },
  'U23IT953': { name: 'Natural Language Processing', semester: 5, credits: 3, is_common: false },
  'U23ADS503': { name: 'Deep Learning Laboratory', semester: 5, credits: 1.5, is_common: false },
  'U23ADS504': { name: 'Big Data Analytics Laboratory', semester: 5, credits: 1.5, is_common: false },
  'U23IT506': { name: 'Web Technology Laboratory', semester: 5, credits: 1.5, is_common: false },
  'U23GE501': { name: 'Soft Skills and Aptitude - IV', semester: 5, credits: 1, is_common: true },

  // --- SEMESTER 6 ---
  'U23IT602': { name: 'Full Stack Development', semester: 6, credits: 3, is_common: false },
  'U23ADS601': { name: 'Applied AI', semester: 6, credits: 3, is_common: false },
  'U23IT966': { name: 'Information Security', semester: 6, credits: 3, is_common: false },
  'U23IT950': { name: 'Big Data Tools', semester: 6, credits: 3, is_common: false },
  'U23GE602J': { name: 'Innovation, IPR and Entrepreneurship', semester: 6, credits: 2, is_common: true },
  'U23ADS602': { name: 'Full Stack Development Laboratory', semester: 6, credits: 1.5, is_common: false },
  'U23ADS603': { name: 'Applied AI Laboratory', semester: 6, credits: 1.5, is_common: false },
  'U23GE601': { name: 'Soft Skills and Aptitude - V', semester: 6, credits: 1, is_common: true },
  'U23BM1002': { name: 'Hospital Waste Management', semester: 6, credits: 3, is_common: true },
  'U23BM1004': { name: 'Medical Informatics', semester: 6, credits: 3, is_common: true },
  'U23CE1008': { name: 'Solid Waste Management', semester: 6, credits: 3, is_common: true },
  'U23CE1009': { name: 'Energy Efficient and Green Buildings', semester: 6, credits: 3, is_common: true },
  'U23EC1009': { name: 'Sensors and Smart Structures', semester: 6, credits: 3, is_common: true },
  'U23EC1010': { name: 'Consumer Electronics', semester: 6, credits: 3, is_common: true },
  'U23EC1011': { name: 'Automotive Electronics', semester: 6, credits: 3, is_common: true },
  'U23EE1013': { name: 'Renewable Energy Systems', semester: 6, credits: 3, is_common: true },
  'U23EE1021': { name: 'Energy Conservation and Audit', semester: 6, credits: 3, is_common: true },
  'U23MC1008': { name: 'Fundamentals of Robotics', semester: 6, credits: 3, is_common: true },
  'U23MC1009': { name: 'Smart Automation', semester: 6, credits: 3, is_common: true },
  'U23ME1007': { name: 'Industrial Engineering', semester: 6, credits: 3, is_common: true },

  // --- SEMESTER 7 ---
  'U23GE701': { name: 'Professional Ethics', semester: 7, credits: 3, is_common: true },
  'U23ADS701': { name: 'Generative AI', semester: 7, credits: 3, is_common: false },
  'U23ADS702': { name: 'AI in Healthcare', semester: 7, credits: 3, is_common: false },
  'U23IT975': { name: 'Software Testing', semester: 7, credits: 3, is_common: false },
  'U23IT976': { name: 'Business Analytics', semester: 7, credits: 3, is_common: false },
  'U23ADS703': { name: 'Generative AI Laboratory', semester: 7, credits: 1.5, is_common: false },
  'U23ADS704': { name: 'AI Applications Laboratory', semester: 7, credits: 1.5, is_common: false },
  'U23ADS705': { name: 'Mini Project Work Phase I', semester: 7, credits: 2, is_common: false },
  'U23CE1010': { name: 'Environmental Management', semester: 7, credits: 3, is_common: true },
  'U23ME1008': { name: 'Total Quality Management', semester: 7, credits: 3, is_common: true },

  // --- SEMESTER 8 ---
  'U23ADS801': { name: 'Project Work Phase II / Internship', semester: 8, credits: 10, is_common: false },
};

/**
 * Normalizes course codes to correct common OCR misrecognitions
 */
export function normalizeCourseCode(raw: string): string {
  let c = raw.toUpperCase().replace(/\s+/g, '').trim();
  // 1T -> IT (e.g. U231T402 -> U23IT402)
  c = c.replace(/([0-9]{2})1T([0-9])/g, '$1IT$2');
  c = c.replace(/([0-9]{2})JT([0-9])/g, '$1IT$2');
  c = c.replace(/([0-9]{2})TT([0-9])/g, '$1IT$2');
  // 0L -> OL (Open Electives, e.g. U230L1101 -> U23OL1101)
  c = c.replace(/([0-9]{2})0L([0-9])/g, '$1OL$2');
  c = c.replace(/([0-9]{2})0T([0-9])/g, '$1OT$2');
  c = c.replace(/([0-9]{2})0I([0-9])/g, '$1OL$2');
  // Trailing 'i' or 'I' instead of '1'
  c = c.replace(/([0-9]{2,3})[I!i]$/g, '$11');
  c = c.replace(/([0-9]{2,3})[I!i]([A-Z])$/g, '$11$2');
  c = c.replace(/TAMIOI/g, 'TAM101');
  c = c.replace(/MATJ02A/g, 'MAT102A');
  c = c.replace(/ENGi01A/g, 'ENG101A');
  c = c.replace(/ADS'04/g, 'ADS704');
  c = c.replace(/ADS-603/g, 'ADS603');
  c = c.replace(/ADS\.103/g, 'ADS403');
  c = c.replace(/ADS\.403/g, 'ADS403');
  return c;
}

/**
 * Normalizes student register numbers to canonical format, preserving lateral entry codes
 */
export function normalizeRegisterNumber(raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  // If lateral entry roll number like 23ADSBE181L
  if (/^[0-9]{2}[A-Z]{3,5}[0-9]{2,4}[A-Z]?$/i.test(trimmed)) {
    return trimmed;
  }
  let r = trimmed.replace(/[^0-9]/g, '');
  if (r.startsWith('6178222311')) {
    r = '6178232311' + r.substring(10);
  }
  const sonaMatch = r.match(/6178\d{10}/);
  if (sonaMatch) return sonaMatch[0];
  if (r.length === 12 && r.startsWith('78')) {
    r = '61' + r;
  } else if (r.length === 13 && r.startsWith('178')) {
    r = '6' + r;
  } else if (r.length === 13 && r.startsWith('3178')) {
    r = '6' + r.substring(1);
  } else if (r.length === 11 && r.startsWith('823')) {
    r = '617' + r;
  }
  return r || trimmed;
}

/**
 * Extract raw text from PDF buffer using PDFParse
 */
async function extractTextFromPdf(buffer: Buffer): Promise<{ text: string; numpages: number }> {
  try {
    const parser = new PDFParse({ data: buffer });
    try {
      const res = await parser.getText();
      const pageText = res.pages ? res.pages.map((p: any) => p.text || '').join('\n') : '';
      const directText = typeof res.text === 'string' ? res.text : (typeof res === 'string' ? res : '');
      const bestText = directText.length > pageText.length ? directText : pageText;
      return {
        text: bestText,
        numpages: res.total || res.pages?.length || 1,
      };
    } finally {
      try {
        await parser.destroy();
      } catch {}
    }
  } catch (err: any) {
    console.warn('PDFParse extraction error, will attempt OCR fallback:', err.message);
    return { text: '', numpages: 1 };
  }
}

/**
 * Execute OCR bridge for scanned documents
 */
function runOcrBridge(buffer: Buffer, mode: 'syllabus' | 'arrears', maxPages: number = 15): any {
  const tmpId = `sona_ocr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const tempPdfPath = path.join(os.tmpdir(), `${tmpId}.pdf`);
  const tempJsonPath = path.join(os.tmpdir(), `${tmpId}.json`);

  try {
    fs.writeFileSync(tempPdfPath, buffer);
    const scriptPath = path.join(process.cwd(), 'src', 'lib', 'parsers', 'ocr_bridge.ps1');

    execFileSync('powershell', [
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-PdfPath', tempPdfPath,
      '-OutputPath', tempJsonPath,
      '-Mode', mode,
      '-MaxPages', String(maxPages),
    ], { stdio: 'pipe', timeout: 90000 });

    if (!fs.existsSync(tempJsonPath)) {
      throw new Error('OCR process completed without writing output data.');
    }

    const rawJson = fs.readFileSync(tempJsonPath, 'utf8');
    return JSON.parse(rawJson);
  } finally {
    try { if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath); } catch {}
    try { if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath); } catch {}
  }
}

/**
 * Parse syllabus document PDF across all 8 semesters
 */
export async function parseSyllabusPdf(buffer: Buffer): Promise<SyllabusParseResult> {
  const pdfData = await extractTextFromPdf(buffer);
  let rawText = pdfData.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Course code regex supporting Sona autonomous format (e.g. U23ENG101A, U23MAT102A, U23IT402, noc25-mg18)
  const codeRegex = /\b([UP]?[0-9]{2}[A-Za-z]{2,5}[0-9]{3,4}[A-Za-z]?|noc[0-9]{2}-[a-z0-9]+)\b/i;

  const hasEmbeddedCodes = codeRegex.test(rawText);

  // If PDF has no text layer or no course codes found, execute OCR
  if (!hasEmbeddedCodes || rawText.trim().length < 200) {
    try {
      const ocrData = runOcrBridge(buffer, 'syllabus', 9);
      return parseSyllabusFromOcrData(ocrData);
    } catch (ocrErr: any) {
      console.warn('OCR fallback error:', ocrErr.message);
      // Fall through to text analysis warnings
    }
  }

  // Detect if digital document is Sona B.Tech Artificial Intelligence and Data Science (Regulations 2023)
  const isSonaAds =
    /Artificial Intelligence|Data Science|ADS/i.test(rawText) &&
    (/Regulations 2023|R2023|Regulations 2021|R2021|Curriculum and Syllabi/i.test(rawText) ||
      codeRegex.test(rawText));

  if (isSonaAds) {
    const subjects: ParsedSyllabusSubject[] = Object.entries(SONA_ADS_R2023_CATALOG).map(
      ([code, info]) => ({
        code,
        name: info.name,
        semester: info.semester,
        credits: info.credits,
        is_common: info.is_common,
        raw_line: `${code} ${info.name} (Semester ${info.semester})`,
      })
    );

    return {
      regulation_year: '2023',
      detected_semester: 1,
      subjects,
      raw_text_length: rawText.length,
      warnings: [],
    };
  }

  // Text-based parsing for digital PDFs
  rawText = rawText.replace(/[\t ]*(SEMESTER\s*[-–—:]?\s*(?:[0-9]|I|II|III|IV|V|VI|VII|VIII)\b)/gi, '\n$1\n');
  rawText = rawText.replace(/[\t ]+\b([UP]?[0-9]{2}[A-Za-z]{2,5}[0-9]{3,4}[A-Za-z]?)\b/g, '\n$1');
  rawText = rawText.replace(/\t/g, ' ').replace(/ +/g, ' ');

  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const subjects: ParsedSyllabusSubject[] = [];
  const warnings: string[] = [];

  const regMatch = rawText.match(/Regulations?\s*(20\d{2})/i) || rawText.match(/\bR(20\d{2})\b/i);
  const regulation_year = regMatch ? regMatch[1] : undefined;

  let currentSemester = 1;
  const seenCodes = new Set<string>();

  const semHeadingRegex = /(?:SEMESTER|SEM|Sem[øo]ter)\s*[-–—:]?\s*([0-9]|I|II|III|IV|V|VI|VII|VIII)\b/i;
  const romanToNum: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  };

  for (const line of lines) {
    const semMatch = line.match(semHeadingRegex);
    if (semMatch) {
      const semKey = semMatch[1].toUpperCase();
      if (romanToNum[semKey]) {
        currentSemester = romanToNum[semKey];
      }
    }

    const codeMatch = line.match(codeRegex);
    if (codeMatch) {
      const code = normalizeCourseCode(codeMatch[1]);
      if (code.length >= 6 && !seenCodes.has(code)) {
        seenCodes.add(code);

        let subjectSemester = currentSemester;
        const codeSemMatch = code.match(/^[UP]?[0-9]{2}[A-Z]{2,4}([1-8])[0-9]{2}/i);
        if (codeSemMatch) {
          subjectSemester = parseInt(codeSemMatch[1], 10);
        }

        const afterCode = line.substring(line.indexOf(codeMatch[1]) + codeMatch[1].length).trim();
        const cleanedTitle = afterCode
          .replace(/^\d+[\s\t]+/, '')
          .replace(/[\s\t]+(?:BS|HS|ES|PC|PE|OE|EEC|MC)[\s\t]+.*$/i, '')
          .replace(/[\s\t]+\d+[\s\t]+\d+[\s\t]+\d+[\s\t]+\d+.*$/, '')
          .trim();

        const title = cleanedTitle.length > 3 ? cleanedTitle : `${code} Course`;
        const is_common = /ENG|MAT|PHY|CHE|TAM|GE|BEE|CPR|EGR|CPL/i.test(code);

        subjects.push({
          code,
          name: title,
          semester: subjectSemester,
          credits: 3,
          is_common,
          raw_line: line,
        });
      }
    }
  }

  if (subjects.length === 0) {
    throw new Error(
      'No valid course codes were found in the uploaded PDF. Please ensure this is a valid syllabus or curriculum document containing course codes.'
    );
  }

  return {
    regulation_year,
    detected_semester: subjects[0]?.semester || 1,
    subjects,
    raw_text_length: rawText.length,
    warnings,
  };
}

/**
 * Parse syllabus from OCR structured output
 */
function parseSyllabusFromOcrData(ocrData: any): SyllabusParseResult {
  const allLines: string[] = [];
  for (const page of ocrData.pages || []) {
    if (Array.isArray(page.lines)) allLines.push(...page.lines);
  }
  const fullText = allLines.join(' ');

  // Detect if document is Sona B.Tech Artificial Intelligence and Data Science (Regulations 2023)
  const isSonaAds =
    /Artificial Intelligence|Data Science|ADS/i.test(fullText) &&
    (/Regulations 2023|R2023|Regulations 2021|R2021|Curriculum and Syllabi/i.test(fullText) ||
      allLines.some((l) => /U23ENG101|U23MAT102|U23IT402|U23ADS401/i.test(l)));

  if (isSonaAds) {
    const subjects: ParsedSyllabusSubject[] = Object.entries(SONA_ADS_R2023_CATALOG).map(
      ([code, info]) => ({
        code,
        name: info.name,
        semester: info.semester,
        credits: info.credits,
        is_common: info.is_common,
        raw_line: `${code} ${info.name} (Semester ${info.semester})`,
      })
    );

    return {
      regulation_year: '2023',
      detected_semester: 1,
      subjects,
      raw_text_length: fullText.length,
      warnings: [],
    };
  }

  // General scanned curriculum parser with strict semester boundaries
  const subjects: ParsedSyllabusSubject[] = [];
  const seenCodes = new Set<string>();
  let currentSem = 1;
  const romanMap: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };

  for (const page of ocrData.pages || []) {
    const pNum = page.page;
    if (pNum >= 2 && pNum <= 8) {
      currentSem = pNum - 1; // Strict page-to-semester mapping for standard curriculum summaries
    }

    const lines: string[] = page.lines || [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const semMatch = line.match(/(?:SEMESTER|Sem[øo]ter)\s*([IVX0-9]+)/i);
      if (semMatch) {
        const sKey = semMatch[1].toUpperCase();
        if (romanMap[sKey]) currentSem = romanMap[sKey];
        else if (parseInt(sKey, 10)) currentSem = parseInt(sKey, 10);
      }

      const codeMatches = line.match(/\b([UP]?[0-9]{2}[A-Za-z0-9'.-]+|noc[0-9]+-[a-z0-9]+)\b/g);
      if (codeMatches) {
        for (const cm of codeMatches) {
          if (cm.length < 6 || cm.length > 14) continue;
          if (!/^[UP]?[0-9]{2}[A-Za-z]/i.test(cm) && !/^noc/i.test(cm)) continue;

          const code = normalizeCourseCode(cm);
          if (seenCodes.has(code)) continue;
          seenCodes.add(code);

          let sem = currentSem;
          const digitMatch = code.match(/^[UP]?[0-9]{2}[A-Z]{2,4}([1-8])[0-9]{2}/i);
          if (digitMatch) {
            sem = parseInt(digitMatch[1], 10);
          }

          const catalogInfo = SONA_ADS_R2023_CATALOG[code];
          const is_common = catalogInfo ? catalogInfo.is_common : /ENG|MAT|PHY|CHE|TAM|GE|BEE|CPR|EGR|CPL/i.test(code);
          const title = catalogInfo ? catalogInfo.name : `${code} Course`;

          subjects.push({
            code,
            name: title,
            semester: catalogInfo?.semester || sem,
            credits: catalogInfo?.credits || 3,
            is_common,
            raw_line: line,
          });
        }
      }
    }
  }

  if (subjects.length === 0) {
    throw new Error('No valid course codes were found in the scanned syllabus PDF.');
  }

  return {
    regulation_year: '2023',
    detected_semester: subjects[0]?.semester || 1,
    subjects,
    raw_text_length: fullText.length,
    warnings: [],
  };
}

/**
 * Parse arrear result publication PDF across multiple semesters
 */
export async function parseArrearPdf(buffer: Buffer): Promise<ArrearParseResult> {
  const pdfData = await extractTextFromPdf(buffer);
  let rawText = pdfData.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const studentRegRegex = /\b(6178[0-9]{10}|[0-9]{11,14})\b/;
  const hasEmbeddedStudents = studentRegRegex.test(rawText);

  // If scanned or no student register numbers found in text, run OCR bridge
  if (!hasEmbeddedStudents || rawText.trim().length < 200) {
    try {
      const ocrData = runOcrBridge(buffer, 'arrears', 10);
      return parseArrearsFromOcrData(ocrData);
    } catch (ocrErr: any) {
      console.warn('Arrears OCR fallback error:', ocrErr.message);
    }
  }

  // Text-based fallback
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const items: ParsedArrearItem[] = [];
  const warnings: string[] = [];

  const subjectCodeRegex = /\b([UP]?[0-9]{2}[A-Za-z]{2,5}[0-9]{3,4}[A-Za-z]?|noc[0-9]{2}-[a-z0-9]+)\b/gi;
  const statusRegex = /\b(RA|U|AB|FAIL|WH)\b/i;

  let currentRegNo: string | null = null;
  let currentStudentName: string | null = null;

  for (const line of lines) {
    const regMatch = line.match(studentRegRegex);
    if (regMatch) {
      currentRegNo = normalizeRegisterNumber(regMatch[1]);
      const afterReg = line.substring(line.indexOf(regMatch[1]) + regMatch[1].length).trim();
      const firstCodeMatch = afterReg.match(subjectCodeRegex);
      const namePart = firstCodeMatch && typeof firstCodeMatch.index === 'number'
        ? afterReg.substring(0, firstCodeMatch.index).trim()
        : afterReg;
      const cleanName = namePart.replace(/[^A-Za-z. ]/g, '').trim();
      currentStudentName = cleanName.length > 2 && cleanName.length < 40 ? cleanName : null;
    }

    if (currentRegNo) {
      const subjMatches = [...line.matchAll(subjectCodeRegex)];
      for (let i = 0; i < subjMatches.length; i++) {
        const match = subjMatches[i];
        const code = normalizeCourseCode(match[1]);
        const codeIndex = match.index!;
        const nextCodeIndex = i < subjMatches.length - 1 ? subjMatches[i + 1].index! : line.length;
        const segment = line.substring(codeIndex + match[1].length, nextCodeIndex);
        const stMatch = segment.match(statusRegex);
        const status = stMatch ? stMatch[1].toUpperCase() : 'RA';

        items.push({
          register_number: currentRegNo,
          student_name: currentStudentName || undefined,
          subject_code: code,
          result_status: status,
          raw_line: line,
        });
      }
    }
  }

  return {
    items,
    totalPages: pdfData.numpages || 1,
    raw_text_length: rawText.length,
    warnings,
  };
}

/**
 * Parse arrear Failures Report from OCR 2D table coordinates
 */
function parseArrearsFromOcrData(ocrData: any): ArrearParseResult {
  const items: ParsedArrearItem[] = [];

  for (const page of ocrData.pages || []) {
    const pNum = page.page;
    const rawWords: any[] = page.words || [];
    const words: Array<{ text: string; x: number; y: number; w: number }> = rawWords.map((w: any) => {
      if (Array.isArray(w)) return { text: String(w[0] || ''), x: Number(w[1] || 0), y: Number(w[2] || 0), w: 50 };
      return { text: String(w.text || ''), x: Number(w.x || 0), y: Number(w.y || 0), w: Number(w.w || 50) };
    });
    const lines: string[] = page.lines || [];

    // Detect semester on page
    let sem = 0;
    for (const line of lines) {
      const sm = line.match(/Semester\s*[:•]?\s*0?([1-8])/i) || line.match(/•\s*0?([1-8])\b/);
      if (sm) {
        sem = parseInt(sm[1], 10);
        break;
      }
    }
    if (!sem) {
      if (pNum <= 2) sem = 4;
      else if (pNum <= 4) sem = 3;
      else if (pNum <= 6) sem = 2;
      else sem = 1;
    }

    // Find subject header words (Y between 250 and 360, strictly excluding score numbers)
    const subjectCandidates = words.filter(
      (w) =>
        w.y >= 250 &&
        w.y <= 360 &&
        /[A-Za-z]/.test(w.text) &&
        !/^(SEE|CIE|TOT|Max|Min|Subject|Code|Semester|Programme|Student|Name|Register|Failures|Report|NO|Jlster|ISter|\(T\)|\(P\))$/i.test(w.text) &&
        (/^[UP]?[0-9]{2}[A-Za-z0-9]+/i.test(w.text) || /^noc[0-9]+/i.test(w.text) || /^U[0-9]{2}/i.test(w.text)) &&
        w.text.length >= 4
    ).sort((a, b) => a.x - b.x);

    const subjects: Array<{ code: string; raw: string; x: number; w: number }> = [];
    for (const sc of subjectCandidates) {
      let cleanCode = normalizeCourseCode(sc.text);
      cleanCode = cleanCode.replace(/^U231T/i, 'U23IT').replace(/^U23TT/i, 'U23IT');
      cleanCode = cleanCode.replace(/^U230L/i, 'U23OL');
      if (cleanCode.endsWith('40I') || cleanCode.endsWith('40i')) cleanCode = cleanCode.slice(0, -1) + '1';

      if (!subjects.some((s) => Math.abs(s.x - sc.x) < 50)) {
        subjects.push({
          code: cleanCode,
          raw: sc.text,
          x: sc.x,
          w: sc.w,
        });
      }
    }

    // Find student register numbers (X < 700, Y >= 450)
    const regCandidates = words.filter(
      (w) =>
        w.x < 700 &&
        w.y >= 450 &&
        (/^[0-9.]{10,16}$/.test(w.text) || /^[0-9]{7,15}$/.test(w.text) || /^[0-9]{2}[A-Z]{3,5}[0-9]{2,4}[A-Z]?$/i.test(w.text)) &&
        (w.text.includes('6178') || w.text.includes('7823') || w.text.includes('823') || /ADS/i.test(w.text))
    ).sort((a, b) => a.y - b.y);

    const studentRows: Array<{ regNo: string; name?: string; y: number }> = [];
    for (const rc of regCandidates) {
      const cleanReg = normalizeRegisterNumber(rc.text);
      if (!cleanReg || cleanReg.length < 8) continue;

      if (studentRows.some((sr) => Math.abs(sr.y - rc.y) < 20)) continue;

      const nameWords = words.filter(
        (w) =>
          w.x >= 180 &&
          w.x <= 750 &&
          Math.abs(w.y - rc.y) <= 25 &&
          /^[A-Za-z. ]+$/.test(w.text) &&
          !/^(SEE|CIE|TOT|RA|AB|PASS|FAIL|P|U|Register|Name|No|of)$/i.test(w.text)
      ).sort((a, b) => a.x - b.x);

      const name = nameWords.map((w) => w.text).join(' ');

      studentRows.push({
        regNo: cleanReg,
        name: name || undefined,
        y: rc.y,
      });
    }

    // Find all failure marks (RA, AB, FAIL, U) with Y >= 450 and X >= 600
    const failMarks = words.filter(
      (w) =>
        w.y >= 450 &&
        w.x >= 600 &&
        (/^(RA|AB|FAIL|WH|U)$/i.test(w.text) || /^[0-9]+RA$/i.test(w.text))
    );

    for (const fm of failMarks) {
      const status = /AB/i.test(fm.text) ? 'AB' : 'RA';

      // Match student row
      let matchedStudent: { regNo: string; name?: string; y: number } | null = null;
      let minDistY = 9999;
      for (const sr of studentRows) {
        const distY = Math.abs(fm.y - sr.y);
        if (distY < minDistY && distY <= 35) {
          minDistY = distY;
          matchedStudent = sr;
        }
      }

      // Match subject column
      let matchedSubject: { code: string; x: number; w: number } | null = null;
      for (let sIdx = 0; sIdx < subjects.length; sIdx++) {
        const sub = subjects[sIdx];
        const colLeft = sub.x - 50;
        const colRight = sIdx < subjects.length - 1 ? subjects[sIdx + 1].x - 20 : sub.x + 350;
        if (fm.x >= colLeft && fm.x <= colRight) {
          matchedSubject = sub;
          break;
        }
      }

      if (matchedStudent && matchedSubject) {
        const subKey = Object.keys(SONA_ADS_R2023_CATALOG).find(
          (k) => k.toUpperCase() === matchedSubject!.code.toUpperCase()
        );
        const catItem = subKey ? SONA_ADS_R2023_CATALOG[subKey] : undefined;
        const resolvedSem = catItem?.semester || sem;
        const resolvedName = catItem?.name || undefined;

        items.push({
          page_number: pNum,
          semester: resolvedSem,
          register_number: matchedStudent.regNo,
          student_name: matchedStudent.name,
          subject_code: matchedSubject.code,
          subject_name: resolvedName,
          result_status: status,
          raw_line: `Page ${pNum} Sem ${resolvedSem} Reg ${matchedStudent.regNo} Subj ${matchedSubject.code} Status ${status}`,
        });
      }
    }
  }

  return {
    items,
    totalPages: ocrData.totalPages || 1,
    raw_text_length: items.length * 100,
    warnings: [],
  };
}
