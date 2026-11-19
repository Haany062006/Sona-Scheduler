'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  FileSpreadsheet,
  Layers,
  Calendar,
  Clock,
  UserCheck,
  ClipboardCheck,
  Bell,
  BarChart3,
  History,
  X,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Regulations & Syllabus', href: '/regulations', icon: BookOpen },
  { name: 'Student Management', href: '/students', icon: Users },
  { name: 'Faculty Management', href: '/faculty', icon: GraduationCap },
  { name: 'Arrear PDF Records', href: '/arrears', icon: FileSpreadsheet },
  { name: 'Subject Groupings', href: '/groupings', icon: Layers },
  { name: 'Academic Calendar', href: '/calendar', icon: Calendar },
  { name: 'Remedial Scheduling', href: '/schedule', icon: Clock },
  { name: 'Peer Tutors', href: '/tutors', icon: UserCheck },
  { name: 'Attendance Records', href: '/attendance', icon: ClipboardCheck },
  { name: 'SMS & Email Alerts', href: '/notifications', icon: Bell },
  { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
  { name: 'Audit & History', href: '/audit-logs', icon: History },
];

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-9 w-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">Sona Scheduler</h1>
              <p className="text-[11px] text-slate-400 font-medium">Remedial Class Portal</p>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info badge */}
        <div className="p-3 border-t border-slate-800">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Active Departments</span>
            </div>
            <div className="mt-1 flex gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono text-[10px] font-bold border border-blue-700/40">
                ADS
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono text-[10px] font-bold border border-blue-700/40">
                IT
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
