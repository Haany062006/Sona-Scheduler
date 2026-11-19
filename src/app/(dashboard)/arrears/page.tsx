'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  FileText,
  Search,
  Filter,
  ArrowRight,
  Plus,
  FileUp,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { ArrearRecord, Department, Batch, Regulation, Subject, Student } from '@/types/database.types';

export default function ArrearsPage() {
  const [arrears, setArrears] = useState<ArrearRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [search, setSearch] = useState('');

  // Upload & Reconciliation state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState<'pdf' | 'text'>('pdf');
  const [uploadDept, setUploadDept] = useState('');
  const [uploadBatch, setUploadBatch] = useState('');
  const [uploadReg, setUploadReg] = useState('');
  const [regulationBatches, setRegulationBatches] = useState<any[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reconciliation review table
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<
    {
      id: string;
      register_number: string;
      subject_code: string;
      semester_number: number;
      student_matched: boolean;
      student_name?: string;
      subject_matched: boolean;
      subject_name?: string;
      status: 'ready' | 'unknown_student' | 'unknown_subject' | 'duplicate_active';
      message?: string;
      raw_line?: string;
    }[]
  >([]);
  const [committing, setCommitting] = useState(false);

  // Manual Add Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualRegNo, setManualRegNo] = useState('');
  const [manualSubjCode, setManualSubjCode] = useState('');
  const [manualBatchId, setManualBatchId] = useState('');
  const [manualSem, setManualSem] = useState('3');
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Quick batch creation
  const [showQuickBatch, setShowQuickBatch] = useState(false);
  const [quickBatchName, setQuickBatchName] = useState('');
  const [quickBatchCreating, setQuickBatchCreating] = useState(false);

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
          department_id: uploadDept || (departments[0]?.id ?? null),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create batch');
      }

      const newBatch = await res.json();
      setBatches((prev) => [...prev, newBatch]);
      setUploadBatch(newBatch.id);
      setManualBatchId(newBatch.id);
      setShowQuickBatch(false);
      setQuickBatchName('');
    } catch (err: any) {
      alert(`Could not create batch: ${err.message}`);
    } finally {
      setQuickBatchCreating(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchArrears = () => {
    const params = new URLSearchParams();
    if (selectedDept) params.set('department_id', selectedDept);
    if (selectedBatch) params.set('batch_id', selectedBatch);

    fetch(`/api/arrears?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setArrears(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data);
        if (data.length > 0) setUploadDept(data[0].id);
      });

    fetch('/api/regulations')
      .then((res) => res.json())
      .then((data) => {
        setRegulations(data.regulations || []);
        setBatches(data.batches || []);
        const rbs = data.regulationBatches || [];
        setRegulationBatches(rbs);
        if (data.batches?.length > 0) {
          const firstBatchId = data.batches[0].id;
          setUploadBatch(firstBatchId);
          setManualBatchId(firstBatchId);
          const matchedRb = rbs.find((rb: any) => rb.batch_id === firstBatchId);
          if (matchedRb) setUploadReg(matchedRb.regulation_id);
        } else if (data.regulations?.length > 0) {
          setUploadReg(data.regulations[0].id);
        }
      });

    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => {
        setSubjects(data);
        if (data.length > 0) setManualSubjCode(data[0].code);
      });

    fetch('/api/students')
      .then((res) => res.json())
      .then((data) => setStudents(data));
  }, []);

  useEffect(() => {
    fetchArrears();
  }, [selectedDept, selectedBatch]);

  // Handle parsing of Arrear PDF or Text extract
  const handleParseInput = async () => {
    setIsProcessing(true);

    try {
      if (uploadTab === 'pdf') {
        if (!pdfFile) {
          alert('Please select an arrear PDF file.');
          setIsProcessing(false);
          return;
        }

        const queryParams = new URLSearchParams({
          department_id: uploadDept,
          batch_id: uploadBatch,
          commit: 'false',
          filename: pdfFile.name,
        });

        const res = await fetch(`/api/arrears/upload-pdf?${queryParams.toString()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/pdf',
          },
          body: pdfFile,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to parse PDF.');

        const rows = (data.items || []).map((it: any) => ({
          id: it.id,
          register_number: it.register_number,
          subject_code: it.subject_code,
          semester_number: it.semester_number || 1,
          student_matched: it.status !== 'unknown_student',
          student_name: it.student_name,
          subject_matched: it.status !== 'unknown_subject',
          subject_name: it.subject_name,
          status: it.status,
          message: it.message,
          raw_line: it.raw_line,
        }));

        setParsedRows(rows);
        setUploadModalOpen(false);
        setReconciliationOpen(true);
      } else {
        // Text mode extraction
        if (!rawText.trim()) {
          alert('Please paste the arrear text extract.');
          setIsProcessing(false);
          return;
        }

        const lines = rawText.split('\n');
        const rows: typeof parsedRows = [];
        const regRegex = /\b(6178[0-9]{10}|2[0-9][A-Za-z0-9]{5,10}|[0-9]{11,14})\b/g;
        const subjRegex = /\b([UP]?[0-9]{2}[A-Za-z]{2,5}[0-9]{3,4}[A-Za-z]?|noc[0-9]{2}-[a-z0-9]+)\b/gi;

        lines.forEach((line, index) => {
          const regMatches = line.match(regRegex);
          const subjMatches = line.match(subjRegex);

          if (regMatches && regMatches.length > 0 && subjMatches && subjMatches.length > 0) {
            const reg = regMatches[0];
            const code = subjMatches[0].toUpperCase();

            const matchedStudent = students.find((s) => s.register_number === reg);
            const matchedSubject = subjects.find((s) => s.code.toUpperCase() === code);

            let status: 'ready' | 'unknown_student' | 'unknown_subject' | 'duplicate_active' = 'ready';
            let message = 'Ready to import';

            if (!matchedStudent) {
              status = 'unknown_student';
              message = 'Register number not found in student master';
            } else if (!matchedSubject) {
              status = 'unknown_subject';
              message = `Subject code ${code} not in active syllabus`;
            }

            rows.push({
              id: `extracted-${index}-${reg}`,
              register_number: reg,
              subject_code: code,
              semester_number: matchedSubject ? (matchedSubject.semester_number || (matchedSubject as any).semester || 1) : 1,
              student_matched: !!matchedStudent,
              student_name: matchedStudent?.name,
              subject_matched: !!matchedSubject,
              subject_name: matchedSubject?.name,
              status,
              message,
              raw_line: line,
            });
          }
        });

        if (rows.length === 0) {
          throw new Error('No valid register number and subject code pairs found in the pasted text.');
        }

        setParsedRows(rows);
        setUploadModalOpen(false);
        setReconciliationOpen(true);
      }
    } catch (err: any) {
      alert(`Parsing error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateParsedRow = (id: string, field: 'register_number' | 'subject_code', value: string) => {
    setParsedRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value.trim() };

        // Re-check matches
        const matchedStudent = students.find(
          (s) => s.register_number.toUpperCase() === updated.register_number.toUpperCase()
        );
        const matchedSubject = subjects.find(
          (s) => s.code.toUpperCase() === updated.subject_code.toUpperCase()
        );

        let status: 'ready' | 'unknown_student' | 'unknown_subject' | 'duplicate_active' = 'ready';
        let message = 'Ready to import';

        if (!matchedStudent) {
          status = 'unknown_student';
          message = 'Register number not found in master';
        } else if (!matchedSubject) {
          status = 'unknown_subject';
          message = 'Subject code not found in syllabus';
        }

        const semNum = matchedSubject ? (matchedSubject.semester_number || (matchedSubject as any).semester || 1) : 1;

        return {
          ...updated,
          semester_number: semNum,
          student_matched: !!matchedStudent,
          student_name: matchedStudent?.name,
          subject_matched: !!matchedSubject,
          subject_name: matchedSubject?.name,
          status,
          message,
        };
      })
    );
  };

  const handleRemoveParsedRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCommitReconciliation = async () => {
    setCommitting(true);
    try {
      const validRecords = parsedRows
        .filter((r) => r.status !== 'duplicate_active')
        .map((r) => ({
          register_number: r.register_number,
          student_name: r.student_name,
          subject_code: r.subject_code,
          batch_id: uploadBatch,
          semester_number: r.semester_number,
        }));

      if (validRecords.length === 0) {
        alert('No valid records available to commit.');
        setCommitting(false);
        return;
      }

      const res = await fetch('/api/arrears', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: validRecords,
          auto_create_missing: true,
          department_id: uploadDept,
          batch_id: uploadBatch,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReconciliationOpen(false);
      fetchArrears();
      alert(`Successfully committed ${data.added?.length || validRecords.length} arrear records.`);
    } catch (err: any) {
      alert(`Commit error: ${err.message}`);
    } finally {
      setCommitting(false);
    }
  };

  const handleManualAddArrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSaving(true);
    setManualError(null);

    try {
      const res = await fetch('/api/arrears', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: [
            {
              register_number: manualRegNo.trim(),
              subject_code: manualSubjCode.trim(),
              batch_id: manualBatchId,
              semester_number: Number(manualSem),
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setManualModalOpen(false);
      setManualRegNo('');
      fetchArrears();
    } catch (err: any) {
      setManualError(err.message);
    } finally {
      setManualSaving(false);
    }
  };

  const filteredArrears = arrears.filter((a) => {
    const matchesSearch =
      search === '' ||
      a.student?.name.toLowerCase().includes(search.toLowerCase()) ||
      a.student?.register_number.toLowerCase().includes(search.toLowerCase()) ||
      a.subject?.code.toLowerCase().includes(search.toLowerCase()) ||
      a.subject?.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Arrear Data Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile COE published arrear lists with Student & Syllabus Masters. Zero silent discards.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setManualModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Single Arrear Entry</span>
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition"
          >
            <Upload className="h-4 w-4" />
            <span>Import Arrears (PDF/Text)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, reg no or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Departments (ADS, IT)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                Batch {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredArrears.length}</span> active arrear records
        </div>
      </div>

      {/* Arrears List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading arrear database records...</div>
        ) : filteredArrears.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-4">
            <FileSpreadsheet className="h-10 w-10 text-slate-300 mx-auto" />
            <div>
              <p className="text-sm font-bold text-slate-800">No Arrear Records Found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Upload an autonomous examination result PDF or paste raw COE results to populate arrear backlogs.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>Import Arrears (PDF/Text)</span>
              </button>
              <button
                onClick={() => setManualModalOpen(true)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Single Arrear Entry</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Dept / Sec</th>
                  <th className="py-3 px-4">Subject Code & Name</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Arrear Status</th>
                  <th className="py-3 px-4">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArrears.map((arrear) => (
                  <tr key={arrear.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">
                      {arrear.student?.register_number || '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {arrear.student?.name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {arrear.student?.department?.code || '—'} • Sec {arrear.student?.section || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{arrear.subject?.code}</div>
                      <div className="text-[11px] text-slate-500">{arrear.subject?.name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">Sem {arrear.subject?.semester_number || arrear.subject?.semester || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={arrear.status === 'active' ? 'amber' : 'green'}>
                        {arrear.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">
                      {arrear.source_file || 'Manual Entry'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal (PDF + Text) */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Import Arrear Records"
        description="Extract arrears from COE Result PDF or raw text stream with automatic entity reconciliation."
      >
        <div className="space-y-4">
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setUploadTab('pdf')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                uploadTab === 'pdf'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Upload PDF File
            </button>
            <button
              type="button"
              onClick={() => setUploadTab('text')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                uploadTab === 'text'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Paste Text / OCR Stream
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Department</label>
              <select
                value={uploadDept}
                onChange={(e) => setUploadDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Target Batch</label>
                <button
                  type="button"
                  onClick={() => setShowQuickBatch(!showQuickBatch)}
                  className="text-[11px] font-bold text-blue-800 hover:text-blue-900 flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>{showQuickBatch ? 'Select List' : '+ New Batch'}</span>
                </button>
              </div>

              {!showQuickBatch && batches.length > 0 ? (
                <select
                  value={uploadBatch}
                  onChange={(e) => {
                    const bId = e.target.value;
                    setUploadBatch(bId);
                    const matchedRb = regulationBatches.find((rb: any) => rb.batch_id === bId);
                    if (matchedRb) setUploadReg(matchedRb.regulation_id);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="">-- Select Target Batch --</option>
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
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
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
                  <p className="text-[10px] text-slate-500">
                    Type batch (e.g. 2022-2026) to create and select it immediately.
                  </p>
                </div>
              )}
            </div>
          </div>

          {uploadTab === 'pdf' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select COE Result PDF File</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-800 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/30"
              >
                <FileUp className="h-8 w-8 text-blue-900 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">
                  {pdfFile ? pdfFile.name : 'Click to browse or drop result publication PDF'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Supports multi-page COE exam PDFs</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setPdfFile(e.target.files[0]);
                  }}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Arrear PDF Text Extract / Raw Examination Output
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste raw text lines... e.g.&#10;21AD001 21MA301 RA&#10;21AD002 21MA301 U&#10;21IT101 21IT301 RA"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleParseInput}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {isProcessing ? 'Analyzing Document...' : 'Parse & Reconcile'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reconciliation Table Modal with Manual Edits */}
      <Modal
        isOpen={reconciliationOpen}
        onClose={() => setReconciliationOpen(false)}
        title="Extraction Reconciliation & Verification"
        description="Review, correct and verify register numbers and course codes before final commit (Zero silent discard policy)."
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900">
            <div>
              <span className="font-bold">Total: {parsedRows.length}</span> •{' '}
              <span className="text-emerald-700 font-bold">
                Ready: {parsedRows.filter((r) => r.status === 'ready').length}
              </span>{' '}
              •{' '}
              <span className="text-amber-700 font-bold">
                Unresolved: {parsedRows.filter((r) => r.status !== 'ready').length}
              </span>
            </div>
            <span className="text-[11px] text-blue-700 font-medium">
              You can edit register numbers or subject codes directly below.
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Register No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Semester</th>
                  <th className="py-2.5 px-3">Subject Code</th>
                  <th className="py-2.5 px-3">Subject Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {parsedRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition ${
                      row.status === 'ready'
                        ? 'hover:bg-slate-50'
                        : row.status === 'duplicate_active'
                        ? 'bg-rose-50/50'
                        : 'bg-amber-50/50'
                    }`}
                  >
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.register_number}
                        onChange={(e) => handleUpdateParsedRow(row.id, 'register_number', e.target.value)}
                        className="w-32 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold font-mono focus:border-blue-900 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <span className="text-slate-900 font-semibold">{row.student_name || '—'}</span>
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[11px]">
                        Sem {row.semester_number || 1}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.subject_code}
                        onChange={(e) => handleUpdateParsedRow(row.id, 'subject_code', e.target.value)}
                        className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold font-mono focus:border-blue-900 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-600 truncate max-w-[180px]">
                      {row.subject_name || '—'}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <Badge
                        variant={
                          row.status === 'ready'
                            ? 'green'
                            : row.status === 'duplicate_active'
                            ? 'red'
                            : 'amber'
                        }
                      >
                        {row.status === 'ready'
                          ? 'READY'
                          : row.status === 'duplicate_active'
                          ? 'DUPLICATE'
                          : 'AUTO-CREATE'}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => handleRemoveParsedRow(row.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                      >
                        Discard
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReconciliationOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCommitReconciliation}
              disabled={committing || parsedRows.filter((r) => r.status !== 'duplicate_active').length === 0}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {committing
                ? 'Committing...'
                : `Commit ${parsedRows.filter((r) => r.status !== 'duplicate_active').length} Arrears`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Manual Single Entry Modal */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Add Single Arrear Record"
        description="Register a verified student arrear record manually."
      >
        <form onSubmit={handleManualAddArrear} className="space-y-4">
          {manualError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {manualError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Student Register Number</label>
            <input
              type="text"
              required
              value={manualRegNo}
              onChange={(e) => setManualRegNo(e.target.value)}
              placeholder="e.g. 21AD001 or 617721104001"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code</label>
            <select
              value={manualSubjCode}
              onChange={(e) => setManualSubjCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.code} - {s.name} (Sem {s.semester_number || s.semester || '—'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Batch</label>
                <button
                  type="button"
                  onClick={() => setShowQuickBatch(!showQuickBatch)}
                  className="text-[11px] font-semibold text-blue-900 hover:underline"
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
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-blue-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleQuickCreateBatch}
                    disabled={quickBatchCreating || !quickBatchName.trim()}
                    className="px-2.5 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
                  >
                    {quickBatchCreating ? '...' : 'Add'}
                  </button>
                </div>
              )}
              <select
                value={manualBatchId}
                onChange={(e) => setManualBatchId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    Batch {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
              <select
                value={manualSem}
                onChange={(e) => setManualSem(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setManualModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={manualSaving}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {manualSaving ? 'Saving...' : 'Register Arrear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
