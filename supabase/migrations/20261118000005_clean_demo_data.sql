-- ==============================================================================
-- Sona Scheduler Migration: 20261118000005_clean_demo_data.sql
-- Description: Safely purges all demonstration and sample records while strictly
-- preserving schema, tables, foreign keys, RLS policies, and base departments (ADS, IT).
-- ==============================================================================

BEGIN;

-- 1. Purge all transactional, attendance, class, and notification demo data
DELETE FROM audit_logs;
DELETE FROM attendance_records;
DELETE FROM attendance_forms;
DELETE FROM tutor_allocations;
DELETE FROM class_students;
DELETE FROM notifications;
DELETE FROM remedial_classes;

-- 2. Purge academic demo records: arrears, subject mappings, faculty, students, curriculum
DELETE FROM arrear_records;
DELETE FROM faculty_subject_assignments;
DELETE FROM subject_departments;
DELETE FROM peer_tutors;
DELETE FROM faculty;
DELETE FROM students;
DELETE FROM subjects;
DELETE FROM calendar_blackout_dates;

-- 3. Purge sample batch and regulation mappings to allow clean college entry
DELETE FROM regulation_batches;
DELETE FROM batches;
DELETE FROM regulations;

-- 4. Preserve core department entities (ADS and IT)
INSERT INTO departments (id, code, name, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111101', 'ADS', 'Artificial Intelligence and Data Science', true),
  ('11111111-1111-1111-1111-111111111102', 'IT', 'Information Technology', true)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, is_active = true;

-- 5. Preserve canonical semester lookup references (Semester 1 to Semester 8)
INSERT INTO semesters (semester_number, name)
VALUES 
  (1, 'Semester 1'),
  (2, 'Semester 2'),
  (3, 'Semester 3'),
  (4, 'Semester 4'),
  (5, 'Semester 5'),
  (6, 'Semester 6'),
  (7, 'Semester 7'),
  (8, 'Semester 8')
ON CONFLICT (semester_number) DO NOTHING;

-- 6. Preserve verified institutional campus venues
INSERT INTO venues (code, name, building, capacity, is_active)
VALUES
  ('TP-304', 'ADS Remedial Hall TP-304', 'Tech Park', 60, true),
  ('TP-305', 'IT Remedial Hall TP-305', 'Tech Park', 60, true),
  ('MB-201', 'Main Block Seminar Hall 1', 'Main Block', 120, true),
  ('CS-LAB-1', 'Computing Laboratory 1', 'CS Block', 45, true)
ON CONFLICT (code) DO NOTHING;

COMMIT;
