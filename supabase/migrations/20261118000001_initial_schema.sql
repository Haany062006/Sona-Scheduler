-- ====================================================================
-- SONA SCHEDULER: INITIAL RELATIONAL SCHEMA
-- Production PostgreSQL DDL for Sona College of Technology
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ACADEMIC STRUCTURE
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(16) NOT NULL UNIQUE, -- 'ADS', 'IT', etc.
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE, -- 'R2019', 'R2021'
    start_year INT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(32) NOT NULL UNIQUE, -- '2021-2025', '2022-2026'
    start_year INT NOT NULL,
    end_year INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regulation_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    regulation_id UUID NOT NULL REFERENCES regulations(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (regulation_id, batch_id, department_id)
);

CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL,
    name TEXT NOT NULL,
    regulation_id UUID NOT NULL REFERENCES regulations(id) ON DELETE RESTRICT,
    semester_number INT NOT NULL CHECK (semester_number BETWEEN 1 AND 8),
    is_common BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (code, regulation_id)
);

CREATE TABLE IF NOT EXISTS subject_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    UNIQUE (subject_id, department_id)
);

-- 2. PEOPLE & MASTER ROSTERS
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_number TEXT NOT NULL UNIQUE, -- Stored strictly as TEXT to preserve leading zeros
    name TEXT NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    section VARCHAR(8) NOT NULL, -- 'A', 'B', 'C'
    email TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_reg_no ON students(register_number);
CREATE INDEX IF NOT EXISTS idx_students_dept_batch_sec ON students(department_id, batch_id, section);

CREATE TABLE IF NOT EXISTS faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    email TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL, -- Mandatory for SMS notifications
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faculty_subject_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (faculty_id, subject_id)
);

CREATE TABLE IF NOT EXISTS peer_tutors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    email TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cc_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone VARCHAR(20),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE, -- NULL for institutional-wide
    designation TEXT NOT NULL, -- 'HOD', 'Remedial Coordinator', 'Principal'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. FILE INGESTION & ARREAR RECORDS
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name TEXT NOT NULL,
    file_type VARCHAR(32) NOT NULL CHECK (file_type IN ('student_excel', 'faculty_excel', 'syllabus_pdf', 'arrear_pdf')),
    storage_path TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    file_size BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_summary JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS extraction_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_file_id UUID NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
    raw_extracted_records JSONB NOT NULL DEFAULT '[]'::jsonb,
    unmatched_records JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'committed', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS arrear_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    semester_number INT NOT NULL,
    source_file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cleared', 'exempted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, subject_id, status)
);

CREATE INDEX IF NOT EXISTS idx_arrear_subject ON arrear_records(subject_id, status);
CREATE INDEX IF NOT EXISTS idx_arrear_student ON arrear_records(student_id);

-- 4. CALENDAR & REMEDIAL SCHEDULING
CREATE TABLE IF NOT EXISTS calendar_blackout_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date_val DATE NOT NULL,
    reason TEXT NOT NULL,
    event_type VARCHAR(20) NOT NULL DEFAULT 'holiday' CHECK (event_type IN ('holiday', 'exam', 'college_event')),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (date_val, department_id)
);

CREATE TABLE IF NOT EXISTS remedial_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_code VARCHAR(32) NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    regulation_id UUID NOT NULL REFERENCES regulations(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    class_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'approved', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_classes_date_time ON remedial_classes(class_date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_classes_faculty ON remedial_classes(faculty_id, class_date);

CREATE TABLE IF NOT EXISTS class_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remedial_class_id UUID NOT NULL REFERENCES remedial_classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (remedial_class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);

CREATE TABLE IF NOT EXISTS tutor_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remedial_class_id UUID NOT NULL UNIQUE REFERENCES remedial_classes(id) ON DELETE CASCADE,
    peer_tutor_id UUID NOT NULL REFERENCES peer_tutors(id) ON DELETE RESTRICT,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'notified'))
);

-- 5. ATTENDANCE SUBSYSTEM
CREATE TABLE IF NOT EXISTS attendance_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remedial_class_id UUID NOT NULL UNIQUE REFERENCES remedial_classes(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL UNIQUE, -- Cryptographic unguessable token
    expires_at TIMESTAMPTZ NOT NULL,
    is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ,
    submitted_by_identifier TEXT, -- Peer tutor reg no or name
    tutor_remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_token ON attendance_forms(access_token);

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_form_id UUID NOT NULL REFERENCES attendance_forms(id) ON DELETE CASCADE,
    remedial_class_id UUID NOT NULL REFERENCES remedial_classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent')),
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (attendance_form_id, student_id)
);

-- 6. NOTIFICATIONS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remedial_class_id UUID REFERENCES remedial_classes(id) ON DELETE SET NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('faculty', 'peer_tutor', 'cc_contact')),
    recipient_name TEXT NOT NULL,
    recipient_contact TEXT NOT NULL,
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('sms', 'email')),
    subject TEXT,
    message_body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(32) NOT NULL,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
