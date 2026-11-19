'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Clock,
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Calendar,
  Users,
  GraduationCap,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Eye,
  Search,
  CheckCircle2,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { RemedialClass, Department, Batch, Regulation, Subject, Faculty, Student, Venue, PeerTutor } from '@/types/database.types';
import { formatDate, formatTime } from '@/lib/utils';

function ScheduleContent() {
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<RemedialClass[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [peerTutors, setPeerTutors] = useState<PeerTutor[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheduling Wizard State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [schedDept, setSchedDept] = useState('');
  const [schedYear, setSchedYear] = useState('4th Year');
  const [schedSection, setSchedSection] = useState('A');
  const [schedBatch, setSchedBatch] = useState('');
  const [schedReg, setSchedReg] = useState('');
  const [schedSubject, setSchedSubject] = useState('');
  const [schedConductorType, setSchedConductorType] = useState<'peer_tutor' | 'faculty'>('peer_tutor');
  const [schedPeerTutor, setSchedPeerTutor] = useState('');
  const [schedFaculty, setSchedFaculty] = useState('');
  const [schedDate, setSchedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [schedStartTime, setSchedStartTime] = useState('16:30');
  const [schedEndTime, setSchedEndTime] = useState('17:45');
  const [schedVenue, setSchedVenue] = useState('TP-304');
  const [schedVenueId, setSchedVenueId] = useState('');
  const [schedNotes, setSchedNotes] = useState('');

  // Selected students for this class
  const [candidateStudents, setCandidateStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [arrearStudentIds, setArrearStudentIds] = useState<string[]>([]);
  const [studentSourceTab, setStudentSourceTab] = useState<'arrear' | 'section' | 'all'>('arrear');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [quickRegisterInput, setQuickRegisterInput] = useState('');
  const [quickAddNotice, setQuickAddNotice] = useState<string | null>(null);

  // Conflict Checking State
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [schedulingSaving, setSchedulingSaving] = useState(false);

  // Single Class View Modal
  const [viewClass, setViewClass] = useState<RemedialClass | null>(null);

  const fetchClasses = () => {
    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        setClasses(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data);
        if (data.length > 0) setSchedDept(data[0].id);
      });

    fetch('/api/regulations')
      .then((res) => res.json())
      .then((data) => {
        setRegulations(data.regulations);
        setBatches(data.batches);
        if (data.regulations?.length > 0) setSchedReg(data.regulations[0].id);
        if (data.batches?.length > 0) setSchedBatch(data.batches[0].id);
      });

    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => {
        setSubjects(data);
        if (data.length > 0) setSchedSubject(data[0].id);
      });

    fetch('/api/faculty')
      .then((res) => res.json())
      .then((data) => {
        setFacultyList(data);
        if (data.length > 0) setSchedFaculty(data[0].id);
      });

    fetch('/api/tutors')
      .then((res) => res.json())
      .then((data) => {
        setPeerTutors(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) setSchedPeerTutor(data[0].id);
      });

    fetch('/api/students')
      .then((res) => res.json())
      .then((data) => setAllStudents(data));

    fetch('/api/venues')
      .then((res) => res.json())
      .then((data) => {
        setVenues(Array.isArray(data) ? data : []);
        if (data.length > 0) {
          setSchedVenueId(data[0].id);
          setSchedVenue(data[0].name);
        }
      });

    fetchClasses();
  }, []);

  // Filter peer tutors for the department (or fallback to all)
  const filteredPeerTutors = useMemo(() => {
    const list = peerTutors.filter((t: PeerTutor) => !schedDept || t.department_id === schedDept);
    return list.length > 0 ? list : peerTutors;
  }, [peerTutors, schedDept]);

  useEffect(() => {
    if (filteredPeerTutors.length > 0 && !filteredPeerTutors.some((t: PeerTutor) => t.id === schedPeerTutor)) {
      setSchedPeerTutor(filteredPeerTutors[0].id);
    }
  }, [filteredPeerTutors, schedPeerTutor]);

  // Detected Class Coordinator (CC) assigned to this section
  const detectedCC = useMemo(() => {
    return (
      facultyList.find(
        (f) =>
          f.department_id === schedDept &&
          f.section?.toUpperCase() === schedSection.toUpperCase() &&
          (!f.academic_year || f.academic_year.toLowerCase() === schedYear.toLowerCase())
      ) ||
      facultyList.find(
        (f) =>
          f.department_id === schedDept &&
          f.section?.toUpperCase() === schedSection.toUpperCase()
      ) ||
      facultyList.find((f) => f.department_id === schedDept) ||
      facultyList[0]
    );
  }, [facultyList, schedDept, schedSection, schedYear]);

  // Eligible faculty filtered strictly by selected department, academic year, and section
  const eligibleFaculty = facultyList.filter((f) => {
    if (schedDept && f.department_id !== schedDept) return false;
    if (f.academic_year && schedYear && f.academic_year.toLowerCase() !== schedYear.toLowerCase()) return false;
    if (f.section && f.section.toUpperCase() !== 'BOTH' && f.section.toUpperCase() !== 'ALL') {
      if (schedSection && f.section.toUpperCase() !== schedSection.toUpperCase()) return false;
    }
    return true;
  });

  // Automatically keep schedFaculty valid when filters change
  useEffect(() => {
    if (eligibleFaculty.length > 0) {
      if (!eligibleFaculty.some((f) => f.id === schedFaculty)) {
        setSchedFaculty(eligibleFaculty[0].id);
      }
    } else {
      setSchedFaculty('');
    }
  }, [schedDept, schedYear, schedSection, facultyList]);

  // Read query params if arriving from Groupings or Arrears
  useEffect(() => {
    const qSubject = searchParams.get('subject_id');
    const qBatch = searchParams.get('batch_id');
    const qDept = searchParams.get('dept_id');
    if (qSubject || qBatch || qDept) {
      if (qSubject) setSchedSubject(qSubject);
      if (qBatch) setSchedBatch(qBatch);
      if (qDept) setSchedDept(qDept);
      setWizardOpen(true);
    }
  }, [searchParams]);

  // Update candidate students when subject, department, or section changes
  useEffect(() => {
    if (!schedSubject) return;

    fetch(`/api/arrears?subject_id=${schedSubject}`)
      .then((res) => res.json())
      .then((arrearList) => {
        const idsWithArrear = (Array.isArray(arrearList) ? arrearList : []).map((a: any) => a.student_id);
        setArrearStudentIds(idsWithArrear);

        const arrearCandidates = allStudents.filter((s) => {
          if (schedDept && s.department_id !== schedDept) return false;
          if (schedSection && schedSection !== 'All' && s.section.toUpperCase() !== schedSection.toUpperCase()) return false;
          return idsWithArrear.includes(s.id);
        });

        const sectionCandidates = allStudents.filter((s) => {
          if (schedDept && s.department_id !== schedDept) return false;
          if (schedSection && schedSection !== 'All' && s.section.toUpperCase() !== schedSection.toUpperCase()) return false;
          return true;
        });

        if (arrearCandidates.length > 0) {
          setCandidateStudents(arrearCandidates);
          setSelectedStudentIds((prev) => (prev.length > 0 ? prev : arrearCandidates.map((c) => c.id)));
          setStudentSourceTab('arrear');
        } else {
          setCandidateStudents(sectionCandidates);
          setSelectedStudentIds((prev) => (prev.length > 0 ? prev : sectionCandidates.map((c) => c.id)));
          setStudentSourceTab('section');
        }
      })
      .catch(() => {
        const sectionCandidates = allStudents.filter((s) => {
          if (schedDept && s.department_id !== schedDept) return false;
          if (schedSection && schedSection !== 'All' && s.section.toUpperCase() !== schedSection.toUpperCase()) return false;
          return true;
        });
        setCandidateStudents(sectionCandidates);
        setSelectedStudentIds((prev) => (prev.length > 0 ? prev : sectionCandidates.map((c) => c.id)));
        setStudentSourceTab('section');
      });
  }, [schedSubject, schedDept, schedSection, allStudents]);

  const handleTabChange = (tab: 'arrear' | 'section' | 'all') => {
    setStudentSourceTab(tab);
    if (tab === 'arrear') {
      const arrearCandidates = allStudents.filter((s) => {
        if (schedDept && s.department_id !== schedDept) return false;
        if (schedSection && schedSection !== 'All' && s.section.toUpperCase() !== schedSection.toUpperCase()) return false;
        return arrearStudentIds.includes(s.id);
      });
      setCandidateStudents(arrearCandidates);
    } else if (tab === 'section') {
      const sectionCandidates = allStudents.filter((s) => {
        if (schedDept && s.department_id !== schedDept) return false;
        if (schedSection && schedSection !== 'All' && s.section.toUpperCase() !== schedSection.toUpperCase()) return false;
        return true;
      });
      setCandidateStudents(sectionCandidates);
    } else {
      const allDept = allStudents.filter((s) => !schedDept || s.department_id === schedDept);
      setCandidateStudents(allDept);
    }
  };

  const handleQuickAddStudents = () => {
    if (!quickRegisterInput.trim()) return;

    const tokens = quickRegisterInput
      .split(/[\s,;\n]+/)
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0);

    const newlyAdded: string[] = [];
    const notFound: string[] = [];

    for (const token of tokens) {
      const matched = allStudents.find(
        (s) =>
          s.register_number.toUpperCase() === token ||
          s.register_number.toUpperCase().includes(token) ||
          s.name.toUpperCase().includes(token)
      );

      if (matched) {
        if (!selectedStudentIds.includes(matched.id)) {
          newlyAdded.push(matched.id);
        }
        setCandidateStudents((prev) => (prev.some((c) => c.id === matched.id) ? prev : [matched, ...prev]));
      } else {
        notFound.push(token);
      }
    }

    if (newlyAdded.length > 0) {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...newlyAdded])));
      setQuickAddNotice(`Added ${newlyAdded.length} student(s) to roster.`);
    }
    if (notFound.length > 0) {
      setQuickAddNotice(
        `Added ${newlyAdded.length} student(s). Could not find: ${notFound.join(', ')}`
      );
    }
    setQuickRegisterInput('');
    setTimeout(() => setQuickAddNotice(null), 4000);
  };

  const activePool = React.useMemo(() => {
    let pool: Student[] = [];
    if (studentSourceTab === 'arrear') {
      pool = allStudents.filter((s) => {
        if (schedDept && s.department_id !== schedDept) return false;
        if (schedSection && schedSection !== 'All' && s.section.toUpperCase() !== schedSection.toUpperCase()) return false;
        return arrearStudentIds.includes(s.id);
      });
    } else if (studentSourceTab === 'section') {
      pool = allStudents.filter((s) => {
        if (schedDept && s.department_id !== schedDept) return false;
        if (schedSection && schedSection !== 'All' && s.section.toUpperCase() !== schedSection.toUpperCase()) return false;
        return true;
      });
    } else {
      pool = allStudents.filter((s) => !schedDept || s.department_id === schedDept);
    }

    const selectedObj = allStudents.filter((s) => selectedStudentIds.includes(s.id));
    const combined = [...selectedObj, ...pool];
    const unique = new Map<string, Student>();
    combined.forEach((s) => unique.set(s.id, s));
    return Array.from(unique.values());
  }, [studentSourceTab, allStudents, schedDept, schedSection, arrearStudentIds, selectedStudentIds]);

  const displayedStudents = activePool.filter((st) => {
    if (!studentSearchQuery) return true;
    const q = studentSearchQuery.toLowerCase();
    return st.name.toLowerCase().includes(q) || st.register_number.toLowerCase().includes(q);
  });

  // Pre-flight Conflict Check
  const handleInitiateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingConflicts(true);

    try {
      const res = await fetch('/api/classes/conflict-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_date: schedDate,
          start_time: schedStartTime,
          end_time: schedEndTime,
          faculty_id: schedConductorType === 'faculty' ? schedFaculty : (detectedCC?.id || undefined),
          peer_tutor_id: schedConductorType === 'peer_tutor' ? schedPeerTutor : undefined,
          venue: schedVenue,
          venue_id: schedVenueId || undefined,
          department_id: schedDept,
          student_ids: selectedStudentIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.hasConflicts) {
        setConflicts(data.conflicts);
        setConflictModalOpen(true);
      } else {
        // No conflicts! Proceed directly to commit
        await commitSchedule(false);
      }
    } catch (err: any) {
      alert(`Conflict checking failed: ${err.message}`);
    } finally {
      setCheckingConflicts(false);
    }
  };

  const commitSchedule = async (allowOverride: boolean) => {
    setSchedulingSaving(true);
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_id: schedDept,
          batch_id: schedBatch,
          regulation_id: schedReg,
          subject_id: schedSubject,
          conductor_type: schedConductorType,
          peer_tutor_id: schedConductorType === 'peer_tutor' ? schedPeerTutor : undefined,
          faculty_id: schedConductorType === 'faculty' ? schedFaculty : (detectedCC?.id || undefined),
          academic_year: schedYear,
          section: schedSection,
          class_date: schedDate,
          start_time: schedStartTime,
          end_time: schedEndTime,
          venue: schedVenue,
          venue_id: schedVenueId || undefined,
          notes: schedNotes,
          student_ids: selectedStudentIds,
          allow_override: allowOverride,
          override_reason: overrideReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setWizardOpen(false);
      setConflictModalOpen(false);
      setOverrideReason('');
      fetchClasses();
    } catch (err: any) {
      alert(`Scheduling error: ${err.message}`);
    } finally {
      setSchedulingSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Remedial Class Scheduling</h1>
          <p className="text-xs text-slate-500 mt-1">
            Multi-slot remedial timetables with automated faculty, student, and venue conflict detection.
          </p>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 text-white font-semibold text-xs hover:bg-blue-800 transition shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Remedial Session</span>
        </button>
      </div>

      {/* Class Timetable Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Class Code</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Conductor & CC</th>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">Venue</th>
                <th className="px-6 py-3.5">Enrolled</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.length > 0 ? (
                classes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono font-bold text-blue-900">{c.class_code}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {c.subject?.code}
                        </span>
                        <p className="text-slate-600 font-medium">{c.subject?.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {c.peer_tutor ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                            👤 {c.peer_tutor.name} (Peer Tutor)
                          </span>
                          {c.faculty && (
                            <p className="text-[10px] text-slate-500">
                              CC: <span className="font-semibold text-slate-700">{c.faculty.name}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900">
                            👨‍🏫 {c.faculty?.name || 'Assigned Faculty'}
                          </span>
                          <p className="text-[10px] text-slate-500">Faculty Conducted</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <span className="block font-bold text-slate-800">{formatDate(c.class_date)}</span>
                      <span className="block text-slate-500 font-mono text-[11px]">
                        {formatTime(c.start_time)} - {formatTime(c.end_time)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{c.venue || 'TBA'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200">
                        {c.student_count} Students
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          c.status === 'completed'
                            ? 'green'
                            : c.status === 'scheduled'
                            ? 'blue'
                            : 'amber'
                        }
                        size="sm"
                      >
                        {c.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setViewClass(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-900 hover:bg-slate-100 transition cursor-pointer"
                        title="View enrolled students"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Clock className="h-10 w-10 text-slate-300" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">No Remedial Sessions Scheduled</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                          Schedule a new remedial class session, allocate peer tutors, and check for faculty/student/venue conflicts.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setWizardOpen(true)}
                          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Schedule First Session</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduling Wizard Modal */}
      <Modal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title="Schedule Remedial Session"
        description="Select subject, assigned faculty, slot timings, and student cohort"
        maxWidth="2xl"
      >
        <form onSubmit={handleInitiateSchedule} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={schedDept}
                onChange={(e) => setSchedDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
              <select
                value={schedYear}
                onChange={(e) => setSchedYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class Section</label>
              <select
                value={schedSection}
                onChange={(e) => setSchedSection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="All">All Sections</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Batch</label>
              <select
                value={schedBatch}
                onChange={(e) => setSchedBatch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remedial Subject</label>
              <select
                value={schedSubject}
                onChange={(e) => setSchedSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-blue-950"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name.slice(0, 24)}... (Sem {s.semester_number || s.semester})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conductor & Class Coordinator Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-900">
                  Session Conductor
                </label>
                <p className="text-[11px] text-slate-500">
                  Peer tutors primarily conduct remedial classes. Faculty occasionally take sessions.
                </p>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start">
                <button
                  type="button"
                  onClick={() => setSchedConductorType('peer_tutor')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    schedConductorType === 'peer_tutor'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👤 Peer Tutor (Primary)
                </button>
                <button
                  type="button"
                  onClick={() => setSchedConductorType('faculty')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    schedConductorType === 'faculty'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👨‍🏫 Faculty (Occasional)
                </button>
              </div>
            </div>

            {schedConductorType === 'peer_tutor' ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Assigned Senior Peer Tutor (Conducts Remedial & Takes Attendance)
                  </label>
                  <a
                    href="/tutors"
                    target="_blank"
                    className="text-[11px] font-bold text-blue-900 hover:underline inline-flex items-center gap-1"
                  >
                    + Register Tutor
                  </a>
                </div>
                <select
                  value={schedPeerTutor}
                  onChange={(e) => setSchedPeerTutor(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                >
                  {filteredPeerTutors.length === 0 ? (
                    <option value="">No peer tutors found for this department</option>
                  ) : (
                    filteredPeerTutors.map((t: PeerTutor) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.register_number}) — {t.department?.code || 'ADS'} Peer Tutor
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Faculty Conductor ({schedYear} Sec {schedSection})
                </label>
                <select
                  value={schedFaculty}
                  onChange={(e) => setSchedFaculty(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                >
                  {eligibleFaculty.length === 0 ? (
                    <option value="">No faculty allocated to {schedYear} Sec {schedSection}</option>
                  ) : (
                    eligibleFaculty.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} — {f.academic_year || 'Class'} (Sec {f.section || 'A'})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* Class Coordinator (CC) Absence Alert Indicator */}
            <div className="flex items-start gap-2.5 p-3 bg-blue-50/90 border border-blue-200 rounded-xl">
              <AlertCircle className="h-4 w-4 text-blue-800 shrink-0 mt-0.5" />
              <div className="text-[11px] text-blue-900">
                <span className="font-bold">
                  Class Coordinator (CC) to Notify on Student Absence:
                </span>{' '}
                <span className="font-semibold underline">
                  {detectedCC?.name || 'Deepika J'} ({schedYear} Sec {schedSection})
                </span>
                <p className="text-blue-700 mt-0.5">
                  If any student is absent from this remedial session, an automated SMS alert is instantly transmitted to their Class Coordinator ({detectedCC?.name || 'Deepika J'}).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class Date</label>
              <input
                type="date"
                required
                value={schedDate}
                onChange={(e) => setSchedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={schedStartTime}
                onChange={(e) => setSchedStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                required
                value={schedEndTime}
                onChange={(e) => setSchedEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Venue / Remedial Hall</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={schedVenueId}
                onChange={(e) => {
                  setSchedVenueId(e.target.value);
                  const v = venues.find((item) => item.id === e.target.value);
                  if (v) setSchedVenue(v.name);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              >
                <option value="">Select Institutional Venue...</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.building ? `(${v.building})` : ''} - Cap: {v.capacity || '—'}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={schedVenue}
                onChange={(e) => setSchedVenue(e.target.value)}
                placeholder="Or custom room name..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Candidate & Enrolled Students Selector */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Enrolled Students ({selectedStudentIds.length} selected)
              </label>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const toAdd = displayedStudents.map((s) => s.id);
                    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...toAdd])));
                  }}
                  className="font-semibold text-blue-900 hover:underline cursor-pointer"
                >
                  Select All in View
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds([])}
                  className="font-semibold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
                {arrearStudentIds.length > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedStudentIds(
                          allStudents.filter((s) => arrearStudentIds.includes(s.id)).map((s) => s.id)
                        )
                      }
                      className="font-semibold text-amber-700 hover:underline cursor-pointer"
                    >
                      Arrears Only
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Source Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleTabChange('arrear')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    studentSourceTab === 'arrear'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Arrear Candidates (
                  {
                    allStudents.filter(
                      (s) =>
                        arrearStudentIds.includes(s.id) &&
                        (!schedDept || s.department_id === schedDept) &&
                        (!schedSection || schedSection === 'All' || s.section.toUpperCase() === schedSection.toUpperCase())
                    ).length
                  }
                  )
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('section')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    studentSourceTab === 'section'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Section {schedSection} (
                  {
                    allStudents.filter(
                      (s) =>
                        (!schedDept || s.department_id === schedDept) &&
                        (!schedSection || schedSection === 'All' || s.section.toUpperCase() === schedSection.toUpperCase())
                    ).length
                  }
                  )
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    studentSourceTab === 'all'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Dept ({allStudents.filter((s) => !schedDept || s.department_id === schedDept).length})
                </button>
              </div>
            </div>

            {/* Direct Input & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search in roster by name or reg no..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={quickRegisterInput}
                  onChange={(e) => setQuickRegisterInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickAddStudents();
                    }
                  }}
                  placeholder="Enter Reg No(s) e.g. 61782323110029..."
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
                <button
                  type="button"
                  onClick={() => handleQuickAddStudents()}
                  className="px-3 py-1.5 bg-blue-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition cursor-pointer shrink-0 shadow-xs"
                >
                  + Add
                </button>
              </div>
            </div>

            {quickAddNotice && (
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                <span>{quickAddNotice}</span>
              </div>
            )}

            {/* Student List Box */}
            <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto p-2 bg-slate-50 space-y-1">
              {displayedStudents.length > 0 ? (
                displayedStudents.map((st) => {
                  const isChecked = selectedStudentIds.includes(st.id);
                  const isArrear = arrearStudentIds.includes(st.id);
                  return (
                    <label
                      key={st.id}
                      className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition ${
                        isChecked ? 'bg-blue-50/80 border border-blue-200' : 'hover:bg-white border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds([...selectedStudentIds, st.id]);
                          } else {
                            setSelectedStudentIds(selectedStudentIds.filter((id) => id !== st.id));
                          }
                        }}
                        className="rounded text-blue-900 cursor-pointer"
                      />
                      <span className="font-mono font-bold text-blue-950">{st.register_number}</span>
                      <span className="text-slate-800 font-medium truncate">{st.name}</span>
                      <span className="text-slate-500 text-[11px] shrink-0 font-medium">(Sec {st.section})</span>
                      {isArrear && (
                        <span className="ml-auto px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold shrink-0">
                          Arrear Candidate
                        </span>
                      )}
                    </label>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-slate-500">
                  <p className="font-medium">No students match this filter.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Switch to &ldquo;Section {schedSection}&rdquo; or type register number above to add students.
                  </p>
                </div>
              )}
            </div>

            {selectedStudentIds.length === 0 && (
              <p className="text-[11px] text-amber-600 font-medium">
                ⚠️ Please select or enter at least one student to schedule this session.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setWizardOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={checkingConflicts || selectedStudentIds.length === 0}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {checkingConflicts ? 'Detecting Conflicts...' : 'Validate Conflicts & Confirm'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Conflict Resolution Modal */}
      <Modal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title="Timetable Conflict Alert"
        description="Multi-resource conflict detected in proposed schedule slot"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Conflicts Found: {conflicts.length}</p>
              <p className="text-amber-800 mt-0.5">
                The scheduling engine has flagged the following resource clashes for this slot:
              </p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {conflicts.map((conf, i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                <span className="font-bold text-red-700 uppercase tracking-wider text-[10px]">
                  {conf.type} conflict
                </span>
                <h4 className="font-semibold text-slate-900 mt-0.5">{conf.title}</h4>
                <p className="text-slate-600 mt-0.5">{conf.description}</p>
                {conf.entity_names?.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-slate-700 text-[11px] font-mono">
                    {conf.entity_names.map((name: string, idx: number) => (
                      <li key={idx}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Coordinator Override Justification (Logged to Audit Trail)
            </label>
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Approved by HOD for extra remedial slot"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConflictModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Edit Slots
            </button>
            <button
              type="button"
              onClick={() => commitSchedule(true)}
              disabled={schedulingSaving || !overrideReason.trim()}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-50"
            >
              {schedulingSaving ? 'Saving...' : 'Authorize Override & Schedule'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Enrolled Students Modal */}
      <Modal
        isOpen={!!viewClass}
        onClose={() => setViewClass(null)}
        title={`Remedial Class Roster: ${viewClass?.class_code}`}
        description={`${viewClass?.subject?.name} (${viewClass?.subject?.code}) on ${viewClass ? formatDate(viewClass.class_date) : ''}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <p>
              Conducted by:{' '}
              <strong>
                {viewClass?.peer_tutor
                  ? `👤 Peer Tutor: ${viewClass.peer_tutor.name} (${viewClass.peer_tutor.register_number})`
                  : `👨‍🏫 Faculty: ${viewClass?.faculty?.name || 'Assigned Faculty'}`}
              </strong>
            </p>
            {viewClass?.faculty && (
              <p>
                Class Coordinator (CC): <strong>{viewClass.faculty.name}</strong> ({viewClass.academic_year || 'Class'} Sec {viewClass.section || 'A'})
              </p>
            )}
            <p>
              Timing:{' '}
              <strong>
                {viewClass ? formatTime(viewClass.start_time) : ''} -{' '}
                {viewClass ? formatTime(viewClass.end_time) : ''}
              </strong>
            </p>
            <p>
              Venue: <strong>{viewClass?.venue || 'TBA'}</strong>
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="px-4 py-2">Reg No</th>
                  <th className="px-4 py-2">Student Name</th>
                  <th className="px-4 py-2">Sec</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewClass?.students?.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 font-mono font-bold text-blue-900">
                      {s.register_number}
                    </td>
                    <td className="px-4 py-2 font-semibold text-slate-900">{s.name}</td>
                    <td className="px-4 py-2">Sec {s.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setViewClass(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading schedule...</div>}>
      <ScheduleContent />
    </Suspense>
  );
}
