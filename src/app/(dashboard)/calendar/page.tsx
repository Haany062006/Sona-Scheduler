'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { CalendarBlackoutDate, RemedialClass } from '@/types/database.types';
import { formatDate, formatTime } from '@/lib/utils';

export default function CalendarPage() {
  const [blackouts, setBlackouts] = useState<CalendarBlackoutDate[]>([]);
  const [classes, setClasses] = useState<RemedialClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Blackout Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [dateVal, setDateVal] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [reason, setReason] = useState('');
  const [eventType, setEventType] = useState<'holiday' | 'exam' | 'college_event'>('holiday');
  const [saving, setSaving] = useState(false);

  const fetchCalendarData = () => {
    fetch('/api/calendar')
      .then((res) => res.json())
      .then((data) => setBlackouts(data));

    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        setClasses(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const handleCreateBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_val: dateVal,
          reason,
          event_type: eventType,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }

      setDateVal('');
      setReason('');
      setModalOpen(false);
      fetchCalendarData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this unavailable date from the academic calendar?')) return;
    try {
      await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' });
      fetchCalendarData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Calendar & Availability</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure working days, examination blackout dates, and avoid timetable conflicts.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 text-white font-semibold text-xs hover:bg-blue-800 transition shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Mark Unavailable Date</span>
        </button>
      </div>

      {/* Two Column Layout: Unavailable Dates vs Scheduled Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Blackout Dates */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Blackout & Holiday Dates</h2>
              <p className="text-xs text-slate-500">Days where scheduling is restricted</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              {blackouts.length} Blocked Dates
            </span>
          </div>

          {blackouts.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">No calendar blackout dates recorded.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mark holidays or exam blackout dates to prevent scheduling conflicts.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {blackouts.map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {formatDate(b.date_val)}
                      </span>
                      <Badge
                        variant={
                          b.event_type === 'exam'
                            ? 'red'
                            : b.event_type === 'holiday'
                            ? 'amber'
                            : 'purple'
                        }
                        size="sm"
                      >
                        {b.event_type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{b.reason}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Remove blackout"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Scheduled Remedial Sessions Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Scheduled Remedial Timetable</h2>
              <p className="text-xs text-slate-500">Confirmed sessions with date and time</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200">
              {classes.length} Classes Scheduled
            </span>
          </div>

          {classes.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">No remedial classes scheduled.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Schedule a session from Subject-Wise Groupings or Remedial Schedule.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {classes.map((c) => (
                <div key={c.id} className="py-3 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {c.subject?.code}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-xs">{c.subject?.name}</h4>
                    </div>
                    <p className="text-xs text-slate-500">
                      Faculty: <strong>{c.faculty?.name}</strong> • Venue:{' '}
                      <strong>{c.venue || 'TBA'}</strong>
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600">
                      <span>
                        📅 <strong>{formatDate(c.class_date)}</strong>
                      </span>
                      <span>
                        ⏰{' '}
                        <strong>
                          {formatTime(c.start_time)} - {formatTime(c.end_time)}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <Badge variant={c.status === 'completed' ? 'green' : 'blue'} size="sm">
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mark Blackout Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Mark Calendar Blackout Date"
        description="Prevent remedial class scheduling on holidays or internal assessment periods"
      >
        <form onSubmit={handleCreateBlackout} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
            >
              <option value="holiday">Institutional Holiday</option>
              <option value="exam">Internal Assessment / Exam</option>
              <option value="college_event">Symposium / College Function</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Description
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Continuous Internal Assessment Test 1 (CIAT-1)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? 'Marking...' : 'Mark Blackout Date'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
