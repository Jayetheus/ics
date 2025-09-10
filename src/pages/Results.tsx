import React, { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, Award, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getResultsByStudent } from '../services/database';
import { Result } from '../types';

const Results: React.FC = () => {
  const { currentUser } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    const fetchResults = async () => {
      if (!currentUser) return;
      
      try {
        // For demo purposes, using sample data
        const sampleResults: Result[] = [
          {
            id: '1',
            studentId: currentUser.uid,
            courseId: 'cs101',
            courseName: 'Computer Science 101',
            courseCode: 'CS101',
            mark: 85,
            grade: 'A',
            semester: 'Semester 1',
            year: 2024
          },
          {
            id: '2',
            studentId: currentUser.uid,
            courseId: 'math101',
            courseName: 'Mathematics 101',
            courseCode: 'MATH101',
            mark: 78,
            grade: 'B+',
            semester: 'Semester 1',
            year: 2024
          },
          {
            id: '3',
            studentId: currentUser.uid,
            courseId: 'phys101',
            courseName: 'Physics 101',
            courseCode: 'PHYS101',
            mark: 92,
            grade: 'A+',
            semester: 'Semester 1',
            year: 2024
          },
          {
            id: '4',
            studentId: currentUser.uid,
            courseId: 'cs201',
            courseName: 'Data Structures',
            courseCode: 'CS201',
            mark: 88,
            grade: 'A',
            semester: 'Semester 2',
            year: 2024
          },
          {
            id: '5',
            studentId: currentUser.uid,
            courseId: 'eng101',
            courseName: 'English 101',
            courseCode: 'ENG101',
            mark: 75,
            grade: 'B',
            semester: 'Semester 2',
            year: 2024
          }
        ];
        
        setResults(sampleResults);
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [currentUser]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-orange-100 text-orange-800';
      case 'F':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateGPA = (results: Result[]) => {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, result) => sum + result.mark, 0);
    return (total / results.length).toFixed(2);
  };

  const filteredResults = results.filter(result => {
    const semesterMatch = selectedSemester === 'all' || result.semester === selectedSemester;
    const yearMatch = selectedYear === 'all' || result.year.toString() === selectedYear;
    return semesterMatch && yearMatch;
  });

  const semesters = [...new Set(results.map(r => r.semester))];
  const years = [...new Set(results.map(r => r.year.toString()))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Results</h1>
            <p className="text-gray-600 mt-1">View your academic performance and grades</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Download Transcript
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{results.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Average Grade</p>
              <p className="text-2xl font-semibold text-gray-900">{calculateGPA(results)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Highest Grade</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.max(...results.map(r => r.mark))}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Current Year</p>
              <p className="text-2xl font-semibold text-gray-900">2024</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Semesters</option>
              {semesters.map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Course Results</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mark
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResults.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{result.courseName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{result.courseCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{result.semester}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{result.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{result.mark}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.grade)}`}>
                      {result.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">
              {selectedSemester !== 'all' || selectedYear !== 'all' 
                ? 'Try adjusting your filter criteria.'
                : 'Your results will appear here once they are available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;