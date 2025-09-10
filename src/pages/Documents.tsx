import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image, Download, Trash2, Eye, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Asset } from '../types';
import FileUpload from '../components/common/FileUpload';

const Documents: React.FC = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | Asset['category']>('all');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        // Sample documents data
        const sampleDocuments: Asset[] = [
          {
            id: '1',
            name: 'ID_Document.pdf',
            type: 'application/pdf',
            url: 'https://example.com/id.pdf',
            uploadedBy: currentUser?.uid || '',
            uploadedAt: '2025-01-15T10:30:00Z',
            size: 2048000,
            category: 'document'
          },
          {
            id: '2',
            name: 'Matric_Certificate.pdf',
            type: 'application/pdf',
            url: 'https://example.com/matric.pdf',
            uploadedBy: currentUser?.uid || '',
            uploadedAt: '2025-01-14T14:20:00Z',
            size: 1536000,
            category: 'document'
          },
          {
            id: '3',
            name: 'Profile_Photo.jpg',
            type: 'image/jpeg',
            url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
            uploadedBy: currentUser?.uid || '',
            uploadedAt: '2025-01-13T09:15:00Z',
            size: 512000,
            category: 'image'
          }
        ];
        
        setDocuments(sampleDocuments);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [currentUser]);

  const handleFileUpload = (fileData: any) => {
    const newDocument: Asset = {
      id: Date.now().toString(),
      name: fileData.name,
      type: fileData.type,
      url: fileData.url,
      uploadedBy: currentUser?.uid || '',
      uploadedAt: new Date().toISOString(),
      size: fileData.size,
      category: fileData.type.startsWith('image/') ? 'image' : 'document'
    };

    setDocuments([newDocument, ...documents]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(doc => doc.id !== id));
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
      return <Image className="h-8 w-8 text-blue-600" />;
    }
    return <FileText className="h-8 w-8 text-red-600" />;
  };

  const filteredDocuments = documents.filter(doc => 
    selectedCategory === 'all' || doc.category === selectedCategory
  );

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
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload New Document</h2>
        <FileUpload
          onUpload={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx"
          maxSize={10}
          folder="student-documents"
        />
      </div>

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
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mb-3">
                    Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(document.url, '_blank')}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = document.url;
                        link.download = document.name;
                        link.click();
                      }}
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