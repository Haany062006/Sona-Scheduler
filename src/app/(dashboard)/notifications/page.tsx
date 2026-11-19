'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  Mail,
  Phone,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Filter,
  Plus,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Notification } from '@/types/database.types';
import { formatDate } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterChannel, setFilterChannel] = useState<'all' | 'sms' | 'email'>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Test Modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testChannel, setTestChannel] = useState<'sms' | 'email'>('sms');
  const [testRecipient, setTestRecipient] = useState('+919443311221');
  const [testMessage, setTestMessage] = useState('Test notification from Sona Scheduler gateway.');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchNotifications = () => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await fetch('/api/notifications/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setRetryingId(null);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: testChannel,
          recipient: testRecipient,
          message: testMessage,
        }),
      });

      const data = await res.json();
      setTestResult(data);
      fetchNotifications();
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filterChannel === 'all') return true;
    return n.channel === filterChannel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SMS & Email Notification Dispatch Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Modular multi-channel delivery tracking with cryptographic idempotency keys to prevent duplicate dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTestModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-900 text-white font-semibold text-xs hover:bg-blue-800 transition flex items-center gap-1.5 shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Test Gateway</span>
          </button>

          <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilterChannel('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterChannel === 'all' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterChannel('sms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                filterChannel === 'sms' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              <Phone className="h-3 w-3" />
              <span>SMS</span>
            </button>
            <button
              onClick={() => setFilterChannel('email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                filterChannel === 'email' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              <Mail className="h-3 w-3" />
              <span>Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gateway Configuration & Idempotency Info Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-800 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-blue-900">SMS Gateway: Modular Console Simulation</p>
            <p className="text-blue-700 mt-0.5">
              Sender ID: <code className="font-mono font-semibold">SONASCH</code> • Provider: <code className="font-mono font-semibold">console</code>
            </p>
            <p className="text-blue-600/80 text-[11px] mt-1">
              All SMS triggers log formatted messages with active links to terminal and persistent audit tables. Set Fast2SMS or Twilio credentials in <code className="font-mono">.env.local</code> to activate live SMS delivery.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-indigo-800 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-indigo-900">Email Gateway: SMTP / Resend Modular Engine</p>
            <p className="text-indigo-700 mt-0.5">
              From: <code className="font-mono font-semibold">remedial@sonatech.ac.in</code> • CC: HOD ADS & IT
            </p>
            <p className="text-indigo-600/80 text-[11px] mt-1">
              Idempotency keys ensure faculty and tutors never receive duplicate emails for identical class sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Channel</th>
                <th className="px-4 py-3.5">Recipient</th>
                <th className="px-4 py-3.5">Contact Target</th>
                <th className="px-4 py-3.5">Message Content / Subject</th>
                <th className="px-4 py-3.5">Idempotency Key</th>
                <th className="px-4 py-3.5">Attempts</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5">
                      <Badge variant={n.channel === 'sms' ? 'purple' : 'blue'} size="sm">
                        {n.channel.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-900">{n.recipient_name}</span>
                        <span className="block text-[11px] text-slate-500 uppercase font-bold">
                          {n.recipient_type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">{n.recipient_contact}</td>
                    <td className="px-4 py-3.5 max-w-xs">
                      {n.subject && (
                        <p className="font-bold text-slate-900 text-xs mb-0.5">{n.subject}</p>
                      )}
                      <p className="text-slate-600 text-xs line-clamp-2">{n.message_body}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 truncate max-w-[140px]">
                      {n.idempotency_key || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      {n.attempt_count ?? 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          n.status === 'delivered'
                            ? 'green'
                            : n.status === 'simulated'
                            ? 'blue'
                            : n.status === 'sent'
                            ? 'green'
                            : n.status === 'failed'
                            ? 'red'
                            : 'amber'
                        }
                        size="sm"
                      >
                        {n.status === 'delivered'
                          ? 'Delivered'
                          : n.status === 'simulated'
                          ? 'Simulated (Console)'
                          : n.status === 'sent'
                          ? 'Sent'
                          : n.status === 'failed'
                          ? 'Failed'
                          : 'Queued'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {n.status === 'pending' || n.status === 'failed' ? (
                        <button
                          onClick={() => handleRetry(n.id)}
                          disabled={retryingId === n.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 font-semibold text-xs border border-blue-200 hover:bg-blue-100 transition disabled:opacity-50 cursor-pointer"
                        >
                          <RefreshCw className={`h-3 w-3 ${retryingId === n.id ? 'animate-spin' : ''}`} />
                          <span>Retry</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {n.sent_at ? formatDate(n.sent_at) : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Bell className="h-8 w-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-700">No Notification Dispatches Recorded</p>
                      <p className="text-[11px] text-slate-400">
                        Class allocation and absentee notifications will appear here upon dispatch.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Gateway Modal */}
      <Modal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="Test Multi-Channel Dispatch Gateway"
        description="Verify SMS provider and SMTP email integration."
      >
        <form onSubmit={handleSendTest} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Channel</label>
              <select
                value={testChannel}
                onChange={(e) => {
                  const ch = e.target.value as 'sms' | 'email';
                  setTestChannel(ch);
                  setTestRecipient(ch === 'sms' ? '+919443311221' : 'coordinator@sonatech.ac.in');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              >
                <option value="sms">SMS Gateway</option>
                <option value="email">Institutional Email</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recipient {testChannel === 'sms' ? 'Phone Number' : 'Email Address'}
              </label>
              <input
                type="text"
                required
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Test Payload</label>
            <textarea
              rows={3}
              required
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <p className="font-bold">
                {testResult.success ? 'Message Dispatched Successfully' : 'Gateway Error'}
              </p>
              <p className="text-[11px] mt-0.5">
                {testResult.message || testResult.error || JSON.stringify(testResult)}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTestModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={sendingTest}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {sendingTest ? 'Dispatching...' : 'Send Test Notification'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
