import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image, Download, Trash2, Eye, Plus, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Asset } from '../types';
import FileUpload from '../components/common/FileUpload';
import { getAssetsByUploader, deleteAsset } from '../services/database';
import { getFileViewUrl, getFileDownloadUrl, getFilePreviewUrl } from '../services/storage';
import { useNotification } from '../context/NotificationContext';

const Documents: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [documents, setDocuments] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | Asset['category']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const userDocuments = await getAssetsByUploader(currentUser.uid);
        setDocuments(userDocuments);
      } catch (error) {
        console.error('Error fetching documents:', error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load documents'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [currentUser, addNotification]);

  const handleFileUpload = async (_fileData: any) => {
    if (!currentUser) return;

    try {
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteAsset(id);
      setDocuments(documents.filter(doc => doc.id !== id));
      
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

  const handleDownload = async (asset: Asset) => {
    try {
      if (asset.fileId) {
        const downloadUrl = getFileDownloadUrl(asset.fileId);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = asset.originalName || asset.name;
        link.target = '_blank';
        link.click();
      } else if (asset.url) {
        // Fallback for old documents with URL
        const link = document.createElement('a');
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

  const handleView = (asset: Asset) => {
    try {
      if (asset.fileId) {
        const viewUrl = getFileViewUrl(asset.fileId);
        window.open(viewUrl, '_blank');
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

  const getFileDisplayUrl = (asset: Asset) => {
    if (asset.fileId) {
      return getFileViewUrl(asset.fileId);
    } else if (asset.url) {
      return asset.url;
    }
    return '';
  };

  const getDocumentPreviewUrl = (asset: Asset) => {
    if (asset.fileId && asset.type.startsWith('image/')) {
      return getFilePreviewUrl(asset.fileId, 400, 400);
    }
    return getFileDisplayUrl(asset);
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
      return <Image className="h-8 w-8 text-blue-600" />;
    }
    return <FileText className="h-8 w-8 text-red-600" />;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { value: 'all', label: 'All Documents', count: documents.length },
    { value: 'document', label: 'Documents', count: documents.filter(d => d.category === 'document').length },
    { value: 'image', label: 'Images', count: documents.filter(d => d.category === 'image').length },
  ];

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
            <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
            <p className="text-gray-600 mt-1">Upload and manage your academic documents</p>
          </div>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </button>
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
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="document">Documents</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      {showUploadForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload New Document</h2>
          <FileUpload
            onUpload={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt"
            maxSize={10}
            folder={`user-documents/${currentUser?.uid}`}
          />
        </div>
      )}

      {/* Categories */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedCategory === 'all' ? 'All Documents' : 
             selectedCategory === 'document' ? 'Documents' : 'Images'}
          </h2>
        </div>
        
        {filteredDocuments.length > 0 ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((document) => (
                <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      {getFileIcon(document.type)}
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {document.originalName || document.name}
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
                        src={getDocumentPreviewUrl(document)}
                        alt={document.originalName || document.name}
                        className="w-full h-32 object-cover rounded-md"
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mb-3">
                    Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(document)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(document)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(document.id)}
                      className="px-3 py-2 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600">
              {selectedCategory === 'all' 
                ? 'Upload your first document to get started.'
                : `No ${selectedCategory}s uploaded yet.`}
            </p>
          </div>
        )}
      </div>

      {/* Document Requirements */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Identity Documents</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• South African ID Document</li>
              <li>• Passport (if applicable)</li>
            </ul>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Academic Records</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Matric Certificate</li>
              <li>• Academic Transcript</li>
              <li>• Previous Qualifications</li>
            </ul>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Financial Documents</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Proof of Payment</li>
              <li>• NSFAS Documentation</li>
              <li>• Bursary Letters</li>
            </ul>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Other Documents</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Medical Certificate</li>
              <li>• Proof of Residence</li>
              <li>• Profile Photo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;