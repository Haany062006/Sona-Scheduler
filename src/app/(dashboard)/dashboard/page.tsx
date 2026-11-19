'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  AlertTriangle,
  GraduationCap,
  Clock,
  CheckCircle2,
  FileQuestion,
  UserX,
  PlusCircle,
  Calendar,
  FileSpreadsheet,
  ArrowRight,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { formatDate, formatTime } from '@/lib/utils';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Remedial Incharge Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">Welcome, Remedial Coordinator</h1>
            <p className="text-blue-100/90 text-sm mt-1 max-w-xl">
              Track arrear clusters across ADS & IT departments, schedule conflict-free sessions, and monitor peer tutor attendance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-950 font-semibold text-xs hover:bg-blue-50 transition shadow-sm"
            >
              <PlusCircle className="h-4 w-4 text-blue-700" />
              <span>Schedule Class</span>
            </Link>
            <Link
              href="/arrears"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800 text-white font-semibold text-xs hover:bg-blue-700 border border-blue-600/50 transition"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Upload Arrears</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Core Remedial Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value={metrics?.totalStudents ?? 0}
            subtitle="Enrolled in active batches"
            icon={Users}
            variant="blue"
          />
          <StatCard
            title="Students With Arrears"
            value={metrics?.totalStudentsWithArrears ?? 0}
            subtitle="Active remedial candidates"
            icon={AlertTriangle}
            variant="amber"
          />
          <StatCard
            title="Remedial Classes"
            value={metrics?.totalRemedialClasses ?? 0}
            subtitle="Scheduled across all depts"
            icon={Clock}
            variant="indigo"
          />
          <StatCard
            title="Faculty Incharge"
            value={metrics?.totalFaculty ?? 0}
            subtitle="Active subject professors"
            icon={GraduationCap}
            variant="purple"
          />
          <StatCard
            title="Upcoming Classes"
            value={metrics?.upcomingClasses ?? 0}
            subtitle="Pending execution"
            icon={Calendar}
            variant="blue"
          />
          <StatCard
            title="Completed Sessions"
            value={metrics?.completedClasses ?? 0}
            subtitle="Successfully conducted"
            icon={CheckCircle2}
            variant="emerald"
          />
          <StatCard
            title="Pending Attendance"
            value={metrics?.pendingAttendanceForms ?? 0}
            subtitle="Forms awaiting submission"
            icon={FileQuestion}
            variant="amber"
          />
          <StatCard
            title="Total Absentees"
            value={metrics?.totalAbsentRecords ?? 0}
            subtitle="Reported to concerned faculty"
            icon={UserX}
            variant="red"
          />
        </div>
      </div>

      {/* Two Column Layout: Upcoming Classes & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left (2 Cols): Upcoming Remedial Sessions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Upcoming Remedial Classes</h3>
              <p className="text-xs text-slate-500 mt-0.5">Sessions queued for the next 7 days</p>
            </div>
            <Link
              href="/schedule"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {metrics?.upcomingList?.length > 0 ? (
              metrics.upcomingList.map((c: any) => (
                <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {c.subject?.code}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-sm">{c.subject?.name}</h4>
                      <Badge variant="blue" size="sm">
                        {c.department?.code}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Faculty: <strong className="text-slate-700">{c.faculty?.name}</strong></span>
                      <span>Date: <strong className="text-slate-700">{formatDate(c.class_date)}</strong></span>
                      <span>Time: <strong className="text-slate-700">{formatTime(c.start_time)} - {formatTime(c.end_time)}</strong></span>
                      <span>Venue: <strong className="text-slate-700">{c.venue || 'TBA'}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <span className="block text-xs font-bold text-slate-800">
                        {c.student_count} Students
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Tutor: {c.peer_tutor?.name?.split(' ')[0] || 'Unassigned'}
                      </span>
                    </div>
                    <Link
                      href={`/schedule`}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500">
                <ClipboardList className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium">No upcoming remedial classes scheduled.</p>
                <Link
                  href="/schedule"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Schedule First Class</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right (1 Col): Quick Action Hub & Remedial Flow */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-1">Administrative Workflows</h3>
            <p className="text-xs text-slate-500 mb-4">Quick shortcuts to frequent tasks</p>

            <div className="space-y-2.5">
              <Link
                href="/students"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                    01
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                      Import Student Roster
                    </p>
                    <p className="text-[11px] text-slate-500">Upload ADS/IT Excel files</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/arrears"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    02
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-amber-900">
                      Upload Arrear PDFs
                    </p>
                    <p className="text-[11px] text-slate-500">Reconcile & review arrears</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/groupings"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                    03
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-900">
                      Subject-Wise Groupings
                    </p>
                    <p className="text-[11px] text-slate-500">Automated student cohorts</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/schedule"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    04
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                      Class Scheduling & Conflict Check
                    </p>
                    <p className="text-[11px] text-slate-500">Multi-slot timetable engine</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/attendance"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                    05
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-purple-900">
                      Attendance & Absentee Alerts
                    </p>
                    <p className="text-[11px] text-slate-500">Review submissions & SMS</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
