import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, Save, Edit, 
  FileText, Download, Trash2, Eye, Image, FolderOpen, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getCourses } from '../services/database';
import FileUpload from '../components/common/FileUpload';
import { getAssetsByUploader, deleteAsset, createAsset } from '../services/appwriteDatabase';
import { getFileViewUrl, getFileDownloadUrl } from '../services/storage';
import { Asset, Course } from '../types';
import { useNotification } from '../context/NotificationContext';

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    college: currentUser?.collegeId || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    dateOfBirth: currentUser?.dateOfBirth || '',
    photoUrl: currentUser?.photoUrl || '',
    course: currentUser?.courseCode || '',
    year: currentUser?.year || 1,
    studentNumber: currentUser?.studentNumber || '',
    staffNumber: currentUser?.staffNumber || '',
  });

  // Document management states
  const [documents, setDocuments] = useState<Asset[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [colleges, setColleges] = useState<string[]>([]);

  // Load courses and colleges data
  useEffect(() => {
    const loadData = async () => {
      try {
        const coursesData = await getCourses();
        console.log('Loaded courses:', coursesData);
        setCourses(coursesData);
        
        // Extract unique colleges from courses
        const uniqueColleges = [...new Set(coursesData.map(course => course.department || 'Unknown Department'))];
        setColleges(uniqueColleges);
        console.log('Loaded colleges:', uniqueColleges);
      } catch (error) {
        console.error('Error loading profile data:', error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load profile data'
        });
        // Set empty arrays as fallback
        setCourses([]);
        setColleges([]);
      }
    };

    loadData();
  }, [addNotification]);

  const handleSave = async () => {
    if (!currentUser || !db) return;
    
    try {
      setLoading(true);
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: new Date()
      });
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (fileData: any) => {
    // Get the view URL from the fileId if available
    const photoUrl = fileData.fileId ? getFileViewUrl(fileData.fileId).toString() : '';
    setProfileData({ ...profileData, photoUrl });
  };

  // Load user documents
  useEffect(() => {
    const loadDocuments = async () => {
      if (!currentUser) return;
      
      setLoadingDocuments(true);
      try {
        const userDocuments = await getAssetsByUploader(currentUser.uid);
        setDocuments(userDocuments);
      } catch (error) {
        console.error('Error loading documents:', error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load documents'
        });
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, [currentUser, addNotification]);

  // Document management functions
  const handleDocumentUpload = async (fileData: any) => {
    if (!currentUser) return;

    try {
      const assetData = {
        name: fileData.name,
        originalName: fileData.originalName || fileData.name,
        type: fileData.type,
        fileId: fileData.fileId,
        bucketId: fileData.bucketId,
        uploadedBy: currentUser.uid,
        size: fileData.size,
        category: (fileData.type.startsWith('image/') ? 'image' : 'document') as 'image' | 'document' | 'video' | 'other'
      };

      await createAsset(assetData);
      
      // Refresh documents list
      const userDocuments = await getAssetsByUploader(currentUser.uid);
      setDocuments(userDocuments);
      
      addNotification({
        type: 'success',
        title: 'Document Uploaded',
        message: 'Document has been successfully uploaded'
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
      setDocuments(documents.filter(doc => doc.id !== documentId));
      
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

  const handleDocumentDownload = async (doc: Asset) => {
    try {
      if (doc.fileId) {
        const downloadUrl = getFileDownloadUrl(doc.fileId);
        const link = window.document.createElement('a');
        link.href = downloadUrl.toString();
        link.download = doc.originalName || doc.name;
        link.target = '_blank';
        link.click();
      } else if (doc.url) {
        // Fallback for old documents with URL
        const link = window.document.createElement('a');
        link.href = doc.url;
        link.download = doc.originalName || doc.name;
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

  const handleDocumentView = (doc: Asset) => {
    try {
      if (doc.fileId) {
        const viewUrl = getFileViewUrl(doc.fileId);
        window.open(viewUrl.toString(), '_blank');
      } else if (doc.url) {
        // Fallback for old documents with URL
        window.open(doc.url, '_blank');
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your personal information</p>
          </div>
          <div className="flex space-x-3">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h2>
          <div className="text-center">
            {profileData.photoUrl ? (
              <img
                src={profileData.photoUrl}
                alt="Profile"
                className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto bg-gray-200 flex items-center justify-center">
                <User className="h-16 w-16 text-gray-400" />
              </div>
            )}
            
            {editing && (
              <div className="mt-4">
                <FileUpload
                  onUpload={handlePhotoUpload}
                  accept="image/*"
                  maxSize={5}
                  folder="profile-photos"
                  className="max-w-sm mx-auto"
                />
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profileData.firstName || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profileData.lastName || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <p className="text-gray-900">{currentUser?.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                College/University
              </label>
              {editing ? (
                <select
                  value={profileData.college}
                  onChange={(e) => setProfileData({ ...profileData, college: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select College/University</option>
                  {colleges.map((college: string) => (
                    <option key={college} value={college}>{college}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900">{profileData.college || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-gray-900">{profileData.phone || 'Not provided'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              {editing ? (
                <input
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-gray-900">{profileData.dateOfBirth || 'Not provided'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              {editing ? (
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-gray-900">{profileData.address || 'Not provided'}</p>
                </div>
              )}
            </div>

            {/* Role-specific fields */}
            {currentUser?.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Number
                  </label>
                  <p className="text-gray-900">{profileData.studentNumber}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course
                  </label>
                  {editing ? (
                    <select
                      value={profileData.course}
                      onChange={(e) => setProfileData({ ...profileData, course: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {courses.map((course: Course) => (
                        <option key={course.code} value={course.code}>{course.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{profileData.course || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year of Study
                  </label>
                  {editing ? (
                    <select
                      value={profileData.year}
                      onChange={(e) => setProfileData({ ...profileData, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{profileData.year ? `${profileData.year}${profileData.year === 1 ? 'st' : profileData.year === 2 ? 'nd' : profileData.year === 3 ? 'rd' : 'th'} Year` : 'Not provided'}</p>
                  )}
                </div>
              </>
            )}

            {currentUser?.role !== 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff Number
                </label>
                <p className="text-gray-900">{profileData.staffNumber}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <p className="text-gray-900 capitalize">{currentUser?.role}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Status
            </label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">My Documents</h2>
          <button
            onClick={() => setShowDocumentUpload(!showDocumentUpload)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </button>
        </div>

        {/* Document Upload Form */}
        {showDocumentUpload && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Upload New Document</h3>
            <FileUpload
              onUpload={handleDocumentUpload}
              accept="image/*,.pdf,.doc,.docx,.txt"
              maxSize={10}
              folder={`user-documents/${currentUser?.uid}`}
            />
          </div>
        )}

        {/* Documents List */}
        {loadingDocuments ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((document) => (
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
            <p className="text-gray-600">You haven't uploaded any documents yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;