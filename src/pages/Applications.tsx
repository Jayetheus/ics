import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApplicationsByStudent, createApplication } from '../services/database';
import { getCourses } from '../services/database';
import { Application, Course } from '../types';

const Applications: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        const [apps, crs] = await Promise.all([
          getApplicationsByStudent(currentUser.uid),
          getCourses(),
        ]);
        setApplications(apps);
        setCourses(crs);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedCourse) return;
    const id = await createApplication({ studentId: currentUser.uid, courseCode: selectedCourse, status: 'pending' as any } as any);
    const apps = await getApplicationsByStudent(currentUser.uid);
    setApplications(apps);
    setSelectedCourse('');
    alert('Application submitted');
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
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-600 mt-1">Apply for a course and track status.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={submit} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- choose --</option>
              {courses.map(c => (
                <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Apply</button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Applications</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((a) => (
                <tr key={a.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.courseCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Applications;


