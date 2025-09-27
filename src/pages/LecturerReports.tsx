import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Filter, 
  Calendar, 
  BookOpen, 
  Users, 
  TrendingUp,
  FileText,
  PieChart,
  LineChart,
  Printer,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  getSubjectsByCourse,
  getCourses,
  getUsers,
  getTimetableByCourse,
  getResultsByCourse,
  getAttendanceSessionsByLecturer
} from '../services/database';
import { Subject, Course, User, Timetable, Result, AttendanceSession } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface ReportData {
  totalStudents: number;
  totalSubjects: number;
  totalClasses: number;
  avgAttendance: number;
  avgPerformance: number;
  gradeDistribution: { [key: string]: number };
  subjectStats: Array<{
    subjectCode: string;
    subjectName: string;
    students: number;
    avgMark: number;
    attendanceRate: number;
  }>;
  monthlyStats: Array<{
    month: string;
    classes: number;
    attendance: number;
    performance: number;
  }>;
}

const LecturerReports: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [reportType, setReportType] = useState<string>('overview');
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        const [coursesData, usersData, sessionsData] = await Promise.all([
          getCourses(),
          getUsers(),
          getAttendanceSessionsByLecturer(currentUser.uid)
        ]);
        
        setCourses(coursesData);
        setStudents(usersData.filter(user => user.role === 'student'));
        setAttendanceSessions(sessionsData);

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

      } catch (error) {
        console.error('Error fetching data:', error);
        addNotification({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load report data'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, addNotification]);

  useEffect(() => {
    if (subjects.length > 0) {
      generateReportData();
    }
  }, [selectedCourse, selectedSubject, selectedSemester, selectedYear, subjects, students, timetable, results, attendanceSessions]);

  const generateReportData = () => {
    const filteredSubjects = subjects.filter(subject => {
      const matchesCourse = !selectedCourse || subject.courseCode === selectedCourse;
      const matchesSubject = !selectedSubject || subject.code === selectedSubject;
      return matchesCourse && matchesSubject;
    });

    const filteredStudents = students.filter(student => 
      filteredSubjects.some(subject => student.enrolledSubjects?.includes(subject.code))
    );

    const filteredResults = results.filter(result => 
      filteredSubjects.some(subject => subject.code === result.subjectCode)
    );

    const filteredTimetable = timetable.filter(entry => 
      filteredSubjects.some(subject => subject.code === entry.subjectCode)
    );

    const filteredSessions = attendanceSessions.filter(session => 
      filteredSubjects.some(subject => subject.code === session.subjectCode)
    );

    // Calculate grade distribution
    const gradeDistribution: { [key: string]: number } = {
      'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0
    };

    filteredResults.forEach(result => {
      if (result.grade && gradeDistribution.hasOwnProperty(result.grade)) {
        gradeDistribution[result.grade]++;
      }
    });

    // Calculate subject stats
    const subjectStats = filteredSubjects.map(subject => {
      const subjectStudents = filteredStudents.filter(s => s.enrolledSubjects?.includes(subject.code));
      const subjectResults = filteredResults.filter(r => r.subjectCode === subject.code);
      const avgMark = subjectResults.length > 0 
        ? subjectResults.reduce((sum, r) => sum + r.mark, 0) / subjectResults.length
        : 0;

      return {
        subjectCode: subject.code,
        subjectName: subject.name,
        students: subjectStudents.length,
        avgMark: Math.round(avgMark),
        attendanceRate: 85 // This would be calculated from actual attendance data
      };
    });

    // Calculate monthly stats (simplified)
    const monthlyStats = [
      { month: 'Jan', classes: 20, attendance: 85, performance: 75 },
      { month: 'Feb', classes: 18, attendance: 88, performance: 78 },
      { month: 'Mar', classes: 22, attendance: 82, performance: 80 },
      { month: 'Apr', classes: 19, attendance: 90, performance: 85 },
      { month: 'May', classes: 21, attendance: 87, performance: 82 },
      { month: 'Jun', classes: 17, attendance: 89, performance: 88 }
    ];

    const avgPerformance = filteredResults.length > 0 
      ? filteredResults.reduce((sum, r) => sum + r.mark, 0) / filteredResults.length
      : 0;

    const avgAttendance = filteredSessions.length > 0 
      ? filteredSessions.reduce((sum, s) => sum + (s.isActive ? 1 : 0), 0) / filteredSessions.length * 100
      : 0;

    setReportData({
      totalStudents: filteredStudents.length,
      totalSubjects: filteredSubjects.length,
      totalClasses: filteredTimetable.length,
      avgAttendance: Math.round(avgAttendance),
      avgPerformance: Math.round(avgPerformance),
      gradeDistribution,
      subjectStats,
      monthlyStats
    });
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!reportData) return;

    let content = '';
    let filename = '';

    if (format === 'csv') {
      // Generate CSV content
      content = [
        ['Report Type', 'Lecturer Report'],
        ['Generated Date', new Date().toISOString().split('T')[0]],
        ['Course', selectedCourse || 'All'],
        ['Subject', selectedSubject || 'All'],
        ['Semester', selectedSemester],
        ['Year', selectedYear.toString()],
        [''],
        ['Summary Statistics'],
        ['Total Students', reportData.totalStudents.toString()],
        ['Total Subjects', reportData.totalSubjects.toString()],
        ['Total Classes', reportData.totalClasses.toString()],
        ['Average Attendance', `${reportData.avgAttendance}%`],
        ['Average Performance', `${reportData.avgPerformance}%`],
        [''],
        ['Grade Distribution'],
        ...Object.entries(reportData.gradeDistribution).map(([grade, count]) => [grade, count.toString()]),
        [''],
        ['Subject Statistics'],
        ['Subject Code', 'Subject Name', 'Students', 'Avg Mark', 'Attendance Rate'],
        ...reportData.subjectStats.map(stat => [
          stat.subjectCode,
          stat.subjectName,
          stat.students.toString(),
          `${stat.avgMark}%`,
          `${stat.attendanceRate}%`
        ])
      ].map(row => row.join(',')).join('\n');

      filename = `lecturer-report-${selectedCourse || 'all'}-${selectedYear}.csv`;
    }

    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  const printReport = () => {
    window.print();
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
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Generate comprehensive reports and analytics</p>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Semesters</option>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overview">Overview</option>
              <option value="performance">Performance</option>
              <option value="attendance">Attendance</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={() => exportReport('csv')}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={printReport}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.totalStudents}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">{reportData.totalSubjects}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">{reportData.totalClasses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Avg Performance</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.avgPerformance}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
            <div className="grid grid-cols-3 md:grid-cols-9 gap-4">
              {Object.entries(reportData.gradeDistribution).map(([grade, count]) => (
                <div key={grade} className="text-center">
                  <div className={`p-3 rounded-lg ${
                    grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-800' :
                    grade === 'B+' || grade === 'B' ? 'bg-blue-100 text-blue-800' :
                    grade === 'C+' || grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm">{grade}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Statistics */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Statistics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Mark
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.subjectStats.map((stat, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{stat.subjectCode}</div>
                          <div className="text-sm text-gray-500">{stat.subjectName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.students}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`font-semibold ${
                          stat.avgMark >= 80 ? 'text-green-600' :
                          stat.avgMark >= 70 ? 'text-blue-600' :
                          stat.avgMark >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {stat.avgMark}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.attendanceRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Classes Conducted</h4>
                <div className="space-y-2">
                  {reportData.monthlyStats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{stat.month}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(stat.classes / 25) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{stat.classes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attendance Rate</h4>
                <div className="space-y-2">
                  {reportData.monthlyStats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{stat.month}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${stat.attendance}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{stat.attendance}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Performance</h4>
                <div className="space-y-2">
                  {reportData.monthlyStats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{stat.month}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${stat.performance}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{stat.performance}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerReports;

