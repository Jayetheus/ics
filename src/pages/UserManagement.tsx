import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Edit, Eye, Trash2, Download, Loader2, 
  FileText, Upload, X, Phone, MapPin, GraduationCap, 
  User as UserIcon, Mail, Shield, Clock,
  Image, FolderOpen
} from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, createLecturer, getColleges, generateStaffNumber } from '../services/database';
import { getAssetsByUploader, deleteAsset, createAsset } from '../services/appwriteDatabase';
import { getFileViewUrl, getFileDownloadUrl } from '../services/storage';
import { User, College, Asset } from '../types';
import { DEPARTMENTS } from '../data/constants';
import { EmailData, emailService } from '../services/emailService';
import FileUpload from '../components/common/FileUpload';
import { useNotification } from '../context/NotificationContext';


const ROLES = ['admin', 'student', 'lecturer'];


const UserManagement: React.FC = () => {
  const { addNotification } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | User['role']>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({});
  const [newLecturer, setNewLecturer] = useState<Partial<User>>({});
  const [password, setPassword] = useState("");
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<Partial<User>>({});
  const [adding, setAdding] = useState(false);
  
  // User details modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userDocuments, setUserDocuments] = useState<Asset[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, collegesData] = await Promise.all([
          getUsers(),
          getColleges()
        ]);
        setUsers(usersData);
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
    ...users.map(user => ({ ...user, type: 'user' as const }))
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
      setAdding(true);
      if (newUser.role === 'lecturer') {
        // Create lecturer with additional attributes
        const staffNumber = await generateStaffNumber();
        const lecturerData: Partial<User> = {
          ...newUser,
          staffNumber,
          department: newLecturer.department || DEPARTMENTS[0],
          collegeId: newLecturer.collegeId || colleges[0]?.id || '',
          phone: newLecturer.phone || '',
          address: newLecturer.address || '',
          qualifications: newLecturer.qualifications || '',
          subjects: []
        };
        await createLecturer(lecturerData, password);

      } else {
        // Create regular user
        const created = await createUser(newUser, password);
        setUsers([...users, created]);
      }
      

      emailService.sendEmail(
        {
          to: newUser.email ,
          body: `Greetings ${newUser.firstName} ${newUser.lastName},\n
           A new account has been created for you with these details:\n
           email: ${newUser.email}\n
           password: ${password}\n
           \n
           Regards, \n
           EduTech System
          `,
          subject: 'EduTech Account Created For You'
        } as EmailData
      )


      setShowAddForm(false);
      setNewUser({});
      setNewLecturer({});
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to add user');
    } finally {
      setAdding(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserId) return;
    try {
      setAdding(true)
      const updated = await updateUser(editUserId, editUser);
      setUsers(users.map(u => (u.uid === editUserId ? updated : u)));
      setEditUserId(null);
      setEditUser({});
    } catch {
      alert('Failed to update user');
    } finally {
      setAdding(false)
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      setUsers(users.filter(u => u.uid !== id));
      addNotification({
        type: 'success',
        title: 'User Deleted',
        message: 'User has been successfully deleted'
      });
    } catch {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete user'
      });
    }
  };

  // User details and document management functions
  const handleViewUserDetails = async (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
    setLoadingDocuments(true);
    
    try {
      const documents = await getAssetsByUploader(user.uid);
      setUserDocuments(documents);
    } catch (error) {
      console.error('Error fetching user documents:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load user documents'
      });
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDocumentUpload = async (fileData: any) => {
    if (!selectedUser) return;

    try {
      const assetData = {
        name: fileData.name,
        originalName: fileData.originalName || fileData.name,
        type: fileData.type,
        url: fileData.url,
        fileId: fileData.fileId,
        bucketId: fileData.bucketId,
        uploadedBy: selectedUser.uid,
        size: fileData.size,
        category: (fileData.type.startsWith('image/') ? 'image' : 'document') as 'image' | 'document' | 'video' | 'other'
      };

      await createAsset(assetData);
      
      // Refresh documents list
      const documents = await getAssetsByUploader(selectedUser.uid);
      setUserDocuments(documents);
      
      addNotification({
        type: 'success',
        title: 'Document Uploaded',
        message: 'Document has been successfully uploaded for this user'
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload document'
      });
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteAsset(documentId);
      setUserDocuments(userDocuments.filter(doc => doc.id !== documentId));
      
      addNotification({
        type: 'success',
        title: 'Document Deleted',
        message: 'Document has been successfully deleted'
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete document'
      });
    }
  };

  const handleDocumentDownload = async (asset: Asset) => {
    try {
      if (asset.fileId) {
        const downloadUrl = getFileDownloadUrl(asset.fileId);
        const link = window.document.createElement('a');
        link.href = downloadUrl.toString();
        link.download = asset.originalName || asset.name;
        link.target = '_blank';
        link.click();
      } else if (asset.url) {
        // Fallback for old documents with URL
        const link = window.document.createElement('a');
        link.href = asset.url;
        link.download = asset.originalName || asset.name;
        link.target = '_blank';
        link.click();
      } else {
        throw new Error('No file available for download');
      }
    } catch (error) {
      console.error('Download error:', error);
      addNotification({
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download file. Please try again.'
      });
    }
  };

  const handleDocumentView = (asset: Asset) => {
    try {
      if (asset.fileId) {
        const viewUrl = getFileViewUrl(asset.fileId);
        window.open(viewUrl.toString(), '_blank');
      } else if (asset.url) {
        // Fallback for old documents with URL
        window.open(asset.url, '_blank');
      } else {
        throw new Error('No file available for viewing');
      }
    } catch (error) {
      console.error('View error:', error);
      addNotification({
        type: 'error',
        title: 'View Failed',
        message: 'Failed to open file. Please try again.'
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-600" />;
    }
    return <FileText className="h-6 w-6 text-red-600" />;
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
            <input
              type="password"
              required
              placeholder="New Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
                    {DEPARTMENTS.map((dept: string) => (
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
              <button disabled={adding} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">{adding? <Loader2 className='animate-spin'/> : "Add"}</button>
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
              <div className="font-medium">{user.department || 'N/A'}</div>
              <div className="text-xs text-gray-500">Staff: {user.staffNumber || 'N/A'}</div>
            </div>
          ) : (
            <div className="text-gray-400">-</div>
          )}
        </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleViewUserDetails(user)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => {
                          setEditUserId(user.uid);
                          setEditUser(user);
                        }}
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteUser(user.uid)}
                        title="Delete User"
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

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                <button
                  onClick={() => {
                    setShowUserDetails(false);
                    setSelectedUser(null);
                    setUserDocuments([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium text-gray-900">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                        selectedUser.role === 'lecturer' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedUser.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.status === 'active' ? 'bg-green-100 text-green-800' :
                        selectedUser.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedUser.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{selectedUser.phone}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.address && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium text-gray-900">{selectedUser.address}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.department && (
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-medium text-gray-900">{selectedUser.department}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.staffNumber && (
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Staff Number</p>
                        <p className="font-medium text-gray-900">{selectedUser.staffNumber}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.studentNumber && (
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Student Number</p>
                        <p className="font-medium text-gray-900">{selectedUser.studentNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              {(selectedUser.qualifications || selectedUser.courseCode) && (
                <div className="border-t pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.qualifications && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Qualifications</p>
                        <p className="text-sm text-gray-900">{selectedUser.qualifications}</p>
                      </div>
                    )}
                    {selectedUser.courseCode && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Course Code</p>
                        <p className="text-sm text-gray-900">{selectedUser.courseCode}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Document Management Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-semibold text-gray-900">Documents</h4>
                  <button
                    onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </button>
                </div>

                {/* Document Upload Form */}
                {showDocumentUpload && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">Upload Document for {selectedUser.firstName} {selectedUser.lastName}</h5>
                    <FileUpload
                      onUpload={handleDocumentUpload}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      maxSize={10}
                      folder={`user-documents/${selectedUser.uid}`}
                    />
                  </div>
                )}

                {/* Documents List */}
                {loadingDocuments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : userDocuments && userDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userDocuments.map((document) => (
                      <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            {getFileIcon(document.type)}
                            <div className="ml-3 flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {document.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(document.size)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {document.type.startsWith('image/') && (
                          <div className="mb-3">
                            <img
                              src={document.url}
                              alt={document.name}
                              className="w-full h-24 object-cover rounded-md"
                            />
                          </div>
                        )}

                        <div className="text-xs text-gray-500 mb-3">
                          Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDocumentView(document)}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDocumentDownload(document)}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </button>
                          <button
                            onClick={() => handleDocumentDelete(document.id)}
                            className="px-3 py-2 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                    <p className="text-gray-600">This user hasn't uploaded any documents yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;