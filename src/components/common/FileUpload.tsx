import React, { useState, useRef } from 'react';
import { Upload, X, File, Image, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadFile } from '../../services/storage';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from './LoadingSpinner';

interface FileUploadProps {
  onUpload: (fileData: any) => void;
  accept?: string;
  maxSize?: number; // in MB
  folder?: string;
  multiple?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  accept = "*/*",
  maxSize = 10,
  folder = '',
  multiple = false,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotification();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    // Validate files first
    for (const file of fileArray) {
      if (file.size > maxSize * 1024 * 1024) {
        addNotification({
          type: 'error',
          title: 'File Too Large',
          message: `File ${file.name} is too large. Maximum size is ${maxSize}MB.`,
        });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadedFiles(validFiles);

    try {
      for (const file of validFiles) {
        const uploadedFile = await uploadFile(file, folder);
        onUpload(uploadedFile);
      }
      
      addNotification({
        type: 'success',
        title: 'Upload Successful',
        message: `Successfully uploaded ${validFiles.length} file(s).`,
      });
    } catch (error: any) {
      console.error('Upload failed:', error);
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload files. Please try again.',
      });
    } finally {
      setUploading(false);
      setUploadedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-8 w-8" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-gray-600 mb-2">Uploading...</p>
            {uploadedFiles.length > 0 && (
              <div className="text-sm text-gray-500">
                Uploading {uploadedFiles.length} file(s)...
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-8 w-8 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              Drop files here or <span className="text-blue-600 font-medium">browse</span>
            </p>
            <p className="text-sm text-gray-500">
              Maximum file size: {maxSize}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;