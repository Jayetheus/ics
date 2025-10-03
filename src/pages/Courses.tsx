import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  FileText, 
  Search, 
  Filter, 
  Eye,
  Download,
  Upload,
  BarChart3,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  getSubjectsByCourse, 
  getCourses, 
  getUsers,
  getTimetableByCourse,
  getAttendanceSessionsByLecturer,
  getResultsByCourse
} from '../services/database';
import { Subject, Course, User, Timetable, AttendanceSession, Result } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface CourseStats {
  totalStudents: number;
  totalSubjects: number;
  totalClasses: number;
  avgAttendance: number;
}

const Courses: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [stats, setStats] = useState<CourseStats>({
    totalStudents: 0,
    totalSubjects: 0,
    totalClasses: 0,
    avgAttendance: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
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

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseData();
    }
  }, [selectedCourse]);

  const fetchCourseData = async () => {
    try {
      const [subjectsData, timetableData, sessionsData, resultsData] = await Promise.all([
        getSubjectsByCourse(selectedCourse),
        getTimetableByCourse(selectedCourse),
        getAttendanceSessionsByLecturer(currentUser?.uid || ''),
        getResultsByCourse(selectedCourse)
      ]);

      setSubjects(subjectsData);
      setTimetable(timetableData);
      setAttendanceSessions(sessionsData);
      setResults(resultsData);

      // Calculate stats
      const enrolledStudents = students.filter(student => 
        student.enrolledSubjects?.some(subjectCode => 
          subjectsData.some(subject => subject.code === subjectCode)
        )
      );

      const totalClasses = timetableData.length;
      const avgAttendance = sessionsData.length > 0 
        ? sessionsData.reduce((sum, session) => sum + (session.isActive ? 1 : 0), 0) / sessionsData.length * 100
        : 0;

      setStats({
        totalStudents: enrolledStudents.length,
        totalSubjects: subjectsData.length,
        totalClasses,
        avgAttendance: Math.round(avgAttendance)
      });
    } catch (error) {
      console.error('Error fetching course data:', error);
    }
  };

  const getUpcomingClasses = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return timetable
      .filter(entry => {
        const entryDate = new Date(entry.day);
        return entryDate >= today && entryDate <= tomorrow;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 5);
  };

  const getRecentAttendance = () => {
    return attendanceSessions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const getSubjectStats = (subjectCode: string) => {
    const subjectResults = results.filter(r => r.subjectCode === subjectCode);
    const avgMark = subjectResults.length > 0 
      ? subjectResults.reduce((sum, r) => sum + r.mark, 0) / subjectResults.length
      : 0;
    
    return {
      totalStudents: students.filter(s => s.enrolledSubjects?.includes(subjectCode)).length,
      avgMark: Math.round(avgMark),
      totalResults: subjectResults.length
    };
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSemester = filterSemester === 'all' || subject.semester === filterSemester;
    
    return matchesSearch && matchesSemester;
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
            <h1 className="text-2xl font-bold text-gray-900">My Courses & Subjects</h1>
            <p className="text-gray-600 mt-1">Manage your assigned courses and subjects</p>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Course Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Course</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.code}>{course.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedCourse && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Subjects</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalSubjects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Classes</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalClasses}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">{stats.avgAttendance}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Classes */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Upcoming Classes
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {getUpcomingClasses().map((class_, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{class_.startTime} - {class_.endTime}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{class_.subjectName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{class_.venue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getUpcomingClasses().length === 0 && (
                    <p className="text-gray-500 text-center py-4">No upcoming classes</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Attendance Sessions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Recent Attendance
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {getRecentAttendance().map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{session.subjectName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{session.date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{session.startTime} - {session.endTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          session.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.isActive ? 'Active' : 'Completed'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {getRecentAttendance().length === 0 && (
                    <p className="text-gray-500 text-center py-4">No recent attendance sessions</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Subjects Management */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Subjects</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <select
                      value={filterSemester}
                      onChange={(e) => setFilterSemester(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Semesters</option>
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Mark
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubjects.map((subject) => {
                    const subjectStats = getSubjectStats(subject.code);
                    return (
                      <tr key={subject.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{subject.code}</div>
                            <div className="text-sm text-gray-500">{subject.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.credits}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subjectStats.totalStudents}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subjectStats.avgMark > 0 ? `${subjectStats.avgMark}%` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredSubjects.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterSemester !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No subjects assigned to this course.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Courses;


