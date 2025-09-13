import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSubjectsByCourse, getStudentById } from '../services/database';
import { Subject } from '../types';

const Subjects: React.FC = () => {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      const student = await getStudentById(currentUser.uid);
      const courseCode = (student as any)?.course || (currentUser as any)?.profile?.course?.code || (currentUser as any)?.profile?.course;
      if (courseCode) {
        const subs = await getSubjectsByCourse(courseCode);
        setSubjects(subs);
      }
      setLoading(false);
    };
    load();
  }, [currentUser]);

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
        <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
        <p className="text-gray-600 mt-1">Subjects for your current course</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(s => (
            <div key={s.id} className="border rounded-lg p-4">
              <div className="font-medium">{s.code} - {s.name}</div>
              <div className="text-sm text-gray-600 mt-1">{s.credits} credits • {s.semester}</div>
            </div>
          ))}
          {subjects.length === 0 && (
            <p className="text-gray-600">No subjects found for your course.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subjects;



