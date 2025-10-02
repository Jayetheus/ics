import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Search, Save, Edit, Trash2, Download, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  getSubjectsByCourse, 
  getCourses, 
  getUsers,
  getResultsByCourse,
  createResult,
  updateResult,
  deleteResult,
} from '../services/database';
import { Subject, Course, User, Result } from '../types';
import { GRADE_SCALE } from '../data/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface StudentResult {
  studentId: string;
  studentName: string;
  studentNumber: string;
  mark: number;
  grade: string;
  status: 'pending' | 'submitted' | 'published';
}

const ResultsEntry: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('Semester 1');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [editingResult, setEditingResult] = useState<Result | null>(null);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [assessmentType, setAssessmentType] = useState<'assignment' | 'test' | 'exam' | 'practical'>('assignment');
  const [assessmentName, setAssessmentName] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const [coursesData, usersData] = await Promise.all([
          getCourses(),
          getUsers()
        ]);
        setCourses(coursesData);
        setStudents(usersData.filter(user => user.role === 'student'));
      } catch (error) {
        console.error('Error fetching data:', error);
        addNotification({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load data'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, addNotification]);

  const fetchSubjects = async () => {
    try {
      const subjectsData = await getSubjectsByCourse(selectedCourse);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load subjects'
      });
    }
  };

  const fetchResults = async () => {
    if (!selectedSubject || !selectedCourse) return;
    
    try {
      const resultsData = await getResultsByCourse(selectedCourse);
      const filteredResults = resultsData.filter(r => 
        r.subjectCode === selectedSubject && 
        r.semester === selectedSemester &&
        r.year === selectedYear
      );
      setResults(filteredResults);
    } catch (error) {
      console.error('Error fetching results:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load results'
      });
    }
  };

  const fetchStudentsForSubject = useCallback(() => {
    if (!selectedSubject || !students.length) {
      setStudentResults([]);
      return;
    }

    const enrolledStudents = students.filter(student => 
      student.enrolledSubjects?.includes(selectedSubject)
    );
    
    const studentResultsData: StudentResult[] = enrolledStudents.map(student => {
      const existingResult = results.find(r => 
        r.studentId === student.uid && 
        r.subjectCode === selectedSubject &&
        r.semester === selectedSemester &&
        r.year === selectedYear
      );
      
      return {
        studentId: student.uid,
        studentName: `${student.firstName} ${student.lastName}`,
        studentNumber: student.studentNumber || '',
        mark: existingResult?.mark || 0,
        grade: existingResult?.grade || calculateGrade(existingResult?.mark || 0),
        status: existingResult ? 'submitted' : 'pending'
      };
    });
    
    setStudentResults(studentResultsData);
  }, [selectedSubject, students, results, selectedSemester, selectedYear]);

  useEffect(() => {
    if (selectedCourse) {
      fetchSubjects();
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedSubject && selectedCourse) {
      fetchResults();
    }
  }, [selectedSubject, selectedCourse, selectedSemester, selectedYear]);

  useEffect(() => {
    if (selectedSubject && selectedCourse) {
      fetchStudentsForSubject();
    }
  }, [selectedSubject, selectedCourse, fetchStudentsForSubject]);

  const calculateGrade = (mark: number): string => {
    const percentage = maxMarks > 0 ? (mark / maxMarks) * 100 : 0;
    const grade = GRADE_SCALE.find(g => percentage >= g.min && percentage <= g.max);
    return grade?.grade || 'F';
  };

  const handleSaveResults = async () => {
    if (!selectedSubject || !selectedCourse) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a subject and course'
      });
      return;
    }

    if (!assessmentName.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter an assessment name'
      });
      return;
    }

    if (maxMarks <= 0) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Maximum marks must be greater than 0'
      });
      return;
    }

    try {
      setSaving(true);
      const subject = subjects.find(s => s.code === selectedSubject);
      if (!subject) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Selected subject not found'
        });
        return;
      }

      const resultsToSave = studentResults.filter(sr => sr.mark > 0);
      
      if (resultsToSave.length === 0) {
        addNotification({
          type: 'warning',
          title: 'No Results',
          message: 'No results to save. Please enter marks for at least one student.'
        });
        return;
      }

      // Validate marks don't exceed max marks
      const invalidMarks = resultsToSave.filter(sr => sr.mark > maxMarks);
      if (invalidMarks.length > 0) {
        addNotification({
          type: 'error',
          title: 'Validation Error',
          message: `Some marks exceed maximum marks (${maxMarks}). Please adjust the marks.`
        });
        return;
      }

      const savePromises = resultsToSave.map(async (studentResult) => {
        const resultData = {
          studentId: studentResult.studentId,
          subjectId: selectedSubject,
          subjectName: subject.name,
          subjectCode: selectedSubject,
          courseCode: selectedCourse,
          mark: studentResult.mark,
          grade: calculateGrade(studentResult.mark),
          semester: selectedSemester,
          year: selectedYear,
          assessmentType,
          assessmentName: assessmentName.trim(),
          maxMarks,
          percentage: maxMarks > 0 ? (studentResult.mark / maxMarks) * 100 : 0,
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.uid || '',
          lastModified: new Date().toISOString(),
          lastModifiedBy: currentUser?.uid || ''
        };

        const existingResult = results.find(r => 
          r.studentId === studentResult.studentId && 
          r.subjectCode === selectedSubject &&
          r.semester === selectedSemester &&
          r.year === selectedYear
        );

        if (existingResult) {
          return updateResult(existingResult.id, resultData);
        } else {
          return createResult(resultData);
        }
      });

      await Promise.all(savePromises);
      await fetchResults();
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: `Results saved successfully for ${resultsToSave.length} students`
      });
      
      setEditingResult(null);
    } catch (error) {
      console.error('Error saving results:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save results. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkChange = (studentId: string, mark: number) => {
    setStudentResults(prev => prev.map(sr => 
      sr.studentId === studentId 
        ? { 
            ...sr, 
            mark: Math.max(0, mark), 
            grade: calculateGrade(mark), 
            status: mark > 0 ? 'submitted' : 'pending' 
          }
        : sr
    ));
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return;

    try {
      await deleteResult(resultId);
      await fetchResults();
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Result deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting result:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete result'
      });
    }
  };

  const handleEditResult = (result: Result) => {
    setEditingResult(result);
    handleMarkChange(result.studentId, result.mark);
  };

  const handleCancelEdit = () => {
    setEditingResult(null);
    fetchResults(); // Refresh to get original data
  };

  const exportResults = () => {
    if (studentResults.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Data',
        message: 'No results to export'
      });
      return;
    }

    const csvContent = [
      ['Student Number', 'Student Name', 'Mark', 'Grade', 'Status', 'Percentage'],
      ...studentResults.map(sr => [
        sr.studentNumber,
        `"${sr.studentName}"`,
        sr.mark.toString(),
        sr.grade,
        sr.status,
        maxMarks > 0 ? ((sr.mark / maxMarks) * 100).toFixed(1) + '%' : '0%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `results-${selectedSubject}-${assessmentName}-${selectedSemester}-${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    addNotification({
      type: 'success',
      title: 'Export Successful',
      message: 'Results exported to CSV file'
    });
  };

  const filteredStudents = studentResults.filter(sr =>
    sr.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sr.studentNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasUnsavedChanges = studentResults.some(sr => {
    const existingResult = results.find(r => 
      r.studentId === sr.studentId && 
      r.subjectCode === selectedSubject &&
      r.semester === selectedSemester &&
      r.year === selectedYear
    );
    return existingResult ? existingResult.mark !== sr.mark : sr.mark > 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Results Entry</h1>
            <p className="text-gray-600 mt-1">Enter and manage student assessment results</p>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Editing Banner */}
      {editingResult && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Edit className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">Editing Mode</span>
              <span className="text-yellow-600 ml-2">You are currently editing a result</span>
            </div>
            <button
              onClick={handleCancelEdit}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Course and Subject Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Assessment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedSubject('');
                setStudentResults([]);
                setResults([]);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.code}>{course.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedCourse}
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.code}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedSubject && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type</label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="assignment">Assignment</option>
                <option value="test">Test</option>
                <option value="exam">Exam</option>
                <option value="practical">Practical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Name</label>
              <input
                type="text"
                value={assessmentName}
                onChange={(e) => setAssessmentName(e.target.value)}
                placeholder="e.g., Assignment 1, Mid-term Test"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Marks</label>
              <input
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                min="1"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Entry */}
      {selectedSubject && (
        <>
          {/* Search and Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportResults}
                  disabled={studentResults.length === 0}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
                <button
                  onClick={handleSaveResults}
                  disabled={saving || !hasUnsavedChanges}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Results'}
                </button>
              </div>
            </div>
            
            {hasUnsavedChanges && (
              <div className="mt-3 text-sm text-blue-600 flex items-center">
                <Save className="h-4 w-4 mr-1" />
                You have unsaved changes
              </div>
            )}
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mark
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.studentNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            value={student.mark}
                            onChange={(e) => handleMarkChange(student.studentId, Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-xs text-gray-500">/ {maxMarks}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.grade === 'A+' || student.grade === 'A' ? 'bg-green-100 text-green-800' :
                          student.grade === 'B+' || student.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          student.grade === 'C+' || student.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {student.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.status === 'submitted' ? 'bg-green-100 text-green-800' :
                          student.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              const result = results.find(r => r.studentId === student.studentId);
                              if (result) handleEditResult(result);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit result"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {results.find(r => r.studentId === student.studentId) && (
                            <button
                              onClick={() => {
                                const result = results.find(r => r.studentId === student.studentId);
                                if (result) handleDeleteResult(result.id);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete result"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'No students enrolled in this subject.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ResultsEntry;