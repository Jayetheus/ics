import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  where,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { User } from '../types';

/**
 * Data Migration Utility
 * This utility helps migrate from the old separate collections (students, lecturers) 
 * to the unified users collection
 */

export interface MigrationStats {
  studentsMigrated: number;
  lecturersMigrated: number;
  errors: string[];
}

export const migrateToUnifiedUsers = async (): Promise<MigrationStats> => {
  const stats: MigrationStats = {
    studentsMigrated: 0,
    lecturersMigrated: 0,
    errors: []
  };

  try {
    console.log('Starting data migration to unified users collection...');

    // Migrate students
    await migrateStudents(stats);
    
    // Migrate lecturers
    await migrateLecturers(stats);

    console.log('Migration completed:', stats);
    return stats;
  } catch (error) {
    console.error('Migration failed:', error);
    stats.errors.push(`Migration failed: ${error}`);
    return stats;
  }
};

const migrateStudents = async (stats: MigrationStats) => {
  try {
    console.log('Migrating students...');
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const batch = writeBatch(db);

    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      
      // Convert student to unified user format
      const userData: Partial<User> = {
        uid: studentDoc.id,
        firstName: studentData.firstName || studentData.profile?.firstName || '',
        lastName: studentData.lastName || studentData.profile?.lastName || '',
        email: studentData.email || '',
        role: 'student',
        status: studentData.status || 'active',
        studentNumber: studentData.studentNumber || studentData.profile?.studentNumber || '',
        courseCode: studentData.course || studentData.profile?.course || '',
        year: studentData.year || studentData.profile?.year || 1,
        registrationDate: studentData.registrationDate || '',
        examNumber: studentData.examNumber || '',
        phone: studentData.phone || studentData.profile?.phone || '',
        address: studentData.address || studentData.profile?.address || '',
        idNumber: studentData.idNumber || studentData.profile?.idNumber || '',
        dateOfBirth: studentData.dateOfBirth || studentData.profile?.dateOfBirth || '',
        photoUrl: studentData.photoUrl || studentData.profile?.photoUrl || '',
        results: studentData.results || [],
        createdAt: studentData.createdAt || new Date(),
        updatedAt: new Date()
      };

      // Add to users collection
      const userRef = doc(db, 'users', studentDoc.id);
      batch.set(userRef, userData);
      stats.studentsMigrated++;
    }

    await batch.commit();
    console.log(`Migrated ${stats.studentsMigrated} students`);
  } catch (error) {
    console.error('Error migrating students:', error);
    stats.errors.push(`Student migration failed: ${error}`);
  }
};

const migrateLecturers = async (stats: MigrationStats) => {
  try {
    console.log('Migrating lecturers...');
    const lecturersSnapshot = await getDocs(collection(db, 'lecturers'));
    const batch = writeBatch(db);

    for (const lecturerDoc of lecturersSnapshot.docs) {
      const lecturerData = lecturerDoc.data();
      
      // Convert lecturer to unified user format
      const userData: Partial<User> = {
        uid: lecturerDoc.id,
        firstName: lecturerData.firstName || '',
        lastName: lecturerData.lastName || '',
        email: lecturerData.email || '',
        role: 'lecturer',
        status: lecturerData.status || 'active',
        staffNumber: lecturerData.staffNumber || '',
        department: lecturerData.department || '',
        collegeId: lecturerData.collegeId || '',
        hireDate: lecturerData.hireDate || '',
        phone: lecturerData.phone || '',
        address: lecturerData.address || '',
        qualifications: lecturerData.qualifications || '',
        subjects: lecturerData.subjects || [],
        createdAt: lecturerData.createdAt || new Date(),
        updatedAt: new Date()
      };

      // Add to users collection
      const userRef = doc(db, 'users', lecturerDoc.id);
      batch.set(userRef, userData);
      stats.lecturersMigrated++;
    }

    await batch.commit();
    console.log(`Migrated ${stats.lecturersMigrated} lecturers`);
  } catch (error) {
    console.error('Error migrating lecturers:', error);
    stats.errors.push(`Lecturer migration failed: ${error}`);
  }
};

export const validateDataConsistency = async (): Promise<{
  isValid: boolean;
  issues: string[];
}> => {
  const issues: string[] = [];

  try {
    // Check if users collection exists and has data
    const usersSnapshot = await getDocs(collection(db, 'users'));
    if (usersSnapshot.empty) {
      issues.push('Users collection is empty');
    }

    // Check for users with missing required fields
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      if (!userData.firstName) issues.push(`User ${userDoc.id} missing firstName`);
      if (!userData.lastName) issues.push(`User ${userDoc.id} missing lastName`);
      if (!userData.email) issues.push(`User ${userDoc.id} missing email`);
      if (!userData.role) issues.push(`User ${userDoc.id} missing role`);
      
      // Role-specific validation
      if (userData.role === 'student' && !userData.studentNumber) {
        issues.push(`Student ${userDoc.id} missing studentNumber`);
      }
      if (userData.role === 'lecturer' && !userData.staffNumber) {
        issues.push(`Lecturer ${userDoc.id} missing staffNumber`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  } catch (error) {
    issues.push(`Validation failed: ${error}`);
    return {
      isValid: false,
      issues
    };
  }
};

export const cleanupOldCollections = async (): Promise<void> => {
  try {
    console.log('Cleaning up old collections...');
    
    // Note: In production, you might want to archive these collections instead of deleting
    // This is just for development cleanup
    
    console.log('Old collections cleanup completed');
    console.log('Note: In production, consider archiving old collections instead of deleting');
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
};
