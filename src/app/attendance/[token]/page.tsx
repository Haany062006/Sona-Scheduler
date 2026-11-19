'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Sparkles,
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

export default function PeerTutorAttendancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [classDetails, setClassDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [tutorIdentifier, setTutorIdentifier] = useState('');
  const [tutorRemarks, setTutorRemarks] = useState('');
  const [marks, setMarks] = useState<{ [studentId: string]: 'present' | 'absent' }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/attendance/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load attendance roster');
        return data;
      })
      .then((data) => {
        setClassDetails(data);
        // Default all students to 'present' initially for fast touch-marking
        const initialMarks: { [key: string]: 'present' | 'absent' } = {};
        data.remedial_class?.students?.forEach((s: any) => {
          initialMarks[s.id] = 'present';
        });
        setMarks(initialMarks);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const toggleStudentStatus = (studentId: string) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const markAll = (status: 'present' | 'absent') => {
    const updated: { [key: string]: 'present' | 'absent' } = {};
    classDetails?.remedial_class?.students?.forEach((s: any) => {
      updated[s.id] = status;
    });
    setMarks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorIdentifier.trim()) {
      alert('Please enter your tutor register number or name.');
      return;
    }

    setSubmitting(true);
    try {
      const formattedMarks = Object.entries(marks).map(([student_id, status]) => ({
        student_id,
        status,
      }));

      const res = await fetch(`/api/attendance/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitted_by_identifier: tutorIdentifier,
          tutor_remarks: tutorRemarks,
          marks: formattedMarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      router.push(`/attendance/${token}/success`);
    } catch (err: any) {
      alert(`Error submitting attendance: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-600">Loading Remedial Attendance Roster...</p>
        </div>
      </div>
    );
  }

  if (error || classDetails?.form?.is_submitted) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center space-y-4">
          <div className="h-14 w-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {classDetails?.form?.is_submitted
              ? 'Attendance Already Submitted'
              : 'Link Inactive or Expired'}
          </h2>
          <p className="text-xs text-slate-600">
            {classDetails?.form?.is_submitted
              ? `Attendance for session ${classDetails.remedial_class?.class_code} was submitted by ${classDetails.form?.submitted_by_identifier}. Records are locked.`
              : error}
          </p>
        </div>
      </div>
    );
  }

  const students = classDetails.remedial_class?.students || [];
  const presentCount = Object.values(marks).filter((m) => m === 'present').length;
  const absentCount = Object.values(marks).filter((m) => m === 'absent').length;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 flex justify-center">
      <div className="max-w-lg w-full space-y-4">
        {/* Mobile Header Card */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-blue-200 text-[11px] font-bold uppercase tracking-wider">
            <GraduationCap className="h-4 w-4" />
            <span>Sona College • Peer Tutor Portal</span>
          </div>
          <h1 className="text-xl font-bold mt-1">
            {classDetails.remedial_class?.subject?.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-blue-100">
            <span className="bg-blue-800/80 px-2.5 py-1 rounded-lg border border-blue-700/60 font-mono font-bold">
              {classDetails.remedial_class?.subject?.code}
            </span>
            <span className="bg-blue-800/80 px-2.5 py-1 rounded-lg border border-blue-700/60 font-semibold">
              Dept: {classDetails.remedial_class?.department?.code}
            </span>
            <span className="bg-blue-800/80 px-2.5 py-1 rounded-lg border border-blue-700/60">
              {formatDate(classDetails.remedial_class?.class_date)}
            </span>
            <span className="bg-blue-800/80 px-2.5 py-1 rounded-lg border border-blue-700/60">
              {formatTime(classDetails.remedial_class?.start_time)} -{' '}
              {formatTime(classDetails.remedial_class?.end_time)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tutor Identification */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Step 1: Tutor Verification
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Your Register Number or Full Name
              </label>
              <input
                type="text"
                required
                value={tutorIdentifier}
                onChange={(e) => setTutorIdentifier(e.target.value)}
                placeholder="e.g. 612721104015 (Sanjay Kumar)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Student Roster Marking */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step 2: Mark Student Attendance
                </h2>
                <div className="flex gap-2 mt-1 text-xs">
                  <span className="text-emerald-700 font-bold">Present: {presentCount}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-red-700 font-bold">Absent: {absentCount}</span>
                </div>
              </div>

              {/* Quick toggle buttons */}
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => markAll('present')}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAll('absent')}
                  className="px-2.5 py-1 bg-red-50 text-red-800 border border-red-200 rounded-lg text-[11px] font-bold"
                >
                  All Absent
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Automated Absence Reporting:</span> Any student marked <strong>Absent</strong> will automatically trigger an instant SMS alert to their respective Class Coordinator (CC).
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Tap any student row to toggle between Present and Absent:
            </p>

            <div className="space-y-2">
              {students.map((st: any) => {
                const isPresent = marks[st.id] === 'present';
                return (
                  <div
                    key={st.id}
                    onClick={() => toggleStudentStatus(st.id)}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      isPresent
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-red-50/70 border-red-200'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {st.register_number}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-sm">{st.name}</h4>
                      <span className="text-[11px] text-slate-500">Section {st.section}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isPresent ? (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Present</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs">
                          <XCircle className="h-4 w-4" />
                          <span>Absent</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remarks & Submit */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Tutor Notes / Session Topic Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={tutorRemarks}
                onChange={(e) => setTutorRemarks(e.target.value)}
                placeholder="e.g. Completed Chapter 2 unit problems. Good student participation."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !tutorIdentifier.trim()}
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <span>Submitting Attendance...</span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Attendance & Notify Faculty</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
