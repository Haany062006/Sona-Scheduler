import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  Department,
  Regulation,
  Batch,
  RegulationBatch,
  Semester,
  Venue,
  Subject,
  Student,
  Faculty,
  FacultySubjectAssignment,
  PeerTutor,
  CCContact,
  ArrearRecord,
  CalendarBlackoutDate,
  RemedialClass,
  ClassStudent,
  TutorAllocation,
  AttendanceForm,
  AttendanceRecord,
  Notification,
  AuditLog,
} from '@/types/database.types';

// Path for local storage persistence
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'sona_db.json');

export interface DBState {
  departments: Department[];
  regulations: Regulation[];
  batches: Batch[];
  regulation_batches: RegulationBatch[];
  semesters: Semester[];
  venues: Venue[];
  subjects: Subject[];
  subject_departments: { id: string; subject_id: string; department_id: string }[];
  students: Student[];
  faculty: Faculty[];
  faculty_subject_assignments: FacultySubjectAssignment[];
  peer_tutors: PeerTutor[];
  cc_contacts: CCContact[];
  arrear_records: ArrearRecord[];
  calendar_blackout_dates: CalendarBlackoutDate[];
  remedial_classes: RemedialClass[];
  class_students: ClassStudent[];
  tutor_allocations: TutorAllocation[];
  attendance_forms: AttendanceForm[];
  attendance_records: AttendanceRecord[];
  notifications: Notification[];
  audit_logs: AuditLog[];
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Clean production state without demonstration or fabricated records
const INITIAL_STATE: DBState = {
  departments: [
    {
      id: '11111111-1111-1111-1111-111111111101',
      code: 'ADS',
      name: 'Artificial Intelligence and Data Science',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: '11111111-1111-1111-1111-111111111102',
      code: 'IT',
      name: 'Information Technology',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  regulations: [
    {
      id: '22222222-2222-2222-2222-222222222201',
      code: 'R2021',
      start_year: 2021,
      description: 'Autonomous Curriculum Regulation 2021',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222202',
      code: 'R2023',
      start_year: 2023,
      description: 'Autonomous Curriculum Regulation 2023',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  batches: [
    {
      id: '44444444-4444-4444-4444-444444444401',
      name: '2021-2025',
      start_year: 2021,
      end_year: 2025,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444444402',
      name: '2022-2026',
      start_year: 2022,
      end_year: 2026,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444444403',
      name: '2023-2027',
      start_year: 2023,
      end_year: 2027,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444444404',
      name: '2024-2028',
      start_year: 2024,
      end_year: 2028,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444444405',
      name: '2025-2029',
      start_year: 2025,
      end_year: 2029,
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  regulation_batches: [
    { id: 'rb-1', regulation_id: '22222222-2222-2222-2222-222222222201', batch_id: '44444444-4444-4444-4444-444444444401', department_id: '11111111-1111-1111-1111-111111111101', created_at: '2026-01-01T00:00:00Z' },
    { id: 'rb-2', regulation_id: '22222222-2222-2222-2222-222222222201', batch_id: '44444444-4444-4444-4444-444444444401', department_id: '11111111-1111-1111-1111-111111111102', created_at: '2026-01-01T00:00:00Z' },
    { id: 'rb-3', regulation_id: '22222222-2222-2222-2222-222222222201', batch_id: '44444444-4444-4444-4444-444444444402', department_id: '11111111-1111-1111-1111-111111111101', created_at: '2026-01-01T00:00:00Z' },
    { id: 'rb-4', regulation_id: '22222222-2222-2222-2222-222222222201', batch_id: '44444444-4444-4444-4444-444444444402', department_id: '11111111-1111-1111-1111-111111111102', created_at: '2026-01-01T00:00:00Z' },
    { id: 'rb-5', regulation_id: '22222222-2222-2222-2222-222222222202', batch_id: '44444444-4444-4444-4444-444444444403', department_id: '11111111-1111-1111-1111-111111111101', created_at: '2026-01-01T00:00:00Z' },
    { id: 'rb-6', regulation_id: '22222222-2222-2222-2222-222222222202', batch_id: '44444444-4444-4444-4444-444444444403', department_id: '11111111-1111-1111-1111-111111111102', created_at: '2026-01-01T00:00:00Z' },
    { id: 'rb-7', regulation_id: '22222222-2222-2222-2222-222222222202', batch_id: '44444444-4444-4444-4444-444444444404', department_id: '11111111-1111-1111-1111-111111111101', created_at: '2026-01-01T00:00:00Z' },
    { id: 'rb-8', regulation_id: '22222222-2222-2222-2222-222222222202', batch_id: '44444444-4444-4444-4444-444444444404', department_id: '11111111-1111-1111-1111-111111111102', created_at: '2026-01-01T00:00:00Z' },
    { id: 'rb-9', regulation_id: '22222222-2222-2222-2222-222222222202', batch_id: '44444444-4444-4444-4444-444444444405', department_id: '11111111-1111-1111-1111-111111111101', created_at: '2026-01-01T00:00:00Z' },
    { id: 'rb-10', regulation_id: '22222222-2222-2222-2222-222222222202', batch_id: '44444444-4444-4444-4444-444444444405', department_id: '11111111-1111-1111-1111-111111111102', created_at: '2026-01-01T00:00:00Z' },
  ],
  semesters: [
    { semester_number: 1, name: 'Semester 1', created_at: '2026-01-01T00:00:00Z' },
    { semester_number: 2, name: 'Semester 2', created_at: '2026-01-01T00:00:00Z' },
    { semester_number: 3, name: 'Semester 3', created_at: '2026-01-01T00:00:00Z' },
    { semester_number: 4, name: 'Semester 4', created_at: '2026-01-01T00:00:00Z' },
    { semester_number: 5, name: 'Semester 5', created_at: '2026-01-01T00:00:00Z' },
    { semester_number: 6, name: 'Semester 6', created_at: '2026-01-01T00:00:00Z' },
    { semester_number: 7, name: 'Semester 7', created_at: '2026-01-01T00:00:00Z' },
    { semester_number: 8, name: 'Semester 8', created_at: '2026-01-01T00:00:00Z' },
  ],
  venues: [
    { id: 'v-1', code: 'TP-304', name: 'ADS Remedial Hall TP-304', building: 'Tech Park', capacity: 60, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'v-2', code: 'TP-305', name: 'IT Remedial Hall TP-305', building: 'Tech Park', capacity: 60, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'v-3', code: 'MB-201', name: 'Main Block Seminar Hall 1', building: 'Main Block', capacity: 120, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'v-4', code: 'CS-LAB-1', name: 'Computing Laboratory 1', building: 'CS Block', capacity: 45, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
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
  audit_logs: [],
};

// Global in-memory cache and mtime tracking
let inMemoryState: DBState | null = null;
let lastMtime = 0;

function loadData(): DBState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const stat = fs.statSync(DATA_FILE);
      if (inMemoryState && stat.mtimeMs === lastMtime) {
        return inMemoryState;
      }
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      inMemoryState = JSON.parse(content);
      lastMtime = stat.mtimeMs;
      // Ensure all collections exist safely in loaded state
      if (!inMemoryState!.departments) inMemoryState!.departments = INITIAL_STATE.departments;
      if (!inMemoryState!.regulations) inMemoryState!.regulations = [];
      if (!inMemoryState!.batches) inMemoryState!.batches = [];
      if (!inMemoryState!.regulation_batches) inMemoryState!.regulation_batches = [];
      if (!inMemoryState!.semesters) inMemoryState!.semesters = INITIAL_STATE.semesters;
      if (!inMemoryState!.venues) inMemoryState!.venues = INITIAL_STATE.venues;
      if (!inMemoryState!.subjects) inMemoryState!.subjects = [];
      if (!inMemoryState!.subject_departments) inMemoryState!.subject_departments = [];
      if (!inMemoryState!.students) inMemoryState!.students = [];
      if (!inMemoryState!.faculty) inMemoryState!.faculty = [];
      if (!inMemoryState!.faculty_subject_assignments) inMemoryState!.faculty_subject_assignments = [];
      if (!inMemoryState!.peer_tutors) inMemoryState!.peer_tutors = [];
      if (!inMemoryState!.cc_contacts) inMemoryState!.cc_contacts = [];
      if (!inMemoryState!.arrear_records) inMemoryState!.arrear_records = [];
      if (!inMemoryState!.calendar_blackout_dates) inMemoryState!.calendar_blackout_dates = [];
      if (!inMemoryState!.remedial_classes) inMemoryState!.remedial_classes = [];
      if (!inMemoryState!.class_students) inMemoryState!.class_students = [];
      if (!inMemoryState!.tutor_allocations) inMemoryState!.tutor_allocations = [];
      if (!inMemoryState!.attendance_forms) inMemoryState!.attendance_forms = [];
      if (!inMemoryState!.attendance_records) inMemoryState!.attendance_records = [];
      if (!inMemoryState!.notifications) inMemoryState!.notifications = [];
      if (!inMemoryState!.audit_logs) inMemoryState!.audit_logs = [];
      return inMemoryState!;
    }
  } catch (err) {
    console.error('Error reading data file, using initial state:', err);
  }

  inMemoryState = JSON.parse(JSON.stringify(INITIAL_STATE));
  saveData(inMemoryState!);
  return inMemoryState!;
}

function saveData(data: DBState) {
  inMemoryState = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    lastMtime = fs.statSync(DATA_FILE).mtimeMs;
  } catch (err) {
    console.error('Error saving data to file:', err);
  }
}

// -------------------------------------------------------------
// REPOSITORY METHODS
// -------------------------------------------------------------

export const DataStore = {
  resetToCleanState(): DBState {
    inMemoryState = JSON.parse(JSON.stringify(INITIAL_STATE));
    saveData(inMemoryState!);
    return inMemoryState!;
  },

  // --- AUDIT LOGS (IMMUTABLE) ---
  logAction(
    action: string,
    entity_type: string,
    entity_id: string | null,
    metadata: Record<string, any> = {},
    user_email: string = 'admin@sonatech.ac.in',
    ip_address: string = '127.0.0.1'
  ): AuditLog {
    const data = loadData();
    const entry: AuditLog = {
      id: uuidv4(),
      user_email,
      action,
      entity_type,
      entity_id,
      metadata,
      ip_address,
      created_at: new Date().toISOString(),
    };
    data.audit_logs.unshift(entry);
    saveData(data);
    return entry;
  },

  getAuditLogs(): AuditLog[] {
    const data = loadData();
    return data.audit_logs;
  },

  // --- DASHBOARD METRICS ---
  getDashboardMetrics() {
    const data = loadData();
    const totalStudents = data.students.length;

    // Strict count of students who have active arrears
    const studentWithArrears = new Set(
      data.arrear_records.filter((a) => a.status === 'active').map((a) => a.student_id)
    );

    const totalFaculty = data.faculty.filter((f) => f.is_active).length;

    // Do NOT count cancelled classes in total or upcoming
    const activeClasses = data.remedial_classes.filter((c) => c.status !== 'cancelled');
    const totalRemedialClasses = activeClasses.length;
    const upcomingClasses = activeClasses.filter(
      (c) => c.status === 'scheduled' || c.status === 'approved'
    ).length;
    const completedClasses = activeClasses.filter((c) => c.status === 'completed').length;

    // Incomplete attendance forms (strictly pending submission)
    const pendingAttendanceForms = data.attendance_forms.filter(
      (f) => !f.is_submitted && (!f.expires_at || new Date(f.expires_at) > new Date())
    ).length;

    // Absentees counted STRICTLY from submitted forms
    const submittedFormIds = new Set(
      data.attendance_forms.filter((f) => f.is_submitted).map((f) => f.id)
    );
    const totalAbsentRecords = data.attendance_records.filter(
      (r) => r.status === 'absent' && submittedFormIds.has(r.attendance_form_id)
    ).length;

    // Upcoming class preview list
    const upcomingList = activeClasses
      .filter((c) => c.status === 'scheduled' || c.status === 'approved')
      .slice(0, 5)
      .map((c) => {
        const dept = data.departments.find((d) => d.id === c.department_id);
        const subj = data.subjects.find((s) => s.id === c.subject_id);
        const fac = data.faculty.find((f) => f.id === c.faculty_id);
        const count = data.class_students.filter((cs) => cs.remedial_class_id === c.id).length;
        const allocation = data.tutor_allocations.find((ta) => ta.remedial_class_id === c.id);
        const tutor = allocation
          ? data.peer_tutors.find((pt) => pt.id === allocation.peer_tutor_id)
          : undefined;
        const venueItem = c.venue_id ? data.venues.find((v) => v.id === c.venue_id) : undefined;
        return {
          ...c,
          department: dept,
          subject: subj,
          faculty: fac,
          student_count: count,
          peer_tutor: tutor,
          venue_details: venueItem,
        };
      });

    return {
      totalStudents,
      totalStudentsWithArrears: studentWithArrears.size,
      totalFaculty,
      totalRemedialClasses,
      upcomingClasses,
      completedClasses,
      pendingAttendanceForms,
      totalAbsentRecords,
      upcomingList,
    };
  },

  // --- DEPARTMENTS ---
  getDepartments(): Department[] {
    const data = loadData();
    return data.departments;
  },

  addDepartment(code: string, name: string): Department {
    const data = loadData();
    const cleanCode = code.trim().toUpperCase();
    const existing = data.departments.find((d) => d.code === cleanCode);
    if (existing) {
      throw new Error(`Department code "${cleanCode}" already exists.`);
    }
    const newDept: Department = {
      id: uuidv4(),
      code: cleanCode,
      name: name.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.departments.push(newDept);
    saveData(data);
    this.logAction('CREATE_DEPARTMENT', 'department', newDept.id, { code: newDept.code, name: newDept.name });
    return newDept;
  },

  toggleDepartment(id: string): Department {
    const data = loadData();
    const dept = data.departments.find((d) => d.id === id);
    if (!dept) throw new Error('Department not found.');
    dept.is_active = !dept.is_active;
    dept.updated_at = new Date().toISOString();
    saveData(data);
    this.logAction('TOGGLE_DEPARTMENT', 'department', id, { is_active: dept.is_active });
    return dept;
  },

  // --- VENUES (Phase 2 Correction) ---
  getVenues(): Venue[] {
    const data = loadData();
    return data.venues;
  },

  addVenue(
    codeOrParams:
      | string
      | {
          name: string;
          code?: string;
          building?: string;
          room_number?: string;
          capacity?: number;
        },
    name?: string,
    building?: string,
    capacity: number = 40
  ): Venue {
    const data = loadData();
    const cleanCode =
      typeof codeOrParams === 'string'
        ? codeOrParams.trim().toUpperCase()
        : (codeOrParams.code?.trim().toUpperCase() ||
          codeOrParams.name.split(' ')[0].toUpperCase());
    const cleanName =
      typeof codeOrParams === 'string'
        ? (name || codeOrParams).trim()
        : codeOrParams.name.trim();
    const cleanBuilding =
      typeof codeOrParams === 'string'
        ? building?.trim() || null
        : codeOrParams.building?.trim() || null;
    const cleanCapacity =
      typeof codeOrParams === 'string'
        ? Number(capacity) || 40
        : Number(codeOrParams.capacity) || 40;

    const existing = data.venues.find((v) => v.code === cleanCode);
    if (existing) throw new Error(`Venue code "${cleanCode}" already exists.`);

    const newVenue: Venue = {
      id: uuidv4(),
      code: cleanCode,
      name: cleanName,
      building: cleanBuilding,
      capacity: cleanCapacity,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.venues.push(newVenue);
    saveData(data);
    this.logAction('CREATE_VENUE', 'venue', newVenue.id, { code: newVenue.code, name: newVenue.name });
    return newVenue;
  },

  // --- REGULATIONS & BATCHES ---
  getRegulations(): Regulation[] {
    const data = loadData();
    return data.regulations;
  },

  getBatches(): Batch[] {
    const data = loadData();
    return data.batches;
  },

  getSemesters(): Semester[] {
    const data = loadData();
    return data.semesters;
  },

  addRegulation(code: string, start_year: number, description?: string): Regulation {
    const data = loadData();
    const cleanCode = code.trim().toUpperCase();
    const existing = data.regulations.find((r) => r.code === cleanCode);
    if (existing) throw new Error(`Regulation "${cleanCode}" already exists.`);
    const newReg: Regulation = {
      id: uuidv4(),
      code: cleanCode,
      start_year,
      description: description?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.regulations.push(newReg);
    saveData(data);
    this.logAction('CREATE_REGULATION', 'regulation', newReg.id, { code: newReg.code });
    return newReg;
  },

  addBatch(
    name: string,
    start_year: number,
    end_year: number,
    regulation_id?: string,
    department_id?: string
  ): Batch {
    const data = loadData();
    const cleanName = name.trim();
    let existing = data.batches.find((b) => b.name === cleanName);
    let batch = existing;
    if (!batch) {
      batch = {
        id: uuidv4(),
        name: cleanName,
        start_year,
        end_year,
        created_at: new Date().toISOString(),
      };
      data.batches.push(batch);
    }
    if (regulation_id) {
      const existsRb = data.regulation_batches.find(
        (rb) =>
          rb.batch_id === batch!.id &&
          rb.regulation_id === regulation_id &&
          rb.department_id === (department_id || null)
      );
      if (!existsRb) {
        data.regulation_batches.push({
          id: uuidv4(),
          batch_id: batch.id,
          regulation_id,
          department_id: department_id || null,
          created_at: new Date().toISOString(),
        });
      }
    }
    saveData(data);
    this.logAction('CREATE_BATCH', 'batch', batch.id, { name: batch.name, regulation_id });
    return batch;
  },

  getRegulationForBatch(batch_id: string, department_id?: string): Regulation | null {
    const data = loadData();
    const mapping = data.regulation_batches.find((rb) => {
      if (department_id && rb.department_id) {
        return rb.batch_id === batch_id && rb.department_id === department_id;
      }
      return rb.batch_id === batch_id;
    });
    if (!mapping) return null;
    return data.regulations.find((r) => r.id === mapping.regulation_id) || null;
  },

  addRegulationBatchMapping(
    regulation_id: string,
    batch_id: string,
    department_id?: string | null
  ): RegulationBatch {
    const data = loadData();
    const existing = data.regulation_batches.find(
      (rb) =>
        rb.regulation_id === regulation_id &&
        rb.batch_id === batch_id &&
        rb.department_id === (department_id || null)
    );
    if (existing) return existing;

    const mapping: RegulationBatch = {
      id: uuidv4(),
      regulation_id,
      batch_id,
      department_id: department_id || null,
      created_at: new Date().toISOString(),
    };
    data.regulation_batches.push(mapping);
    saveData(data);
    return mapping;
  },

  getRegulationBatches(): RegulationBatch[] {
    const data = loadData();
    return data.regulation_batches.map((rb) => ({
      ...rb,
      regulation: data.regulations.find((r) => r.id === rb.regulation_id),
      batch: data.batches.find((b) => b.id === rb.batch_id),
      department: data.departments.find((d) => d.id === rb.department_id),
    }));
  },

  linkRegulationBatch(regulation_id: string, batch_id: string, department_id: string): RegulationBatch {
    const data = loadData();
    const existing = data.regulation_batches.find(
      (rb) =>
        rb.regulation_id === regulation_id &&
        rb.batch_id === batch_id &&
        rb.department_id === department_id
    );
    if (existing) return existing;
    const newRb: RegulationBatch = {
      id: uuidv4(),
      regulation_id,
      batch_id,
      department_id,
      created_at: new Date().toISOString(),
    };
    data.regulation_batches.push(newRb);
    saveData(data);
    return newRb;
  },

  // --- SUBJECTS ---
  getSubjects(department_id?: string, regulation_id?: string): Subject[] {
    const data = loadData();
    return data.subjects
      .filter((s) => !regulation_id || s.regulation_id === regulation_id)
      .filter((s) => {
        if (!department_id) return true;
        return data.subject_departments.some(
          (sd) => sd.subject_id === s.id && sd.department_id === department_id
        );
      })
      .map((s) => {
        const reg = data.regulations.find((r) => r.id === s.regulation_id);
        const depts = data.subject_departments
          .filter((sd) => sd.subject_id === s.id)
          .map((sd) => data.departments.find((d) => d.id === sd.department_id)!)
          .filter(Boolean);
        return {
          ...s,
          regulation: reg,
          departments: depts,
        };
      });
  },

  addSubject(
    codeOrParams:
      | string
      | {
          code: string;
          name: string;
          regulation_id: string;
          department_id?: string | null;
          department_ids?: string[];
          semester?: number;
          semester_number?: number;
          credits?: number;
          is_common?: boolean;
        },
    name?: string,
    regulation_id?: string,
    semester_number?: number,
    department_ids: string[] = [],
    is_common: boolean = false
  ): Subject {
    const data = loadData();
    const cleanCode =
      typeof codeOrParams === 'string'
        ? codeOrParams.trim().toUpperCase()
        : codeOrParams.code.trim().toUpperCase();
    const cleanName =
      typeof codeOrParams === 'string'
        ? (name || '').trim()
        : codeOrParams.name.trim();
    const targetReg =
      typeof codeOrParams === 'string'
        ? regulation_id || ''
        : codeOrParams.regulation_id;
    const semNum =
      typeof codeOrParams === 'string'
        ? semester_number || 1
        : codeOrParams.semester_number || codeOrParams.semester || 1;
    const commonFlag =
      typeof codeOrParams === 'string'
        ? is_common
        : Boolean(codeOrParams.is_common);
    const deptList =
      typeof codeOrParams === 'string'
        ? department_ids
        : codeOrParams.department_ids || (codeOrParams.department_id ? [codeOrParams.department_id] : []);

    // Check if subject code already exists under regulation
    let existingSubject = data.subjects.find(
      (s) => s.code === cleanCode && s.regulation_id === targetReg
    );

    if (existingSubject) {
      // Map to additional departments without duplicate subject record
      for (const dId of deptList) {
        const mapped = data.subject_departments.some(
          (sd) => sd.subject_id === existingSubject!.id && sd.department_id === dId
        );
        if (!mapped) {
          data.subject_departments.push({
            id: uuidv4(),
            subject_id: existingSubject.id,
            department_id: dId,
          });
        }
      }
      saveData(data);
      return existingSubject;
    }

    const newSubject: Subject = {
      id: uuidv4(),
      code: cleanCode,
      name: cleanName,
      regulation_id: targetReg,
      semester_number: semNum,
      is_common: commonFlag,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.subjects.push(newSubject);

    for (const dId of deptList) {
      data.subject_departments.push({
        id: uuidv4(),
        subject_id: newSubject.id,
        department_id: dId,
      });
    }

    saveData(data);
    this.logAction('CREATE_SUBJECT', 'subject', newSubject.id, {
      code: newSubject.code,
      name: newSubject.name,
      department_ids: deptList,
    });
    return newSubject;
  },

  // --- STUDENTS ---
  getStudents(
    filtersOrDeptId?:
      | string
      | {
          department_id?: string;
          batch_id?: string;
          section?: string;
          search?: string;
        },
    batch_id?: string
  ): Student[] {
    const filters =
      typeof filtersOrDeptId === 'string'
        ? { department_id: filtersOrDeptId, batch_id }
        : filtersOrDeptId;

    const data = loadData();
    return data.students
      .filter((s) => !filters?.department_id || s.department_id === filters.department_id)
      .filter((s) => !filters?.batch_id || s.batch_id === filters.batch_id)
      .filter((s) => !filters?.section || s.section === filters.section)
      .filter((s) => {
        if (!filters?.search) return true;
        const q = filters.search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.register_number.toLowerCase().includes(q);
      })
      .map((s) => ({
        ...s,
        department: data.departments.find((d) => d.id === s.department_id),
        batch: data.batches.find((b) => b.id === s.batch_id),
      }));
  },

  addStudent(
    register_number: string,
    name: string,
    department_id: string,
    batch_id: string,
    section: string = 'A',
    email: string | null = null,
    phone: string | null = null
  ): Student {
    const data = loadData();
    const cleanReg = String(register_number).trim();
    const existing = data.students.find((s) => s.register_number === cleanReg);
    if (existing) return existing;

    const newStudent: Student = {
      id: uuidv4(),
      register_number: cleanReg,
      name: name.trim(),
      department_id,
      batch_id,
      section,
      email,
      phone,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.students.push(newStudent);
    saveData(data);
    return newStudent;
  },

  importStudents(
    newStudents: {
      register_number: string;
      name: string;
      department_id: string;
      batch_id: string;
      section: string;
      email?: string | null;
      phone?: string | null;
    }[]
  ) {
    const data = loadData();
    const imported: Student[] = [];
    const skipped: { register_number: string; reason: string }[] = [];

    for (const item of newStudents) {
      const reg = String(item.register_number).trim();
      const existing = data.students.find((s) => s.register_number === reg);
      if (existing) {
        skipped.push({ register_number: reg, reason: 'Duplicate register number already exists in master' });
        continue;
      }

      const st: Student = {
        id: uuidv4(),
        register_number: reg, // strictly string preserving leading zeros
        name: item.name.trim(),
        department_id: item.department_id,
        batch_id: item.batch_id,
        section: item.section.trim().toUpperCase(),
        email: item.email?.trim() || null,
        phone: item.phone?.trim() || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.students.push(st);
      imported.push(st);
    }

    saveData(data);
    this.logAction('IMPORT_STUDENTS', 'student', null, {
      importedCount: imported.length,
      skippedCount: skipped.length,
    });
    return { imported, skipped };
  },

  updateStudent(
    id: string,
    updates: {
      name?: string;
      register_number?: string;
      department_id?: string;
      batch_id?: string;
      section?: string;
      email?: string | null;
      phone?: string | null;
    }
  ): Student {
    const data = loadData();
    const st = data.students.find((s) => s.id === id);
    if (!st) throw new Error('Student record not found.');

    if (updates.register_number && updates.register_number.trim() !== st.register_number) {
      const cleanReg = updates.register_number.trim();
      const duplicate = data.students.find((s) => s.id !== id && s.register_number === cleanReg);
      if (duplicate) throw new Error(`Student with register number "${cleanReg}" already exists.`);
      st.register_number = cleanReg;
    }

    if (updates.name !== undefined) st.name = updates.name.trim();
    if (updates.department_id !== undefined) st.department_id = updates.department_id;
    if (updates.batch_id !== undefined) st.batch_id = updates.batch_id;
    if (updates.section !== undefined) st.section = updates.section.trim().toUpperCase();
    if (updates.email !== undefined) st.email = updates.email?.trim() || null;
    if (updates.phone !== undefined) st.phone = updates.phone?.trim() || null;
    st.updated_at = new Date().toISOString();

    saveData(data);
    this.logAction('UPDATE_STUDENT', 'student', st.id, {
      name: st.name,
      register_number: st.register_number,
      section: st.section,
    });
    return st;
  },

  deleteStudent(id: string): boolean {
    const data = loadData();
    const idx = data.students.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Student record not found.');

    const deleted = data.students.splice(idx, 1)[0];
    data.class_students = data.class_students.filter((cs) => cs.student_id !== id);
    data.arrear_records = data.arrear_records.filter((ar) => ar.student_id !== id);

    saveData(data);
    this.logAction('DELETE_STUDENT', 'student', id, {
      name: deleted.name,
      register_number: deleted.register_number,
    });
    return true;
  },

  deleteStudentsBatch(ids: string[]): { deletedCount: number } {
    const data = loadData();
    const idSet = new Set(ids);
    const initialCount = data.students.length;
    data.students = data.students.filter((s) => !idSet.has(s.id));
    const deletedCount = initialCount - data.students.length;

    data.class_students = data.class_students.filter((cs) => !idSet.has(cs.student_id));
    data.arrear_records = data.arrear_records.filter((ar) => !idSet.has(ar.student_id));

    saveData(data);
    this.logAction('BATCH_DELETE_STUDENTS', 'student', null, {
      requestedCount: ids.length,
      deletedCount,
    });
    return { deletedCount };
  },

  // --- FACULTY (Class-Wise: Department + Academic Year + Section) ---
  getFaculty(filters?: string | { department_id?: string; academic_year?: string; section?: string; subject_id?: string }): Faculty[] {
    const data = loadData();
    const deptId = typeof filters === 'string' ? filters : filters?.department_id;
    const yearFilter = typeof filters === 'object' ? filters?.academic_year : undefined;
    const secFilter = typeof filters === 'object' ? filters?.section : undefined;
    const subjFilter = typeof filters === 'object' ? filters?.subject_id : undefined;

    return data.faculty
      .filter((f) => !deptId || f.department_id === deptId)
      .filter((f) => {
        if (!yearFilter) return true;
        if (!f.academic_year) return true;
        const normY1 = f.academic_year.toLowerCase().replace(/[^0-9a-z]/g, '');
        const normY2 = yearFilter.toLowerCase().replace(/[^0-9a-z]/g, '');
        return normY1 === normY2 || normY1.includes(normY2) || normY2.includes(normY1);
      })
      .filter((f) => {
        if (!secFilter) return true;
        if (!f.section || f.section.toUpperCase() === 'BOTH' || f.section.toUpperCase() === 'ALL') return true;
        return f.section.trim().toUpperCase() === secFilter.trim().toUpperCase();
      })
      .map((f) => {
        const assignedSubjIds = data.faculty_subject_assignments
          .filter((a) => a.faculty_id === f.id)
          .map((a) => a.subject_id);
        const assignedSubjects = data.subjects.filter((s) => assignedSubjIds.includes(s.id));
        return {
          ...f,
          department: data.departments.find((d) => d.id === f.department_id),
          assigned_subjects: assignedSubjects,
          assigned_subject_ids: assignedSubjIds,
        };
      })
      .filter((f) => {
        if (!subjFilter) return true;
        return (f.assigned_subject_ids || []).includes(subjFilter);
      });
  },

  addFaculty(
    nameOrParams: string | {
      name: string;
      department_id: string;
      academic_year?: string | null;
      section?: string | null;
      email?: string | null;
      phone?: string | null;
      faculty_id_code?: string | null;
      assigned_subject_ids?: string[];
    },
    legacyName?: string,
    legacyDeptId?: string,
    legacyEmail?: string | null,
    legacyPhone?: string | null
  ): Faculty {
    const data = loadData();
    let name = '';
    let department_id = '';
    let faculty_id_code = '';
    let academic_year: string | null = null;
    let section: string | null = null;
    let email: string | null = null;
    let phone: string | null = null;
    let assigned_subject_ids: string[] = [];

    if (typeof nameOrParams === 'object') {
      name = nameOrParams.name;
      department_id = nameOrParams.department_id;
      academic_year = nameOrParams.academic_year || null;
      section = nameOrParams.section || null;
      email = nameOrParams.email || null;
      phone = nameOrParams.phone || null;
      faculty_id_code = nameOrParams.faculty_id_code || '';
      assigned_subject_ids = nameOrParams.assigned_subject_ids || [];
    } else if (legacyName && legacyDeptId) {
      faculty_id_code = nameOrParams;
      name = legacyName;
      department_id = legacyDeptId;
      email = legacyEmail || null;
      phone = legacyPhone || null;
    } else {
      name = nameOrParams;
      department_id = legacyDeptId || (data.departments[0]?.id ?? '');
    }

    if (!name || !name.trim()) throw new Error('Faculty name is required.');
    if (!department_id) throw new Error('Department is required.');

    const cleanCode = faculty_id_code.trim().toUpperCase();

    const fac: Faculty = {
      id: uuidv4(),
      faculty_id_code: cleanCode || undefined,
      name: name.trim(),
      department_id,
      academic_year: academic_year?.trim() || null,
      section: section?.trim().toUpperCase() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.faculty.push(fac);

    if (assigned_subject_ids && assigned_subject_ids.length > 0) {
      for (const sId of assigned_subject_ids) {
        data.faculty_subject_assignments.push({
          id: uuidv4(),
          faculty_id: fac.id,
          subject_id: sId,
          department_id: fac.department_id,
          academic_year: fac.academic_year,
          section: fac.section,
          created_at: new Date().toISOString(),
        });
      }
    }

    saveData(data);
    this.logAction('CREATE_FACULTY', 'faculty', fac.id, {
      name: fac.name,
      academic_year: fac.academic_year,
      section: fac.section,
    });
    return fac;
  },

  importFaculty(
    newFaculty: {
      faculty_id_code?: string;
      name: string;
      department_id: string;
      academic_year?: string | null;
      section?: string | null;
      email?: string | null;
      phone?: string | null;
      assigned_subject_codes?: string[];
      assigned_subject_ids?: string[];
    }[]
  ) {
    const data = loadData();
    const imported: Faculty[] = [];
    const skipped: { name: string; reason: string }[] = [];

    for (const item of newFaculty) {
      const facName = String(item.name || '').trim();
      if (!facName) {
        skipped.push({ name: 'EMPTY', reason: 'Faculty name is required' });
        continue;
      }

      const fac: Faculty = {
        id: uuidv4(),
        faculty_id_code: item.faculty_id_code?.trim().toUpperCase() || undefined,
        name: facName,
        department_id: item.department_id,
        academic_year: item.academic_year?.trim() || null,
        section: item.section?.trim().toUpperCase() || null,
        email: item.email?.trim() || null,
        phone: item.phone?.trim() || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.faculty.push(fac);
      imported.push(fac);

      if (Array.isArray(item.assigned_subject_ids)) {
        for (const sId of item.assigned_subject_ids) {
          data.faculty_subject_assignments.push({
            id: uuidv4(),
            faculty_id: fac.id,
            subject_id: sId,
            department_id: fac.department_id,
            academic_year: fac.academic_year,
            section: fac.section,
            created_at: new Date().toISOString(),
          });
        }
      } else if (Array.isArray(item.assigned_subject_codes)) {
        for (const subCode of item.assigned_subject_codes) {
          const cleanSubCode = subCode.trim().toUpperCase();
          const matchedSub = data.subjects.find((s) => s.code.toUpperCase() === cleanSubCode);
          if (matchedSub) {
            data.faculty_subject_assignments.push({
              id: uuidv4(),
              faculty_id: fac.id,
              subject_id: matchedSub.id,
              department_id: fac.department_id,
              academic_year: fac.academic_year,
              section: fac.section,
              created_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    saveData(data);
    this.logAction('IMPORT_FACULTY', 'faculty', null, {
      importedCount: imported.length,
      skippedCount: skipped.length,
    });
    return { imported, skipped };
  },

  mapFacultySubject(
    faculty_id: string,
    subject_id: string,
    department_id?: string,
    regulation_id?: string,
    academic_year?: string
  ) {
    const data = loadData();
    const exists = data.faculty_subject_assignments.some(
      (a) => a.faculty_id === faculty_id && a.subject_id === subject_id
    );
    if (!exists) {
      data.faculty_subject_assignments.push({
        id: uuidv4(),
        faculty_id,
        subject_id,
        department_id: department_id || null,
        regulation_id: regulation_id || null,
        academic_year: academic_year || '2026-2027',
        created_at: new Date().toISOString(),
      });
      saveData(data);
      this.logAction('ASSIGN_FACULTY_SUBJECT', 'faculty', faculty_id, { subject_id, department_id });
    }
  },

  updateFaculty(
    id: string,
    updates: {
      name?: string;
      department_id?: string;
      academic_year?: string | null;
      section?: string | null;
      email?: string | null;
      phone?: string | null;
      faculty_id_code?: string | null;
      assigned_subject_ids?: string[];
    }
  ): Faculty {
    const data = loadData();
    const fac = data.faculty.find((f) => f.id === id);
    if (!fac) throw new Error('Faculty member not found.');

    if (updates.name !== undefined) {
      if (!updates.name.trim()) throw new Error('Faculty name cannot be empty.');
      fac.name = updates.name.trim();
    }
    if (updates.department_id !== undefined) fac.department_id = updates.department_id;
    if (updates.academic_year !== undefined) fac.academic_year = updates.academic_year?.trim() || null;
    if (updates.section !== undefined) fac.section = updates.section?.trim().toUpperCase() || null;
    if (updates.email !== undefined) fac.email = updates.email?.trim() || null;
    if (updates.phone !== undefined) fac.phone = updates.phone?.trim() || null;
    if (updates.faculty_id_code !== undefined) fac.faculty_id_code = updates.faculty_id_code?.trim() || undefined;
    fac.updated_at = new Date().toISOString();

    if (Array.isArray(updates.assigned_subject_ids)) {
      data.faculty_subject_assignments = data.faculty_subject_assignments.filter((a) => a.faculty_id !== id);
      for (const sId of updates.assigned_subject_ids) {
        data.faculty_subject_assignments.push({
          id: uuidv4(),
          faculty_id: fac.id,
          subject_id: sId,
          department_id: fac.department_id,
          academic_year: fac.academic_year,
          section: fac.section,
          created_at: new Date().toISOString(),
        });
      }
    }

    saveData(data);
    this.logAction('UPDATE_FACULTY', 'faculty', fac.id, {
      name: fac.name,
      department_id: fac.department_id,
      academic_year: fac.academic_year,
      section: fac.section,
    });
    return fac;
  },

  deleteFaculty(id: string): boolean {
    const data = loadData();
    const idx = data.faculty.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Faculty member not found.');

    const deleted = data.faculty.splice(idx, 1)[0];
    data.faculty_subject_assignments = data.faculty_subject_assignments.filter((a) => a.faculty_id !== id);

    saveData(data);
    this.logAction('DELETE_FACULTY', 'faculty', id, {
      name: deleted.name,
      academic_year: deleted.academic_year,
      section: deleted.section,
    });
    return true;
  },

  unmapFacultySubject(faculty_id: string, subject_id: string): boolean {
    const data = loadData();
    const initialLen = data.faculty_subject_assignments.length;
    data.faculty_subject_assignments = data.faculty_subject_assignments.filter(
      (a) => !(a.faculty_id === faculty_id && a.subject_id === subject_id)
    );
    const removed = initialLen > data.faculty_subject_assignments.length;
    if (removed) {
      saveData(data);
      this.logAction('UNASSIGN_FACULTY_SUBJECT', 'faculty', faculty_id, { subject_id });
    }
    return removed;
  },

  // --- ARREAR MANAGEMENT (PARTIAL UNIQUE INDEX LOGIC) ---
  getArrearRecords(filters?: {
    department_id?: string;
    batch_id?: string;
    subject_id?: string;
    status?: string;
  }): ArrearRecord[] {
    const data = loadData();
    return data.arrear_records
      .filter((a) => !filters?.batch_id || a.batch_id === filters.batch_id)
      .filter((a) => !filters?.subject_id || a.subject_id === filters.subject_id)
      .filter((a) => !filters?.status || a.status === filters.status)
      .map((a) => {
        const student = data.students.find((s) => s.id === a.student_id);
        const subject = data.subjects.find((s) => s.id === a.subject_id);
        const batch = data.batches.find((b) => b.id === a.batch_id);
        return {
          ...a,
          student: student
            ? {
                ...student,
                department: data.departments.find((d) => d.id === student.department_id),
              }
            : undefined,
          subject,
          batch,
        };
      })
      .filter((a) => {
        if (!filters?.department_id) return true;
        return a.student?.department_id === filters.department_id;
      });
  },

  getArrears(department_id?: string, batch_id?: string): ArrearRecord[] {
    return this.getArrearRecords({ department_id, batch_id });
  },

  addArrear(params: {
    student_id: string;
    subject_id: string;
    batch_id?: string;
    semester_number?: number;
    status?: 'active' | 'cleared';
    source_file?: string;
  }): ArrearRecord {
    const data = loadData();
    const student = data.students.find((s) => s.id === params.student_id);
    if (!student) throw new Error(`Student ${params.student_id} not found.`);

    const subject = data.subjects.find((s) => s.id === params.subject_id);
    if (!subject) throw new Error(`Subject ${params.subject_id} not found.`);

    const status = params.status || 'active';

    if (status === 'active') {
      const existing = data.arrear_records.find(
        (a) => a.student_id === params.student_id && a.subject_id === params.subject_id && a.status === 'active'
      );
      if (existing) {
        throw new Error(`Student ${student.register_number} already has an active arrear in ${subject.code}`);
      }
    }

    const rec: ArrearRecord = {
      id: uuidv4(),
      student_id: params.student_id,
      subject_id: params.subject_id,
      batch_id: params.batch_id || student.batch_id,
      semester_number: params.semester_number || subject.semester_number,
      source_file_id: null,
      source_file: params.source_file || 'Direct Entry',
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      student,
      subject,
    };
    data.arrear_records.push(rec);
    saveData(data);
    return rec;
  },

  importArrearRecords(
    records: {
      register_number: string;
      student_name?: string;
      subject_code: string;
      batch_id: string;
      semester_number: number;
      source_page?: number;
    }[],
    options?: {
      auto_create_missing?: boolean;
      department_id?: string;
    }
  ) {
    const data = loadData();
    const added: ArrearRecord[] = [];
    const unmatchedStudents: string[] = [];
    const unmatchedSubjects: string[] = [];
    const existingDuplicates: string[] = [];

    const autoCreate = options?.auto_create_missing ?? false;
    const deptId = options?.department_id || data.departments[0]?.id || 'dept_ads';

    for (const item of records) {
      let student = data.students.find((s) => s.register_number === String(item.register_number).trim());
      if (!student && autoCreate) {
        student = {
          id: uuidv4(),
          register_number: String(item.register_number).trim(),
          name: item.student_name && item.student_name !== 'Unknown Student' ? item.student_name : `Student ${item.register_number}`,
          department_id: deptId,
          batch_id: item.batch_id || data.batches[0]?.id || 'batch_1',
          section: 'A',
          email: null,
          phone: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        data.students.push(student);
      }
      if (!student) {
        unmatchedStudents.push(item.register_number);
        continue;
      }

      let subject = data.subjects.find((s) => s.code.toUpperCase() === item.subject_code.trim().toUpperCase());
      if (!subject && autoCreate) {
        const isCommon = /ENG|MAT|PHY|CHE|TAM|GE|BEE|CPR|EGR|CPL/i.test(item.subject_code);
        const regId = data.regulations[0]?.id || 'reg_r2023';
        subject = {
          id: uuidv4(),
          code: item.subject_code.trim().toUpperCase(),
          name: `${item.subject_code.trim().toUpperCase()} Course`,
          regulation_id: regId,
          semester_number: item.semester_number || 1,
          departments: isCommon ? [] : data.departments.filter((d) => d.id === deptId),
          is_common: isCommon,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        data.subjects.push(subject);
      }
      if (!subject) {
        unmatchedSubjects.push(item.subject_code);
        continue;
      }

      // Partial unique index enforcement: exactly ONE active arrear record per student and subject
      const existingActive = data.arrear_records.find(
        (a) => a.student_id === student!.id && a.subject_id === subject!.id && a.status === 'active'
      );
      if (existingActive) {
        existingDuplicates.push(`${student.register_number} (${subject.code})`);
        continue;
      }

      const newRec: ArrearRecord = {
        id: uuidv4(),
        student_id: student.id,
        subject_id: subject.id,
        batch_id: item.batch_id,
        semester_number: item.semester_number,
        source_file_id: null,
        source_page: item.source_page || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.arrear_records.push(newRec);
      added.push(newRec);
    }

    saveData(data);
    this.logAction('IMPORT_ARREARS', 'arrear_record', null, {
      addedCount: added.length,
      unmatchedStudentsCount: unmatchedStudents.length,
      unmatchedSubjectsCount: unmatchedSubjects.length,
      duplicatesCount: existingDuplicates.length,
    });
    return { added, unmatchedStudents, unmatchedSubjects, existingDuplicates };
  },

  getSubjectWiseGroupings(department_id?: string, batch_id?: string) {
    const data = loadData();
    const activeArrears = data.arrear_records.filter((a) => a.status === 'active');

    const groupsMap = new Map<
      string,
      {
        subject: Subject;
        batch: Batch;
        department: Department;
        students: (Student & { semester_number: number })[];
      }
    >();

    for (const rec of activeArrears) {
      const student = data.students.find((s) => s.id === rec.student_id);
      if (!student) continue;

      if (department_id && student.department_id !== department_id) continue;
      if (batch_id && rec.batch_id !== batch_id) continue;

      const subject = data.subjects.find((s) => s.id === rec.subject_id);
      const batch = data.batches.find((b) => b.id === rec.batch_id);
      const dept = data.departments.find((d) => d.id === student.department_id);

      if (!subject || !batch || !dept) continue;

      const key = `${subject.id}-${batch.id}-${dept.id}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          subject,
          batch,
          department: dept,
          students: [],
        });
      }

      groupsMap.get(key)!.students.push({
        ...student,
        semester_number: rec.semester_number,
      });
    }

    return Array.from(groupsMap.values());
  },

  // --- CALENDAR & BLACKOUT DATES (COLLEGE-WIDE & DEPT SPECIFIC) ---
  getCalendarBlackouts(): CalendarBlackoutDate[] {
    const data = loadData();
    return data.calendar_blackout_dates;
  },

  addCalendarBlackout(
    date_val: string,
    reason: string,
    event_type: 'holiday' | 'exam' | 'college_event',
    department_id: string | null = null
  ): CalendarBlackoutDate {
    const data = loadData();
    const existing = data.calendar_blackout_dates.find(
      (c) => c.date_val === date_val && c.department_id === department_id
    );
    if (existing) {
      throw new Error(`A blackout date on ${date_val} already exists for this scope.`);
    }

    const entry: CalendarBlackoutDate = {
      id: uuidv4(),
      date_val,
      reason,
      event_type,
      department_id,
      created_at: new Date().toISOString(),
    };
    data.calendar_blackout_dates.push(entry);
    saveData(data);
    this.logAction('CREATE_CALENDAR_BLACKOUT', 'calendar', entry.id, {
      date: date_val,
      reason,
      scope: department_id ? 'department' : 'college_wide',
    });
    return entry;
  },

  deleteCalendarBlackout(id: string) {
    const data = loadData();
    data.calendar_blackout_dates = data.calendar_blackout_dates.filter((c) => c.id !== id);
    saveData(data);
  },

  // --- REMEDIAL CLASSES & MATHEMATICAL CONFLICT ENGINE ---
  getRemedialClasses(filters?: {
    department_id?: string;
    status?: string;
    date?: string;
  }): RemedialClass[] {
    const data = loadData();
    return data.remedial_classes
      .filter((c) => !filters?.department_id || c.department_id === filters.department_id)
      .filter((c) => !filters?.status || c.status === filters.status)
      .filter((c) => !filters?.date || c.class_date === filters.date)
      .map((c) => {
        const dept = data.departments.find((d) => d.id === c.department_id);
        const batch = data.batches.find((b) => b.id === c.batch_id);
        const reg = data.regulations.find((r) => r.id === c.regulation_id);
        const subj = data.subjects.find((s) => s.id === c.subject_id);
        const fac = data.faculty.find((f) => f.id === c.faculty_id);
        const venueItem = c.venue_id ? data.venues.find((v) => v.id === c.venue_id) : undefined;

        const enrolledStudentIds = data.class_students
          .filter((cs) => cs.remedial_class_id === c.id)
          .map((cs) => cs.student_id);
        const enrolledStudents = data.students.filter((s) => enrolledStudentIds.includes(s.id));

        const alloc = data.tutor_allocations.find((ta) => ta.remedial_class_id === c.id);
        const tutor = alloc ? data.peer_tutors.find((pt) => pt.id === alloc.peer_tutor_id) : undefined;
        const form = data.attendance_forms.find((af) => af.remedial_class_id === c.id);

        return {
          ...c,
          department: dept,
          batch,
          regulation: reg,
          subject: subj,
          faculty: fac,
          venue_details: venueItem,
          peer_tutor: tutor,
          attendance_form: form,
          attendance_token: form?.access_token || form?.form_token,
          students: enrolledStudents,
          student_count: enrolledStudents.length,
        };
      });
  },

  checkScheduleConflicts(proposal: {
    class_date: string;
    start_time: string;
    end_time: string;
    faculty_id?: string | null;
    peer_tutor_id?: string | null;
    venue?: string;
    venue_id?: string;
    department_id?: string;
    student_ids: string[];
    exclude_class_id?: string;
  }) {
    const data = loadData();
    const conflicts: {
      type: 'faculty' | 'student' | 'venue' | 'blackout' | 'time';
      title: string;
      description: string;
      entity_names: string[];
    }[] = [];

    // 0. Time Interval Validity Check: end_time must be strictly greater than start_time
    if (proposal.end_time <= proposal.start_time) {
      conflicts.push({
        type: 'time',
        title: 'Invalid Time Slot',
        description: `Class end time (${proposal.end_time}) must be strictly after start time (${proposal.start_time}).`,
        entity_names: [`${proposal.start_time} - ${proposal.end_time}`],
      });
      return conflicts;
    }

    // 1. Blackout Date Check: Both college-wide (null) and department-specific
    const blackout = data.calendar_blackout_dates.find(
      (b) =>
        b.date_val === proposal.class_date &&
        (b.department_id === null || b.department_id === proposal.department_id)
    );
    if (blackout) {
      conflicts.push({
        type: 'blackout',
        title: 'Academic Calendar Blackout Restriction',
        description: `Date ${proposal.class_date} is blocked: ${blackout.reason} (${blackout.event_type.toUpperCase()})`,
        entity_names: [proposal.class_date],
      });
    }

    // Mathematical Half-Open Interval Overlap Rule: [start1, end1) and [start2, end2)
    // Overlap exists iff: start1 < end2 AND start2 < end1
    const isHalfOpenOverlapping = (s1: string, e1: string, s2: string, e2: string) => {
      return s1 < e2 && s2 < e1;
    };

    // Active classes on same date excluding cancelled classes
    const classesOnDate = data.remedial_classes.filter(
      (c) =>
        c.class_date === proposal.class_date &&
        c.status !== 'cancelled' &&
        c.id !== proposal.exclude_class_id &&
        isHalfOpenOverlapping(c.start_time, c.end_time, proposal.start_time, proposal.end_time)
    );

    // 2. Peer Tutor Overlap Check (Primary Instructor)
    if (proposal.peer_tutor_id) {
      const tutorClass = classesOnDate.find((c) => {
        if (c.peer_tutor_id === proposal.peer_tutor_id) return true;
        const alloc = data.tutor_allocations.find((ta) => ta.remedial_class_id === c.id);
        return alloc?.peer_tutor_id === proposal.peer_tutor_id;
      });
      if (tutorClass) {
        const tutor = data.peer_tutors.find((t) => t.id === proposal.peer_tutor_id);
        const subj = data.subjects.find((s) => s.id === tutorClass.subject_id);
        conflicts.push({
          type: 'faculty',
          title: 'Peer Tutor Double-Booking Overlap',
          description: `Peer Tutor ${tutor?.name || 'Assigned Tutor'} is already conducting ${subj?.name || tutorClass.class_code} (${tutorClass.start_time} - ${tutorClass.end_time})`,
          entity_names: [tutor?.name || proposal.peer_tutor_id],
        });
      }
    }

    // 3. Faculty Overlap Check (if faculty is teaching or assigned)
    if (proposal.faculty_id) {
      const facultyClass = classesOnDate.find((c) => c.faculty_id === proposal.faculty_id);
      if (facultyClass) {
        const fac = data.faculty.find((f) => f.id === proposal.faculty_id);
        const subj = data.subjects.find((s) => s.id === facultyClass.subject_id);
        conflicts.push({
          type: 'faculty',
          title: 'Faculty Double-Booking Overlap',
          description: `${fac?.name || 'Faculty'} is already scheduled for ${subj?.name || facultyClass.class_code} (${facultyClass.start_time} - ${facultyClass.end_time})`,
          entity_names: [fac?.name || proposal.faculty_id],
        });
      }
    }

    // 3. Venue Overlap Check (by venue_id or venue text)
    if (proposal.venue_id || (proposal.venue && proposal.venue.trim())) {
      const venueClass = classesOnDate.find((c) => {
        if (proposal.venue_id && c.venue_id) {
          return c.venue_id === proposal.venue_id;
        }
        return (
          c.venue &&
          proposal.venue &&
          c.venue.trim().toLowerCase() === proposal.venue.trim().toLowerCase()
        );
      });

      if (venueClass) {
        const venueName = proposal.venue || 'Specified Hall';
        conflicts.push({
          type: 'venue',
          title: 'Venue Double-Booking Conflict',
          description: `Venue "${venueName}" is already scheduled for class ${venueClass.class_code} (${venueClass.start_time} - ${venueClass.end_time})`,
          entity_names: [venueName],
        });
      }
    }

    // 4. Student Double-Booking Check
    const conflictingStudents: { student_name: string; reg_no: string; existing_class: string }[] = [];
    for (const c of classesOnDate) {
      const enrolled = data.class_students
        .filter((cs) => cs.remedial_class_id === c.id)
        .map((cs) => cs.student_id);

      const overlappingStudentIds = proposal.student_ids.filter((id) => enrolled.includes(id));
      for (const stId of overlappingStudentIds) {
        const student = data.students.find((s) => s.id === stId);
        const subj = data.subjects.find((s) => s.id === c.subject_id);
        if (student) {
          conflictingStudents.push({
            student_name: student.name,
            reg_no: student.register_number,
            existing_class: `${subj?.name || c.class_code} (${c.start_time} - ${c.end_time})`,
          });
        }
      }
    }

    if (conflictingStudents.length > 0) {
      conflicts.push({
        type: 'student',
        title: `${conflictingStudents.length} Student Schedule Conflict(s)`,
        description: `Student(s) have concurrent remedial classes scheduled at this time.`,
        entity_names: conflictingStudents.map(
          (cs) => `${cs.student_name} (${cs.reg_no}) in ${cs.existing_class}`
        ),
      });
    }

    return conflicts;
  },

  createRemedialClass(params: {
    department_id: string;
    batch_id: string;
    regulation_id: string;
    subject_id: string;
    faculty_id?: string | null;
    peer_tutor_id?: string | null;
    conductor_type?: 'peer_tutor' | 'faculty';
    academic_year?: string | null;
    section?: string | null;
    class_date: string;
    start_time: string;
    end_time: string;
    venue?: string;
    venue_id?: string;
    notes?: string;
    student_ids: string[];
    allow_override?: boolean;
    override_reason?: string;
    user_email?: string;
  }): RemedialClass {
    const data = loadData();

    // Check conflicts
    const conflicts = this.checkScheduleConflicts({
      class_date: params.class_date,
      start_time: params.start_time,
      end_time: params.end_time,
      faculty_id: params.faculty_id,
      peer_tutor_id: params.peer_tutor_id,
      venue: params.venue,
      venue_id: params.venue_id,
      department_id: params.department_id,
      student_ids: params.student_ids,
    });

    if (conflicts.length > 0) {
      if (!params.allow_override) {
        throw new Error(`Scheduling conflict detected: ${conflicts[0].title}. Override required.`);
      }
      if (!params.override_reason || !params.override_reason.trim()) {
        throw new Error('Authorized conflict override requires a written coordinator justification.');
      }
    }

    const class_code = `REM-${Date.now().toString().slice(-6)}`;
    const conductor_type = params.conductor_type || (params.peer_tutor_id ? 'peer_tutor' : 'faculty');

    const newClass: RemedialClass = {
      id: uuidv4(),
      class_code,
      department_id: params.department_id,
      batch_id: params.batch_id,
      regulation_id: params.regulation_id,
      subject_id: params.subject_id,
      faculty_id: params.faculty_id || null,
      peer_tutor_id: params.peer_tutor_id || null,
      conductor_type,
      academic_year: params.academic_year || null,
      section: params.section || null,
      class_date: params.class_date,
      start_time: params.start_time,
      end_time: params.end_time,
      venue: params.venue || null,
      venue_id: params.venue_id || null,
      status: 'scheduled',
      notes: params.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.remedial_classes.push(newClass);

    // Enroll students
    for (const sId of params.student_ids) {
      data.class_students.push({
        id: uuidv4(),
        remedial_class_id: newClass.id,
        student_id: sId,
        created_at: new Date().toISOString(),
      });
    }

    // Generate cryptographic attendance token (64-character high entropy) & store SHA-256 hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const token_hash = hashToken(rawToken);
    const expires = new Date();
    expires.setDate(expires.getDate() + 3); // 3 days expiry

    data.attendance_forms.push({
      id: uuidv4(),
      remedial_class_id: newClass.id,
      access_token: rawToken,
      token_hash,
      expires_at: expires.toISOString(),
      is_submitted: false,
      submitted_at: null,
      submitted_by_identifier: null,
      tutor_remarks: null,
      revoked_at: null,
      created_at: new Date().toISOString(),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const attendanceLink = `${appUrl}/attendance/${rawToken}`;
    const subj = data.subjects.find((s) => s.id === params.subject_id);
    const enrolledStudents = data.students.filter((s) => params.student_ids.includes(s.id));

    // Allocate Peer Tutor if assigned (Primary Mode in Sona)
    if (params.peer_tutor_id) {
      const tutor = data.peer_tutors.find((t) => t.id === params.peer_tutor_id);
      data.tutor_allocations.push({
        id: uuidv4(),
        remedial_class_id: newClass.id,
        peer_tutor_id: params.peer_tutor_id,
        allocated_at: new Date().toISOString(),
        status: 'assigned',
      });

      if (tutor && tutor.phone) {
        const tutorSmsIdempotency = `sched_tutor_${newClass.id}_${tutor.id}_sms`;
        data.notifications.push({
          id: uuidv4(),
          remedial_class_id: newClass.id,
          recipient_type: 'peer_tutor',
          recipient_name: tutor.name,
          recipient_contact: tutor.phone,
          channel: 'sms',
          notification_type: 'peer_tutor_link',
          idempotency_key: tutorSmsIdempotency,
          subject: null,
          message_body: `Sona Remedial Tutor: You are assigned to conduct ${subj?.code} on ${params.class_date} at ${params.start_time} (${params.student_ids.length} students). Mark attendance: ${attendanceLink}`,
          status: 'pending',
          attempt_count: 0,
          retry_count: 0,
          error_message: null,
          sent_at: null,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Create Faculty / Class Coordinator Notification record with Idempotency Key
    const fac = data.faculty.find((f) => f.id === params.faculty_id);

    if (fac) {
      const isConductor = conductor_type === 'faculty';
      const facMessage = isConductor
        ? `Sona Remedial: Class scheduled for ${subj?.name} (${subj?.code}) on ${params.class_date} at ${params.start_time}. Students assigned: ${params.student_ids.length}.`
        : `Sona Remedial: Remedial session scheduled for ${params.student_ids.length} students of your section on ${params.class_date} at ${params.start_time} for ${subj?.code}. Conductor: Peer Tutor.`;

      if (fac.phone) {
        const smsIdempotency = `sched_${newClass.id}_${fac.id}_sms`;
        data.notifications.push({
          id: uuidv4(),
          remedial_class_id: newClass.id,
          recipient_type: 'faculty',
          recipient_name: fac.name,
          recipient_contact: fac.phone,
          channel: 'sms',
          notification_type: 'faculty_schedule',
          idempotency_key: smsIdempotency,
          subject: null,
          message_body: facMessage,
          status: 'pending',
          attempt_count: 0,
          retry_count: 0,
          error_message: null,
          sent_at: null,
          created_at: new Date().toISOString(),
        });
      }

      if (fac.email) {
        const emailIdempotency = `sched_${newClass.id}_${fac.id}_email`;
        data.notifications.push({
          id: uuidv4(),
          remedial_class_id: newClass.id,
          recipient_type: 'faculty',
          recipient_name: fac.name,
          recipient_contact: fac.email,
          channel: 'email',
          notification_type: 'faculty_schedule',
          idempotency_key: emailIdempotency,
          subject: `Remedial Class Schedule: ${subj?.name} - ${params.class_date}`,
          message_body: `Dear Class Coordinator / Faculty ${fac.name},\n\nA remedial class has been scheduled for ${subj?.name} (${subj?.code}) on ${params.class_date} from ${params.start_time} to ${params.end_time} at ${params.venue || 'Designated Hall'}.\n\nConductor: ${conductor_type === 'peer_tutor' ? 'Senior Peer Tutor' : 'Faculty'}\nAssigned Students (${enrolledStudents.length}):\n${enrolledStudents.map((s) => `- ${s.name} (${s.register_number}, Sec ${s.section})`).join('\n')}\n\nNote: If any student from your class is marked absent, you will receive an automatic SMS absence alert.\n\nRegards,\nRemedial Coordinator, Sona College of Technology`,
          status: 'pending',
          attempt_count: 0,
          retry_count: 0,
          error_message: null,
          sent_at: null,
          created_at: new Date().toISOString(),
        });
      }
    }

    saveData(data);

    // Audit Logging
    this.logAction(
      conflicts.length > 0 ? 'CONFLICT_OVERRIDDEN_AND_SCHEDULED' : 'CREATE_REMEDIAL_CLASS',
      'remedial_class',
      newClass.id,
      {
        code: class_code,
        date: params.class_date,
        studentCount: params.student_ids.length,
        conflictsOverridden: conflicts.length > 0,
        conflicts,
        overrideReason: params.override_reason,
      },
      params.user_email || 'admin@sonatech.ac.in'
    );

    return newClass;
  },

  // --- PEER TUTORS & ALLOCATION ---
  getPeerTutors(department_id?: string): PeerTutor[] {
    const data = loadData();
    return data.peer_tutors
      .filter((pt) => !department_id || pt.department_id === department_id)
      .map((pt) => ({
        ...pt,
        department: data.departments.find((d) => d.id === pt.department_id),
      }));
  },

  addPeerTutor(
    register_number: string,
    name: string,
    department_id: string,
    email: string,
    phone: string
  ): PeerTutor {
    const data = loadData();
    const cleanReg = register_number.trim();
    const existing = data.peer_tutors.find((p) => p.register_number === cleanReg);
    if (existing) throw new Error(`Peer tutor with register number "${cleanReg}" already exists.`);

    const tutor: PeerTutor = {
      id: uuidv4(),
      register_number: cleanReg,
      name: name.trim(),
      department_id,
      email: email.trim(),
      phone: phone.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.peer_tutors.push(tutor);
    saveData(data);
    this.logAction('CREATE_PEER_TUTOR', 'peer_tutor', tutor.id, {
      name: tutor.name,
      reg: tutor.register_number,
    });
    return tutor;
  },

  allocatePeerTutor(remedial_class_id: string, peer_tutor_id: string): TutorAllocation {
    const data = loadData();
    const remClass = data.remedial_classes.find((c) => c.id === remedial_class_id);
    if (!remClass) throw new Error('Remedial class not found.');

    const tutor = data.peer_tutors.find((t) => t.id === peer_tutor_id);
    if (!tutor) throw new Error('Peer tutor not found.');

    // Remove existing allocation if any
    data.tutor_allocations = data.tutor_allocations.filter(
      (ta) => ta.remedial_class_id !== remedial_class_id
    );

    // Ensure active attendance form exists
    let form = data.attendance_forms.find((af) => af.remedial_class_id === remedial_class_id);
    if (!form) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const token_hash = hashToken(rawToken);
      const expires = new Date();
      expires.setDate(expires.getDate() + 3);
      form = {
        id: uuidv4(),
        remedial_class_id,
        access_token: rawToken,
        token_hash,
        expires_at: expires.toISOString(),
        is_submitted: false,
        submitted_at: null,
        submitted_by_identifier: null,
        tutor_remarks: null,
        revoked_at: null,
        created_at: new Date().toISOString(),
      };
      data.attendance_forms.push(form);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const attendanceLink = `${appUrl}/attendance/${form.access_token}`;

    const alloc: any = {
      id: uuidv4(),
      remedial_class_id,
      peer_tutor_id,
      allocated_at: new Date().toISOString(),
      status: 'assigned',
      form_token: form.access_token,
      attendance_url: attendanceLink,
    };
    data.tutor_allocations.push(alloc);

    // Queue notification to tutor with idempotency key
    const subj = data.subjects.find((s) => s.id === remClass.subject_id);
    const tutorIdempotency = `tutor_alloc_${remClass.id}_${tutor.id}_sms`;

    // Avoid duplicate dispatch
    const existingNotif = data.notifications.find((n) => n.idempotency_key === tutorIdempotency);
    if (!existingNotif) {
      data.notifications.push({
        id: uuidv4(),
        remedial_class_id,
        recipient_type: 'peer_tutor',
        recipient_name: tutor.name,
        recipient_contact: tutor.phone,
        channel: 'sms',
        notification_type: 'peer_tutor_link',
        idempotency_key: tutorIdempotency,
        subject: null,
        message_body: `Sona Remedial Tutor: You are assigned to ${subj?.name} on ${remClass.class_date} at ${remClass.start_time}. Mark attendance here: ${attendanceLink}`,
        status: 'pending',
        attempt_count: 0,
        retry_count: 0,
        error_message: null,
        sent_at: null,
        created_at: new Date().toISOString(),
      });
    }

    saveData(data);
    this.logAction('ALLOCATE_PEER_TUTOR', 'tutor_allocation', alloc.id, {
      classId: remedial_class_id,
      tutorName: tutor.name,
    });
    return alloc;
  },

  // --- ATTENDANCE COLLECTION & FORM PROCESSING (HASH VERIFIED & COMPLETE ROSTER CHECK) ---
  getAttendanceFormByToken(token: string) {
    const data = loadData();
    const tokenHash = hashToken(token);

    // Support lookup by hash or raw token
    const form = data.attendance_forms.find(
      (af) => af.access_token === token || (af.token_hash && af.token_hash === tokenHash)
    );
    if (!form) return null;

    // Check expiration or revocation
    if (form.revoked_at) return null;
    if (new Date(form.expires_at) < new Date()) return null;

    const remClass = data.remedial_classes.find((c) => c.id === form.remedial_class_id);
    if (!remClass) return null;

    const dept = data.departments.find((d) => d.id === remClass.department_id);
    const batch = data.batches.find((b) => b.id === remClass.batch_id);
    const subj = data.subjects.find((s) => s.id === remClass.subject_id);
    const fac = data.faculty.find((f) => f.id === remClass.faculty_id);

    const studentIds = data.class_students
      .filter((cs) => cs.remedial_class_id === remClass.id)
      .map((cs) => cs.student_id);
    const students = data.students.filter((s) => studentIds.includes(s.id));

    const records = data.attendance_records.filter((ar) => ar.attendance_form_id === form.id);

    return {
      form,
      remedial_class: {
        ...remClass,
        department: dept,
        batch,
        subject: subj,
        faculty: fac,
        students,
      },
      students,
      records,
    };
  },

  submitAttendance(
    token: string,
    payload: {
      submitted_by_identifier: string;
      tutor_remarks?: string;
      marks: { student_id: string; status: 'present' | 'absent'; remarks?: string }[];
    }
  ) {
    const data = loadData();
    const tokenHash = hashToken(token);

    const form = data.attendance_forms.find(
      (af) => af.access_token === token || (af.token_hash && af.token_hash === tokenHash)
    );
    if (!form) throw new Error('Invalid or expired attendance link.');
    if (form.is_submitted) throw new Error('Attendance has already been submitted for this session.');
    if (form.revoked_at) throw new Error('This attendance link has been revoked.');
    if (new Date(form.expires_at) < new Date()) throw new Error('This attendance link has expired.');

    const remClass = data.remedial_classes.find((c) => c.id === form.remedial_class_id);
    if (!remClass) throw new Error('Associated remedial class not found.');

    // Roster Completeness Validation (Phase 6): Ensure EVERY student in class_students is marked
    const requiredStudentIds = data.class_students
      .filter((cs) => cs.remedial_class_id === remClass.id)
      .map((cs) => cs.student_id);

    const submittedStudentIds = new Set(payload.marks.map((m) => m.student_id));
    const missingStudentIds = requiredStudentIds.filter((id) => !submittedStudentIds.has(id));

    if (missingStudentIds.length > 0) {
      throw new Error(
        `Incomplete attendance roster. All ${requiredStudentIds.length} assigned students must be marked Present or Absent before submission.`
      );
    }

    const now = new Date().toISOString();
    form.is_submitted = true;
    form.submitted_at = now;
    form.submitted_by_identifier = payload.submitted_by_identifier.trim();
    form.tutor_remarks = payload.tutor_remarks?.trim() || null;

    // Update remedial class status to completed
    remClass.status = 'completed';
    remClass.updated_at = now;

    // Save attendance records
    for (const mark of payload.marks) {
      data.attendance_records.push({
        id: uuidv4(),
        attendance_form_id: form.id,
        remedial_class_id: remClass.id,
        student_id: mark.student_id,
        status: mark.status,
        marked_at: now,
      });
    }

    // Identify absentees
    const absentIds = payload.marks.filter((m) => m.status === 'absent').map((m) => m.student_id);
    const absentStudents = data.students.filter((s) => absentIds.includes(s.id));
    const presentCount = payload.marks.filter((m) => m.status === 'present').length;
    const tutorIdentifier = payload.submitted_by_identifier || 'Senior Peer Tutor';
    const subj = data.subjects.find((s) => s.id === remClass.subject_id);

    // 1. Alert Class Coordinators (CC) for Absent Students
    // Faculty are assigned class-wise: (Department, Academic Year, Section).
    // E.g. Deepika J is Class Coordinator for 4th Year ADS A.
    // If a student in Sec A is absent, an SMS & Email alert is sent directly to their Class Coordinator!
    const ccMap = new Map<string, { cc: Faculty; section: string; students: Student[] }>();

    for (const st of absentStudents) {
      const studentSec = (st.section || 'A').toUpperCase();

      // Look up CC faculty matching department and section
      let ccFaculty = data.faculty.find(
        (f) => f.department_id === st.department_id && f.section?.toUpperCase() === studentSec
      );
      if (!ccFaculty) {
        ccFaculty = data.faculty.find((f) => f.section?.toUpperCase() === studentSec);
      }
      if (!ccFaculty && remClass.faculty_id) {
        ccFaculty = data.faculty.find((f) => f.id === remClass.faculty_id);
      }
      if (!ccFaculty) {
        ccFaculty = data.faculty.find((f) => f.department_id === st.department_id) || data.faculty[0];
      }

      if (ccFaculty) {
        if (!ccMap.has(ccFaculty.id)) {
          ccMap.set(ccFaculty.id, { cc: ccFaculty, section: studentSec, students: [] });
        }
        ccMap.get(ccFaculty.id)!.students.push(st);
      }
    }

    const ccAlertsSent: { cc_id: string; cc_name: string; section: string; count: number }[] = [];

    // Dispatch Absence Alerts to each student's Class Coordinator (CC)
    for (const { cc, section, students } of ccMap.values()) {
      const studentDetailsStr = students.map((s) => `${s.name} (${s.register_number})`).join(', ');
      const studentListLines = students
        .map((s) => `• ${s.name} (Reg No: ${s.register_number}, Section ${s.section})`)
        .join('\n');

      if (cc.phone) {
        const ccSmsIdempotency = `cc_absence_${remClass.id}_${cc.id}_${form.id}_sms`;
        data.notifications.push({
          id: uuidv4(),
          remedial_class_id: remClass.id,
          recipient_type: 'cc_contact',
          recipient_name: cc.name,
          recipient_contact: cc.phone,
          channel: 'sms',
          notification_type: 'cc_absence_alert',
          idempotency_key: ccSmsIdempotency,
          subject: null,
          message_body: `Sona Remedial: Absence Alert to CC ${cc.name}! ${students.length} student(s) from your class (${cc.academic_year || ''} Sec ${section}) were ABSENT for ${subj?.code || 'Remedial Class'} on ${remClass.class_date} conducted by Peer Tutor ${tutorIdentifier}: ${studentDetailsStr.slice(0, 80)}. Please follow up.`,
          status: 'pending',
          attempt_count: 0,
          retry_count: 0,
          error_message: null,
          sent_at: null,
          created_at: now,
        });
      }

      if (cc.email) {
        const ccEmailIdempotency = `cc_absence_${remClass.id}_${cc.id}_${form.id}_email`;
        data.notifications.push({
          id: uuidv4(),
          remedial_class_id: remClass.id,
          recipient_type: 'cc_contact',
          recipient_name: cc.name,
          recipient_contact: cc.email,
          channel: 'email',
          notification_type: 'cc_absence_alert',
          idempotency_key: ccEmailIdempotency,
          subject: `Absence Notice: Remedial Class ${subj?.code} - ${remClass.class_date} (Section ${section})`,
          message_body: `Dear Class Coordinator ${cc.name},\n\nThe following student(s) from your assigned class (${cc.academic_year || ''} Section ${section}) were marked ABSENT for the remedial session:\n\nSubject: ${subj?.code} - ${subj?.name}\nDate: ${remClass.class_date} (${remClass.start_time} - ${remClass.end_time})\nConducted by: Peer Tutor ${tutorIdentifier}\n\nAbsent Students:\n${studentListLines}\n\nPlease counsel these students and take necessary action.\n\nRegards,\nRemedial Cell, Sona College of Technology`,
          status: 'pending',
          attempt_count: 0,
          retry_count: 0,
          error_message: null,
          sent_at: null,
          created_at: now,
        });
      }

      ccAlertsSent.push({
        cc_id: cc.id,
        cc_name: cc.name,
        section,
        count: students.length,
      });
    }

    // 2. Also notify the remedial class faculty if a faculty conductor was specifically assigned
    const fac = data.faculty.find((f) => f.id === remClass.faculty_id);
    if (fac && !ccMap.has(fac.id)) {
      const absentSummary =
        absentStudents.length > 0
          ? absentStudents.map((s) => `${s.name} (${s.register_number})`).join(', ')
          : 'None (100% Present)';

      if (fac.email) {
        const emailIdempotency = `absentee_digest_${remClass.id}_${form.id}_email`;
        data.notifications.push({
          id: uuidv4(),
          remedial_class_id: remClass.id,
          recipient_type: 'faculty',
          recipient_name: fac.name,
          recipient_contact: fac.email,
          channel: 'email',
          notification_type: 'absentee_digest',
          idempotency_key: emailIdempotency,
          subject: `Remedial Attendance Report: ${subj?.name} - ${remClass.class_date} (${absentStudents.length} Absent)`,
          message_body: `Dear ${fac.name},\n\nAttendance has been submitted by Peer Tutor ${payload.submitted_by_identifier} for ${subj?.name} conducted on ${remClass.class_date}.\n\nTotal Enrolled: ${payload.marks.length}\nPresent: ${presentCount}\nAbsent: ${absentStudents.length}\n\nAbsent Students:\n${absentStudents.length > 0 ? absentStudents.map((s) => `- ${s.name} (${s.register_number}, Sec ${s.section})`).join('\n') : 'Nil (100% Present)'}\n\nRegards,\nSona Scheduler Notification System`,
          status: 'pending',
          attempt_count: 0,
          retry_count: 0,
          error_message: null,
          sent_at: null,
          created_at: now,
        });
      }

      if (fac.phone) {
        const smsIdempotency = `absentee_digest_${remClass.id}_${form.id}_sms`;
        data.notifications.push({
          id: uuidv4(),
          remedial_class_id: remClass.id,
          recipient_type: 'faculty',
          recipient_name: fac.name,
          recipient_contact: fac.phone,
          channel: 'sms',
          notification_type: 'absentee_digest',
          idempotency_key: smsIdempotency,
          subject: null,
          message_body: `Sona Remedial: Attendance submitted for ${subj?.code}. Total: ${payload.marks.length}, Present: ${presentCount}, Absent: ${absentStudents.length}. Absentees: ${absentSummary.slice(0, 80)}`,
          status: 'pending',
          attempt_count: 0,
          retry_count: 0,
          error_message: null,
          sent_at: null,
          created_at: now,
        });
      }
    }

    saveData(data);
    this.logAction('SUBMIT_ATTENDANCE', 'attendance_form', form.id, {
      classCode: remClass.class_code,
      total: payload.marks.length,
      present: presentCount,
      absent: absentStudents.length,
      absentStudentRegs: absentStudents.map((s) => s.register_number),
    });

    return {
      remedial_class_id: remClass.id,
      total: payload.marks.length,
      present: presentCount,
      absent: absentStudents.length,
      absentStudents,
      cc_alerts_sent: ccAlertsSent,
    };
  },

  // --- NOTIFICATIONS MANAGEMENT & RETRY WITH EXPONENTIAL BACKOFF ---
  getNotifications(): Notification[] {
    const data = loadData();
    return data.notifications;
  },

  addNotification(params: {
    remedial_class_id?: string | null;
    recipient_type: 'faculty' | 'peer_tutor' | 'cc_contact';
    recipient_name: string;
    recipient_contact: string;
    channel: 'sms' | 'email';
    notification_type?: 'faculty_schedule' | 'peer_tutor_link' | 'absentee_digest' | 'test';
    subject?: string | null;
    message_body: string;
    status: 'pending' | 'queued' | 'simulated' | 'sent' | 'delivered' | 'failed';
    provider_message_id?: string | null;
    error_message?: string | null;
  }): Notification {
    const data = loadData();
    const notif: Notification = {
      id: uuidv4(),
      remedial_class_id: params.remedial_class_id || null,
      recipient_type: params.recipient_type,
      recipient_name: params.recipient_name,
      recipient_contact: params.recipient_contact,
      channel: params.channel,
      notification_type: params.notification_type || 'test',
      idempotency_key: `notif_${uuidv4()}`,
      subject: params.subject || null,
      message_body: params.message_body,
      status: params.status,
      attempt_count: 1,
      retry_count: 0,
      provider_message_id: params.provider_message_id || null,
      error_message: params.error_message || null,
      sent_at: params.status === 'sent' || params.status === 'delivered' || params.status === 'simulated' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    };
    data.notifications.unshift(notif);
    saveData(data);
    return notif;
  },

  retryNotification(id: string): Notification {
    const data = loadData();
    const notif = data.notifications.find((n) => n.id === id);
    if (!notif) throw new Error('Notification not found.');

    notif.attempt_count += 1;
    notif.retry_count += 1;
    notif.last_attempt_at = new Date().toISOString();
    notif.status = 'sent';
    notif.sent_at = new Date().toISOString();
    notif.error_message = null;
    notif.next_retry_at = null;

    saveData(data);
    this.logAction('RETRY_NOTIFICATION', 'notification', id, {
      channel: notif.channel,
      recipient: notif.recipient_contact,
      attempt: notif.attempt_count,
    });
    return notif;
  },

  // --- CC CONTACTS ---
  getCCContacts(): CCContact[] {
    const data = loadData();
    return data.cc_contacts;
  },
};
