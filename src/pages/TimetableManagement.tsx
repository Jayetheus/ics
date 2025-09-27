import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  Users,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  getCourses, 
  getSubjectsByCourse, 
  getLecturers, 
  getTimetableByCourse, 
  createTimetableEntry, 
  updateTimetableEntry, 
  deleteTimetableEntry 
} from '../services/database';
import { Course, Subject, Lecturer, Timetable } from '../types';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];
const VENUES = ['A101', 'A102', 'A103', 'B201', 'B202', 'B203', 'C301', 'C302', 'C303', 'Lab1', 'Lab2', 'Lab3'];

const TimetableManagement: React.FC = () => {
  const { addNotification } = useNotification();
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Timetable | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(DAYS));

  const [newEntry, setNewEntry] = useState<Partial<Timetable>>({
    courseCode: '',
    courseName: '',
    subjectCode: '',
    subjectName: '',
    lecturerId: '',
    lecturerName: '',
    day: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    venue: 'A101',
    type: 'lecture',
    semester: 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, lecturersData] = await Promise.all([
          getCourses(),
          getLecturers()
        ]);
        setCourses(coursesData);
        setLecturers(lecturersData as any);
      } catch (error) {
        console.error('Error fetching data:', error);
        addNotification({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load courses and lecturers'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [addNotification]);

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
      setTimetable(timetableData);
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
      const lecturer = lecturers.find(l => l.uid === newEntry.lecturerId);
      const subject = subjects.find(s => s.code === newEntry.subjectCode);

      const entryData: Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'> = {
        courseCode: selectedCourse,
        courseName: course?.name || '',
        subjectCode: newEntry.subjectCode || '',
        subjectName: subject?.name || '',
        lecturerId: newEntry.lecturerId || '',
        lecturerName: lecturer ? `${lecturer.firstName} ${lecturer.lastName}` : '',
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
      setNewEntry({
        courseCode: '',
        courseName: '',
        subjectCode: '',
        subjectName: '',
        lecturerId: '',
        lecturerName: '',
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
        venue: 'A101',
        type: 'lecture',
        semester: 1,
        year: new Date().getFullYear(),
      });

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Timetable entry added successfully'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add timetable entry'
      });
    }
  };

  const handleEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    try {
      const lecturer = lecturers.find(l => l.uid === editingEntry.lecturerId);
      const subject = subjects.find(s => s.code === editingEntry.subjectCode);

      await updateTimetableEntry(editingEntry.id, {
        ...editingEntry,
        lecturerName: lecturer ? `${lecturer.firstName} ${lecturer.lastName}` : editingEntry.lecturerName,
        subjectName: subject?.name || editingEntry.subjectName,
      });

      await fetchTimetable();
      setEditingEntry(null);

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Timetable entry updated successfully'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update timetable entry'
      });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this timetable entry?')) return;

    try {
      await deleteTimetableEntry(id);
      await fetchTimetable();

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Timetable entry deleted successfully'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete timetable entry'
      });
    }
  };

  const toggleDayExpansion = (day: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
  };

  const getTimetableForDay = (day: string) => {
    return timetable.filter(entry => entry.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
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
            <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
            <p className="text-gray-600 mt-1">Manage course timetables by semester</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={!selectedCourse}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </button>
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

      {/* Timetable Display */}
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
              const isExpanded = expandedDays.has(day);

              return (
                <div key={day} className="p-4">
                  <button
                    onClick={() => toggleDayExpansion(day)}
                    className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 rounded-md"
                  >
                    <h3 className="text-lg font-medium text-gray-900">{day}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{dayEntries.length} entries</span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-2">
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
                                <Users className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{entry.lecturerName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{entry.venue}</span>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                entry.type === 'lecture' ? 'bg-blue-100 text-blue-800' :
                                entry.type === 'practical' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
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
                  )}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Timetable Entry</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lecturer</label>
                  <select
                    required
                    value={newEntry.lecturerId || ''}
                    onChange={(e) => {
                      const lecturer = lecturers.find(l => l.uid === e.target.value);
                      setNewEntry({
                        ...newEntry,
                        lecturerId: e.target.value,
                        lecturerName: lecturer ? `${lecturer.firstName} ${lecturer.lastName}` : ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Lecturer</option>
                    {lecturers.map(lecturer => (
                      <option key={lecturer.uid} value={lecturer.uid}>
                        {lecturer.firstName} {lecturer.lastName}
                      </option>
                    ))}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Timetable Entry</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lecturer</label>
                  <select
                    required
                    value={editingEntry.lecturerId}
                    onChange={(e) => {
                      const lecturer = lecturers.find(l => l.uid === e.target.value);
                      setEditingEntry({
                        ...editingEntry,
                        lecturerId: e.target.value,
                        lecturerName: lecturer ? `${lecturer.firstName} ${lecturer.lastName}` : ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {lecturers.map(lecturer => (
                      <option key={lecturer.uid} value={lecturer.uid}>
                        {lecturer.firstName} {lecturer.lastName}
                      </option>
                    ))}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

export default TimetableManagement;