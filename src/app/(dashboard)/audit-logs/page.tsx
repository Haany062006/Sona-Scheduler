'use client';

import React, { useEffect, useState } from 'react';
import { History, Shield, Clock, Terminal } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { AuditLog } from '@/types/database.types';
import { formatDate } from '@/lib/utils';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit-logs')
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Audit Trail & History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of all administrative actions, data uploads, timetable overrides, and attendance submissions.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
          <Shield className="h-4 w-4 text-blue-900" />
          <span>Tamper-Resistant Log</span>
        </div>
      </div>

      {/* Audit Log Timeline Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Action Event</th>
                <th className="px-6 py-3.5">Entity Type</th>
                <th className="px-6 py-3.5">Coordinator Email</th>
                <th className="px-6 py-3.5">Action Payload / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-blue-950 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="slate" size="sm">
                        {log.entity_type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {log.user_email || 'System Action'}
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <pre className="font-mono text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <History className="h-8 w-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-700">No Audit Events Recorded</p>
                      <p className="text-[11px] text-slate-400">
                        Administrative operations performed in the portal will be logged here.
                      </p>
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
