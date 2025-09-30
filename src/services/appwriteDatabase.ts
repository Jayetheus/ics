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
const COURSES_COLLECTION_ID = '6894f208002ce1ab60ba'; // Courses collection ID

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
    console.error('Error getting students by subject from Appwrite:', error);
    // Fallback to Firebase if Appwrite fails
    try {
      const { getStudentsBySubject: getStudentsBySubjectFirebase } = await import('./database');
      return await getStudentsBySubjectFirebase(subjectCode);
    } catch (firebaseError) {
      console.error('Error getting students by subject from Firebase:', firebaseError);
      // If Firebase also fails, try to get all students and filter by course
      try {
        const { getUsers } = await import('./database');
        const allUsers = await getUsers();
        const students = allUsers.filter(user => user.role === 'student');
        
        // For now, return all students as a fallback
        // In a real scenario, you'd want to implement proper subject enrollment
        console.warn('Using fallback: returning all students. Subject enrollment data may be incomplete.');
        return students;
      } catch (fallbackError) {
        console.error('All fallback methods failed:', fallbackError);
        throw error; // Throw original Appwrite error
      }
    }
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

// Get subjects by course
export const getSubjectsByCourse = async (courseCode: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      SUBJECTS_COLLECTION_ID,
      [
        Query.equal('courseCode', courseCode)
      ]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      ...doc
    }));
  } catch (error) {
    console.error('Error getting subjects by course from Appwrite:', error);
    // Fallback to Firebase if Appwrite fails
    try {
      const { getSubjectsByCourse: getSubjectsByCourseFirebase } = await import('./database');
      return await getSubjectsByCourseFirebase(courseCode);
    } catch (firebaseError) {
      console.error('Error getting subjects by course from Firebase:', firebaseError);
      throw error; // Throw original Appwrite error
    }
  }
};

// Create subject in Appwrite
export const createSubject = async (subjectData: Omit<Subject, 'id'>) => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      SUBJECTS_COLLECTION_ID,
      ID.unique(),
      {
        ...subjectData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    return response.$id;
  } catch (error) {
    console.error('Error creating subject:', error);
    throw error;
  }
};

// Get courses
export const getCourses = async () => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COURSES_COLLECTION_ID
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      ...doc
    }));
  } catch (error) {
    console.error('Error getting courses from Appwrite:', error);
    // Fallback to Firebase if Appwrite fails
    try {
      const { getCourses: getCoursesFirebase } = await import('./database');
      return await getCoursesFirebase();
    } catch (firebaseError) {
      console.error('Error getting courses from Firebase:', firebaseError);
      throw error; // Throw original Appwrite error
    }
  }
};

// Create course in Appwrite
export const createCourse = async (courseData: Omit<Course, 'id'>) => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      COURSES_COLLECTION_ID,
      ID.unique(),
      {
        ...courseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    return response.$id;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

// Migrate courses from Firebase to Appwrite
export const migrateCoursesToAppwrite = async () => {
  try {
    const { getCourses: getCoursesFirebase } = await import('./database');
    
    const firebaseCourses = await getCoursesFirebase();
    let migratedCount = 0;
    
    for (const course of firebaseCourses) {
      try {
        // Check if course already exists in Appwrite
        const existingCourses = await databases.listDocuments(
          DATABASE_ID,
          COURSES_COLLECTION_ID,
          [Query.equal('code', course.code)]
        );
        
        if (existingCourses.documents.length === 0) {
          await createCourse({
            code: course.code,
            name: course.name,
            description: course.description || '',
            duration: course.duration || 3,
            credits: course.credits || 0,
            level: course.level || 'undergraduate',
            department: course.department || '',
            requirements: course.requirements || [],
            careerProspects: course.careerProspects || [],
            fees: course.fees || 0
          });
          migratedCount++;
        }
      } catch (courseError) {
        console.error(`Error migrating course ${course.code}:`, courseError);
      }
    }
    
    console.log(`Migrated ${migratedCount} courses to Appwrite`);
    return migratedCount;
  } catch (error) {
    console.error('Error migrating courses to Appwrite:', error);
    throw error;
  }
};

// Migrate subjects from Firebase to Appwrite
export const migrateSubjectsToAppwrite = async () => {
  try {
    const { getSubjectsByCourse: getSubjectsByCourseFirebase } = await import('./database');
    const { getCourses } = await import('./database');
    
    const courses = await getCourses();
    let migratedCount = 0;
    
    for (const course of courses) {
      try {
        const firebaseSubjects = await getSubjectsByCourseFirebase(course.code);
        
        for (const subject of firebaseSubjects) {
          try {
            // Check if subject already exists in Appwrite
            const existingSubjects = await databases.listDocuments(
              DATABASE_ID,
              SUBJECTS_COLLECTION_ID,
              [Query.equal('code', subject.code)]
            );
            
            if (existingSubjects.documents.length === 0) {
              await createSubject({
                courseCode: subject.courseCode,
                code: subject.code,
                name: subject.name,
                credits: subject.credits,
                semester: subject.semester,
                amount: subject.amount || 0
              });
              migratedCount++;
            }
          } catch (subjectError) {
            console.error(`Error migrating subject ${subject.code}:`, subjectError);
          }
        }
      } catch (courseError) {
        console.error(`Error migrating subjects for course ${course.code}:`, courseError);
      }
    }
    
    console.log(`Migrated ${migratedCount} subjects to Appwrite`);
    return migratedCount;
  } catch (error) {
    console.error('Error migrating subjects to Appwrite:', error);
    throw error;
  }
};

// Migrate all data to Appwrite
export const migrateAllDataToAppwrite = async () => {
  try {
    console.log('Starting data migration to Appwrite...');
    
    // First migrate courses
    const coursesMigrated = await migrateCoursesToAppwrite();
    
    // Then migrate subjects
    const subjectsMigrated = await migrateSubjectsToAppwrite();
    
    console.log(`Migration completed: ${coursesMigrated} courses, ${subjectsMigrated} subjects`);
    return { coursesMigrated, subjectsMigrated };
  } catch (error) {
    console.error('Error migrating data to Appwrite:', error);
    throw error;
  }
};

export default client;
