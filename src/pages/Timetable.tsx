import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Download, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTimetable, getTimetableByCourse, getStudentRegistration } from '../services/database';
import { Timetable as TimetableType } from '../types';

const Timetable: React.FC = () => {
  const { currentUser } = useAuth();
  const [timetable, setTimetable] = useState<TimetableType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState('current');
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        // Get student's course registration
        const registration = await getStudentRegistration(currentUser.uid);
        
        if (registration?.courseCode) {
          // Get timetable for the student's specific course
          const timetableData = await getTimetableByCourse(registration.courseCode);
          setTimetable(timetableData);
        } else {
          // If no course registered, show empty timetable
          setTimetable([]);
        }
      } catch (error) {
        console.error('Error fetching timetable:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [currentUser]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const getTypeColor = (type: TimetableType['type']) => {
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

  const getClassForTimeSlot = (day: string, time: string) => {
    return timetable.find(item => 
      item.day === day && item.startTime === time
    );
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Class Timetable</h1>
            <p className="text-gray-600 mt-1">Your weekly class schedule</p>
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'week' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List View
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="current">Current Week</option>
              <option value="next">Next Week</option>
              <option value="previous">Previous Week</option>
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'week' ? (
        /* Week View */
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Time
                  </th>
                  {days.map(day => (
                    <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSlots.map(time => (
                  <tr key={time} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                      {time}
                    </td>
                    {days.map(day => {
                      const classItem = getClassForTimeSlot(day, time);
                      return (
                        <td key={`${day}-${time}`} className="px-4 py-4 whitespace-nowrap">
                          {classItem ? (
                            <div className={`p-3 rounded-lg border ${getTypeColor(classItem.type)}`}>
                              <div className="font-medium text-sm">{classItem.courseCode}</div>
                              <div className="text-xs opacity-75">{classItem.courseName}</div>
                              <div className="flex items-center mt-1 text-xs opacity-75">
                                <MapPin className="h-3 w-3 mr-1" />
                                {classItem.venue}
                              </div>
                              <div className="flex items-center text-xs opacity-75">
                                <User className="h-3 w-3 mr-1" />
                                {classItem.lecturer}
                              </div>
                              <div className="flex items-center text-xs opacity-75">
                                <Clock className="h-3 w-3 mr-1" />
                                {classItem.startTime} - {classItem.endTime}
                              </div>
                            </div>
                          ) : (
                            <div className="h-20"></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {days.map(day => {
            const dayClasses = timetable.filter(item => item.day === day);
            return (
              <div key={day} className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{day}</h3>
                </div>
                <div className="p-4">
                  {dayClasses.length > 0 ? (
                    <div className="space-y-3">
                      {dayClasses
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map(classItem => (
                          <div key={classItem.id} className={`p-4 rounded-lg border ${getTypeColor(classItem.type)}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{classItem.courseName}</h4>
                                <p className="text-sm opacity-75">{classItem.courseCode}</p>
                              </div>
                              <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded-full capitalize">
                                {classItem.type}
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm opacity-75">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                {classItem.startTime} - {classItem.endTime}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                {classItem.venue}
                              </div>
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                {classItem.lecturer}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No classes scheduled for {day}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Types</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded mr-2"></div>
            <span className="text-sm text-gray-700">Lecture</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-2"></div>
            <span className="text-sm text-gray-700">Practical</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded mr-2"></div>
            <span className="text-sm text-gray-700">Tutorial</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timetable;