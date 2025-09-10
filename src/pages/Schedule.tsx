import React from 'react';

const Schedule: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <p className="text-gray-600 mt-1">Lecturer schedule overview.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-700">This lecturer schedule screen will show your classes, meetings, and events.</p>
      </div>
    </div>
  );
};

export default Schedule;


