import React, { useState } from 'react';
import { Plus, Search, Filter, Clock, CheckCircle, AlertTriangle, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Helpdesk: React.FC = () => {
  const { currentUser } = useAuth();
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sample ticket data
  const tickets = [
    {
      id: 'TK-001',
      title: 'Cannot access student portal',
      description: 'I am unable to log into the student portal since yesterday',
      category: 'technical',
      priority: 'high',
      status: 'open',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T10:30:00Z',
      studentId: currentUser?.uid || '',
      response: null,
    },
    {
      id: 'TK-002', 
      title: 'Question about course registration',
      description: 'I need help understanding the course registration process for next semester',
      category: 'academic',
      priority: 'medium',
      status: 'in-progress',
      createdAt: '2025-01-14T14:20:00Z',
      updatedAt: '2025-01-15T09:15:00Z',
      studentId: currentUser?.uid || '',
      response: 'We have assigned an academic advisor to help you. They will contact you soon.',
    },
    {
      id: 'TK-003',
      title: 'Payment confirmation issue',
      description: 'My payment was processed but not showing in my account',
      category: 'finance',
      priority: 'high',
      status: 'resolved',
      createdAt: '2025-01-13T11:45:00Z',
      updatedAt: '2025-01-14T16:30:00Z',
      studentId: currentUser?.uid || '',
      response: 'Your payment has been verified and applied to your account. Thank you for your patience.',
    },
  ];

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'general' as 'technical' | 'academic' | 'finance' | 'general',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally send the ticket to your backend
    console.log('Creating ticket:', newTicket);
    setShowNewTicketForm(false);
    setNewTicket({
      title: '',
      description: '',
      category: 'general',
      priority: 'medium',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="h-4 w-4" />;
      case 'in-progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Helpdesk</h1>
            <p className="text-gray-600 mt-1">Get help with technical, academic, or administrative issues</p>
          </div>
          <button
            onClick={() => setShowNewTicketForm(!showNewTicketForm)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Ticket
          </button>
        </div>
      </div>

      {/* New Ticket Form */}
      {showNewTicketForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Support Ticket</h2>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="academic">Academic</option>
                  <option value="finance">Finance</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of your issue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please provide detailed information about your issue..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Ticket
              </button>
              <button
                type="button"
                onClick={() => setShowNewTicketForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
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
                placeholder="Search tickets..."
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
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-mono text-gray-500">{ticket.id}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    <span className="ml-1 capitalize">{ticket.status.replace('-', ' ')}</span>
                  </span>
                  <span className={`text-xs font-medium capitalize ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority} Priority
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{ticket.title}</h3>
                <p className="text-gray-600 mb-3">{ticket.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Category: <span className="capitalize">{ticket.category}</span></span>
                  <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  {ticket.updatedAt !== ticket.createdAt && (
                    <span>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>

                {ticket.response && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Staff Response:</h4>
                    <p className="text-sm text-blue-800">{ticket.response}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredTickets.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first support ticket to get help.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Helpdesk;