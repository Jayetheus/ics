import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Plus, Edit, Eye, Trash2, Download } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, createLecturer, getLecturers, getColleges } from '../services/database';
import { generateStaffNumber } from '../services/dataLoader';
import { User, Lecturer, College } from '../types';
import { DEPARTMENTS } from '../data/constants';


const ROLES = ['admin', 'student', 'lecturer'];


const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | User['role']>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({});
  const [newLecturer, setNewLecturer] = useState<Partial<Lecturer>>({});
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<Partial<User>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, lecturersData, collegesData] = await Promise.all([
          getUsers(),
          getLecturers(),
          getColleges()
        ]);
        setUsers(usersData);
        setLecturers(lecturersData);
        setColleges(collegesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Combine users and lecturers for display
  const allUsers = [
    ...users.map(user => ({ ...user, type: 'user' as const })),
    ...lecturers.map(lecturer => ({ 
      uid: lecturer.uid, 
      firstName: lecturer.firstName, 
      lastName: lecturer.lastName, 
      email: lecturer.email, 
      role: 'lecturer' as const,
      type: 'lecturer' as const,
      staffNumber: lecturer.staffNumber,
      department: lecturer.department,
      collegeId: lecturer.collegeId
    }))
  ];

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newUser.role === 'lecturer') {
        // Create lecturer with additional attributes
        const staffNumber = await generateStaffNumber();
        const lecturerData = {
          ...newUser,
          staffNumber,
          department: newLecturer.department || DEPARTMENTS[0],
          collegeId: newLecturer.collegeId || colleges[0]?.id || null,
          phone: newLecturer.phone || null,
          address: newLecturer.address || null,
          qualifications: newLecturer.qualifications || '',
          subjects: []
        };
        //@ts-ignore
        await createLecturer(lecturerData);
        await createUser(lecturerData);
        
        // Refresh lecturers list
        const updatedLecturers = await getLecturers();
        setLecturers(updatedLecturers);
      } else {
        // Create regular user
        const created = await createUser(newUser);
        setUsers([...users, created]);
      }
      
      setShowAddForm(false);
      setNewUser({});
      setNewLecturer({});
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to add user');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserId) return;
    try {
      const updated = await updateUser(editUserId, editUser);
      setUsers(users.map(u => (u.uid === editUserId ? updated : u)));
      setEditUserId(null);
      setEditUser({});
    } catch {
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      setUsers(users.filter(u => u.uid !== id));
    } catch {
      alert('Failed to delete user');
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage users and their roles</p>
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ROLES.map(role => (
          <div key={role} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${role === 'Admin' ? 'bg-blue-100' : role === 'Lecturer' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                <Users className={`h-6 w-6 ${role === 'Admin' ? 'text-blue-600' : role === 'Lecturer' ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{role}s</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role === role).length}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                required
                placeholder="First Name"
                value={newUser.firstName || ''}
                onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                className="border px-3 py-2 rounded w-full"
              />
              <input
                type="text"
                required
                placeholder="Last Name"
                value={newUser.lastName || ''}
                onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                className="border px-3 py-2 rounded w-full"
              />
            </div>
            <input
              type="email"
              required
              placeholder="Email"
              value={newUser.email || ''}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              className="border px-3 py-2 rounded w-full"
            />
            <select
              required
              value={newUser.role || ''}
              onChange={e => setNewUser({ ...newUser, role: e.target.value as User['role'] })}
              className="border px-3 py-2 rounded w-full"
            >
              <option value="">Select Role</option>
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            
            {/* Lecturer-specific fields */}
            {newUser.role === 'lecturer' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    required
                    value={newLecturer.department || ''}
                    onChange={e => setNewLecturer({ ...newLecturer, department: e.target.value })}
                    className="border px-3 py-2 rounded w-full"
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  
                  <select
                    required
                    value={newLecturer.collegeId || ''}
                    onChange={e => setNewLecturer({ ...newLecturer, collegeId: e.target.value })}
                    className="border px-3 py-2 rounded w-full"
                  >
                    <option value="">Select College</option>
                    {colleges.map(college => (
                      <option key={college.id} value={college.id}>{college.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={newLecturer.phone || ''}
                    onChange={e => setNewLecturer({ ...newLecturer, phone: e.target.value })}
                    className="border px-3 py-2 rounded w-full"
                  />
                  
                  <input
                    type="text"
                    placeholder="Address (optional)"
                    value={newLecturer.address || ''}
                    onChange={e => setNewLecturer({ ...newLecturer, address: e.target.value })}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                
                <textarea
                  placeholder="Qualifications (optional)"
                  value={newLecturer.qualifications || ''}
                  onChange={e => setNewLecturer({ ...newLecturer, qualifications: e.target.value })}
                  className="border px-3 py-2 rounded w-full"
                  rows={3}
                />
              </>
            )}
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
              <button type="button" className="px-4 py-2 rounded border" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Form */}
      {editUserId && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                required
                placeholder="First Name"
                value={editUser.firstName || ''}
                onChange={e => setEditUser({ ...editUser, firstName: e.target.value })}
                className="border px-3 py-2 rounded w-full"
              />
              <input
                type="text"
                required
                placeholder="Last Name"
                value={editUser.lastName || ''}
                onChange={e => setEditUser({ ...editUser, lastName: e.target.value })}
                className="border px-3 py-2 rounded w-full"
              />
            </div>
            <input
              type="email"
              required
              placeholder="Email"
              value={editUser.email || ''}
              onChange={e => setEditUser({ ...editUser, email: e.target.value })}
              className="border px-3 py-2 rounded w-full"
            />
            <select
              required
              value={editUser.role || ''}
              onChange={e => setEditUser({ ...editUser, role: e.target.value as User['role'] })}
              className="border px-3 py-2 rounded w-full"
            >
              <option value="">Select Role</option>
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save</button>
              <button type="button" className="px-4 py-2 rounded border" onClick={() => setEditUserId(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department/Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'lecturer' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.role === 'lecturer' ? (
                      <div>
                        <div className="font-medium">{lecturers.filter(lect => lect.uid == user.uid)[0].department}</div>
                        <div className="text-xs text-gray-500">Staff: {lecturers.filter(lect => lect.uid == user.uid)[0].staffNumber}</div>
                      </div>
                    ) : (
                      <div className="text-gray-400">-</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => {
                          setEditUserId(user.uid);
                          setEditUser(user);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteUser(user.uid)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || filterRole !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No users have been registered yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;