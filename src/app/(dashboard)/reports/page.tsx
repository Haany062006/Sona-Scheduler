'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  UserX,
  BookOpen,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Badge from '@/components/ui/Badge';
import { Department, Batch, Subject } from '@/types/database.types';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<
    'arrears' | 'classes' | 'absentees' | 'faculty'
  >('arrears');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  // Data sets
  const [arrearsData, setArrearsData] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => setDepartments(data));

    fetch('/api/regulations')
      .then((res) => res.json())
      .then((data) => setBatches(data.batches));

    fetch('/api/arrears')
      .then((res) => res.json())
      .then((data) => setArrearsData(data));

    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        setClassesData(data);
        setLoading(false);
      });
  }, []);

  const exportToExcel = () => {
    let rows: any[] = [];
    let filename = `Sona_Scheduler_${reportType}_report.xlsx`;

    if (reportType === 'arrears') {
      rows = arrearsData.map((a) => ({
        'Register Number': a.student?.register_number,
        'Student Name': a.student?.name,
        Department: a.student?.department?.code,
        Section: a.student?.section,
        'Subject Code': a.subject?.code,
        'Subject Title': a.subject?.name,
        Semester: a.semester_number,
        Status: a.status,
      }));
    } else if (reportType === 'classes') {
      rows = classesData.map((c) => ({
        'Class Code': c.class_code,
        Department: c.department?.code,
        Subject: c.subject?.name,
        Faculty: c.faculty?.name,
        Date: c.class_date,
        'Start Time': c.start_time,
        'End Time': c.end_time,
        Venue: c.venue || 'TBA',
        'Student Count': c.student_count,
        Status: c.status,
      }));
    } else if (reportType === 'absentees') {
      rows = classesData.map((c) => ({
        'Class Code': c.class_code,
        Subject: c.subject?.name,
        Faculty: c.faculty?.name,
        Date: c.class_date,
        Status: c.status,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(rows);

    // Format Excel exports with clear column widths and ensure register numbers remain string text
    ws['!cols'] = [
      { wch: 18 },
      { wch: 26 },
      { wch: 12 },
      { wch: 10 },
      { wch: 14 },
      { wch: 35 },
      { wch: 10 },
      { wch: 12 },
    ];

    // Ensure all cells in register number column are formatted as text ('s')
    Object.keys(ws).forEach((cellKey) => {
      if (cellKey.startsWith('A') && cellKey !== 'A1' && ws[cellKey]) {
        ws[cellKey].t = 's';
        ws[cellKey].z = '@';
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics Export</h1>
          <p className="text-xs text-slate-500 mt-1">
            Export institutional remedial metrics, department arrear cohorts, and session logs to Excel & CSV.
          </p>
        </div>
        <button
          onClick={exportToExcel}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Export Excel Report (.xlsx)</span>
        </button>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200">
        <button
          onClick={() => setReportType('arrears')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            reportType === 'arrears' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Arrear Students Report</span>
        </button>
        <button
          onClick={() => setReportType('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            reportType === 'classes' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Remedial Timetable Sessions</span>
        </button>
        <button
          onClick={() => setReportType('absentees')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            reportType === 'absentees' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserX className="h-4 w-4" />
          <span>Absentee & Attendance Logs</span>
        </button>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Report Preview ({reportType.toUpperCase()})
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Ready for instant download
          </span>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          {reportType === 'arrears' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                <tr>
                  <th className="px-5 py-3">Register Number</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Dept</th>
                  <th className="px-5 py-3">Section</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {arrearsData.length > 0 ? (
                  arrearsData.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono font-bold text-blue-900">
                        {a.student?.register_number}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{a.student?.name}</td>
                      <td className="px-5 py-3">{a.student?.department?.code}</td>
                      <td className="px-5 py-3">Sec {a.student?.section}</td>
                      <td className="px-5 py-3 font-medium text-slate-700">
                        {a.subject?.code} - {a.subject?.name}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="amber" size="sm">
                          {a.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No arrear records available to generate report.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {reportType === 'classes' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                <tr>
                  <th className="px-5 py-3">Class Code</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Faculty</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Venue</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classesData.length > 0 ? (
                  classesData.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono font-bold text-blue-900">{c.class_code}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{c.subject?.name}</td>
                      <td className="px-5 py-3">{c.faculty?.name}</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{c.class_date}</td>
                      <td className="px-5 py-3">{c.venue || 'TBA'}</td>
                      <td className="px-5 py-3">
                        <Badge variant={c.status === 'completed' ? 'green' : 'blue'} size="sm">
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No remedial class records available to generate report.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {reportType === 'absentees' && (
            <div className="p-8 text-center text-slate-500">
              <UserX className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-semibold">
                Absentee tracking is linked directly with peer tutor attendance submission forms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
