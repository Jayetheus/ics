import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApplicationsByStudent, getSubjectsByCourse, enrollStudentSubjects, updateStudent } from '../services/database';
import { Subject, Application } from '../types';

const FinalizeRegistration: React.FC = () => {
  const { currentUser } = useAuth();
  const [approvedApp, setApprovedApp] = useState<Application | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [year, setYear] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      const apps = await getApplicationsByStudent(currentUser.uid);
      const app = apps.find(a => a.status === 'approved') || null;
      setApprovedApp(app);
      if (app) {
        const subs = await getSubjectsByCourse(app.courseCode);
        setSubjects(subs);
        setSelected(Object.fromEntries(subs.map(s => [s.code, true])));
      }
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const toggle = (code: string) => setSelected(prev => ({ ...prev, [code]: !prev[code] }));

  const finalize = async () => {
    if (!currentUser || !approvedApp) return;
    const chosen = Object.entries(selected).filter(([_, v]) => v).map(([k]) => k);
    await enrollStudentSubjects(currentUser.uid, chosen);
    await updateStudent(currentUser.uid, { status: 'active' as any });
    alert('Registration finalized. You can now access your portal.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!approvedApp) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Finalize Registration</h1>
        <p className="text-gray-600 mt-2">No approved application found yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Finalize Registration</h1>
        <p className="text-gray-600 mt-1">Course: {approvedApp.courseCode}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Select Subjects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {subjects.map(s => (
                <label key={s.id} className="flex items-center gap-3 p-3 border rounded-md">
                  <input type="checkbox" checked={!!selected[s.code]} onChange={() => toggle(s.code)} />
                  <div>
                    <div className="font-medium">{s.code} - {s.name}</div>
                    <div className="text-xs text-gray-600">{s.credits} credits • {s.semester}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button onClick={finalize} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Finalize</button>
        </div>
      </div>
    </div>
  );
};

export default FinalizeRegistration;



