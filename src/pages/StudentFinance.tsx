import React from 'react';

const StudentFinance: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Finance</h1>
        <p className="text-gray-600 mt-1">Search students and view their payment status.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-700">Tools to view student balances and statements will be added.</p>
      </div>
    </div>
  );
};

export default StudentFinance;


