import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'amber' | 'emerald' | 'red' | 'indigo' | 'purple';
}

const variantStyles = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-600',
    text: 'text-blue-900',
    border: 'border-blue-100',
  },
  amber: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-600',
    text: 'text-amber-900',
    border: 'border-amber-100',
  },
  emerald: {
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-600',
    text: 'text-emerald-900',
    border: 'border-emerald-100',
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-600',
    text: 'text-red-900',
    border: 'border-red-100',
  },
  indigo: {
    bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-600',
    text: 'text-indigo-900',
    border: 'border-indigo-100',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-600',
    text: 'text-purple-900',
    border: 'border-purple-100',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`p-5 rounded-2xl bg-white border ${styles.border} shadow-xs flex items-start justify-between`}>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className={`mt-2 text-2xl font-bold tracking-tight text-slate-900`}>{value}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className={`h-11 w-11 rounded-xl ${styles.iconBg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
