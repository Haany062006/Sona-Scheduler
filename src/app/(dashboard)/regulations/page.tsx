'use client';

import React, { useEffect, useState, useRef } from 'react';
import { BookOpen, Plus, Layers, Check, AlertCircle, FileText, Upload, Sparkles, FileUp, Calendar } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Regulation, Batch, Subject, Department } from '@/types/database.types';

export default function RegulationsPage() {
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [regulationBatches, setRegulationBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedRegulation, setSelectedRegulation] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'regulations' | 'subjects'>('subjects');

  // Modals
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [syllabusUploadOpen, setSyllabusUploadOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'pdf' | 'text'>('pdf');
  const [syllabusPdfFile, setSyllabusPdfFile] = useState<File | null>(null);

  // Form states - Regulation
  const [regCode, setRegCode] = useState('');
  const [regYear, setRegYear] = useState('2021');
  const [regDesc, setRegDesc] = useState('');

  // Form states - Batch
  const [batchName, setBatchName] = useState('');
  const [batchStartYear, setBatchStartYear] = useState('2021');
  const [batchEndYear, setBatchEndYear] = useState('2025');
  const [batchMappedRegId, setBatchMappedRegId] = useState('');
  const [batchDeptId, setBatchDeptId] = useState('');

  // Form states - Subject
  const [subjCode, setSubjCode] = useState('');
  const [subjName, setSubjName] = useState('');
  const [subjSem, setSubjSem] = useState('1');
  const [subjCredits, setSubjCredits] = useState('3');
  const [subjIsCommon, setSubjIsCommon] = useState(false);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);

  // Syllabus Extract states
  const [syllabusDept, setSyllabusDept] = useState('');
  const [syllabusTargetReg, setSyllabusTargetReg] = useState('');
  const [manualRegCode, setManualRegCode] = useState('R2021');
  const [singleSubjRegCode, setSingleSubjRegCode] = useState('R2021');
  const [syllabusRaw, setSyllabusRaw] = useState('');
  const [extractedSubjects, setExtractedSubjects] = useState<
    { code: string; name: string; semester: number; credits: number; is_common: boolean; is_existing?: boolean }[]
  >([]);
  const [syllabusStep, setSyllabusStep] = useState<'input' | 'preview'>('input');
  const [extracting, setExtracting] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = () => {
    fetch('/api/regulations')
      .then((res) => res.json())
      .then((data) => {
        setRegulations(data.regulations || []);
        setBatches(data.batches || []);
        setRegulationBatches(data.regulationBatches || []);
        if (data.regulations?.length > 0) {
          if (!selectedRegulation) setSelectedRegulation(data.regulations[0].id);
          if (!syllabusTargetReg) setSyllabusTargetReg(data.regulations[0].id);
          if (!manualRegCode) setManualRegCode(data.regulations[0].code);
          if (!singleSubjRegCode) setSingleSubjRegCode(data.regulations[0].code);
          setBatchMappedRegId(data.regulations[0].id);
        }
      });

    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        setDepartments(Array.isArray(data) ? data : []);
        if (data.length > 0) {
          if (selectedDeptIds.length === 0) setSelectedDeptIds([data[0].id]);
          if (!syllabusDept) setSyllabusDept(data[0].id);
          if (!batchDeptId) setBatchDeptId(data[0].id);
        }
      });

    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => setSubjects(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRegulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/regulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'regulation',
          code: regCode.trim().toUpperCase(),
          start_year: Number(regYear),
          description: regDesc.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRegCode('');
      setRegDesc('');
      setRegModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/regulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'batch',
          name: batchName.trim(),
          start_year: Number(batchStartYear),
          end_year: Number(batchEndYear),
          regulation_id: batchMappedRegId || selectedRegulation,
          department_id: batchDeptId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBatchName('');
      setBatchModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let targetRegId = selectedRegulation;
      const cleanReg = singleSubjRegCode.trim().toUpperCase();
      if (cleanReg) {
        const found = regulations.find((r) => r.code.toUpperCase() === cleanReg);
        if (found) {
          targetRegId = found.id;
        } else {
          const yearMatch = cleanReg.match(/\d{4}/);
          const sYear = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();
          const createRes = await fetch('/api/regulations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'regulation',
              code: cleanReg,
              start_year: sYear,
              description: `Curriculum Regulation ${cleanReg}`,
            }),
          });
          const createdReg = await createRes.json();
          targetRegId = createdReg.id;
        }
      }

      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: subjCode.trim().toUpperCase(),
          name: subjName.trim(),
          regulation_id: targetRegId,
          semester_number: Number(subjSem),
          credits: Number(subjCredits),
          department_ids: subjIsCommon ? [] : selectedDeptIds,
          is_common: subjIsCommon,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSubjCode('');
      setSubjName('');
      setSubjectModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleParseSyllabus = async () => {
    setExtracting(true);
    setError(null);

    try {
      const cleanReg = manualRegCode.trim().toUpperCase();
      if (!cleanReg) {
        alert('Please enter an Academic Regulation code (e.g. R2021).');
        setExtracting(false);
        return;
      }

      if (uploadMode === 'pdf') {
        if (!syllabusPdfFile) {
          alert('Please select a syllabus PDF file to upload.');
          setExtracting(false);
          return;
        }

        const queryParams = new URLSearchParams({
          regulation_code: cleanReg,
          department_id: syllabusDept,
          commit: 'false',
          filename: syllabusPdfFile.name,
        });

        const res = await fetch(`/api/regulations/upload-syllabus?${queryParams.toString()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/pdf',
          },
          body: syllabusPdfFile,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to extract syllabus from PDF.');

        if (data.regulation_id) {
          setSyllabusTargetReg(data.regulation_id);
        }

        const parsed = (data.subjects || []).map((s: any) => ({
          code: s.code,
          name: s.name,
          semester: Number(s.semester || s.semester_number || 1),
          credits: Number(s.credits || 3),
          is_common: Boolean(s.is_common),
          is_existing: Boolean(s.is_existing),
        }));

        setExtractedSubjects(parsed);
        setSyllabusStep('preview');
      } else {
        // Text mode extraction
        if (!syllabusRaw.trim()) {
          alert('Please paste syllabus curriculum text.');
          setExtracting(false);
          return;
        }

        const lines = syllabusRaw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
        const parsed: typeof extractedSubjects = [];
        const codeRegex = /\b([UP]?[0-9]{2}[A-Za-z]{2,5}[0-9]{3,4}[A-Za-z]?|noc[0-9]{2}-[a-z0-9]+)\b/i;
        const semHeadingRegex = /(?:CURRICULUM\s+(?:AND\s+SYLLABUS\s+)?(?:FOR\s+)?)?(?:SEMESTER|SEM|Sem[øo]ter)\s*[-–—:]?\s*([0-9]|I|II|III|IV|V|VI|VII|VIII)\b/i;
        const codeSemDigitRegex = /^[UP]?[0-9]{2}[A-Z]{2,5}([1-8])[0-9]{2}/i;

        const romanToNum: Record<string, number> = {
          I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8,
          '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
        };

        let currentSem = 1;
        let seenHeader = false;

        lines.forEach((line) => {
          const semMatch = line.match(semHeadingRegex);
          if (semMatch && romanToNum[semMatch[1].toUpperCase()]) {
            currentSem = romanToNum[semMatch[1].toUpperCase()];
            seenHeader = true;
          }

          const match = line.match(codeRegex);
          if (match) {
            const code = match[1].toUpperCase();
            let subjectSem = currentSem;
            const digitMatch = code.match(codeSemDigitRegex);
            if (digitMatch && !seenHeader) {
              const d = parseInt(digitMatch[1] || digitMatch[2], 10);
              if (d >= 1 && d <= 8) subjectSem = d;
            }

            const afterCode = line.substring(line.indexOf(code) + code.length).trim();
            const name = afterCode
              .replace(/[0-9]+(\.[0-9]+)?\s+[0-9]+(\.[0-9]+)?\s+[0-9]+(\.[0-9]+)?\s+[0-9]+(\.[0-9]+)?/g, '')
              .replace(/\b[0-9]\s+[0-9]\s+[0-9]\b/g, '')
              .replace(/\b[0-9](\.[0-9])?\s*$/g, '')
              .trim() || `Course ${code}`;

            parsed.push({
              code,
              name,
              semester: subjectSem,
              credits: 3,
              is_common:
                code.includes('MA') ||
                code.includes('GE') ||
                code.includes('PH') ||
                code.includes('CY') ||
                code.includes('CH') ||
                code.includes('HS'),
              is_existing: subjects.some((s) => s.code.toUpperCase() === code),
            });
          }
        });

        if (parsed.length === 0) {
          throw new Error('No valid course codes were found in the pasted text.');
        }

        setExtractedSubjects(parsed);
        setSyllabusStep('preview');
      }
    } catch (err: any) {
      alert(`Extraction error: ${err.message}`);
    } finally {
      setExtracting(false);
    }
  };

  const handleCommitExtractedSyllabus = async () => {
    setSaving(true);
    try {
      let targetReg = syllabusTargetReg;
      const cleanReg = manualRegCode.trim().toUpperCase();
      if (cleanReg) {
        const found = regulations.find((r) => r.code.toUpperCase() === cleanReg);
        if (found) {
          targetReg = found.id;
        } else if (!targetReg) {
          const yearMatch = cleanReg.match(/\d{4}/);
          const sYear = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();
          const createRes = await fetch('/api/regulations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'regulation',
              code: cleanReg,
              start_year: sYear,
              description: `Curriculum Regulation ${cleanReg}`,
            }),
          });
          const createdReg = await createRes.json();
          targetReg = createdReg.id;
        }
      }

      if (!targetReg) {
        targetReg = selectedRegulation;
      }

      let added = 0;
      for (const item of extractedSubjects) {
        if (!item.is_existing) {
          await fetch('/api/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: item.code,
              name: item.name,
              regulation_id: targetReg,
              semester_number: item.semester,
              credits: item.credits,
              department_ids: item.is_common ? [] : [syllabusDept],
              is_common: item.is_common,
            }),
          });
          added++;
        }
      }

      setSyllabusUploadOpen(false);
      setSyllabusRaw('');
      setSyllabusPdfFile(null);
      setSyllabusStep('input');
      fetchData();
      alert(`Successfully added ${added} curriculum subjects across all 8 semesters.`);
    } catch (err: any) {
      alert(`Commit error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredSubjects = subjects.filter(
    (s) => !selectedRegulation || s.regulation_id === selectedRegulation
  );

  // Group subjects by Semester 1 to 8
  const semesterGroups = [1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
    const list = filteredSubjects.filter(
      (s) => (s.semester_number || s.semester) === semNum
    );
    return { semester: semNum, subjects: list };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Regulations & Syllabus Master</h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain curriculum regulations (e.g. R2019, R2021), academic batches, and 8-semester canonical subjects.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSyllabusStep('input');
              setSyllabusUploadOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="h-4 w-4 text-blue-700" />
            <span>Extract Complete Syllabus PDF</span>
          </button>
          <button
            onClick={() => setSubjectModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Single Subject</span>
          </button>
        </div>
      </div>

      {/* Tabs & Regulation Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'subjects'
                ? 'bg-blue-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Subjects Catalog ({filteredSubjects.length})
          </button>
          <button
            onClick={() => setActiveTab('regulations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'regulations'
                ? 'bg-blue-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Regulations & Batches ({regulations.length})
          </button>
        </div>

        {activeTab === 'subjects' && regulations.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter Regulation:</span>
            <select
              value={selectedRegulation}
              onChange={(e) => {
                setSelectedRegulation(e.target.value);
                setSyllabusTargetReg(e.target.value);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none"
            >
              {regulations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} (Effective {r.start_year})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeTab === 'subjects' ? (
        filteredSubjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-50 text-blue-900 mb-3">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Syllabus Subjects Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Upload a single autonomous syllabus PDF covering all eight semesters for ADS or IT, or create subjects manually.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setSyllabusStep('input');
                  setSyllabusUploadOpen(true);
                }}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>Extract Complete Syllabus PDF</span>
              </button>
              <button
                onClick={() => setSubjectModalOpen(true)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Single Subject</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {semesterGroups.map(
              (group) =>
                group.subjects.length > 0 && (
                  <div
                    key={group.semester}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
                  >
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-900"></span>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Semester {group.semester} Curriculum
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {group.subjects.length} {group.subjects.length === 1 ? 'Subject' : 'Subjects'}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-2.5 px-4">Subject Code</th>
                            <th className="py-2.5 px-4">Subject Name</th>
                            <th className="py-2.5 px-4">Credits</th>
                            <th className="py-2.5 px-4">Scope</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.subjects.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-2.5 px-4 font-mono font-bold text-blue-900">{s.code}</td>
                              <td className="py-2.5 px-4 font-semibold text-slate-900">{s.name}</td>
                              <td className="py-2.5 px-4 text-slate-600 font-mono">{s.credits ?? 3.0}</td>
                              <td className="py-2.5 px-4">
                                {s.is_common ? (
                                  <Badge variant="green">Common Subject</Badge>
                                ) : (
                                  <span className="text-slate-500 text-xs">Department Core</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
            )}
          </div>
        )
      ) : (
        <div className="space-y-6">
          {/* Action Row for Regulations & Batches */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRegModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Regulation</span>
            </button>
            <button
              onClick={() => setBatchModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Batch with Regulation</span>
            </button>
          </div>

          {/* Regulations List */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-900" />
              <span>Academic Regulations</span>
            </h3>
            {regulations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
                <p className="text-xs text-slate-500">No regulations defined. Click "Create Regulation" to begin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {regulations.map((r) => (
                  <div key={r.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {r.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">Effective from {r.start_year}</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-600 font-medium">
                      {r.description || 'Sona College of Technology Academic Regulation'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Batches with Mapped Regulations */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-900" />
              <span>Academic Batches & Regulation Mapping</span>
            </h3>
            {batches.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
                <p className="text-xs text-slate-500">No batches defined. Click "Create Batch with Regulation" to map batches.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {batches.map((b) => {
                  const mapping = regulationBatches.find((rb) => rb.batch_id === b.id);
                  const mappedReg = mapping ? regulations.find((r) => r.id === mapping.regulation_id) : null;
                  return (
                    <div key={b.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{b.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {b.start_year} - {b.end_year}
                        </span>
                      </div>
                      <div className="pt-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">Governing Regulation:</span>
                        {mappedReg ? (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-mono text-[10px] font-bold border border-blue-200">
                            {mappedReg.code}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium">Unlinked</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Syllabus PDF Extract Modal */}
      <Modal
        isOpen={syllabusUploadOpen}
        onClose={() => {
          setSyllabusUploadOpen(false);
          setSyllabusStep('input');
        }}
        title="Complete 8-Semester Syllabus Extraction"
        description="Upload one comprehensive syllabus PDF per department containing all eight semesters."
        maxWidth="4xl"
      >
        {syllabusStep === 'input' ? (
          <div className="space-y-4">
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setUploadMode('pdf')}
                className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
                  uploadMode === 'pdf'
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Upload Syllabus PDF (8 Semesters)
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('text')}
                className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
                  uploadMode === 'text'
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Paste Multi-Semester Curriculum Text
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Department</label>
                <select
                  value={syllabusDept}
                  onChange={(e) => setSyllabusDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Academic Regulation
                </label>
                <input
                  type="text"
                  value={manualRegCode}
                  onChange={(e) => setManualRegCode(e.target.value.toUpperCase())}
                  placeholder="e.g. R2021"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter regulation code directly (e.g. R2021, R2023). Auto-creates if new.
                </p>
              </div>
            </div>

            {uploadMode === 'pdf' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Complete Syllabus PDF</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-800 rounded-xl p-8 text-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/30"
                >
                  <FileUp className="h-10 w-10 text-blue-900 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    {syllabusPdfFile ? syllabusPdfFile.name : 'Click to select or drop full syllabus curriculum PDF'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Extracts Semesters 1 to 8 subject codes, titles, credits, and common core types automatically
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setSyllabusPdfFile(e.target.files[0]);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Multi-Semester Curriculum Text Dump
                </label>
                <textarea
                  rows={8}
                  value={syllabusRaw}
                  onChange={(e) => setSyllabusRaw(e.target.value)}
                  placeholder="Paste curriculum text copied from syllabus PDF e.g.:&#10;SEMESTER I&#10;21HS101 Technical English 3 0 0 3&#10;21MA101 Calculus and Linear Algebra 3 1 0 4&#10;SEMESTER III&#10;21AD301 Data Structures and Algorithms 3 0 0 3&#10;21MA301 Transforms and Partial Differential Equations 3 1 0 4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSyllabusUploadOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParseSyllabus}
                disabled={extracting}
                className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
              >
                {extracting ? 'Extracting Semesters 1-8...' : 'Extract & Preview Subjects'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-200">
              <span className="text-xs font-bold text-blue-900">
                {extractedSubjects.length} Courses Detected Across Semesters
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {extractedSubjects.filter((s) => !s.is_existing).length} New to Save |{' '}
                {extractedSubjects.filter((s) => s.is_existing).length} Already Exist
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto divide-y divide-slate-100">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const list = extractedSubjects.filter((s) => s.semester === sem);
                if (list.length === 0) return null;
                return (
                  <div key={sem} className="p-3">
                    <div className="font-bold text-xs text-blue-900 uppercase tracking-wide mb-2 flex items-center justify-between">
                      <span>Semester {sem}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{list.length} subjects</span>
                    </div>
                    <table className="w-full text-left text-xs mb-2">
                      <thead className="bg-slate-50 text-slate-600 font-semibold">
                        <tr>
                          <th className="px-2 py-1.5 w-24">Code</th>
                          <th className="px-2 py-1.5">Subject Name</th>
                          <th className="px-2 py-1.5 w-16">Credits</th>
                          <th className="px-2 py-1.5 w-20">Common?</th>
                          <th className="px-2 py-1.5 w-20">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {list.map((sub, i) => {
                          const originalIdx = extractedSubjects.findIndex((item) => item.code === sub.code);
                          return (
                            <tr key={sub.code} className="hover:bg-slate-50">
                              <td className="px-2 py-1 font-mono font-bold text-blue-900">{sub.code}</td>
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={sub.name}
                                  onChange={(e) => {
                                    const copy = [...extractedSubjects];
                                    copy[originalIdx].name = e.target.value;
                                    setExtractedSubjects(copy);
                                  }}
                                  className="w-full px-2 py-0.5 border border-slate-200 rounded text-xs"
                                />
                              </td>
                              <td className="px-2 py-1 text-slate-700 font-mono">{sub.credits}</td>
                              <td className="px-2 py-1">
                                <input
                                  type="checkbox"
                                  checked={sub.is_common}
                                  onChange={(e) => {
                                    const copy = [...extractedSubjects];
                                    copy[originalIdx].is_common = e.target.checked;
                                    setExtractedSubjects(copy);
                                  }}
                                  className="rounded text-blue-900"
                                />
                              </td>
                              <td className="px-2 py-1">
                                {sub.is_existing ? (
                                  <span className="text-[10px] text-amber-700 font-medium">Exists</span>
                                ) : (
                                  <span className="text-[10px] text-emerald-700 font-bold">New</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSyllabusStep('input')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCommitExtractedSyllabus}
                disabled={saving || extractedSubjects.filter((s) => !s.is_existing).length === 0}
                className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {saving
                  ? 'Saving Subjects...'
                  : `Confirm & Save ${extractedSubjects.filter((s) => !s.is_existing).length} New Courses`}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Single Subject Modal */}
      <Modal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        title="Add Single Subject to Regulation"
        description="Add a canonical subject into curriculum database."
      >
        <form onSubmit={handleCreateSubject} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Regulation Code</label>
              <input
                type="text"
                required
                value={singleSubjRegCode}
                onChange={(e) => setSingleSubjRegCode(e.target.value.toUpperCase())}
                placeholder="e.g. R2021"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code</label>
              <input
                type="text"
                required
                value={subjCode}
                onChange={(e) => setSubjCode(e.target.value.toUpperCase())}
                placeholder="e.g. 21AD301"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name</label>
            <input
              type="text"
              required
              value={subjName}
              onChange={(e) => setSubjName(e.target.value)}
              placeholder="e.g. Discrete Mathematics and Graph Theory"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
              <select
                value={subjSem}
                onChange={(e) => setSubjSem(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credits</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="6"
                value={subjCredits}
                onChange={(e) => setSubjCredits(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={subjIsCommon}
                onChange={(e) => setSubjIsCommon(e.target.checked)}
                className="rounded text-blue-900"
              />
              <span className="text-xs font-semibold text-slate-800">Is Common Core Subject?</span>
            </label>
          </div>

          {!subjIsCommon && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={selectedDeptIds[0] || ''}
                onChange={(e) => setSelectedDeptIds([e.target.value])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setSubjectModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Regulation Modal */}
      <Modal
        isOpen={regModalOpen}
        onClose={() => setRegModalOpen(false)}
        title="Create Academic Regulation"
        description="Define an autonomous regulation (e.g. R2019, R2021) for curriculum governing."
      >
        <form onSubmit={handleCreateRegulation} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Regulation Code</label>
              <input
                type="text"
                required
                value={regCode}
                onChange={(e) => setRegCode(e.target.value.toUpperCase())}
                placeholder="e.g. R2021"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Year</label>
              <input
                type="number"
                required
                value={regYear}
                onChange={(e) => setRegYear(e.target.value)}
                placeholder="2021"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={regDesc}
              onChange={(e) => setRegDesc(e.target.value)}
              placeholder="e.g. B.Tech Autonomous Curriculum Regulation 2021"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setRegModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Creating...' : 'Create Regulation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Batch Modal */}
      <Modal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        title="Create Academic Batch & Map Regulation"
        description="Define a student cohort batch and link its governing curriculum regulation."
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Name</label>
            <input
              type="text"
              required
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g. 2021-2025"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Year</label>
              <input
                type="number"
                required
                value={batchStartYear}
                onChange={(e) => setBatchStartYear(e.target.value)}
                placeholder="2021"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Year</label>
              <input
                type="number"
                required
                value={batchEndYear}
                onChange={(e) => setBatchEndYear(e.target.value)}
                placeholder="2025"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Governing Regulation</label>
            <select
              value={batchMappedRegId}
              onChange={(e) => setBatchMappedRegId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
            >
              {regulations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} (Effective from {r.start_year})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setBatchModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
