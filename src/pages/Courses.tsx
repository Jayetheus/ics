import React from 'react';

const Courses: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <p className="text-gray-600 mt-1">View and manage your assigned courses.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-700">This lecturer screen is coming soon. You will be able to see your course list, enrollments, and related resources here.</p>
      </div>
    </div>
  );
};

export default Courses;


