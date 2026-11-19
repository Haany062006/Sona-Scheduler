-- ====================================================================
-- SONA SCHEDULER: AUDIT & CORRECTIONS MIGRATION (Phase 2)
-- Relational consistency, venues table, partial index for active arrears,
-- attendance composite foreign key integrity, notification tracking.
-- ====================================================================

-- 1. SEMESTERS REFERENCE TABLE
CREATE TABLE IF NOT EXISTS semesters (
    semester_number INT PRIMARY KEY CHECK (semester_number BETWEEN 1 AND 8),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO semesters (semester_number, name) VALUES
    (1, 'Semester 1'),
    (2, 'Semester 2'),
    (3, 'Semester 3'),
    (4, 'Semester 4'),
    (5, 'Semester 5'),
    (6, 'Semester 6'),
    (7, 'Semester 7'),
    (8, 'Semester 8')
ON CONFLICT (semester_number) DO NOTHING;

-- 2. VENUES MASTER TABLE
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    building TEXT,
    capacity INT NOT NULL DEFAULT 40,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO venues (code, name, building, capacity, is_active) VALUES
    ('TP-304', 'ADS Remedial Hall TP-304', 'Tech Park', 60, TRUE),
    ('TP-305', 'IT Remedial Hall TP-305', 'Tech Park', 60, TRUE),
    ('MB-201', 'Main Block Seminar Hall 1', 'Main Block', 120, TRUE),
    ('CS-LAB-1', 'Computing Laboratory 1', 'CS Block', 45, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Add venue_id foreign key to remedial_classes
ALTER TABLE remedial_classes
    ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id) ON DELETE SET NULL;

-- 3. ARREAR RECORDS: PARTIAL UNIQUE INDEX FOR ACTIVE ARREARS
-- Removes rigid UNIQUE(student_id, subject_id, status) so cleared arrear history is preserved
ALTER TABLE arrear_records DROP CONSTRAINT IF EXISTS arrear_records_student_id_subject_id_status_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_arrear_active_unique
    ON arrear_records (student_id, subject_id)
    WHERE status = 'active';

-- 4. FACULTY SUBJECT ASSIGNMENT CONTEXT
ALTER TABLE faculty_subject_assignments
    ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS regulation_id UUID REFERENCES regulations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS academic_year VARCHAR(16);

-- 5. ATTENDANCE INTEGRITY: COMPOSITE KEY PREVENTING MISMATCHED FORMS & CLASSES
ALTER TABLE attendance_forms
    ADD COLUMN IF NOT EXISTS token_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- Create composite unique constraint on attendance_forms (id, remedial_class_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_attendance_forms_id_class'
    ) THEN
        ALTER TABLE attendance_forms ADD CONSTRAINT uq_attendance_forms_id_class UNIQUE (id, remedial_class_id);
    END IF;
END $$;

-- Enforce composite foreign key on attendance_records
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_attendance_records_form_class'
    ) THEN
        ALTER TABLE attendance_records
            ADD CONSTRAINT fk_attendance_records_form_class
            FOREIGN KEY (attendance_form_id, remedial_class_id)
            REFERENCES attendance_forms (id, remedial_class_id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- 6. CALENDAR BLACKOUT DATES: COLLEGE-WIDE (NULL DEPT) SUPPORT
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_blackout_college_wide
    ON calendar_blackout_dates (date_val)
    WHERE department_id IS NULL;

-- 7. NOTIFICATION TRACKING & IDEMPOTENCY
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS notification_type VARCHAR(32) DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128),
    ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS error_details JSONB DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_idempotency
    ON notifications (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- 8. ROW LEVEL SECURITY ON NEW TABLES
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to venues" ON venues FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to semesters" ON semesters FOR ALL TO authenticated USING (true);
CREATE POLICY "Public read venues" ON venues FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read semesters" ON semesters FOR SELECT TO anon USING (true);
