// Database Type Definitions for Sona Scheduler (Updated with Audit Corrections)

export type Department = {
  id: string;
  code: string; // 'ADS', 'IT', etc.
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Regulation = {
  id: string;
  code: string; // 'R2019', 'R2021'
  start_year: number;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Batch = {
  id: string;
  name: string; // '2021-2025'
  start_year: number;
  end_year: number;
  created_at: string;
};

export type RegulationBatch = {
  id: string;
  regulation_id: string;
  batch_id: string;
  department_id: string | null;
  created_at: string;
  regulation?: Regulation;
  batch?: Batch;
  department?: Department;
};

export type Semester = {
  semester_number: number; // 1 to 8
  name: string;
  created_at: string;
};

export type Venue = {
  id: string;
  code: string; // 'TP-304'
  name: string;
  building: string | null;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Subject = {
  id: string;
  code: string; // e.g. '21AD301'
  name: string;
  regulation_id: string;
  semester_number: number;
  semester?: number;
  credits?: number;
  is_common: boolean;
  created_at: string;
  updated_at: string;
  regulation?: Regulation;
  departments?: Department[];
};

export type Student = {
  id: string;
  register_number: string; // Stored strictly as TEXT
  name: string;
  department_id: string;
  batch_id: string;
  section: string; // 'A', 'B', 'C'
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: Department;
  batch?: Batch;
};

export type Faculty = {
  id: string;
  faculty_id_code?: string; // Optional legacy code, not required
  name: string;
  department_id: string;
  academic_year?: string | null; // e.g. '1st Year' | '2nd Year' | '3rd Year' | '4th Year'
  section?: string | null; // 'A' | 'B' | 'Both'
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: Department;
  assigned_subjects?: Subject[];
  assigned_subject_ids?: string[];
};

export type FacultySubjectAssignment = {
  id: string;
  faculty_id: string;
  subject_id: string;
  department_id?: string | null;
  regulation_id?: string | null;
  academic_year?: string | null;
  section?: string | null;
  created_at: string;
};

export type PeerTutor = {
  id: string;
  register_number: string;
  name: string;
  department_id: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: Department;
};

export type CCContact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  department_id: string | null;
  designation: string;
  is_active: boolean;
  created_at: string;
};

export type UploadedFile = {
  id: string;
  file_name: string;
  file_type: 'student_excel' | 'faculty_excel' | 'syllabus_pdf' | 'arrear_pdf';
  storage_path: string;
  department_id: string | null;
  batch_id: string | null;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_summary: Record<string, any>;
  created_at: string;
};

export type ArrearRecord = {
  id: string;
  student_id: string;
  subject_id: string;
  batch_id: string;
  semester_number: number;
  source_file_id: string | null;
  source_file?: string;
  source_page?: number | null;
  status: 'active' | 'cleared' | 'exempted';
  created_at: string;
  updated_at: string;
  student?: Student;
  subject?: Subject;
  batch?: Batch;
};

export type CalendarBlackoutDate = {
  id: string;
  date_val: string; // YYYY-MM-DD
  reason: string;
  event_type: 'holiday' | 'exam' | 'college_event';
  department_id: string | null; // NULL indicates college-wide blackout
  created_at: string;
};

export type RemedialClass = {
  id: string;
  class_code: string;
  department_id: string;
  batch_id: string;
  regulation_id: string;
  subject_id: string;
  faculty_id?: string | null;
  conductor_type?: 'peer_tutor' | 'faculty';
  peer_tutor_id?: string | null;
  academic_year?: string | null;
  section?: string | null;
  class_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  venue: string | null;
  venue_id?: string | null;
  status: 'scheduled' | 'upcoming' | 'approved' | 'in_progress' | 'awaiting_attendance' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  department?: Department;
  batch?: Batch;
  regulation?: Regulation;
  subject?: Subject;
  faculty?: Faculty;
  peer_tutor?: PeerTutor;
  students?: Student[];
  student_count?: number;
  venue_details?: Venue;
  attendance_form?: AttendanceForm;
  attendance_token?: string;
};

export type ClassStudent = {
  id: string;
  remedial_class_id: string;
  student_id: string;
  created_at: string;
};

export type TutorAllocation = {
  id: string;
  remedial_class_id: string;
  peer_tutor_id: string;
  allocated_at: string;
  status: 'assigned' | 'notified';
  peer_tutor?: PeerTutor;
};

export type AttendanceForm = {
  id: string;
  remedial_class_id: string;
  access_token: string;
  form_token?: string;
  token_hash?: string; // SHA-256 hash for secure verification
  expires_at: string;
  is_submitted: boolean;
  submitted_at: string | null;
  submitted_by_identifier: string | null;
  tutor_remarks: string | null;
  revoked_at?: string | null;
  created_at: string;
  remedial_class?: RemedialClass;
};

export type AttendanceRecord = {
  id: string;
  attendance_form_id: string;
  remedial_class_id: string;
  student_id: string;
  status: 'present' | 'absent';
  marked_at: string;
  student?: Student;
};

export type Notification = {
  id: string;
  remedial_class_id: string | null;
  recipient_type: 'faculty' | 'peer_tutor' | 'cc_contact';
  recipient_name: string;
  recipient_contact: string;
  channel: 'sms' | 'email';
  notification_type?: 'faculty_schedule' | 'peer_tutor_link' | 'absentee_digest' | 'cc_absence_alert' | 'test';
  idempotency_key?: string | null;
  subject: string | null;
  message_body: string;
  status: 'pending' | 'queued' | 'simulated' | 'sent' | 'delivered' | 'failed';
  attempt_count: number;
  retry_count: number;
  last_attempt_at?: string | null;
  next_retry_at?: string | null;
  provider_message_id?: string | null;
  error_message: string | null;
  error_details?: Record<string, any>;
  sent_at: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  created_at: string;
};
