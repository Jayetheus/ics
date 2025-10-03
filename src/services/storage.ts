import { Client, Storage, ID } from 'appwrite';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'your_project_id_here');

export const storage = new Storage(client);
export const BUCKET_ID = '6894f208002ce1ab60b5';

// Upload file to Appwrite storage bucket
export const uploadFile = async (file: File, folder: string = '') => {
  try {
    const fileName = folder ? `${folder}/${Date.now()}_${file.name}` : `${Date.now()}_${file.name}`;
    const response = await storage.createFile(BUCKET_ID, ID.unique(), file);
    
    return {
      id: response.$id,
      name: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      bucketId: BUCKET_ID,
      uploadedAt: response.$createdAt,
      url: await getFileViewUrl(response.$id),
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Delete file from Appwrite storage bucket
export const deleteFile = async (fileId: string) => {
  try {
    await storage.deleteFile(BUCKET_ID, fileId);
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get file download URL
export const getFileDownloadUrl = (fileId: string) => {
  try {
    return storage.getFileDownload(BUCKET_ID, fileId);
  } catch (error) {
    console.error('Get download URL error:', error);
    throw new Error(`Failed to get download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get file view URL (for displaying in browser)
export const getFileViewUrl = (fileId: string) => {
  try {
    return storage.getFileView(BUCKET_ID, fileId);
  } catch (error) {
    console.error('Get view URL error:', error);
    throw new Error(`Failed to get view URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get file preview URL (for thumbnails)
export const getFilePreviewUrl = (fileId: string, width: number = 400, height: number = 400) => {
  try {
    return storage.getFilePreview(BUCKET_ID, fileId, width, height);
  } catch (error) {
    console.error('Get preview URL error:', error);
    throw new Error(`Failed to get preview URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get file information
export const getFileInfo = async (fileId: string) => {
  try {
    const response = await storage.getFile(BUCKET_ID, fileId);
    return {
      id: response.$id,
      name: response.name,
      size: response.sizeOriginal,
      type: response.mimeType,
      uploadedAt: response.$createdAt,
      bucketId: response.bucketId,
    };
  } catch (error) {
    console.error('Get file info error:', error);
    throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// List files in bucket (for admin purposes)
export const listFiles = async (queries: string[] = []) => {
  try {
    const response = await storage.listFiles(BUCKET_ID, queries);
    return response.files.map(file => ({
      id: file.$id,
      name: file.name,
      size: file.sizeOriginal,
      type: file.mimeType,
      uploadedAt: file.$createdAt,
      bucketId: file.bucketId,
    }));
  } catch (error) {
    console.error('List files error:', error);
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};