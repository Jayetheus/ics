import { Client, Storage, ID } from 'appwrite';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const storage = new Storage(client);
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

export const uploadFile = async (file: File, folder: string = '') => {
  try {
    const fileName = folder ? `${folder}/${Date.now()}_${file.name}` : `${Date.now()}_${file.name}`;
    const response = await storage.createFile(BUCKET_ID, ID.unique(), file);
    return {
      id: response.$id,
      name: fileName,
      url: `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const deleteFile = async (fileId: string) => {
  try {
    await storage.deleteFile(BUCKET_ID, fileId);
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

export const getFilePreview = (fileId: string, width: number = 400, height: number = 400) => {
  return `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/preview?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}&width=${width}&height=${height}`;
};