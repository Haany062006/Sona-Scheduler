'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Users,
  Upload,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Download,
  Pencil,
  Trash2,
  Trash,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Student, Department, Batch } from '@/types/database.types';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Manual Add Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [manualDept, setManualDept] = useState('');
  const [manualBatch, setManualBatch] = useState('');
  const [manualSection, setManualSection] = useState('A');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [savingManual, setSavingManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Edit Student Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editRegNo, setEditRegNo] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editSection, setEditSection] = useState('A');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Student Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((s) => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const openEditStudent = (s: Student) => {
    setEditingStudent(s);
    setEditName(s.name);
    setEditRegNo(s.register_number);
    setEditDept(s.department_id);
    setEditBatch(s.batch_id);
    setEditSection(s.section || 'A');
    setEditEmail(s.email || '');
    setEditPhone(s.phone || '');
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStudent.id,
          name: editName.trim(),
          register_number: editRegNo.trim(),
          department_id: editDept,
          batch_id: editBatch,
          section: editSection,
          email: editEmail.trim() || null,
          phone: editPhone.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update student.');

      setEditModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const openDeleteStudent = (s: Student) => {
    setDeletingStudent(s);
    setDeleteModalOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/students?id=${deletingStudent.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete student.');

      setDeleteModalOpen(false);
      setDeletingStudent(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deletingStudent.id));
      fetchStudents();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete students.');

      setBulkDeleteModalOpen(false);
      setSelectedIds([]);
      fetchStudents();
    } catch (err: any) {
      alert(`Bulk delete error: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Excel Import Preview Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importTargetDept, setImportTargetDept] = useState('');
  const [importTargetBatch, setImportTargetBatch] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [showQuickBatch, setShowQuickBatch] = useState(false);
  const [quickBatchName, setQuickBatchName] = useState('');
  const [quickBatchCreating, setQuickBatchCreating] = useState(false);
  const [detectedBatchNotice, setDetectedBatchNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQuickCreateBatch = async () => {
    if (!quickBatchName.trim()) return;
    setQuickBatchCreating(true);
    try {
      const parts = quickBatchName.trim().split('-');
      const startYear = parseInt(parts[0], 10) || new Date().getFullYear();
      const endYear = parts[1] ? parseInt(parts[1], 10) : startYear + 4;

      const res = await fetch('/api/regulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'batch',
          name: quickBatchName.trim(),
          start_year: startYear,
          end_year: endYear,
          department_id: importTargetDept || (departments[0]?.id ?? null),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create batch');
      }

      const newBatch = await res.json();
      setBatches((prev) => [...prev, newBatch]);
      setImportTargetBatch(newBatch.id);
      setManualBatch(newBatch.id);
      setShowQuickBatch(false);
      setQuickBatchName('');
      setDetectedBatchNotice(`Batch "${newBatch.name}" created and selected successfully.`);
    } catch (err: any) {
      alert(`Could not create batch: ${err.message}`);
    } finally {
      setQuickBatchCreating(false);
    }
  };

  const fetchStudents = () => {
    const params = new URLSearchParams();
    if (selectedDept) params.set('department_id', selectedDept);
    if (selectedBatch) params.set('batch_id', selectedBatch);
    if (selectedSection) params.set('section', selectedSection);
    if (search) params.set('search', search);

    fetch(`/api/students?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data);
        if (data.length > 0) {
          setManualDept(data[0].id);
          setImportTargetDept(data[0].id);
        }
      });

    fetch('/api/regulations')
      .then((res) => res.json())
      .then((data) => {
        setBatches(data.batches);
        if (data.batches?.length > 0) {
          setManualBatch(data.batches[0].id);
          setImportTargetBatch(data.batches[0].id);
        }
      });
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedDept, selectedBatch, selectedSection, search]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingManual(true);
    setManualError(null);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          register_number: regNo,
          name,
          department_id: manualDept,
          batch_id: manualBatch,
          section: manualSection,
          email: manualEmail,
          phone: manualPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setName('');
      setRegNo('');
      setManualEmail('');
      setManualPhone('');
      setAddModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      setManualError(err.message);
    } finally {
      setSavingManual(false);
    }
  };

  // Excel File Upload & Parse
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
        // Parse rows as raw strings to strictly preserve leading zeros in register numbers
        const data: any[] = XLSX.utils.sheet_to_json(ws, { raw: false });

        if (data.length === 0) {
          setImportErrors(['Uploaded Excel worksheet appears empty.']);
          return;
        }

        const normalized: any[] = [];
        const errors: string[] = [];
        const seenRegs = new Set<string>();

        data.forEach((row, idx) => {
          // Normalize column names
          const keys = Object.keys(row);
          const nameKey = keys.find((k) => /name|student\s*name/i.test(k));
          const regKey = keys.find((k) => /reg|register|roll/i.test(k));
          const secKey = keys.find((k) => /sec|section/i.test(k));

          const rowName = nameKey ? String(row[nameKey]).trim() : '';
          const rowReg = regKey ? String(row[regKey]).trim() : '';
          const rowSec = secKey ? String(row[secKey]).trim().toUpperCase() : 'A';

          // Strictly ignore and skip question-breakdown rows, empty rows, marks, totals, and repeated headers
          if (!rowName || !rowReg) {
            return;
          }
          if (rowName.toUpperCase() === 'NAME' || rowReg.toUpperCase() === 'REG NO') {
            return;
          }

          // Avoid duplicate rows for the same student without generating errors
          if (seenRegs.has(rowReg)) {
            return;
          }
          seenRegs.add(rowReg);

          normalized.push({
            name: rowName,
            register_number: rowReg,
            section: rowSec,
            email: row.Email || row.email || null,
            phone: row.Phone || row.phone || null,
          });
        });

        setImportPreview(normalized);
        setImportErrors(errors);

        // Auto-detect batch and department from Excel columns if available
        let detectedBatch: string | null = null;
        let detectedDept: string | null = null;

        for (const row of data) {
          const keys = Object.keys(row);
          if (!detectedBatch) {
            const bKey = keys.find((k) => /batch|academic\s*year/i.test(k));
            if (bKey && row[bKey]) detectedBatch = String(row[bKey]).trim();
          }
          if (!detectedDept) {
            const dKey = keys.find((k) => /branch|dept|department/i.test(k));
            if (dKey && row[dKey]) detectedDept = String(row[dKey]).trim().toUpperCase();
          }
          if (detectedBatch && detectedDept) break;
        }

        if (detectedDept && departments.length > 0) {
          const matchedDept = departments.find(
            (d) => d.code.toUpperCase() === detectedDept || d.name.toUpperCase().includes(detectedDept!)
          );
          if (matchedDept) setImportTargetDept(matchedDept.id);
        }

        if (detectedBatch) {
          const matchedBatch = batches.find((b) => b.name.toLowerCase() === detectedBatch!.toLowerCase());
          if (matchedBatch) {
            setImportTargetBatch(matchedBatch.id);
            setDetectedBatchNotice(`Auto-detected batch "${matchedBatch.name}" from Excel.`);
          } else {
            setQuickBatchName(detectedBatch);
            setShowQuickBatch(true);
            setDetectedBatchNotice(`Detected batch "${detectedBatch}" from Excel. Click "Create Batch" below to register.`);
          }
        } else {
          setDetectedBatchNotice(null);
        }

        setImportModalOpen(true);
      } catch (err: any) {
        setImportErrors([`Failed to parse Excel file: ${err.message}`]);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!importTargetDept || !importTargetBatch) {
      alert('Please specify the target Department and Academic Batch.');
      return;
    }

    setImporting(true);
    try {
      const payload = importPreview.map((item) => ({
        ...item,
        department_id: importTargetDept,
        batch_id: importTargetBatch,
      }));

      const res = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setImportModalOpen(false);
      setImportPreview([]);
      fetchStudents();
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Download Sample Excel Template
  const downloadSampleExcel = () => {
    const sampleData = [
      {
        'Student Name': 'Aravind Kumar R',
        'Register Number': '612722104001',
        Department: 'ADS',
        Section: 'A',
        Batch: '2022-2026',
        Email: 'aravind.22ads@sonatech.ac.in',
        Phone: '+919842100001',
      },
      {
        'Student Name': 'Bhavani Shankar S',
        'Register Number': '612722104002',
        Department: 'ADS',
        Section: 'B',
        Batch: '2022-2026',
        Email: 'bhavani.22ads@sonatech.ac.in',
        Phone: '+919842100002',
      },
      {
        'Student Name': 'Dinesh Karthik M',
        'Register Number': '612722104065',
        Department: 'ADS',
        Section: 'C',
        Batch: '2022-2026',
        Email: 'dinesh.22ads@sonatech.ac.in',
        Phone: '+919842100003',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'ADS_Student_Details_Template.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Master Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Department-wise student roster supporting all sections (A, B, C) in a single unified master.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <a
              href="/samples/ADS_Student_Details.xlsx"
              download
              className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
              title="Download ADS Template with sections A, B, C"
            >
              <Download className="h-3.5 w-3.5 text-blue-700" />
              <span>ADS Sample</span>
            </a>
            <a
              href="/samples/IT_Student_Details.xlsx"
              download
              className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
              title="Download IT Template"
            >
              <Download className="h-3.5 w-3.5 text-blue-700" />
              <span>IT Sample</span>
            </a>
          </div>
          <label className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer">
            <Upload className="h-4 w-4 text-blue-700" />
            <span>Import Excel</span>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-900 text-white font-semibold text-xs hover:bg-blue-800 transition flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or Register No..."
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
            <option value="C">Section C</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-900">
              {selectedIds.length} {selectedIds.length === 1 ? 'student' : 'students'} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-blue-700 hover:underline cursor-pointer"
            >
              Clear selection
            </button>
          </div>
          <button
            onClick={() => setBulkDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Selected ({selectedIds.length})</span>
          </button>
        </div>
      )}

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="w-10 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === students.length && students.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3.5">Register Number</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Dept</th>
                <th className="px-6 py-3.5">Batch</th>
                <th className="px-6 py-3.5">Section</th>
                <th className="px-6 py-3.5">Contact Info</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length > 0 ? (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => toggleSelectStudent(s.id)}
                        className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-900 text-sm">
                      {s.register_number}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{s.name}</td>
                    <td className="px-6 py-4">
                      <Badge variant="blue" size="sm">
                        {s.department?.code}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{s.batch?.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-800 border border-slate-200">
                        Sec {s.section}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 space-y-0.5">
                      {s.email && <div className="text-[11px] font-mono">{s.email}</div>}
                      {s.phone && <div className="text-[11px]">{s.phone}</div>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditStudent(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50 border border-slate-200 transition cursor-pointer"
                          title="Edit Student Record"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteStudent(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 transition cursor-pointer"
                          title="Delete Student"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Users className="h-10 w-10 text-slate-300" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">No Students Found</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                          Upload your department student Excel roster (all sections A, B, C in 1 worksheet) to populate student records.
                        </p>
                      </div>
                      <div className="flex justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Upload Student Excel</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddModalOpen(true)}
                          className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Student Manually</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium">
          Showing {students.length} student records
        </div>
      </div>

      {/* Manual Add Student Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Student Manually"
        description="Ensure register number preserves leading zeros"
      >
        <form onSubmit={handleManualAdd} className="space-y-4">
          {manualError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{manualError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Register Number (Text)
              </label>
              <input
                type="text"
                required
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="e.g. 612722104001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
              <select
                value={manualSection}
                onChange={(e) => setManualSection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Student Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aravind Kumar R"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={manualDept}
                onChange={(e) => setManualDept(e.target.value)}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Batch</label>
                <button
                  type="button"
                  onClick={() => setShowQuickBatch(!showQuickBatch)}
                  className="text-[11px] font-bold text-blue-800 hover:text-blue-900 cursor-pointer"
                >
                  {showQuickBatch ? 'Cancel' : '+ New Batch'}
                </button>
              </div>
              {showQuickBatch && (
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. 2022-2026"
                    value={quickBatchName}
                    onChange={(e) => setQuickBatchName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                  <button
                    type="button"
                    disabled={quickBatchCreating || !quickBatchName.trim()}
                    onClick={handleQuickCreateBatch}
                    className="px-3 py-1.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                  >
                    {quickBatchCreating ? '...' : 'Add'}
                  </button>
                </div>
              )}
              <select
                value={manualBatch}
                onChange={(e) => setManualBatch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="student@sonatech.ac.in"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                placeholder="+91..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
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
              disabled={savingManual}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {savingManual ? 'Saving...' : 'Save Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Excel Import Preview Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Excel Roster Import & Pre-Validation"
        description="Verify extracted records across all sections before final database commit"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {importErrors.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4" />
                <span>Warnings & Discrepancies ({importErrors.length})</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 max-h-24 overflow-y-auto">
                {importErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Department
              </label>
              <select
                value={importTargetDept}
                onChange={(e) => setImportTargetDept(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Target Academic Batch
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickBatch(!showQuickBatch)}
                  className="text-[11px] font-bold text-blue-800 hover:text-blue-900 flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>{showQuickBatch ? 'Select List' : '+ New Batch'}</span>
                </button>
              </div>

              {detectedBatchNotice && (
                <div className="mb-2 p-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 font-medium">
                  {detectedBatchNotice}
                </div>
              )}

              {!showQuickBatch && batches.length > 0 ? (
                <select
                  value={importTargetBatch}
                  onChange={(e) => setImportTargetBatch(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="">-- Select Academic Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      Batch {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. 2022-2026"
                      value={quickBatchName}
                      onChange={(e) => setQuickBatchName(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                    <button
                      type="button"
                      disabled={quickBatchCreating || !quickBatchName.trim()}
                      onClick={handleQuickCreateBatch}
                      className="px-3 py-1.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                    >
                      {quickBatchCreating ? '...' : 'Add Batch'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Type batch name (e.g. 2022-2026) to add it instantly to database.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                <tr>
                  <th className="px-4 py-2">Reg Number</th>
                  <th className="px-4 py-2">Student Name</th>
                  <th className="px-4 py-2">Section</th>
                  <th className="px-4 py-2">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importPreview.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono font-bold text-blue-900">
                      {row.register_number}
                    </td>
                    <td className="px-4 py-2 font-semibold text-slate-900">{row.name}</td>
                    <td className="px-4 py-2 font-bold text-slate-700">Sec {row.section}</td>
                    <td className="px-4 py-2 text-slate-500 text-[11px]">
                      {row.email || row.phone || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              Ready to commit {importPreview.length} records into database
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmImport}
                disabled={importing || importPreview.length === 0}
                className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
              >
                {importing ? 'Committing...' : `Commit & Import (${importPreview.length})`}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Student — ${editingStudent?.name}`}
        description="Update student academic allocation and contact details."
      >
        <form onSubmit={handleEditStudent} className="space-y-4">
          {editError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{editError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Register Number (Text)
              </label>
              <input
                type="text"
                required
                value={editRegNo}
                onChange={(e) => setEditRegNo(e.target.value)}
                placeholder="e.g. 61782323110001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
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
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Student Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Aravind Kumar R"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={editDept}
                onChange={(e) => setEditDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch</label>
              <select
                value={editBatch}
                onChange={(e) => setEditBatch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="student@sonatech.ac.in"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="9842100000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
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
              disabled={savingEdit}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {savingEdit ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Single Student Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Student Record"
        description="Are you sure you want to remove this student?"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
            <p className="font-bold mb-1">Warning: Deleting Student</p>
            <p>
              You are removing <strong>{deletingStudent?.name}</strong> (Reg: <code className="font-mono font-bold">{deletingStudent?.register_number}</code>, Section {deletingStudent?.section}). Any active arrear records or remedial enrollments for this student will also be removed.
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
              onClick={handleDeleteStudent}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {deleteLoading ? 'Deleting...' : 'Yes, Delete Student'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Students Confirmation Modal */}
      <Modal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        title={`Bulk Delete ${selectedIds.length} Students`}
        description="Permanently remove selected students from the database."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
            <p className="font-bold mb-1">Caution: Permanent Mass Deletion</p>
            <p>
              You have selected <strong>{selectedIds.length} students</strong>. Deleting them will remove their master records, active arrear records, and class registrations.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleBulkDelete}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {deleteLoading ? 'Deleting...' : `Confirm Delete (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
