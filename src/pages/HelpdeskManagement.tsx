import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageCircle, Clock, CheckCircle, AlertTriangle, User, Calendar } from 'lucide-react';
import { getAllTickets, updateTicket } from '../services/database';
import { useNotification } from '../context/NotificationContext';
import { Ticket } from '../types';
import { TICKET_CATEGORIES } from '../data/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';

const HelpdeskManagement: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Ticket['status']>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | Ticket['priority']>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState('');
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const ticketsData = await getAllTickets();
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load tickets'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: Ticket['status'], responseText?: string) => {
    try {
      const updateData: Partial<Ticket> = { status: newStatus };
      if (responseText) {
        updateData.response = responseText;
      }

      await updateTicket(ticketId, updateData);
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, ...updateData } : ticket
      ));
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: `Ticket ${newStatus === 'resolved' ? 'resolved' : 'updated'} successfully`
      });
      
      setSelectedTicket(null);
      setResponse('');
    } catch (error) {
      console.error('Error updating ticket:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update ticket'
      });
    }
  };

  const getStatusColor = (status: Ticket['status']) => {
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

  const getStatusIcon = (status: Ticket['status']) => {
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

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    highPriority: tickets.filter(t => t.priority === 'high').length,
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Helpdesk Management</h1>
            <p className="text-gray-600 mt-1">Manage support tickets across the institution</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-2xl font-semibold text-red-600">{stats.open}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-yellow-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-semibold text-green-600">{stats.resolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-semibold text-orange-600">{stats.highPriority}</p>
            </div>
          </div>
        </div>
      </div>

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
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
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
                  <span className="text-sm font-mono text-gray-500">#{ticket.id.slice(-6)}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    <span className="ml-1 capitalize">{ticket.status.replace('-', ' ')}</span>
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority} Priority
                  </span>
                  <span className="text-xs text-gray-500 capitalize">{ticket.category}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{ticket.title}</h3>
                <p className="text-gray-600 mb-3">{ticket.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Student ID: {ticket.studentId.slice(-6)}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Created: {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                  {ticket.updatedAt !== ticket.createdAt && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Updated: {new Date(ticket.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {ticket.response && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Staff Response:</h4>
                    <p className="text-sm text-blue-800">{ticket.response}</p>
                  </div>
                )}
              </div>

              <div className="ml-4 flex flex-col gap-2">
                {ticket.status === 'open' && (
                  <button
                    onClick={() => handleStatusUpdate(ticket.id, 'in-progress')}
                    className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-full hover:bg-yellow-700 transition-colors"
                  >
                    Start Working
                  </button>
                )}
                
                {(ticket.status === 'open' || ticket.status === 'in-progress') && (
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-full hover:bg-green-700 transition-colors"
                  >
                    Resolve
                  </button>
                )}
                
                {ticket.status === 'resolved' && (
                  <button
                    onClick={() => handleStatusUpdate(ticket.id, 'closed')}
                    className="px-3 py-1 bg-gray-600 text-white text-xs rounded-full hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
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
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No support tickets have been submitted yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Resolve Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolve Ticket</h3>
            <p className="text-sm text-gray-600 mb-4">
              Provide a response to resolve ticket: <strong>{selectedTicket.title}</strong>
            </p>
            
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Enter your response to the student..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => handleStatusUpdate(selectedTicket.id, 'resolved', response)}
                disabled={!response.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Resolve Ticket
              </button>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setResponse('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpdeskManagement;