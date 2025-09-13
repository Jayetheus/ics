import React, { useEffect, useState } from 'react';
import { getAllApplications, updateApplicationStatus, getCourses } from '../services/database';
import { Application, Course } from '../types';
import { CheckCircle, X, Search, Filter } from 'lucide-react';

const ApplicationsManagement: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | Application['status']>('all');

  useEffect(() => {
    const load = async () => {
      const [apps, crs] = await Promise.all([getAllApplications(), getCourses()]);
      setApplications(apps);
      setCourses(crs);
      setLoading(false);
    };
    load();
  }, []);

  const courseName = (code: string) => courses.find(c => c.code === code)?.name || code;

  const filtered = applications.filter(a => {
    const matchS = status === 'all' || a.status === status;
    const matchQ = a.courseCode.toLowerCase().includes(search.toLowerCase());
    return matchS && matchQ;
  });

  const act = async (id: string, next: Application['status']) => {
    await updateApplicationStatus(id, next);
    setApplications(applications.map(a => a.id === id ? { ...a, status: next } : a));
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications Management</h1>
            <p className="text-gray-600 mt-1">Approve or reject student course applications</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by course code"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map(a => (
              <tr key={a.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.studentId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.courseCode} - {courseName(a.courseCode)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{a.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {a.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => act(a.id, 'approved')} className="text-green-600 hover:text-green-900 flex items-center px-2 py-1 bg-green-50 rounded">
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </button>
                      <button onClick={() => act(a.id, 'rejected')} className="text-red-600 hover:text-red-900 flex items-center px-2 py-1 bg-red-50 rounded">
                        <X className="h-4 w-4 mr-1" /> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicationsManagement;



