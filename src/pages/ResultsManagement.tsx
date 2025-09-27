import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Plus, Edit, Trash2, Search, Filter, 
  CheckCircle, XCircle, AlertCircle, Save, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  getSubjectsByLecturer, 
  getStudentsBySubject, 
  getResultsByLecturer,
  createResult,
  updateResult,
  deleteResult
} from '../services/appwriteDatabase';
import { Result, User } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
}

const ResultsManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [students, setStudents] = useState<User[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResult, setEditingResult] = useState<Result | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    subjectCode: '',
    assignment: '',
    exam: '',
    project: '',
    total: '',
    grade: '',
    comments: ''
  });

  useEffect(() => {
    loadSubjects();
  }, [currentUser]);

  useEffect(() => {
    if (selectedSubject) {
      loadStudents();
      loadResults();
    }
  }, [selectedSubject]);

  const loadSubjects = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      const lecturerSubjects = await getSubjectsByLecturer(currentUser.uid);
      setSubjects(lecturerSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load subjects'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!selectedSubject) return;
    
    try {
      const subjectStudents = await getStudentsBySubject(selectedSubject);
      setStudents(subjectStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load students'
      });
    }
  };

  const loadResults = async () => {
    if (!currentUser?.uid || !selectedSubject) return;
    
    try {
      const lecturerResults = await getResultsByLecturer(currentUser.uid);
      const subjectResults = lecturerResults.filter(result => result.subjectCode === selectedSubject);
      setResults(subjectResults);
    } catch (error) {
      console.error('Error loading results:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load results'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.uid || !selectedSubject) return;

    try {
      const resultData = {
        studentId: formData.studentId,
        subjectCode: selectedSubject,
        lecturerId: currentUser.uid,
        assignment: parseFloat(formData.assignment) || 0,
        exam: parseFloat(formData.exam) || 0,
        project: parseFloat(formData.project) || 0,
        total: parseFloat(formData.total) || 0,
        grade: formData.grade,
        comments: formData.comments,
        semester: new Date().getMonth() < 6 ? 1 : 2, // Simple semester calculation
        academicYear: new Date().getFullYear().toString()
      };

      if (editingResult) {
        await updateResult(editingResult.id, resultData);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Result updated successfully'
        });
      } else {
        await createResult(resultData);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Result created successfully'
        });
      }

      setShowAddForm(false);
      setEditingResult(null);
      resetForm();
      loadResults();
    } catch (error) {
      console.error('Error saving result:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save result'
      });
    }
  };

  const handleEdit = (result: Result) => {
    setEditingResult(result);
    setFormData({
      studentId: result.studentId,
      subjectCode: result.subjectCode,
      assignment: result.assignment.toString(),
      exam: result.exam.toString(),
      project: result.project.toString(),
      total: result.total.toString(),
      grade: result.grade,
      comments: result.comments || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (resultId: string) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return;

    try {
      await deleteResult(resultId);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Result deleted successfully'
      });
      loadResults();
    } catch (error) {
      console.error('Error deleting result:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete result'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      subjectCode: '',
      assignment: '',
      exam: '',
      project: '',
      total: '',
      grade: '',
      comments: ''
    });
  };

  const calculateTotal = () => {
    const assignment = parseFloat(formData.assignment) || 0;
    const exam = parseFloat(formData.exam) || 0;
    const project = parseFloat(formData.project) || 0;
    const total = assignment + exam + project;
    
    setFormData(prev => ({
      ...prev,
      total: total.toString(),
      grade: total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : total >= 50 ? 'D' : 'F'
    }));
  };

  const filteredResults = results.filter(result => {
    const student = students.find(s => s.uid === result.studentId);
    const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : '';
    return studentName.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" message="Loading subjects..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results Management</h1>
          <p className="text-gray-600">Manage student results for your subjects</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingResult(null);
            resetForm();
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Result
        </button>
      </div>

      {/* Subject Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Subject</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => setSelectedSubject(subject.code)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedSubject === subject.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">{subject.name}</h3>
                  <p className="text-sm text-gray-600">{subject.code}</p>
                  <p className="text-xs text-gray-500">{subject.credits} credits</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSubject && (
        <>
          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
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
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Results for {subjects.find(s => s.code === selectedSubject)?.name}
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.map((result) => {
                    const student = students.find(s => s.uid === result.studentId);
                    return (
                      <tr key={result.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <Users className="h-5 w-5 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student?.studentNumber || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.assignment}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.exam}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.project}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            result.grade === 'A' ? 'bg-green-100 text-green-800' :
                            result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            result.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(result)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(result.id)}
                              className="text-red-600 hover:text-red-900"
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
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Result Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingResult ? 'Edit Result' : 'Add New Result'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingResult(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.uid} value={student.uid}>
                      {student.firstName} {student.lastName} ({student.studentNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.assignment}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, assignment: e.target.value }));
                      setTimeout(calculateTotal, 100);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.exam}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, exam: e.target.value }));
                      setTimeout(calculateTotal, 100);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.project}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, project: e.target.value }));
                      setTimeout(calculateTotal, 100);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Score
                  </label>
                  <input
                    type="number"
                    value={formData.total}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={formData.grade}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter any additional comments..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingResult(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingResult ? 'Update Result' : 'Create Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsManagement;
