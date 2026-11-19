'use client';

import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, Link as LinkIcon, Phone, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { PeerTutor, Department, RemedialClass } from '@/types/database.types';

export default function TutorsPage() {
  const [tutors, setTutors] = useState<PeerTutor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<RemedialClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Tutor Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [deptId, setDeptId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Allocate Tutor Modal
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<PeerTutor | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [allocating, setAllocating] = useState(false);

  const fetchTutors = () => {
    fetch('/api/tutors')
      .then((res) => res.json())
      .then((data) => {
        setTutors(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data);
        if (data.length > 0) setDeptId(data[0].id);
      });

    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].id);
      });

    fetchTutors();
  }, []);

  const handleAddTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          register_number: regNo,
          name,
          department_id: deptId,
          email,
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRegNo('');
      setName('');
      setEmail('');
      setPhone('');
      setAddModalOpen(false);
      fetchTutors();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTutor || !selectedClassId) return;

    setAllocating(true);
    try {
      const res = await fetch('/api/tutors/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remedial_class_id: selectedClassId,
          peer_tutor_id: selectedTutor.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAllocateModalOpen(false);
      alert(`Peer Tutor ${selectedTutor.name} successfully assigned. Attendance link generated & SMS queued.`);
    } catch (err: any) {
      alert(`Allocation failed: ${err.message}`);
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Peer Tutor Directory & Allocation</h1>
          <p className="text-xs text-slate-500 mt-1">
            Assign senior student tutors to conduct remedial sessions and submit passwordless mobile attendance.
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 text-white font-semibold text-xs hover:bg-blue-800 transition shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Register Peer Tutor</span>
        </button>
      </div>

      {/* Tutor Cards Grid */}
      {tutors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-50 text-blue-900 mb-3">
            <UserCheck className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Peer Tutors Registered</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Register senior peer tutors to assist faculty in taking attendance and guiding students during remedial sessions.
          </p>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Register First Peer Tutor</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tutors.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {t.register_number}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{t.name}</h3>
                  </div>
                  <Badge variant="blue" size="sm">
                    {t.department?.code}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-mono text-[11px]">{t.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{t.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Available</span>
                </span>
                <button
                  onClick={() => {
                    setSelectedTutor(t);
                    setAllocateModalOpen(true);
                  }}
                  className="text-xs font-semibold text-blue-900 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>Allocate to Class</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Tutor Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register Senior Peer Tutor"
        description="Senior students assigned to assist subject faculty in remedial batches"
      >
        <form onSubmit={handleAddTutor} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Register Number
              </label>
              <input
                type="text"
                required
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="e.g. 612721104015"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tutor Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sanjay Kumar K"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tutor@sonatech.ac.in"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone (For Attendance Link SMS)
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919789012345"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Register Tutor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Allocate Tutor to Class Modal */}
      <Modal
        isOpen={allocateModalOpen}
        onClose={() => setAllocateModalOpen(false)}
        title="Allocate Tutor to Remedial Class"
        description={`Assign ${selectedTutor?.name} to manage attendance`}
      >
        <form onSubmit={handleAllocate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Scheduled Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_code} - {c.subject?.name} ({c.class_date})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
            <p className="font-semibold">Automated Workflow Notification:</p>
            <p className="mt-0.5 text-blue-800">
              Upon allocation, an SMS and email containing a secure tokenized attendance link will be dispatched directly to {selectedTutor?.phone}.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setAllocateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={allocating}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {allocating ? 'Allocating...' : 'Confirm Allocation & Send Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
