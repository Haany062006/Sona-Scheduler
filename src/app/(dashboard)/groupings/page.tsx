'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Users,
  Search,
  Filter,
  Calendar,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Department, Batch } from '@/types/database.types';

export default function GroupingsPage() {
  const [groupings, setGroupings] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [search, setSearch] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const fetchGroupings = () => {
    const params = new URLSearchParams();
    if (selectedDept) params.set('department_id', selectedDept);
    if (selectedBatch) params.set('batch_id', selectedBatch);

    fetch(`/api/groupings?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setGroupings(data);
        if (data.length > 0 && !expandedKey) {
          setExpandedKey(`${data[0].subject.id}-${data[0].batch.id}`);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => setDepartments(data));

    fetch('/api/regulations')
      .then((res) => res.json())
      .then((data) => setBatches(data.batches));
  }, []);

  useEffect(() => {
    fetchGroupings();
  }, [selectedDept, selectedBatch]);

  const filteredGroups = groupings.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.subject.name.toLowerCase().includes(q) ||
      g.subject.code.toLowerCase().includes(q) ||
      g.students.some((s: any) => s.name.toLowerCase().includes(q) || s.register_number.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subject-Wise Student Groupings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated student clustering partitioned by Department, Batch, Regulation, Semester, and Arrear Course.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200">
          {groupings.length} Active Remedial Cohorts
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject or student..."
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

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cohort Grouping Cards */}
      <div className="space-y-4">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => {
            const key = `${group.subject.id}-${group.batch.id}`;
            const isExpanded = expandedKey === key;

            return (
              <div
                key={key}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition"
              >
                {/* Cohort Header Bar */}
                <div
                  onClick={() => setExpandedKey(isExpanded ? null : key)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-sm shrink-0">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {group.subject.code}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">{group.subject.name}</h3>
                        <Badge variant="blue" size="sm">
                          {group.department.code}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Batch: <strong className="text-slate-700">{group.batch.name}</strong> •
                        Semester: <strong className="text-slate-700">Sem {group.subject.semester_number}</strong> •
                        Total Arrear Candidates: <strong className="text-blue-950 font-bold">{group.students.length}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <Link
                      href={`/schedule?subject_id=${group.subject.id}&batch_id=${group.batch.id}&dept_id=${group.department.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3.5 py-2 rounded-xl bg-blue-900 text-white font-semibold text-xs hover:bg-blue-800 transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Schedule Class</span>
                    </Link>

                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Student Table */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/40 p-5">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      Enrolled Students with Arrears in {group.subject.code} ({group.students.length})
                    </p>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-2.5">Register Number</th>
                            <th className="px-4 py-2.5">Student Name</th>
                            <th className="px-4 py-2.5">Section</th>
                            <th className="px-4 py-2.5">Arrear Semester</th>
                            <th className="px-4 py-2.5">Contact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.students.map((s: any) => (
                            <tr key={s.id} className="hover:bg-slate-50/80">
                              <td className="px-4 py-2.5 font-mono font-bold text-blue-900">
                                {s.register_number}
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-slate-900">{s.name}</td>
                              <td className="px-4 py-2.5 font-bold text-slate-700">Sec {s.section}</td>
                              <td className="px-4 py-2.5 text-slate-600 font-medium">
                                Sem {s.semester_number}
                              </td>
                              <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                                {s.email || s.phone || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <Layers className="h-10 w-10 mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-bold text-slate-800">No subject groups available</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Import and validate arrear records first to automatically group students into remedial cohorts.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/arrears"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                <span>Go to Arrear Import</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
