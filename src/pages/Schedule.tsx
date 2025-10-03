import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Download,
  Printer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  getTimetableByCourse, 
  getCourses, 
  getSubjectsByCourse,
  getUsers,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry
} from '../services/database';
import { Timetable, Course, Subject, User } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Schedule: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Timetable | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const [newEntry, setNewEntry] = useState<Partial<Timetable>>({
    courseCode: '',
    courseName: '',
    subjectCode: '',
    subjectName: '',
    lecturerId: currentUser?.uid || '',
    lecturerName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
    day: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    venue: 'A101',
    type: 'lecture',
    semester: 1,
    year: new Date().getFullYear(),
  });

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];
  const VENUES = ['A101', 'A102', 'A103', 'B201', 'B202', 'B203', 'C301', 'C302', 'C303', 'Lab1', 'Lab2', 'Lab3'];

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
      fetchTimetable();
      fetchSubjects();
    }
  }, [selectedCourse, selectedSemester, selectedYear]);

  const fetchTimetable = async () => {
    if (!selectedCourse) return;
    try {
      const timetableData = await getTimetableByCourse(selectedCourse, selectedSemester, selectedYear);
      // Filter by lecturer
      const lecturerTimetable = timetableData.filter(entry => entry.lecturerId === currentUser?.uid);
      setTimetable(lecturerTimetable);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    }
  };

  const fetchSubjects = async () => {
    if (!selectedCourse) return;
    try {
      const subjectsData = await getSubjectsByCourse(selectedCourse);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a course first'
      });
      return;
    }

    try {
      const course = courses.find(c => c.code === selectedCourse);
      const subject = subjects.find(s => s.code === newEntry.subjectCode);

      const entryData: Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'> = {
        courseCode: selectedCourse,
        courseName: course?.name || '',
        subjectCode: newEntry.subjectCode || '',
        subjectName: subject?.name || '',
        lecturerId: currentUser?.uid || '',
        lecturerName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
        day: newEntry.day || 'Monday',
        startTime: newEntry.startTime || '08:00',
        endTime: newEntry.endTime || '09:00',
        venue: newEntry.venue || 'A101',
        type: newEntry.type || 'lecture',
        semester: selectedSemester,
        year: selectedYear,
      };

      await createTimetableEntry(entryData);
      await fetchTimetable();
      setShowAddForm(false);
      resetForm();

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Schedule entry added successfully'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add schedule entry'
      });
    }
  };

  const handleEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    try {
      const subject = subjects.find(s => s.code === editingEntry.subjectCode);

      await updateTimetableEntry(editingEntry.id, {
        ...editingEntry,
        subjectName: subject?.name || editingEntry.subjectName,
      });

      await fetchTimetable();
      setEditingEntry(null);

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Schedule entry updated successfully'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update schedule entry'
      });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule entry?')) return;

    try {
      await deleteTimetableEntry(id);
      await fetchTimetable();

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Schedule entry deleted successfully'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete schedule entry'
      });
    }
  };

  const resetForm = () => {
    setNewEntry({
      courseCode: '',
      courseName: '',
      subjectCode: '',
      subjectName: '',
      lecturerId: currentUser?.uid || '',
      lecturerName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
      day: 'Monday',
      startTime: '08:00',
      endTime: '09:00',
      venue: 'A101',
      type: 'lecture',
      semester: 1,
      year: new Date().getFullYear(),
    });
    setEditingEntry(null);
    setShowAddForm(false);
  };

  const getTimetableForDay = (day: string) => {
    return timetable
      .filter(entry => entry.day === day)
      .filter(entry => filterType === 'all' || entry.type === filterType)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getTypeColor = (type: Timetable['type']) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'practical':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'tutorial':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exportSchedule = () => {
    const csvContent = [
      ['Day', 'Time', 'Subject', 'Type', 'Venue', 'Students'],
      ...timetable.map(entry => [
        entry.day,
        `${entry.startTime} - ${entry.endTime}`,
        entry.subjectName,
        entry.type,
        entry.venue,
        students.filter(s => s.enrolledSubjects?.includes(entry.subjectCode)).length.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule-${selectedCourse}-${selectedSemester}-${selectedYear}.csv`;
    link.click();
  };

  const printSchedule = () => {
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
            <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
            <p className="text-gray-600 mt-1">View and manage your teaching schedule</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Course and Semester Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value) as 1 | 2)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>Semester 1</option>
              <option value={2}>Semester 2</option>
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

          <div className="flex items-end">
            <button
              onClick={fetchTimetable}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Controls */}
      {selectedCourse && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="lecture">Lecture</option>
                  <option value="practical">Practical</option>
                  <option value="tutorial">Tutorial</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </button>
              <button
                onClick={exportSchedule}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={printSchedule}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Display */}
      {selectedCourse && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {courses.find(c => c.code === selectedCourse)?.name} - Semester {selectedSemester} ({selectedYear})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {DAYS.map(day => {
              const dayEntries = getTimetableForDay(day);
              return (
                <div key={day} className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{day}</h3>
                  <div className="space-y-2">
                    {dayEntries.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No classes scheduled for {day}</p>
                    ) : (
                      dayEntries.map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">
                                {entry.startTime} - {entry.endTime}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{entry.subjectName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{entry.venue}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">
                                {students.filter(s => s.enrolledSubjects?.includes(entry.subjectCode)).length} students
                              </span>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full border ${getTypeColor(entry.type)}`}>
                              {entry.type}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingEntry(entry)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Schedule Entry</h3>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    required
                    value={newEntry.subjectCode || ''}
                    onChange={(e) => {
                      const subject = subjects.find(s => s.code === e.target.value);
                      setNewEntry({
                        ...newEntry,
                        subjectCode: e.target.value,
                        subjectName: subject?.name || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.code}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    required
                    value={newEntry.type || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as 'lecture' | 'practical' | 'tutorial' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="practical">Practical</option>
                    <option value="tutorial">Tutorial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
                  <select
                    required
                    value={newEntry.day || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, day: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <select
                    required
                    value={newEntry.startTime || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <select
                    required
                    value={newEntry.endTime || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                <select
                  required
                  value={newEntry.venue || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, venue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {VENUES.map(venue => (
                    <option key={venue} value={venue}>{venue}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Schedule Entry</h3>
            <form onSubmit={handleEditEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    required
                    value={editingEntry.subjectCode}
                    onChange={(e) => {
                      const subject = subjects.find(s => s.code === e.target.value);
                      setEditingEntry({
                        ...editingEntry,
                        subjectCode: e.target.value,
                        subjectName: subject?.name || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.code}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    required
                    value={editingEntry.type}
                    onChange={(e) => setEditingEntry({ ...editingEntry, type: e.target.value as 'lecture' | 'practical' | 'tutorial' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="practical">Practical</option>
                    <option value="tutorial">Tutorial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
                  <select
                    required
                    value={editingEntry.day}
                    onChange={(e) => setEditingEntry({ ...editingEntry, day: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <select
                    required
                    value={editingEntry.startTime}
                    onChange={(e) => setEditingEntry({ ...editingEntry, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <select
                    required
                    value={editingEntry.endTime}
                    onChange={(e) => setEditingEntry({ ...editingEntry, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                <select
                  required
                  value={editingEntry.venue}
                  onChange={(e) => setEditingEntry({ ...editingEntry, venue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {VENUES.map(venue => (
                    <option key={venue} value={venue}>{venue}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Update Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;


