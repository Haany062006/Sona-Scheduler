'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Phone,
  Mail,
  Search,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Upload,
  Calendar,
  Layers,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Faculty, Department, Subject } from '@/types/database.types';

export default function FacultyPage() {
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Add Faculty Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [facName, setFacName] = useState('');
  const [facDept, setFacDept] = useState('');
  const [facYear, setFacYear] = useState('4th Year');
  const [facSection, setFacSection] = useState('A');
  const [facSelectedSubjectIds, setFacSelectedSubjectIds] = useState<string[]>([]);
  const [facEmail, setFacEmail] = useState('');
  const [facPhone, setFacPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Import Faculty Excel Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importTargetDept, setImportTargetDept] = useState('');
  const [importPreview, setImportPreview] = useState<
    {
      name: string;
      department_id: string;
      academic_year?: string | null;
      section?: string | null;
      email?: string | null;
      phone?: string | null;
      assigned_subject_codes?: string[];
      assigned_subject_ids?: string[];
    }[]
  >([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map Subject Modal
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedFacultyForMap, setSelectedFacultyForMap] = useState<Faculty | null>(null);
  const [targetSubjectId, setTargetSubjectId] = useState('');
  const [mappingSaving, setMappingSaving] = useState(false);

  // Edit Faculty Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editYear, setEditYear] = useState('4th Year');
  const [editSection, setEditSection] = useState('A');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSubjectIds, setEditSubjectIds] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Faculty Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingFaculty, setDeletingFaculty] = useState<Faculty | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openEditModal = (fac: Faculty) => {
    setEditingFaculty(fac);
    setEditName(fac.name);
    setEditDept(fac.department_id);
    setEditYear(fac.academic_year || '4th Year');
    setEditSection(fac.section || 'A');
    setEditEmail(fac.email || '');
    setEditPhone(fac.phone || '');
    setEditSubjectIds(fac.assigned_subjects?.map((s) => s.id) || []);
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleEditFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setEditSaving(true);
    setEditError(null);

    try {
      const res = await fetch('/api/faculty', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingFaculty.id,
          name: editName.trim(),
          department_id: editDept,
          academic_year: editYear,
          section: editSection,
          email: editEmail.trim() || null,
          phone: editPhone.trim() || null,
          assigned_subject_ids: editSubjectIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update faculty member.');

      setEditModalOpen(false);
      fetchFaculty();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const openDeleteModal = (fac: Faculty) => {
    setDeletingFaculty(fac);
    setDeleteModalOpen(true);
  };

  const handleDeleteFaculty = async () => {
    if (!deletingFaculty) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/faculty?id=${deletingFaculty.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete faculty.');

      setDeleteModalOpen(false);
      setDeletingFaculty(null);
      fetchFaculty();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUnmapSubject = async (facultyId: string, subjectId: string) => {
    if (!confirm('Are you sure you want to remove this subject from this faculty member?')) return;
    try {
      const res = await fetch(`/api/faculty/assign?faculty_id=${facultyId}&subject_id=${subjectId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unmap subject.');
      fetchFaculty();
    } catch (err: any) {
      alert(`Unmap error: ${err.message}`);
    }
  };

  const fetchFaculty = () => {
    const params = new URLSearchParams();
    if (selectedDept) params.set('department_id', selectedDept);
    if (selectedYear) params.set('academic_year', selectedYear);
    if (selectedSection) params.set('section', selectedSection);

    fetch(`/api/faculty?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setFacultyList(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        const depts = Array.isArray(data) ? data : [];
        setDepartments(depts);
        if (depts.length > 0) {
          setFacDept(depts[0].id);
          setImportTargetDept(depts[0].id);
        }
      });

    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => {
        const subs = Array.isArray(data) ? data : [];
        setSubjects(subs);
        if (subs.length > 0) setTargetSubjectId(subs[0].id);
      });
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [selectedDept, selectedYear, selectedSection]);

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: facName.trim(),
          department_id: facDept,
          academic_year: facYear,
          section: facSection,
          assigned_subject_ids: facSelectedSubjectIds,
          email: facEmail.trim() || undefined,
          phone: facPhone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFacName('');
      setFacEmail('');
      setFacPhone('');
      setFacSelectedSubjectIds([]);
      setAddModalOpen(false);
      fetchFaculty();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Excel file upload & parse for Faculty
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', raw: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { raw: false });

        if (data.length === 0) {
          setImportErrors(['Uploaded Excel worksheet appears empty.']);
          return;
        }

        const normalized: typeof importPreview = [];
        const errors: string[] = [];
        const seenNames = new Set<string>();

        data.forEach((row, idx) => {
          const keys = Object.keys(row);
          const nameKey = keys.find((k) => /name|faculty\s*name|professor/i.test(k));
          const deptKey = keys.find((k) => /dept|department/i.test(k));
          const yearKey = keys.find((k) => /year|academic\s*year/i.test(k));
          const secKey = keys.find((k) => /sec|section/i.test(k));
          const emailKey = keys.find((k) => /email|mail/i.test(k));
          const phoneKey = keys.find((k) => /phone|mobile|contact/i.test(k));
          const subjKey = keys.find((k) => /subject|assigned|courses/i.test(k));

          const rowName = nameKey ? String(row[nameKey]).trim() : '';

          if (!rowName || rowName.toUpperCase() === 'NAME') {
            return;
          }

          const dedupKey = `${rowName}_${secKey ? row[secKey] || '' : ''}`;
          if (seenNames.has(dedupKey)) {
            return;
          }
          seenNames.add(dedupKey);

          // Department resolution
          let deptId = importTargetDept;
          if (deptKey && row[deptKey]) {
            const rowDeptStr = String(row[deptKey]).trim().toUpperCase();
            const matchedDept = departments.find(
              (d) => d.code.toUpperCase() === rowDeptStr || d.name.toUpperCase().includes(rowDeptStr)
            );
            if (matchedDept) deptId = matchedDept.id;
          }

          // Assigned subjects
          let assignedCodes: string[] = [];
          if (subjKey && row[subjKey]) {
            assignedCodes = String(row[subjKey])
              .split(/[,;\s]+/)
              .map((s) => s.trim().toUpperCase())
              .filter((s) => s.length > 2);
          }

          normalized.push({
            name: rowName,
            department_id: deptId,
            academic_year: yearKey && row[yearKey] ? String(row[yearKey]).trim() : '4th Year',
            section: secKey && row[secKey] ? String(row[secKey]).trim().toUpperCase() : 'A',
            email: emailKey && row[emailKey] ? String(row[emailKey]).trim() : null,
            phone: phoneKey && row[phoneKey] ? String(row[phoneKey]).trim() : null,
            assigned_subject_codes: assignedCodes,
          });
        });

        setImportPreview(normalized);
        setImportErrors(errors);
        setImportModalOpen(true);
      } catch (err: any) {
        setImportErrors([`Failed to parse Excel file: ${err.message}`]);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const confirmFacultyImport = async () => {
    if (importPreview.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch('/api/faculty/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faculty: importPreview }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setImportModalOpen(false);
      setImportPreview([]);
      fetchFaculty();
      alert(`Imported ${data.importedCount} faculty members successfully.`);
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleMapSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyForMap || !targetSubjectId) return;

    setMappingSaving(true);
    try {
      const res = await fetch('/api/faculty/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faculty_id: selectedFacultyForMap.id,
          subject_id: targetSubjectId,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }

      setMapModalOpen(false);
      fetchFaculty();
    } catch (err: any) {
      alert(`Assignment error: ${err.message}`);
    } finally {
      setMappingSaving(false);
    }
  };

  const filteredFaculty = facultyList.filter((f) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchEmail = f.email && f.email.toLowerCase().includes(q);
      const matchSubj = (f.assigned_subjects || []).some(
        (s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
      if (!matchName && !matchEmail && !matchSubj) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Class Coordinators (CC) & Faculty Advisors</h1>
          <p className="text-xs text-slate-500 mt-1">
            Assign Class Coordinators class-wise (Academic Year, Department, and Section). Class Coordinators automatically receive instant SMS alerts whenever their class students are absent for remedial sessions conducted by Peer Tutors.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 font-semibold text-xs hover:bg-blue-100 transition cursor-pointer"
          >
            <Upload className="h-4 w-4 text-blue-700" />
            <span>Import Faculty Excel</span>
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-900 text-white font-semibold text-xs hover:bg-blue-800 transition shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Class Coordinator</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 shadow-xs">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty name or subject..."
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
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Academic Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="Both">Both Sections (A & B)</option>
          </select>
        </div>
      </div>

      {/* Faculty Cards Grid or Empty State */}
      {filteredFaculty.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-50 text-blue-900 mb-3">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Faculty Members Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Add faculty members and assign them class-wise to their respective year, section, and subjects.
          </p>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 text-white font-semibold text-xs hover:bg-blue-800 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Faculty Member</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFaculty.map((fac) => (
            <div
              key={fac.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{fac.name}</h3>
                    <p className="text-xs text-slate-500">{fac.department?.code || 'Department'} Class Coordinator</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-bold text-[11px] border border-emerald-200">
                    CC • {fac.academic_year || '4th Year'} Sec {fac.section || 'A'}
                  </span>
                </div>

                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">Notification Duty:</span> Receives automated SMS alerts when students of {fac.academic_year || '4th Year'} Sec {fac.section || 'A'} are absent from remedial classes.
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-mono text-[11px]">
                      {fac.email || <span className="text-slate-400 italic">No email provided</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{fac.phone || <span className="text-slate-400 italic">No phone provided</span>}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Assigned Subjects ({fac.assigned_subjects?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {fac.assigned_subjects && fac.assigned_subjects.length > 0 ? (
                      fac.assigned_subjects.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[10px] font-semibold border border-slate-200 group"
                          title={s.name}
                        >
                          <span>{s.code}</span>
                          <button
                            type="button"
                            onClick={() => handleUnmapSubject(fac.id, s.id)}
                            className="text-slate-400 hover:text-red-600 transition ml-0.5 font-bold cursor-pointer"
                            title={`Remove ${s.code}`}
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs italic">No subjects mapped yet</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Active
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(fac)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50 border border-slate-200 transition cursor-pointer"
                    title="Edit Faculty Member"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(fac)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 transition cursor-pointer"
                    title="Delete Faculty Member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFacultyForMap(fac);
                      setMapModalOpen(true);
                    }}
                    className="text-xs font-semibold text-blue-900 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Map Subject</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Faculty Excel Preview Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Faculty Roster from Excel"
        description="Review faculty records and class assignments before saving."
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-900">
                {importPreview.length} Faculty Members Ready to Import
              </p>
              <p className="text-[11px] text-slate-500">
                Class assignments (Year & Section) and assigned subjects will be mapped automatically.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                <tr>
                  <th className="px-3 py-2">Faculty Name</th>
                  <th className="px-3 py-2">Class Assignment</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Subjects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importPreview.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-bold text-slate-900">{item.name}</td>
                    <td className="px-3 py-2 text-blue-900 font-semibold">
                      {item.academic_year || '4th Year'} (Sec {item.section || 'A'})
                    </td>
                    <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">{item.email || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{item.phone || '—'}</td>
                    <td className="px-3 py-2">
                      {item.assigned_subject_codes && item.assigned_subject_codes.length > 0 ? (
                        <span className="font-mono text-[11px] text-blue-800 font-semibold">
                          {item.assigned_subject_codes.join(', ')}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setImportModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmFacultyImport}
              disabled={importing || importPreview.length === 0}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {importing ? 'Importing...' : `Confirm & Save ${importPreview.length} Faculty`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Single Faculty Modal (Class-Wise: No Faculty ID) */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Faculty Member"
        description="Register faculty with their assigned Department, Academic Year, and Section."
      >
        <form onSubmit={handleAddFaculty} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Name *</label>
            <input
              type="text"
              required
              value={facName}
              onChange={(e) => setFacName(e.target.value)}
              placeholder="e.g. Deepika J"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
              <select
                value={facDept}
                onChange={(e) => setFacDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year *</label>
              <select
                value={facYear}
                onChange={(e) => setFacYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section *</label>
              <select
                value={facSection}
                onChange={(e) => setFacSection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="Both">Both (A & B)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Remedial Subject</label>
            <select
              onChange={(e) => {
                const sId = e.target.value;
                if (sId && !facSelectedSubjectIds.includes(sId)) {
                  setFacSelectedSubjectIds([...facSelectedSubjectIds, sId]);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
            >
              <option value="">Choose subject to allocate...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} (Sem {s.semester_number || s.semester})
                </option>
              ))}
            </select>

            {facSelectedSubjectIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {facSelectedSubjectIds.map((sId) => {
                  const sub = subjects.find((s) => s.id === sId);
                  return (
                    <span
                      key={sId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 text-xs font-semibold border border-blue-200"
                    >
                      {sub?.code || sId}
                      <button
                        type="button"
                        onClick={() => setFacSelectedSubjectIds(facSelectedSubjectIds.filter((id) => id !== sId))}
                        className="text-blue-500 hover:text-red-600 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={facEmail}
                onChange={(e) => setFacEmail(e.target.value)}
                placeholder="deepika.j@sonatech.ac.in"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                value={facPhone}
                onChange={(e) => setFacPhone(e.target.value)}
                placeholder="9842101234"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {saving ? 'Registering...' : 'Save Faculty'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Map Subject Modal */}
      <Modal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        title={`Assign Subject to ${selectedFacultyForMap?.name}`}
        description="Link an active syllabus subject to this faculty member for remedial classes."
      >
        <form onSubmit={handleMapSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Subject</label>
            <select
              value={targetSubjectId}
              onChange={(e) => setTargetSubjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} (Semester {s.semester_number || s.semester})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setMapModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mappingSaving}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {mappingSaving ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Faculty Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Faculty — ${editingFaculty?.name}`}
        description="Update class-wise teaching allocation and contact details."
      >
        <form onSubmit={handleEditFaculty} className="space-y-4">
          {editError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Full Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Deepika J"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={editDept}
                onChange={(e) => setEditDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
              <select
                value={editYear}
                onChange={(e) => setEditYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
              <select
                value={editSection}
                onChange={(e) => setEditSection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="Both">Both Sections</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="deepika.j@sonatech.ac.in"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="9842101234"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Subjects ({editSubjectIds.length} selected)
            </label>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 divide-y divide-slate-100">
              {subjects.map((s) => {
                const isChecked = editSubjectIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-100/70 rounded-lg cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditSubjectIds([...editSubjectIds, s.id]);
                        } else {
                          setEditSubjectIds(editSubjectIds.filter((id) => id !== s.id));
                        }
                      }}
                      className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                    />
                    <span className="font-mono font-bold text-slate-800">{s.code}</span>
                    <span className="text-slate-600 truncate">{s.name}</span>
                    <span className="text-[10px] text-slate-400 ml-auto shrink-0">Sem {s.semester_number || s.semester}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSaving}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {editSaving ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Faculty Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Remove Faculty Member"
        description="Are you sure you want to delete this faculty member from the system?"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
            <p className="font-bold mb-1">Warning: Deleting Faculty Record</p>
            <p>
              You are about to remove <strong>{deletingFaculty?.name}</strong> ({deletingFaculty?.academic_year}, Sec {deletingFaculty?.section}). All teaching subject assignments for this professor will also be unmapped.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleDeleteFaculty}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {deleteLoading ? 'Removing...' : 'Yes, Remove Faculty'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
