'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Users,
  Search,
  Filter,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { RemedialClass, Department } from '@/types/database.types';
import { formatDate, formatTime } from '@/lib/utils';

export default function AttendanceMonitoringPage() {
  const [classes, setClasses] = useState<RemedialClass[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [search, setSearch] = useState('');

  // Selected Class Audit Modal
  const [auditClass, setAuditClass] = useState<any | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchClasses = () => {
    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        setClasses(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => setDepartments(data));

    fetchClasses();
  }, []);

  const openAuditModal = async (classItem: RemedialClass) => {
    setAuditLoading(true);
    try {
      // Find the associated attendance form token
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      // Fetch full class details
      setAuditClass({
        ...classItem,
        tutor_name: classItem.peer_tutor?.name || 'Unassigned',
      });
    } finally {
      setAuditLoading(false);
    }
  };

  const filteredClasses = classes.filter((c) => {
    if (selectedDept && c.department_id !== selectedDept) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.class_code.toLowerCase().includes(q) ||
      c.subject?.name.toLowerCase().includes(q) ||
      c.faculty?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Monitoring & Absentees</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of peer tutor attendance submissions, absent student registers, and notifications.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search class code, subject, or professor..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Classes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Class Code</th>
                <th className="px-6 py-3.5">Subject & Dept</th>
                <th className="px-6 py-3.5">Session Date</th>
                <th className="px-6 py-3.5">Assigned Tutor</th>
                <th className="px-6 py-3.5">Enrolled Roster</th>
                <th className="px-6 py-3.5">Attendance Status</th>
                <th className="px-6 py-3.5 text-right">Tutor Form Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClasses.length > 0 ? (
                filteredClasses.map((c) => {
                  const isCompleted = c.status === 'completed';
                  const formToken = (c as any).attendance_token || (c as any).attendance_form?.form_token;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-mono font-bold text-blue-900">{c.class_code}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {c.subject?.code}
                            </span>
                            <Badge variant="blue" size="sm">
                              {c.department?.code}
                            </Badge>
                          </div>
                          <p className="text-slate-600 font-medium">{c.subject?.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 space-y-0.5">
                        <span className="block font-bold text-slate-800">{formatDate(c.class_date)}</span>
                        <span className="block text-slate-500 font-mono text-[11px]">
                          {formatTime(c.start_time)} - {formatTime(c.end_time)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {c.peer_tutor?.name || (
                          <span className="text-amber-700 italic">Pending Allocation</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {c.student_count} Candidates
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={isCompleted ? 'green' : 'amber'} size="sm">
                          {isCompleted ? 'Attendance Submitted' : 'Pending Attendance'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formToken ? (
                          <Link
                            href={`/attendance/${formToken}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                          >
                            <span>Open Form</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Pending Setup</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <ClipboardCheck className="h-10 w-10 text-slate-300" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">No Remedial Sessions Scheduled</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                          Schedule remedial classes to generate secure peer tutor attendance links and monitor roster submissions.
                        </p>
                      </div>
                      <div className="pt-2">
                        <Link
                          href="/schedule"
                          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-xs transition"
                        >
                          <span>Go to Remedial Schedule</span>
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
