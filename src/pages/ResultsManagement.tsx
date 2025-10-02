import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Save, Search, FileText, Plus, X } from 'lucide-react';
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
  
  // New assessment fields
  const [assessmentType, setAssessmentType] = useState<'exam' | 'test' | 'assignment' | 'practical'>('assignment');
  const [assessmentName, setAssessmentName] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [showAssessmentFields, setShowAssessmentFields] = useState(false);

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
    const percentage = maxMarks > 0 ? (mark / maxMarks) * 100 : 0;
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
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
      // Populate assessment fields if they exist
      if (existing.assessmentType) {
        setAssessmentType(existing.assessmentType as any);
      }
      if (existing.assessmentName) {
        setAssessmentName(existing.assessmentName);
        setShowAssessmentFields(true);
      }
      if (existing.maxMarks) {
        setMaxMarks(existing.maxMarks);
      }
    } else {
      setFormMark('');
      setFormGrade('');
      setEditingResult(null);
      // Reset assessment fields for new entries
      setAssessmentType('assignment');
      setAssessmentName('');
      setMaxMarks(100);
    }
  };

  const handleSave = async () => {
    if (!selectedCourse || !selectedSubject || !selectedStudent) {
      addNotification({ type: 'error', title: 'Validation', message: 'Select course, subject and student' });
      return;
    }

    if (showAssessmentFields && !assessmentName.trim()) {
      addNotification({ type: 'error', title: 'Validation', message: 'Please enter an assessment name' });
      return;
    }

    const markNum = Number(formMark) || 0;
    
    // Validate mark doesn't exceed max marks
    if (markNum > maxMarks) {
      addNotification({ 
        type: 'error', 
        title: 'Validation Error', 
        message: `Mark cannot exceed maximum marks (${maxMarks})` 
      });
      return;
    }

    const payload: Omit<Result, 'id'> = {
      studentId: selectedStudent,
      subjectId: selectedSubject,
      subjectName: subjects.find(s => s.code === selectedSubject)?.name || '',
      subjectCode: selectedSubject,
      courseCode: selectedCourse,
      mark: markNum,
      grade: formGrade || calculateGrade(markNum),
      semester: new Date().getMonth() < 6 ? 'Semester 1' : 'Semester 2',
      year: new Date().getFullYear(),
      // Include assessment fields
      ...(showAssessmentFields && {
        assessmentType,
        assessmentName: assessmentName.trim(),
        maxMarks,
        percentage: maxMarks > 0 ? (markNum / maxMarks) * 100 : 0
      }),
      createdAt: editingResult ? editingResult.createdAt : new Date().toISOString(),
      createdBy: editingResult ? editingResult.createdBy : 'current-user-id', // Replace with actual user ID
      lastModified: new Date().toISOString(),
      lastModifiedBy: 'current-user-id' // Replace with actual user ID
    } as any;

    try {
      if (editingResult) {
        await updateResult(editingResult.id, payload as Partial<Result>);
        addNotification({ type: 'success', title: 'Updated', message: 'Result updated successfully' });
      } else {
        await createResult(payload);
        addNotification({ type: 'success', title: 'Created', message: 'Result created successfully' });
      }

      // refresh
      const courseResults = await getResultsByCourse(selectedCourse);
      setResults(courseResults.filter(r => r.subjectCode === selectedSubject));
      resetForm();
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
      addNotification({ type: 'success', title: 'Deleted', message: 'Result deleted successfully' });
      
      // If we're deleting the currently edited result, reset the form
      if (editingResult?.id === id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      addNotification({ type: 'error', title: 'Error', message: 'Failed to delete result' });
    }
  };

  const resetForm = () => {
    setFormMark('');
    setFormGrade('');
    setSelectedStudent('');
    setEditingResult(null);
    setAssessmentType('assignment');
    setAssessmentName('');
    setMaxMarks(100);
    setShowAssessmentFields(false);
  };

  const toggleAssessmentFields = () => {
    setShowAssessmentFields(!showAssessmentFields);
    if (!showAssessmentFields) {
      // When showing fields, set default values
      setAssessmentType('assignment');
      setAssessmentName('');
      setMaxMarks(100);
    } else {
      // When hiding fields, clear the values
      setAssessmentName('');
    }
  };

  const getAssessmentTypeColor = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-red-100 text-red-800 border-red-200';
      case 'test': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'assignment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'practical': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-64"><LoadingSpinner size="lg" message="Loading..." /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results Management</h1>
          <p className="text-gray-600">Create and update student marks with detailed assessment information</p>
        </div>
        <div className="flex items-center space-x-2">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Course and Subject Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Course and Subject</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <select 
              value={selectedCourse} 
              onChange={e => {
                setSelectedCourse(e.target.value);
                setSelectedSubject('');
                resetForm();
              }} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.code}>{c.name} ({c.code})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select 
              value={selectedSubject} 
              onChange={e => {
                setSelectedSubject(e.target.value);
                resetForm();
              }} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedCourse}
            >
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.code}>{s.name} ({s.code})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Student</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Search by name or number" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="bg-white rounded-lg shadow-sm border p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Students</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredStudents.map(s => (
              <button 
                key={s.uid} 
                onClick={() => handleSelectStudent(s.uid)} 
                className={`w-full text-left p-3 rounded-md transition-colors border ${
                  selectedStudent === s.uid 
                    ? 'bg-blue-50 border-blue-300 shadow-sm' 
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{s.firstName} {s.lastName}</div>
                <div className="text-sm text-gray-500 mt-1">{s.studentNumber || 'No student number'}</div>
                {results.find(r => r.studentId === s.uid) && (
                  <div className="text-xs text-green-600 mt-1 font-medium">Result exists</div>
                )}
              </button>
            ))}
            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div>No students found</div>
                {searchTerm && <div className="text-sm mt-1">Try adjusting your search</div>}
              </div>
            )}
          </div>
        </div>

        {/* Marks Entry and Results */}
        <div className="bg-white rounded-lg shadow-sm border p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingResult ? 'Edit Result' : 'Enter Marks'}
          </h2>

          {/* Student Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Selected Student</h3>
                <p className="text-gray-600 mt-1">
                  {selectedStudent 
                    ? `${students.find(s => s.uid === selectedStudent)?.firstName} ${students.find(s => s.uid === selectedStudent)?.lastName}`
                    : 'No student selected'
                  }
                </p>
                {selectedStudent && (
                  <p className="text-sm text-gray-500 mt-1">
                    Student Number: {students.find(s => s.uid === selectedStudent)?.studentNumber || 'N/A'}
                  </p>
                )}
              </div>
              {selectedStudent && (
                <button
                  onClick={toggleAssessmentFields}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    showAssessmentFields
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {showAssessmentFields ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                  {showAssessmentFields ? 'Hide Details' : 'Add Details'}
                </button>
              )}
            </div>
          </div>

          {/* Basic Marks Entry */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mark</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  min={0} 
                  max={maxMarks}
                  value={formMark as any} 
                  onChange={e => { 
                    const v = e.target.value; 
                    setFormMark(v === '' ? '' : Number(v)); 
                    setFormGrade(v === '' ? '' : calculateGrade(Number(v))); 
                  }} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Enter mark"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">/ {maxMarks}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
              <input 
                value={formGrade} 
                readOnly 
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-medium" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Percentage</label>
              <input 
                value={formMark && maxMarks > 0 ? `${((Number(formMark) / maxMarks) * 100).toFixed(1)}%` : '0%'} 
                readOnly 
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" 
              />
            </div>
          </div>

          {/* Assessment Details - Conditionally Shown */}
          {showAssessmentFields && (
            <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Assessment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Assessment Type</label>
                  <select
                    value={assessmentType}
                    onChange={e => setAssessmentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="test">Test</option>
                    <option value="exam">Exam</option>
                    <option value="practical">Practical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Assessment Name</label>
                  <input
                    type="text"
                    value={assessmentName}
                    onChange={e => setAssessmentName(e.target.value)}
                    placeholder="e.g., Final Exam, Assignment 1"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Maximum Marks</label>
                  <input
                    type="number"
                    value={maxMarks}
                    onChange={e => {
                      const newMax = Number(e.target.value);
                      setMaxMarks(newMax);
                      // Recalculate grade if we have a mark
                      if (formMark) {
                        setFormGrade(calculateGrade(Number(formMark)));
                      }
                    }}
                    min="1"
                    max="1000"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button 
              onClick={resetForm} 
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              Clear
            </button>
            <button 
              onClick={handleSave} 
              disabled={!selectedStudent || formMark === ''}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingResult ? 'Update Result' : 'Save Result'}
            </button>
          </div>

          {/* Existing Results Table */}
          <div className="mt-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Existing Results for {subjects.find(s => s.code === selectedSubject)?.name || 'Selected Subject'}
            </h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mark</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map(r => {
                    const student = students.find(s => s.uid === r.studentId);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{student ? `${student.firstName} ${student.lastName}` : 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{student?.studentNumber || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{r.mark}</div>
                          {r.maxMarks && (
                            <div className="text-sm text-gray-500">/ {r.maxMarks}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            r.grade === 'A' ? 'bg-green-100 text-green-800' :
                            r.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            r.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            r.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {r.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {r.assessmentName ? (
                            <div className="flex flex-col space-y-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getAssessmentTypeColor(r.assessmentType || 'assignment')}`}>
                                {r.assessmentType || 'assignment'}
                              </span>
                              <span className="text-sm text-gray-600">{r.assessmentName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No details</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleSelectStudent(r.studentId)} 
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Edit result"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(r.id)} 
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete result"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {results.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <div>No results recorded for this subject</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsManagement;