import React, { useState, useEffect } from 'react';
import { Upload, Search, Filter, Eye, Trash2, Download, FileText, Image, File } from 'lucide-react';
import { getAssets, deleteAsset } from '../services/database';
import { useNotification } from '../context/NotificationContext';
import { Asset } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AssetManagement: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | Asset['category']>('all');
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const assetsData = await getAssets();
      setAssets(assetsData);
    } catch (error) {
      console.error('Error fetching assets:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load assets'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assetId: string, assetName: string) => {
    if (!confirm(`Are you sure you want to delete "${assetName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteAsset(assetId);
      setAssets(assets.filter(a => a.id !== assetId));
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Asset deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete asset'
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
      return <Image className="h-5 w-5 text-blue-600" />;
    } else if (type.includes('pdf') || type.includes('document')) {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const getCategoryColor = (category: Asset['category']) => {
    switch (category) {
      case 'document':
        return 'bg-blue-100 text-blue-800';
      case 'image':
        return 'bg-green-100 text-green-800';
      case 'video':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || asset.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Categories', count: assets.length },
    { value: 'document', label: 'Documents', count: assets.filter(a => a.category === 'document').length },
    { value: 'image', label: 'Images', count: assets.filter(a => a.category === 'image').length },
    { value: 'video', label: 'Videos', count: assets.filter(a => a.category === 'video').length },
    { value: 'other', label: 'Other', count: assets.filter(a => a.category === 'other').length },
  ];

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
            <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
            <p className="text-gray-600 mt-1">Manage institutional assets and documents</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Assets</p>
              <p className="text-2xl font-semibold text-gray-900">{assets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Image className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Images</p>
              <p className="text-2xl font-semibold text-gray-900">
                {assets.filter(a => a.category === 'image').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Documents</p>
              <p className="text-2xl font-semibold text-gray-900">
                {assets.filter(a => a.category === 'document').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Upload className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Size</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatFileSize(assets.reduce((sum, a) => sum + a.size, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => setFilterCategory(category.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === category.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {filterCategory === 'all' ? 'All Assets' : 
             filterCategory === 'document' ? 'Documents' : 
             filterCategory === 'image' ? 'Images' :
             filterCategory === 'video' ? 'Videos' : 'Other Files'}
          </h2>
        </div>
        
        {filteredAssets.length > 0 ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center flex-1 min-w-0">
                      {getFileIcon(asset.type)}
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={asset.name}>
                          {asset.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(asset.size)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getCategoryColor(asset.category)}`}>
                      {asset.category}
                    </span>
                  </div>

                  {asset.type.startsWith('image/') && (
                    <div className="mb-3">
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mb-3">
                    <div>Uploaded: {new Date(asset.uploadedAt).toLocaleDateString()}</div>
                    <div>Type: {asset.type}</div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(asset.url, '_blank')}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = asset.url;
                        link.download = asset.name;
                        link.click();
                      }}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id, asset.name)}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-600">
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No assets have been uploaded yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetManagement;