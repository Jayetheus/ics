// Migration helper utility
// This can be called from the browser console to migrate data

import { migrateAllDataToAppwrite, migrateCoursesToAppwrite, migrateSubjectsToAppwrite } from '../services/appwriteDatabase';

// Make migration functions available globally for console access
declare global {
  interface Window {
    migrateData: () => Promise<void>;
    migrateCourses: () => Promise<void>;
    migrateSubjects: () => Promise<void>;
  }
}

// Migrate all data
export const migrateData = async () => {
  try {
    console.log('Starting data migration...');
    const result = await migrateAllDataToAppwrite();
    console.log('Migration completed:', result);
    alert(`Migration completed: ${result.coursesMigrated} courses, ${result.subjectsMigrated} subjects`);
  } catch (error) {
    console.error('Migration failed:', error);
    alert('Migration failed. Check console for details.');
  }
};

// Migrate only courses
export const migrateCourses = async () => {
  try {
    console.log('Starting courses migration...');
    const result = await migrateCoursesToAppwrite();
    console.log('Courses migration completed:', result);
    alert(`Courses migration completed: ${result} courses migrated`);
  } catch (error) {
    console.error('Courses migration failed:', error);
    alert('Courses migration failed. Check console for details.');
  }
};

// Migrate only subjects
export const migrateSubjects = async () => {
  try {
    console.log('Starting subjects migration...');
    const result = await migrateSubjectsToAppwrite();
    console.log('Subjects migration completed:', result);
    alert(`Subjects migration completed: ${result} subjects migrated`);
  } catch (error) {
    console.error('Subjects migration failed:', error);
    alert('Subjects migration failed. Check console for details.');
  }
};

// Make functions available globally
if (typeof window !== 'undefined') {
  window.migrateData = migrateData;
  window.migrateCourses = migrateCourses;
  window.migrateSubjects = migrateSubjects;
  
  console.log('Migration helpers available:');
  console.log('- window.migrateData() - Migrate all data');
  console.log('- window.migrateCourses() - Migrate courses only');
  console.log('- window.migrateSubjects() - Migrate subjects only');
}
