import React from 'react';

const FinancialReports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600 mt-1">Analyze payments and revenue.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-700">Finance analytics and exports will be available here.</p>
      </div>
    </div>
  );
};

export default FinancialReports;


