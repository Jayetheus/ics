import React from 'react';

const ResultsEntry: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Results Entry</h1>
        <p className="text-gray-600 mt-1">Submit and manage student results.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-700">This screen will allow lecturers to capture assessment marks and publish results.</p>
      </div>
    </div>
  );
};

export default ResultsEntry;


