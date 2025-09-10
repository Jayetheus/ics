import React from 'react';

const CourseManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
        <p className="text-gray-600 mt-1">Create, edit, and assign courses.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-700">Admin tools for managing courses will appear here.</p>
      </div>
    </div>
  );
};

export default CourseManagement;


