import { Client, Databases, Query, ID } from 'appwrite';
import { Asset, Result, User } from '../types';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const databases = new Databases(client);

// Database IDs
const DATABASE_ID = 'main';
const ASSETS_COLLECTION_ID = '6894f208002ce1ab60b6'; // Assets collection ID
const RESULTS_COLLECTION_ID = '6894f208002ce1ab60b7'; // Results collection ID
const USERS_COLLECTION_ID = '6894f208002ce1ab60b8'; // Users collection ID
const SUBJECTS_COLLECTION_ID = '6894f208002ce1ab60b9'; // Subjects collection ID

// Asset/Document functions
export const createAsset = async (assetData: Omit<Asset, 'id' | 'uploadedAt'>) => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      ASSETS_COLLECTION_ID,
      ID.unique(),
      {
        ...assetData,
        uploadedAt: new Date().toISOString(),
      }
    );
    return response.$id;
  } catch (error) {
    console.error('Error creating asset:', error);
    throw error;
  }
};

export const getAssetsByUploader = async (uploadedBy: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      ASSETS_COLLECTION_ID,
      [
        Query.equal('uploadedBy', uploadedBy),
        Query.orderDesc('uploadedAt')
      ]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      ...doc
    } as Asset));
  } catch (error) {
    console.error('Error getting assets by uploader:', error);
    throw error;
  }
};

export const getAllAssets = async () => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      ASSETS_COLLECTION_ID,
      [Query.orderDesc('uploadedAt')]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      ...doc
    } as Asset));
  } catch (error) {
    console.error('Error getting all assets:', error);
    throw error;
  }
};

export const deleteAsset = async (id: string) => {
  try {
    // First get the asset to get the fileId
    const asset = await databases.getDocument(DATABASE_ID, ASSETS_COLLECTION_ID, id);
    
    // Delete from database
    await databases.deleteDocument(DATABASE_ID, ASSETS_COLLECTION_ID, id);
    
    // If there's a fileId, also delete from storage
    if (asset.fileId) {
      const { deleteFile } = await import('./storage');
      await deleteFile(asset.fileId);
    }
  } catch (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }
};

// Results functions
export const createResult = async (resultData: Omit<Result, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      RESULTS_COLLECTION_ID,
      ID.unique(),
      {
        ...resultData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    return response.$id;
  } catch (error) {
    console.error('Error creating result:', error);
    throw error;
  }
};

export const getResultsByStudent = async (studentId: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      RESULTS_COLLECTION_ID,
      [
        Query.equal('studentId', studentId),
        Query.orderDesc('createdAt')
      ]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      ...doc
    } as Result));
  } catch (error) {
    console.error('Error getting results by student:', error);
    throw error;
  }
};

export const getResultsByLecturer = async (lecturerId: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      RESULTS_COLLECTION_ID,
      [
        Query.equal('lecturerId', lecturerId),
        Query.orderDesc('createdAt')
      ]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      ...doc
    } as Result));
  } catch (error) {
    console.error('Error getting results by lecturer:', error);
    throw error;
  }
};

export const getResultsBySubject = async (subjectCode: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      RESULTS_COLLECTION_ID,
      [
        Query.equal('subjectCode', subjectCode),
        Query.orderDesc('createdAt')
      ]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      ...doc
    } as Result));
  } catch (error) {
    console.error('Error getting results by subject:', error);
    throw error;
  }
};

export const updateResult = async (id: string, resultData: Partial<Result>) => {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      RESULTS_COLLECTION_ID,
      id,
      {
        ...resultData,
        updatedAt: new Date().toISOString(),
      }
    );
    return response.$id;
  } catch (error) {
    console.error('Error updating result:', error);
    throw error;
  }
};

export const deleteResult = async (id: string) => {
  try {
    await databases.deleteDocument(DATABASE_ID, RESULTS_COLLECTION_ID, id);
  } catch (error) {
    console.error('Error deleting result:', error);
    throw error;
  }
};

// Get students enrolled in a subject
export const getStudentsBySubject = async (subjectCode: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [
        Query.equal('role', 'student'),
        Query.contains('enrolledSubjects', subjectCode)
      ]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      ...doc
    } as User));
  } catch (error) {
    console.error('Error getting students by subject:', error);
    throw error;
  }
};

// Get subjects taught by a lecturer
export const getSubjectsByLecturer = async (lecturerId: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [
        Query.equal('$id', lecturerId)
      ]
    );
    
    if (response.documents.length === 0) {
      return [];
    }
    
    const lecturer = response.documents[0];
    const subjects = lecturer.subjects || [];
    
    // Get subject details
    const subjectPromises = subjects.map(async (subjectCode: string) => {
      try {
        const subjectResponse = await databases.listDocuments(
          DATABASE_ID,
          SUBJECTS_COLLECTION_ID,
          [Query.equal('code', subjectCode)]
        );
        return subjectResponse.documents[0];
      } catch (error) {
        console.error(`Error getting subject ${subjectCode}:`, error);
        return null;
      }
    });
    
    const subjectResults = await Promise.all(subjectPromises);
    return subjectResults.filter(subject => subject !== null);
  } catch (error) {
    console.error('Error getting subjects by lecturer:', error);
    throw error;
  }
};

export default client;
