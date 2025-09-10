import React from 'react';

const PaymentProofs: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Proofs</h1>
        <p className="text-gray-600 mt-1">Review uploaded payment proof documents.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-700">A list of proofs with filtering and actions will be added.</p>
      </div>
    </div>
  );
};

export default PaymentProofs;


