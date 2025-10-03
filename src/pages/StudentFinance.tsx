import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  Search,
  Filter,
  Calendar,
  Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  getPaymentsByStudent, 
  getFinancesByStudentId,
  createPayment,
  getStudentRegistration
} from '../services/database';
import { Payment } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const StudentFinance: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [financeData, setFinanceData] = useState<any>({ records: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [registration, setRegistration] = useState<any>(null);

  const [newPayment, setNewPayment] = useState({
    amount: '',
    type: 'tuition' as 'registration' | 'tuition' | 'accommodation' | 'other',
    description: '',
    proofOfPaymentUrl: ''
  });

  useEffect(() => {
    const fetchFinanceData = async () => {
      if (!currentUser) return;

      try {
        const [paymentsData, financeData, registrationData] = await Promise.all([
          getPaymentsByStudent(currentUser.uid),
          getFinancesByStudentId(currentUser.uid),
          getStudentRegistration(currentUser.uid)
        ]);
        
        setPayments(paymentsData);
        setFinanceData(financeData);
        setRegistration(registrationData);
      } catch (error) {
        console.error('Error fetching finance data:', error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load finance data'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, [currentUser, addNotification]);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    try {
      const paymentData = {
        studentId: currentUser.uid,
        amount: parseFloat(newPayment.amount),
        type: newPayment.type,
        description: newPayment.description,
        status: 'pending' as 'pending' | 'approved' | 'rejected',
        proofOfPaymentUrl: newPayment.proofOfPaymentUrl || undefined
      };

      await createPayment(paymentData);
      
      // Refresh payments list
      const updatedPayments = await getPaymentsByStudent(currentUser.uid);
      setPayments(updatedPayments);
      
      setShowPaymentForm(false);
      setNewPayment({
        amount: '',
        type: 'tuition',
        description: '',
        proofOfPaymentUrl: ''
      });
      
      addNotification({
        type: 'success',
        title: 'Payment Submitted',
        message: 'Your payment has been submitted for review'
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to submit payment'
      });
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'registration':
        return 'text-blue-600';
      case 'tuition':
        return 'text-green-600';
      case 'accommodation':
        return 'text-purple-600';
      case 'other':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || payment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPaid = payments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Finance</h1>
            <p className="text-gray-600 mt-1">Manage your payments and view financial records</p>
          </div>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Make Payment
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-semibold text-gray-900">R{totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-2xl font-semibold text-gray-900">R{totalPending.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-2xl font-semibold text-gray-900">R{financeData.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Make Payment</h3>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Type
                </label>
                <select
                  value={newPayment.type}
                  onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="tuition">Tuition</option>
                  <option value="registration">Registration</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (R)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proof of Payment URL (Optional)
                </label>
                <input
                  type="url"
                  value={newPayment.proofOfPaymentUrl}
                  onChange={(e) => setNewPayment({ ...newPayment, proofOfPaymentUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/proof"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Submit Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Make your first payment to get started.'}
              </p>
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <div key={payment.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-sm font-medium capitalize ${getTypeColor(payment.type)}`}>
                        {payment.type}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1 capitalize">{payment.status}</span>
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      R{payment.amount.toFixed(2)}
                    </h3>
                    <p className="text-gray-600 mb-2">{payment.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Date: {payment.date && typeof payment.date.toDate === 'function' 
                        ? payment.date.toDate().toLocaleDateString()
                        : new Date(payment.date as any).toLocaleDateString()}
                      </span>
                      {payment.proofOfPaymentUrl && (
                        <a
                          href={payment.proofOfPaymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Proof
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentFinance;


