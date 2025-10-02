import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Save, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  getCourses,
  getSubjectsByCourse,
  getUsers,
  getResultsByCourse,
  createResult,
  updateResult,
  deleteResult
} from '../services/database';
import { Course, Subject, User, Result } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ResultsManagement: React.FC = () => {
  useAuth();
  const { addNotification } = useNotification();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formMark, setFormMark] = useState<number | ''>('');
  const [formGrade, setFormGrade] = useState<string>('');
  const [editingResult, setEditingResult] = useState<Result | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [coursesData, usersData] = await Promise.all([getCourses(), getUsers()]);
        setCourses(coursesData);
        // keep only students
        setStudents(usersData.filter(u => u.role === 'student'));
      } catch (err) {
        console.error(err);
        addNotification({ type: 'error', title: 'Error', message: 'Failed to load initial data' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addNotification]);

  useEffect(() => {
    if (!selectedCourse) {
      setSubjects([]);
      setSelectedSubject('');
      return;
    }

    const loadSubjects = async () => {
      setLoading(true);
      try {
        const subs = await getSubjectsByCourse(selectedCourse);
        setSubjects(subs);
      } catch (err) {
        console.error(err);
        addNotification({ type: 'error', title: 'Error', message: 'Failed to load subjects' });
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, [selectedCourse, addNotification]);

  useEffect(() => {
    if (!selectedSubject) {
      setResults([]);
      return;
    }

    const loadResults = async () => {
      setLoading(true);
      try {
        // fetch results for the course and filter by subject
        const courseResults = await getResultsByCourse(selectedCourse || '');
        const subjectResults = courseResults.filter(r => r.subjectCode === selectedSubject);
        setResults(subjectResults);
      } catch (err) {
        console.error(err);
        addNotification({ type: 'error', title: 'Error', message: 'Failed to load results' });
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [selectedSubject, selectedCourse, addNotification]);

  const filteredStudents = students.filter(s => {
    const full = `${s.firstName} ${s.lastName}`.toLowerCase();
    return (
      full.includes(searchTerm.toLowerCase()) ||
      (s.studentNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const calculateGrade = (mark: number) => {
    if (mark >= 80) return 'A';
    if (mark >= 70) return 'B';
    if (mark >= 60) return 'C';
    if (mark >= 50) return 'D';
    return 'F';
  };

  const handleSelectStudent = (uid: string) => {
    setSelectedStudent(uid);
    // populate mark if existing result
    const existing = results.find(r => r.studentId === uid);
    if (existing) {
      setFormMark(typeof existing.mark === 'number' ? existing.mark : Number(existing.mark || 0));
      setFormGrade(existing.grade || calculateGrade(Number(existing.mark || 0)));
      setEditingResult(existing);
    } else {
      setFormMark('');
      setFormGrade('');
      setEditingResult(null);
    }
  };

  const handleSave = async () => {
    if (!selectedCourse || !selectedSubject || !selectedStudent) {
      addNotification({ type: 'error', title: 'Validation', message: 'Select course, subject and student' });
      return;
    }
    const markNum = Number(formMark) || 0;
    const payload: Omit<Result, 'id'> = {
      studentId: selectedStudent,
      subjectId: selectedSubject,
      subjectName: subjects.find(s => s.code === selectedSubject)?.name || '',
      subjectCode: selectedSubject,
      courseCode: selectedCourse,
      mark: markNum,
      grade: formGrade || calculateGrade(markNum),
      semester: new Date().getMonth() < 6 ? 'Semester 1' : 'Semester 2',
      year: new Date().getFullYear()
    } as any;

    try {
      if (editingResult) {
        await updateResult(editingResult.id, payload as Partial<Result>);
        addNotification({ type: 'success', title: 'Updated', message: 'Result updated' });
      } else {
        await createResult(payload);
        addNotification({ type: 'success', title: 'Created', message: 'Result created' });
      }

      // refresh
      const courseResults = await getResultsByCourse(selectedCourse);
      setResults(courseResults.filter(r => r.subjectCode === selectedSubject));
      setFormMark('');
      setFormGrade('');
      setSelectedStudent('');
      setEditingResult(null);
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', title: 'Error', message: 'Failed to save result' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this result?')) return;
    try {
      await deleteResult(id);
      setResults(prev => prev.filter(r => r.id !== id));
      addNotification({ type: 'success', title: 'Deleted', message: 'Result deleted' });
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', title: 'Error', message: 'Failed to delete result' });
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-64"><LoadingSpinner size="lg" message="Loading..." /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Results Management</h1>
          <p className="text-gray-600">Create and update student marks</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full px-3 py-2 border rounded-md">
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.code}>{c.name} ({c.code})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 border rounded-md">
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.code}>{s.name} ({s.code})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Student</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 px-3 py-2 border rounded-md" placeholder="Search by name or number" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Students</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredStudents.map(s => (
              <button key={s.uid} onClick={() => handleSelectStudent(s.uid)} className={`w-full text-left p-2 rounded-md transition-colors ${selectedStudent === s.uid ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}>
                <div className="font-medium">{s.firstName} {s.lastName}</div>
                <div className="text-sm text-gray-500">{s.studentNumber || 'N/A'}</div>
              </button>
            ))}
            {filteredStudents.length === 0 && <div className="text-sm text-gray-500">No students found</div>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Enter Marks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Selected Student</label>
              <div className="p-2 border rounded-md">{selectedStudent ? (students.find(s => s.uid === selectedStudent)?.firstName + ' ' + students.find(s => s.uid === selectedStudent)?.lastName) : 'None'}</div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Mark</label>
              <input type="number" min={0} max={100} value={formMark as any} onChange={e => { const v = e.target.value; setFormMark(v === '' ? '' : Number(v)); setFormGrade(v === '' ? '' : calculateGrade(Number(v))); }} className="w-full px-3 py-2 border rounded-md" />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Grade</label>
              <input value={formGrade} readOnly className="w-full px-3 py-2 border rounded-md bg-gray-50" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => { setFormMark(''); setFormGrade(''); setSelectedStudent(''); setEditingResult(null); }} className="px-4 py-2 bg-gray-100 rounded-md">Clear</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"><Save className="h-4 w-4 mr-2" />{editingResult ? 'Update' : 'Save'}</button>
          </div>

          <div className="mt-6">
            <h3 className="font-medium mb-2">Existing Results (Subject)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Student</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mark</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Grade</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map(r => {
                    const student = students.find(s => s.uid === r.studentId);
                    return (
                      <tr key={r.id}>
                        <td className="px-4 py-2">{student ? `${student.firstName} ${student.lastName}` : 'Unknown'}</td>
                        <td className="px-4 py-2">{r.mark}</td>
                        <td className="px-4 py-2">{r.grade}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedStudent(r.studentId); setFormMark(Number(r.mark)); setFormGrade(r.grade); setEditingResult(r); }} className="text-blue-600"><Edit /></button>
                            <button onClick={() => handleDelete(r.id)} className="text-red-600"><Trash2 /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsManagement;
