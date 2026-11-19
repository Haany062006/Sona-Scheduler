'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

export default function AttendanceSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-200 text-center space-y-5">
        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance Submitted Successfully</h1>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Thank you for conducting this remedial session. Attendance records have been committed to the Sona remedial database.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 text-left space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Automated Notifications Dispatched</span>
          </div>
          <p className="text-slate-500 text-[11px] pl-6">
            Absence alerts have been automatically transmitted via SMS and email to the student's Class Coordinator (CC) and Remedial Cell.
          </p>
        </div>

        <p className="text-[11px] text-slate-400">
          You may safely close this browser window.
        </p>
      </div>
    </div>
  );
}
