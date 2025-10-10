import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  FileText, 
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  getSubjectsByCourse, 
  getCourses, 
  getUsers,
  getTimetableByCourse,
  getAttendanceSessionsByLecturer,
  getResultsByCourse
} from '../../services/database';
import { Subject, Course, User, Timetable, AttendanceSession, Result } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

interface DashboardStats {
  totalStudents: number;
  activeSubjects: number;
  pendingGrades: number;
  avgAttendance: number;
  totalClasses: number;
  activeSessions: number;
}

const LecturerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeSubjects: 0,
    pendingGrades: 0,
    avgAttendance: 0,
    totalClasses: 0,
    activeSessions: 0
  });

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

        // Get lecturer's subjects from all courses
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

        // Calculate stats
        const enrolledStudents = students.filter(student => 
          lecturerSubjects.some(subject => 
            student.enrolledSubjects?.includes(subject.code)
          )
        );

        const pendingGrades = lecturerResults.filter(result => 
          result.mark === 0 || !result.grade
        ).length;

        const activeSessions = sessionsData.filter(session => session.isActive).length;
        const avgAttendance = sessionsData.length > 0 
          ? Math.round((activeSessions / sessionsData.length) * 100)
          : 0;

        setStats({
          totalStudents: enrolledStudents.length,
          activeSubjects: lecturerSubjects.length,
          pendingGrades,
          avgAttendance,
          totalClasses: lecturerTimetable.length,
          activeSessions
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        addNotification({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load dashboard data'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, addNotification]);

  const getTodaysSchedule = () => {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    return timetable
      .filter(entry => entry.day === dayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 5);
  };

  const getUpcomingClasses = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    return timetable
      .filter(entry => {
        const entryDate = new Date(entry.day);
        return entryDate >= today && entryDate <= dayAfterTomorrow;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 3);
  };

  const getRecentAttendance = () => {
    return attendanceSessions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  };

  const getPendingTasks = () => {
    const tasks = [];
    
    // Pending grades
    if (stats.pendingGrades > 0) {
      tasks.push({
        task: 'Grade pending assignments',
        count: stats.pendingGrades,
        dueDate: 'This week',
        type: 'grading'
      });
    }

    // Active attendance sessions
    if (stats.activeSessions > 0) {
      tasks.push({
        task: 'Active attendance sessions',
        count: stats.activeSessions,
        dueDate: 'Now',
        type: 'attendance'
      });
    }

    // Upcoming classes
    const upcoming = getUpcomingClasses();
    if (upcoming.length > 0) {
      tasks.push({
        task: 'Upcoming classes',
        count: upcoming.length,
        dueDate: 'Today/Tomorrow',
        type: 'schedule'
      });
    }

    return tasks;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const todaysSchedule = getTodaysSchedule();
  const upcomingClasses = getUpcomingClasses();
  const recentAttendance = getRecentAttendance();
  const pendingTasks = getPendingTasks();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome, Dr. {currentUser?.lastName || 'Lecturer'}
        </h1>
        <p className="mt-2 opacity-90">Lecturer Dashboard</p>
        <p className="text-sm opacity-75">
          Staff Number: {currentUser?.staffNumber || 'N/A'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
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
              <p className="text-2xl font-semibold text-gray-900">{stats.activeSubjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Grades</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingGrades}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalClasses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <QrCode className="h-6 w-6 text-cyan-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.avgAttendance}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Subjects */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-green-600" />
              My Subjects
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {subjects.slice(0, 5).map((subject, index) => {
                const subjectStudents = students.filter(s => s.enrolledSubjects?.includes(subject.code)).length;
                const nextClass = timetable
                  .filter(entry => entry.subjectCode === subject.code)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
                
                return (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{subject.code}</h3>
                        <p className="text-sm text-gray-600">{subject.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{subjectStudents} students enrolled</p>
                      </div>
                      <div className="text-right">
                        {nextClass && (
                          <>
                            <p className="text-sm font-medium text-blue-600">
                              {nextClass.startTime} - {nextClass.day}
                            </p>
                            <p className="text-xs text-gray-500">Next class</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {subjects.length === 0 && (
                <p className="text-gray-500 text-center py-4">No subjects assigned</p>
              )}
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Today's Schedule
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {todaysSchedule.map((class_, index) => {
                const classStudents = students.filter(s => s.enrolledSubjects?.includes(class_.subjectCode)).length;
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                        {class_.startTime} - {class_.endTime}
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">{class_.subjectName}</p>
                        <p className="text-sm text-gray-600">{class_.venue} • {class_.type}</p>
                        <p className="text-xs text-gray-500">{classStudents} students</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {todaysSchedule.length === 0 && (
                <p className="text-gray-500 text-center py-4">No classes scheduled for today</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Classes */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-purple-600" />
              Upcoming Classes
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingClasses.map((class_, index) => {
                const classStudents = students.filter(s => s.enrolledSubjects?.includes(class_.subjectCode)).length;
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-purple-600 text-white text-xs font-medium px-2 py-1 rounded">
                        {class_.startTime} - {class_.endTime}
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">{class_.subjectName}</p>
                        <p className="text-sm text-gray-600">{class_.venue} • {class_.type}</p>
                        <p className="text-xs text-gray-500">{classStudents} students</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {upcomingClasses.length === 0 && (
                <p className="text-gray-500 text-center py-4">No upcoming classes</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Recent Attendance
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentAttendance.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-green-600 text-white text-xs font-medium px-2 py-1 rounded">
                      {session.date}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">{session.subjectName}</p>
                      <p className="text-sm text-gray-600">{session.startTime} - {session.endTime}</p>
                      <p className="text-xs text-gray-500">{session.venue}</p>
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
              {recentAttendance.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent attendance sessions</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              Pending Tasks
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTasks.map((task, index) => (
                <div key={index} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{task.task}</p>
                      <p className="text-sm text-gray-600">{task.count} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">{task.dueDate}</p>
                      <button className="mt-1 px-3 py-1 bg-orange-600 text-white text-xs rounded-full hover:bg-orange-700 transition-colors">
                        Start
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerDashboard;