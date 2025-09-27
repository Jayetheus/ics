import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  BookOpen,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  getUsers,
  getSubjectsByCourse,
  getCourses,
  getTimetableByCourse,
  getResultsByCourse,
  getAttendanceRecordsBySession
} from '../services/database';
import { User, Subject, Course, Timetable, Result, AttendanceRecord } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface StudentWithStats extends User {
  enrolledSubjects: string[];
  totalSubjects: number;
  completedSubjects: number;
  avgMark: number;
  attendanceRate: number;
  lastActive: string;
}

const LecturerStudentManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        const [usersData, coursesData] = await Promise.all([
          getUsers(),
          getCourses()
        ]);
        
        setCourses(coursesData);
        const studentUsers = usersData.filter(user => user.role === 'student');
        
        // Get lecturer's subjects and timetable
        const lecturerSubjects: Subject[] = [];
        const lecturerTimetable: Timetable[] = [];
        const lecturerResults: Result[] = [];

        for (const course of coursesData) {
          try {
            const [subjectsData, timetableData, resultsData] = await Promise.all([
              getSubjectsByCourse(course.code),
              getTimetableByCourse(course.code),
              getResultsByCourse(course.code)
            ]);

            // Filter by lecturer
            const courseTimetable = timetableData.filter(entry => entry.lecturerId === currentUser.uid);
            const courseResults = resultsData.filter(result => 
              courseTimetable.some(entry => entry.subjectCode === result.subjectCode)
            );

            lecturerSubjects.push(...subjectsData);
            lecturerTimetable.push(...courseTimetable);
            lecturerResults.push(...courseResults);
          } catch (error) {
            console.error(`Error fetching data for course ${course.code}:`, error);
          }
        }

        setSubjects(lecturerSubjects);
        setTimetable(lecturerTimetable);
        setResults(lecturerResults);

        // Calculate student stats
        const studentsWithStats: StudentWithStats[] = studentUsers.map(student => {
          const studentSubjects = lecturerSubjects.filter(subject => 
            student.enrolledSubjects?.includes(subject.code)
          );
          
          const studentResults = lecturerResults.filter(result => 
            result.studentId === student.uid
          );
          
          const avgMark = studentResults.length > 0 
            ? studentResults.reduce((sum, result) => sum + result.mark, 0) / studentResults.length
            : 0;

          const completedSubjects = studentResults.filter(result => result.mark >= 50).length;
          
          return {
            ...student,
            enrolledSubjects: student.enrolledSubjects || [],
            totalSubjects: studentSubjects.length,
            completedSubjects,
            avgMark: Math.round(avgMark),
            attendanceRate: 85, // This would be calculated from attendance records
            lastActive: new Date().toISOString().split('T')[0]
          };
        });

        setStudents(studentsWithStats);
      } catch (error) {
        console.error('Error fetching data:', error);
        addNotification({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load student data'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, addNotification]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    const matchesYear = filterYear === 'all' || student.year?.toString() === filterYear;
    const matchesCourse = !selectedCourse || student.courseCode === selectedCourse;
    const matchesSubject = !selectedSubject || student.enrolledSubjects?.includes(selectedSubject);
    
    return matchesSearch && matchesStatus && matchesYear && matchesCourse && matchesSubject;
  });

  const getStudentResults = (studentId: string) => {
    return results.filter(result => result.studentId === studentId);
  };

  const getStudentAttendance = (studentId: string) => {
    // This would be calculated from actual attendance records
    return {
      totalSessions: 20,
      attended: 17,
      rate: 85
    };
  };

  const exportStudentList = () => {
    const csvContent = [
      ['Student Number', 'Name', 'Email', 'Course', 'Year', 'Status', 'Subjects', 'Avg Mark', 'Attendance'],
      ...filteredStudents.map(student => [
        student.studentNumber || '',
        `${student.firstName} ${student.lastName}`,
        student.email,
        student.courseCode || '',
        student.year?.toString() || '',
        student.status,
        student.enrolledSubjects?.length.toString() || '0',
        student.avgMark.toString(),
        `${student.attendanceRate}%`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-${selectedCourse || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getGradeColor = (mark: number) => {
    if (mark >= 80) return 'text-green-600';
    if (mark >= 70) return 'text-blue-600';
    if (mark >= 60) return 'text-yellow-600';
    if (mark >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-600 mt-1">View and manage your students</p>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Students</p>
              <p className="text-2xl font-semibold text-gray-900">
                {students.filter(s => s.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Performance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.avgMark, 0) / students.length) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Courses</option>
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
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.code}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
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

          <div className="flex items-end">
            <button
              onClick={exportStudentList}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subjects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Mark
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
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
                <tr key={student.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {student.firstName[0]}{student.lastName[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{student.studentNumber}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.courseCode || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.year || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.enrolledSubjects?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={getGradeColor(student.avgMark)}>
                      {student.avgMark}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.attendanceRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.status === 'active' ? 'bg-green-100 text-green-800' :
                      student.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowStudentDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Mail className="h-4 w-4" />
                      </button>
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
              {searchTerm || selectedCourse || selectedSubject || filterStatus !== 'all' || filterYear !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No students enrolled in your subjects.'}
            </p>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showStudentDetails && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Student Details - {selectedStudent.firstName} {selectedStudent.lastName}
              </h3>
              <button
                onClick={() => setShowStudentDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Personal Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Student Number:</span>
                    <span className="text-sm font-medium">{selectedStudent.studentNumber}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium">{selectedStudent.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm font-medium">{selectedStudent.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Address:</span>
                    <span className="text-sm font-medium">{selectedStudent.address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Academic Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Course:</span>
                    <span className="text-sm font-medium">{selectedStudent.courseCode || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Year:</span>
                    <span className="text-sm font-medium">{selectedStudent.year || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Average Mark:</span>
                    <span className={`text-sm font-medium ${getGradeColor(selectedStudent.avgMark)}`}>
                      {selectedStudent.avgMark}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Attendance Rate:</span>
                    <span className="text-sm font-medium">{selectedStudent.attendanceRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Academic Results</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mark</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getStudentResults(selectedStudent.uid).map((result, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{result.subjectName}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <span className={getGradeColor(result.mark)}>
                            {result.mark}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{result.grade}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{result.semester}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerStudentManagement;

