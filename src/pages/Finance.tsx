import React, { useState, useEffect } from 'react';
import { CreditCard, Upload, Download, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Payment } from '../types';
import FileUpload from '../components/common/FileUpload';

const Finance: React.FC = () => {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    type: 'tuition' as Payment['type'],
    description: '',
    proofOfPaymentUrl: '',
  });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        // Sample payment data
        const samplePayments: Payment[] = [
          {
            id: '1',
            studentId: currentUser?.uid || '',
            amount: 15000,
            type: 'tuition',
            status: 'approved',
            date: '2025-01-15',
            description: 'Semester 1 Tuition Fee',
            proofOfPaymentUrl: 'https://example.com/proof1.pdf'
          },
          {
            id: '2',
            studentId: currentUser?.uid || '',
            amount: 5000,
            type: 'registration',
            status: 'pending',
            date: '2025-01-10',
            description: 'Registration Fee 2025',
            proofOfPaymentUrl: 'https://example.com/proof2.pdf'
          },
          {
            id: '3',
            studentId: currentUser?.uid || '',
            amount: 8000,
            type: 'accommodation',
            status: 'approved',
            date: '2025-01-05',
            description: 'Residence Fee - January',
          }
        ];
        
        setPayments(samplePayments);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [currentUser]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPayment.amount || !newPayment.description) {
      alert('Please fill in all required fields');
      return;
    }

    const payment: Payment = {
      id: Date.now().toString(),
      studentId: currentUser?.uid || '',
      amount: parseFloat(newPayment.amount),
      type: newPayment.type,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      description: newPayment.description,
      proofOfPaymentUrl: newPayment.proofOfPaymentUrl,
    };

    setPayments([payment, ...payments]);
    setNewPayment({
      amount: '',
      type: 'tuition',
      description: '',
      proofOfPaymentUrl: '',
    });
    setShowPaymentForm(false);
    alert('Payment submitted successfully! It will be reviewed by the finance team.');
  };

  const handleProofUpload = (fileData: any) => {
    setNewPayment({ ...newPayment, proofOfPaymentUrl: fileData.url });
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const totalPaid = payments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalFees = 45000; // Sample total fees
  const outstanding = totalFees - totalPaid;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Finance & Payments</h1>
            <p className="text-gray-600 mt-1">Manage your fees and payment history</p>
          </div>
          <button
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Make Payment
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Fees</p>
              <p className="text-2xl font-semibold text-gray-900">R{totalFees.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Paid Amount</p>
              <p className="text-2xl font-semibold text-green-600">R{totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-yellow-600">R{totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${outstanding > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <AlertTriangle className={`h-6 w-6 ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className={`text-2xl font-semibold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                R{outstanding.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Progress</h2>
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Paid: R{totalPaid.toLocaleString()}</span>
            <span>Total: R{totalFees.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((totalPaid / totalFees) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {Math.round((totalPaid / totalFees) * 100)}% completed
          </p>
        </div>
      </div>

      {/* Payment Form */}
      {showPaymentForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Payment</h2>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Type
                </label>
                <select
                  value={newPayment.type}
                  onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value as Payment['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="tuition">Tuition Fee</option>
                  <option value="registration">Registration Fee</option>
                  <option value="accommodation">Accommodation Fee</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (R)
                </label>
                <input
                  type="number"
                  required
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                required
                value={newPayment.description}
                onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Payment description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proof of Payment
              </label>
              <FileUpload
                onUpload={handleProofUpload}
                accept="image/*,.pdf"
                maxSize={5}
                folder="payment-proofs"
              />
              {newPayment.proofOfPaymentUrl && (
                <p className="text-sm text-green-600 mt-2">✓ Proof of payment uploaded</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit Payment
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proof
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payment.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">{payment.type.replace('-', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    R{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1 capitalize">{payment.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.proofOfPaymentUrl ? (
                      <a 
                        href={payment.proofOfPaymentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </a>
                    ) : (
                      'No proof'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payments.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
            <p className="text-gray-600">Your payment history will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finance;