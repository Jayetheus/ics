import React from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText
} from 'lucide-react';

const FinanceDashboard: React.FC = () => {
  // Sample data
  const financialStats = {
    totalRevenue: 5670000,
    monthlyRevenue: 890000,
    outstandingPayments: 234000,
    pendingApprovals: 47,
    paymentSuccessRate: 94.2,
    studentsWithOutstanding: 156,
  };

  const recentPayments = [
    { id: 1, student: 'John Doe', amount: 15000, type: 'Tuition Fee', status: 'approved', date: '2025-01-15' },
    { id: 2, student: 'Sarah Wilson', amount: 8000, type: 'Registration', status: 'pending', date: '2025-01-15' },
    { id: 3, student: 'Mike Johnson', amount: 12000, type: 'Accommodation', status: 'approved', date: '2025-01-14' },
    { id: 4, student: 'Lisa Brown', amount: 18500, type: 'Tuition Fee', status: 'rejected', date: '2025-01-14' },
  ];

  const outstandingPayments = [
    { student: 'Alex Thompson', amount: 25000, daysOverdue: 15, course: 'Engineering' },
    { student: 'Emma Davis', amount: 18000, daysOverdue: 8, course: 'Business Studies' },
    { student: 'James Wilson', amount: 22000, daysOverdue: 23, course: 'Medicine' },
    { student: 'Sophie Miller', amount: 15500, daysOverdue: 5, course: 'Computer Science' },
  ];

  const monthlyTrend = [
    { month: 'Jan', revenue: 890000 },
    { month: 'Dec', revenue: 920000 },
    { month: 'Nov', revenue: 875000 },
    { month: 'Oct', revenue: 940000 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Finance Dashboard</h1>
        <p className="mt-2 opacity-90">Financial Management & Payment Tracking</p>
        <p className="text-sm opacity-75">Real-time financial overview</p>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Revenue (YTD)</p>
              <p className="text-2xl font-semibold text-gray-900">
                R{(financialStats.totalRevenue / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-green-600">+8.4% from last year</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                R{(financialStats.monthlyRevenue / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-blue-600">-3.2% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Outstanding Payments</p>
              <p className="text-2xl font-semibold text-gray-900">
                R{(financialStats.outstandingPayments / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-red-600">{financialStats.studentsWithOutstanding} students</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-semibold text-gray-900">{financialStats.pendingApprovals}</p>
              <p className="text-xs text-orange-600">Requires review</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{financialStats.paymentSuccessRate}%</p>
              <p className="text-xs text-green-600">Payment approvals</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Accounts</p>
              <p className="text-2xl font-semibold text-gray-900">1,247</p>
              <p className="text-xs text-purple-600">Student accounts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
              Recent Payments
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${
                      payment.status === 'approved' ? 'bg-green-100' :
                      payment.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      {payment.status === 'approved' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : payment.status === 'pending' ? (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{payment.student}</p>
                      <p className="text-sm text-gray-600">{payment.type}</p>
                      <p className="text-xs text-gray-500">{payment.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">R{payment.amount.toLocaleString()}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full capitalize ${
                      payment.status === 'approved' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Outstanding Payments */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Outstanding Payments
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {outstandingPayments.map((payment, index) => (
                <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{payment.student}</p>
                      <p className="text-sm text-gray-600">{payment.course}</p>
                      <p className="text-xs text-red-600">{payment.daysOverdue} days overdue</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">R{payment.amount.toLocaleString()}</p>
                      <button className="mt-1 px-3 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700 transition-colors">
                        Follow Up
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Revenue Trend (Last 4 Months)
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4">
            {monthlyTrend.map((month, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">{month.month}</p>
                <p className="text-xl font-bold text-gray-900 mt-2">
                  R{(month.revenue / 1000).toFixed(0)}K
                </p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${(month.revenue / 1000000) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">Approve Payments</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
              <span className="text-sm font-medium text-red-900">Outstanding Reports</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Financial Reports</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <Users className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">Student Accounts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;