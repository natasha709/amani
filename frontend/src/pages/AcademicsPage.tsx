import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicApi, studentApi } from '../lib/api';
import {
  GraduationCap,
  BookOpen,
  Plus,
  Search,
  X,
  Trash2,
  User,
  ChevronRight,
  ClipboardCheck,
  Award,
  Printer
} from 'lucide-react';

type Tab = 'overview' | 'subjects' | 'classes' | 'marks' | 'reports';

export default function AcademicsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  // Marks Entry state
  const [marksClass, setMarksClass] = useState<any>(null);
  const [marksSubject, setMarksSubject] = useState<any>(null);
  const [marksTerm, setMarksTerm] = useState<any>(null);
  const [marksInput, setMarksInput] = useState<Record<string, number>>({});

  // Reports state
  const [reportStudent, setReportStudent] = useState<any>(null);
  const [reportTerm, setReportTerm] = useState<any>(null);
  const [printingReport, setPrintingReport] = useState(false);

  const queryClient = useQueryClient();

  // Fetch data
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => academicApi.getClasses(),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => academicApi.getSubjects(),
  });

  const { data: termsData } = useQuery({
    queryKey: ['terms'],
    queryFn: () => academicApi.getTerms(),
  });

  // Marks Entry queries
  const { data: marksStudentsData } = useQuery({
    queryKey: ['marks-students', marksClass?.id],
    queryFn: () => studentApi.getAll({ classId: marksClass.id, limit: 100 }),
    enabled: !!marksClass?.id && activeTab === 'marks',
  });

  const { data: existingRecordsData } = useQuery({
    queryKey: ['existing-records', marksClass?.id, marksSubject?.id, marksTerm?.id],
    queryFn: () => academicApi.getRecords({ classId: marksClass.id, subjectId: marksSubject.id, academicTermId: marksTerm.id }),
    enabled: !!marksClass?.id && !!marksSubject?.id && !!marksTerm?.id && activeTab === 'marks',
  });

  const { data: studentRecordsData } = useQuery({
    queryKey: ['student-records', reportStudent?.id, reportTerm?.id],
    queryFn: () => academicApi.getRecords({ studentId: reportStudent.id, academicTermId: reportTerm.id }),
    enabled: !!reportStudent?.id && !!reportTerm?.id && activeTab === 'reports',
  });

  const { data: allStudentsData } = useQuery({
    queryKey: ['all-students-list'],
    queryFn: () => studentApi.getAll({ limit: 1000 }),
    enabled: activeTab === 'reports',
  });

  const classes = classesData?.data?.data || [];
  const subjects = subjectsData?.data?.data || [];
  const terms = termsData?.data?.data || [];
  const marksStudents = marksStudentsData?.data?.data || [];
  const existingRecords = existingRecordsData?.data?.data || [];
  const studentRecords = studentRecordsData?.data?.data || [];
  const allStudents = allStudentsData?.data?.data || [];

  // Mutations
  const createSubjectMutation = useMutation({
    mutationFn: academicApi.createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setShowSubjectModal(false);
    },
  });

  const assignMutation = useMutation({
    mutationFn: academicApi.assignSubjectToClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setShowAssignModal(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: academicApi.removeSubjectFromClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  const saveMarksMutation = useMutation({
    mutationFn: async (data: any[]) => {
      await Promise.all(
        data.map(record => academicApi.createRecord(record))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['existing-records'] });
      alert('Successfully saved all marks!');
    },
  });

  // Sync marksInput with existingRecords
  useEffect(() => {
    if (existingRecords && existingRecords.length > 0) {
      const initialInput: Record<string, number> = {};
      existingRecords.forEach((rec: any) => {
        initialInput[rec.studentId] = rec.marksObtained;
      });
      setMarksInput(initialInput);
    } else {
      setMarksInput({});
    }
  }, [existingRecords]);

  const handleSaveMarks = () => {
    if (!marksClass || !marksSubject || !marksTerm) return;

    const payload = Object.entries(marksInput).map(([studentId, marks]) => ({
      studentId,
      subjectId: marksSubject.id,
      academicTermId: marksTerm.id,
      marksObtained: Number(marks),
      maxMarks: 100,
      grade: calculateGrade(Number(marks))
    }));

    saveMarksMutation.mutate(payload);
  };

  const calculateGrade = (marks: number) => {
    if (marks >= 90) return 'D1';
    if (marks >= 80) return 'D2';
    if (marks >= 70) return 'C3';
    if (marks >= 60) return 'C4';
    if (marks >= 50) return 'C5';
    if (marks >= 45) return 'C6';
    if (marks >= 40) return 'P7';
    if (marks >= 35) return 'P8';
    return 'F9';
  };

  const calculateTotal = () => {
    return studentRecords.reduce((sum: number, rec: any) => sum + rec.marksObtained, 0);
  };

  const calculateAverage = () => {
    if (studentRecords.length === 0) return 0;
    return (calculateTotal() / studentRecords.length).toFixed(1);
  };

  const handlePrintReport = () => {
    setPrintingReport(true);
    setTimeout(() => {
      window.print();
      setPrintingReport(false);
    }, 100);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academics</h1>
          <p className="text-gray-500">Manage curriculum, subjects, and records</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          {[
            { id: 'overview', label: 'Overview', icon: GraduationCap },
            { id: 'subjects', label: 'Subjects', icon: BookOpen },
            { id: 'classes', label: 'Classes', icon: GraduationCap },
            { id: 'marks', label: 'Marks Entry', icon: ClipboardCheck },
            { id: 'reports', label: 'Reports', icon: Award },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 className="text-lg font-semibold opacity-90">Total Subjects</h3>
            <p className="text-4xl font-black mt-2">{subjects.length}</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <h3 className="text-lg font-semibold opacity-90">Total Classes</h3>
            <p className="text-4xl font-black mt-2">{classes.length}</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 className="text-lg font-semibold opacity-90">Terms Registered</h3>
            <p className="text-4xl font-black mt-2">3</p>
          </div>

          <div className="md:col-span-3 card p-8 text-center bg-white border-2 border-dashed border-gray-200">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">Academic Overview Not Configured</h3>
            <p className="text-gray-500 mt-2">Start by defining your subjects and assigning them to classes.</p>
            <button
              onClick={() => setActiveTab('subjects')}
              className="btn btn-primary mt-6 whitespace-nowrap"
            >
              Go to Subjects
            </button>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">School Subjects</h3>
            <button onClick={() => setShowSubjectModal(true)} className="btn btn-primary btn-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Subject
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub: any) => (
              <div key={sub.id} className="card p-4 hover:shadow-md transition-shadow cursor-default group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 font-bold">
                      {sub.code || sub.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{sub.name}</h4>
                      <p className="text-xs text-gray-500">{sub.description || 'No description'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Select Class</h3>
            <div className="flex flex-col gap-2">
              {classes.map((cls: any) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selectedClass?.id === cls.id
                    ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-100'
                    : 'bg-white border-gray-100 hover:border-primary-200'
                    }`}
                >
                  <div className="text-left">
                    <p className="font-bold text-gray-900">{cls.name}</p>
                    <p className="text-xs text-gray-500">{cls._count?.students || 0} Students</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${selectedClass?.id === cls.id ? 'translate-x-1 text-primary-500' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selectedClass ? (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedClass.name} Curriculum</h3>
                    <p className="text-sm text-gray-500">Manage subjects and teachers for this class</p>
                  </div>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="btn btn-outline btn-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Assign Subject
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedClass.subjects?.length > 0 ? (
                    selectedClass.subjects.map((cs: any) => (
                      <div key={cs.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group border border-transparent hover:border-primary-200 hover:bg-white transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center font-bold text-gray-600 shadow-sm">
                            {cs.subject.code || 'SUB'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{cs.subject.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                              <User className="w-3 h-3 text-gray-400" />
                              {cs.teacherName || 'No teacher assigned'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeMutation.mutate(cs.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-400 italic">
                      No subjects assigned to this class yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-20 flex flex-col items-center justify-center bg-gray-50/50 border-2 border-dashed">
                <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium text-center">Select a class from the list to manage its curriculum</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'marks' && (
        <div className="space-y-6">
          <div className="card p-6 border-primary-100 bg-primary-50/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. Select Class</label>
                <select
                  value={marksClass?.id || ''}
                  onChange={(e) => {
                    const cls = classes.find((c: any) => c.id === e.target.value);
                    setMarksClass(cls);
                    setMarksSubject(null);
                  }}
                  className="w-full px-4 py-2 bg-white border rounded-xl"
                >
                  <option value="">Select a class...</option>
                  {classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. Select Subject</label>
                <select
                  value={marksSubject?.id || ''}
                  onChange={(e) => setMarksSubject(marksClass?.subjects?.find((s: any) => s.subject.id === e.target.value)?.subject)}
                  className="w-full px-4 py-2 bg-white border rounded-xl"
                  disabled={!marksClass}
                >
                  <option value="">Select a subject...</option>
                  {marksClass?.subjects?.map((cs: any) => (
                    <option key={cs.subject.id} value={cs.subject.id}>{cs.subject.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">3. Select Term</label>
                <select
                  value={marksTerm?.id || ''}
                  onChange={(e) => setMarksTerm(terms.find((t: any) => t.id === e.target.value))}
                  className="w-full px-4 py-2 bg-white border rounded-xl"
                >
                  <option value="">Select current term...</option>
                  {terms.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {(marksClass && marksSubject && marksTerm) ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Entering Marks for {marksSubject.name}</h3>
                  <p className="text-sm text-gray-500">{marksClass.name} - {marksTerm.name}</p>
                </div>
                <button
                  onClick={handleSaveMarks}
                  disabled={saveMarksMutation.isPending}
                  className="btn btn-primary"
                >
                  {saveMarksMutation.isPending ? 'Saving...' : 'Save All Marks'}
                </button>
              </div>

              <div className="card overflow-hidden border-gray-200 shadow-xl">
                <table className="w-full text-left bg-white border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-4 font-bold text-gray-700">Student Name</th>
                      <th className="px-6 py-4 font-bold text-gray-700">ID Number</th>
                      <th className="px-6 py-4 font-bold text-gray-700 w-48">Score (/100)</th>
                      <th className="px-6 py-4 font-bold text-gray-700">Auto Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {marksStudents.map((std: any) => (
                      <tr key={std.id} className="hover:bg-primary-50/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{std.firstName} {std.lastName}</td>
                        <td className="px-6 py-4 text-gray-500">{std.studentNo}</td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={marksInput[std.id] || ''}
                            onChange={(e) => setMarksInput({ ...marksInput, [std.id]: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition-all text-lg font-bold"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-4 py-1.5 rounded-full font-bold text-sm ${(marksInput[std.id] || 0) >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {calculateGrade(marksInput[std.id] || 0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {marksStudents.length === 0 && (
                  <div className="p-12 text-center text-gray-400">
                    No students found in {marksClass.name}.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-20 flex flex-col items-center justify-center bg-gray-50/10 border-2 border-dashed border-primary-100 opacity-60">
              <ClipboardCheck className="w-16 h-16 text-primary-200 mb-4" />
              <h3 className="text-xl font-bold text-gray-400">Preparation Required</h3>
              <p className="text-gray-400 text-center max-w-sm mt-2">Please select a Class, Subject and Term from above to load the marks entry grid.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="card p-6 no-print">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. Select Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={reportStudent?.id || ''}
                    onChange={(e) => setReportStudent(allStudents.find((s: any) => s.id === e.target.value))}
                    className="w-full pl-10 pr-4 py-2 bg-white border rounded-xl appearance-none"
                  >
                    <option value="">Search student for report...</option>
                    {allStudents.map((std: any) => (
                      <option key={std.id} value={std.id}>{std.firstName} {std.lastName} ({std.studentNo})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. Select Term</label>
                <select
                  value={reportTerm?.id || ''}
                  onChange={(e) => setReportTerm(terms.find((t: any) => t.id === e.target.value))}
                  className="w-full px-4 py-2 bg-white border rounded-xl"
                >
                  <option value="">Select academic term...</option>
                  {terms.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {reportStudent && reportTerm ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between no-print">
                <h3 className="text-lg font-bold text-gray-900">Preview Report Card</h3>
                <button
                  onClick={handlePrintReport}
                  className="btn btn-primary"
                >
                  <Printer className="w-4 h-4 mr-2" /> Print Report Card
                </button>
              </div>

              {/* Report Card Content */}
              <div className={`${printingReport ? 'fixed inset-0 bg-white z-[9999] p-10 overflow-auto' : 'card p-10 bg-white shadow-2xl max-w-4xl mx-auto'}`}>
                {/* Header */}
                <div className="text-center mb-8 border-b-4 border-gray-900 pb-6">
                  <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">AMANI SCHOOL SYSTEM</h1>
                  <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">Excellence Through Hard Work</p>
                  <div className="mt-4 inline-block bg-gray-900 text-white px-8 py-2 font-bold rounded-full text-lg uppercase">
                    Terminal Academic Report
                  </div>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-2 gap-10 mb-8 pb-6 border-b border-gray-100">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-400 uppercase w-24">Student:</span>
                      <span className="font-black text-xl text-gray-900">{reportStudent.firstName} {reportStudent.lastName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-400 uppercase w-24">Admin No:</span>
                      <span className="font-bold text-gray-800">{reportStudent.studentNo}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-400 uppercase w-24">Class:</span>
                      <span className="font-bold text-gray-800">{reportStudent.class?.name || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-3 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <span className="text-sm font-bold text-gray-400 uppercase">Term:</span>
                      <span className="font-bold text-gray-800">{reportTerm.name}</span>
                    </div>
                    <div className="flex items-center justify-end gap-4">
                      <span className="text-sm font-bold text-gray-400 uppercase">Year:</span>
                      <span className="font-bold text-gray-800">{new Date(reportTerm.startDate).getFullYear()}</span>
                    </div>
                  </div>
                </div>

                {/* Marks Table */}
                <table className="w-full border-collapse border-2 border-gray-900 mb-8">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-900">
                      <th className="border-r-2 border-gray-900 p-3 text-left font-black uppercase text-xs">Subject</th>
                      <th className="border-r-2 border-gray-900 p-3 text-center font-black uppercase text-xs">Score (/100)</th>
                      <th className="border-r-2 border-gray-900 p-3 text-center font-black uppercase text-xs">Grade</th>
                      <th className="p-3 text-left font-black uppercase text-xs">Teacher's Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRecords.length > 0 ? (
                      studentRecords.map((rec: any) => (
                        <tr key={rec.id} className="border-b border-gray-900 font-bold">
                          <td className="border-r-2 border-gray-900 p-4 text-gray-900 uppercase text-sm">{rec.subject.name}</td>
                          <td className="border-r-2 border-gray-900 p-4 text-center text-lg">{rec.marksObtained}</td>
                          <td className="border-r-2 border-gray-900 p-4 text-center">
                            <span className="text-xl font-black">{rec.grade}</span>
                          </td>
                          <td className="p-4 italic text-gray-500 text-sm">
                            {rec.marksObtained >= 80 ? 'Excellent performance. Keep it up!' :
                              rec.marksObtained >= 60 ? 'Good work, but more effort needed.' :
                                'Average performance. Work harder.'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-gray-400 italic">
                          No academic records found for this term.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-6 mb-12">
                  <div className="bg-gray-50 p-4 border-2 border-gray-900 rounded-xl text-center">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Marks</p>
                    <p className="text-3xl font-black">{calculateTotal()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 border-2 border-gray-900 rounded-xl text-center">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Average Score</p>
                    <p className="text-3xl font-black">{calculateAverage()}%</p>
                  </div>
                  <div className="bg-gray-900 text-white p-4 border-2 border-gray-900 rounded-xl text-center">
                    <p className="text-xs font-bold opacity-70 uppercase mb-1">Class Position</p>
                    <p className="text-3xl font-black">N/A</p>
                  </div>
                </div>

                {/* Bottom Signatures */}
                <div className="grid grid-cols-2 gap-20 pt-10 border-t-2 border-gray-900 border-dashed">
                  <div className="text-center">
                    <div className="w-full border-b border-gray-900 mb-2"></div>
                    <p className="text-xs font-bold uppercase">Class Teacher's Signature</p>
                  </div>
                  <div className="text-center">
                    <div className="w-full border-b border-gray-900 mb-2"></div>
                    <p className="text-xs font-bold uppercase">Headteacher's Official Stamp</p>
                  </div>
                </div>

                <div className="mt-12 text-center text-[10px] text-gray-400 italic">
                  This report card is generated by Amani School OS and is official only when signed and stamped by the school headteacher.
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-20 flex flex-col items-center justify-center bg-gray-50/10 border-2 border-dashed border-primary-100 opacity-60">
              <Award className="w-16 h-16 text-primary-100 mb-4" />
              <h3 className="text-xl font-bold text-gray-400">Generate Report Cards</h3>
              <p className="text-gray-400 text-center max-w-sm mt-2">Pick a student and an academic term above to generate their Terminal Report Card.</p>
            </div>
          )}
        </div>
      )}

      {/* Forms and Modals */}

      {/* Create Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Add New Subject</h2>
              <button onClick={() => setShowSubjectModal(false)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createSubjectMutation.mutate({
                name: formData.get('name'),
                code: formData.get('code'),
                description: formData.get('description'),
              });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                <input name="name" required placeholder="e.g. Mathematics" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code (Optional)</label>
                <input name="code" placeholder="e.g. MATH" className="w-full px-3 py-2 border rounded-lg uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <button type="submit" className="btn btn-primary w-full py-3" disabled={createSubjectMutation.isPending}>
                {createSubjectMutation.isPending ? 'Creating...' : 'Save Subject'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Subject Modal */}
      {showAssignModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Assign Subject</h2>
                <p className="text-sm text-gray-500">to {selectedClass.name}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              assignMutation.mutate({
                classId: selectedClass.id,
                subjectId: formData.get('subjectId'),
              });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject *</label>
                <select name="subjectId" required className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select a subject...</option>
                  {subjects.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code || 'NO-CODE'})</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400 py-2">
                Note: This will add the subject to {selectedClass.name}'s curriculum instantly.
              </p>
              <button type="submit" className="btn btn-primary w-full py-3" disabled={assignMutation.isPending}>
                {assignMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

{/* Global Print Styles */ }
<style dangerouslySetInnerHTML={{
  __html: `
  @media print {
      .no-print { display: none !important; }
      body { background: white !important; }
      .card { border: none !important; box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
      #root > div > aside { display: none !important; }
      #root > div > div { padding-left: 0 !important; }
      header { display: none !important; }
      main { padding: 0 !important; }
  }
`}} />
