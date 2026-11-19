-- ====================================================================
-- SONA SCHEDULER: ROW LEVEL SECURITY & ACCESS POLICIES
-- ====================================================================

-- Enable RLS on core tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrear_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE remedial_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. ADMIN ACCESS POLICY: Authenticated users (remedial coordinator/admin) have full access
CREATE POLICY "Admins have full access to departments" ON departments FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to regulations" ON regulations FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to batches" ON batches FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to regulation_batches" ON regulation_batches FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to subjects" ON subjects FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to subject_departments" ON subject_departments FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to students" ON students FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to faculty" ON faculty FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to faculty_subject_assignments" ON faculty_subject_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to peer_tutors" ON peer_tutors FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to cc_contacts" ON cc_contacts FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to uploaded_files" ON uploaded_files FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to extraction_jobs" ON extraction_jobs FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to arrear_records" ON arrear_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to calendar_blackout_dates" ON calendar_blackout_dates FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to remedial_classes" ON remedial_classes FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to class_students" ON class_students FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to tutor_allocations" ON tutor_allocations FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to attendance_forms" ON attendance_forms FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to attendance_records" ON attendance_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to notifications" ON notifications FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to audit_logs" ON audit_logs FOR ALL TO authenticated USING (true);

-- 2. PUBLIC ANONYMOUS ACCESS POLICY: Token-scoped attendance submission for Peer Tutors
-- Peer tutors access attendance via their unique unguessable access_token without needing login accounts.
CREATE POLICY "Public token access to attendance form" ON attendance_forms
    FOR SELECT TO anon
    USING (expires_at > NOW() AND is_submitted = false);

CREATE POLICY "Public token submission to attendance form" ON attendance_forms
    FOR UPDATE TO anon
    USING (expires_at > NOW() AND is_submitted = false);

CREATE POLICY "Public token insert to attendance records" ON attendance_records
    FOR INSERT TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM attendance_forms af
            WHERE af.id = attendance_records.attendance_form_id
            AND af.expires_at > NOW()
            AND af.is_submitted = false
        )
    );
