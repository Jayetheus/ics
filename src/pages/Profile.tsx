import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Upload, Save, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateStudentProfile } from '../services/database';
import { COLLEGES, COURSES } from '../data/constants';
import FileUpload from '../components/common/FileUpload';
import { useNotification } from '../context/NotificationContext';

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: currentUser?.profile?.firstName || '',
    lastName: currentUser?.profile?.lastName || '',
    college: currentUser?.profile?.college || '',
    phone: currentUser?.profile?.phone || '',
    address: currentUser?.profile?.address || '',
    dateOfBirth: currentUser?.profile?.dateOfBirth || '',
    photoUrl: currentUser?.profile?.photoUrl || '',
    course: currentUser?.profile?.course || '',
    year: currentUser?.profile?.year || 1,
    studentNumber: currentUser?.profile?.studentNumber || '',
    staffNumber: currentUser?.profile?.staffNumber || '',
  });

  const handleSave = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      await updateStudentProfile(currentUser.uid, profileData);
      setEditing(false);
      addNotification({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully!'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update profile. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (fileData: any) => {
    setProfileData({ ...profileData, photoUrl: fileData.url });
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
                  {COLLEGES.map(college => (
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
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">{profileData.studentNumber || 'Not assigned'}</p>
                  </div>
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
                      {COURSES.map(course => (
                        <option key={course} value={course}>{course}</option>
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
                      <option value={5}>5th Year</option>
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
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-gray-900">{profileData.staffNumber || 'Not assigned'}</p>
                </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Since
            </label>
            <p className="text-gray-900">
              {currentUser?.profile?.createdAt 
                ? new Date(currentUser.profile.createdAt).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Updated
            </label>
            <p className="text-gray-900">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;