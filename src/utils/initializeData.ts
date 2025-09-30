import { collection, addDoc, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Course, College } from '../types';

// Initialize basic data for the application
export const initializeBasicData = async () => {
  try {
    if (!db) {
      console.error('Firestore not initialized, skipping data initialization');
      return;
    }
    console.log('Initializing basic data...');

    // Check if colleges exist
    const collegesSnapshot = await getDocs(collection(db, 'colleges'));
    if (collegesSnapshot.empty) {
      console.log('Creating colleges...');
      const colleges = [
        { name: 'Faculty of Science', code: 'SCI' },
        { name: 'Faculty of Engineering', code: 'ENG' },
        { name: 'Faculty of Business', code: 'BUS' },
        { name: 'Faculty of Health Sciences', code: 'HEALTH' },
        { name: 'Faculty of Humanities', code: 'HUM' }
      ];

      for (const college of colleges) {
        await addDoc(collection(db, 'colleges'), college);
      }
      console.log('Colleges created successfully');
    }

    // Check if courses exist
    const coursesSnapshot = await getDocs(collection(db, 'courses'));
    if (coursesSnapshot.empty) {
      console.log('Creating courses...');
      const courses = [
        {
          code: 'CS101',
          name: 'Computer Science',
          credits: 120,
          lecturer: 'Dr. John Smith',
          department: 'Faculty of Science',
          collegeId: 'sci',
          requirements: 'Mathematics and English',
          apsRequired: '28'
        },
        {
          code: 'IT101',
          name: 'Information Technology',
          credits: 120,
          lecturer: 'Dr. Jane Doe',
          department: 'Faculty of Science',
          collegeId: 'sci',
          requirements: 'Mathematics and English',
          apsRequired: '26'
        },
        {
          code: 'BA101',
          name: 'Business Administration',
          credits: 120,
          lecturer: 'Dr. Mike Johnson',
          department: 'Faculty of Business',
          collegeId: 'bus',
          requirements: 'English and Mathematics',
          apsRequired: '24'
        }
      ];

      for (const course of courses) {
        await addDoc(collection(db, 'courses'), course);
      }
      console.log('Courses created successfully');
    }

    // Check if subjects exist
    const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
    if (subjectsSnapshot.empty) {
      console.log('Creating subjects...');
      const subjects = [
        {
          courseCode: 'CS101',
          code: 'CS101',
          name: 'Introduction to Programming',
          credits: 6,
          semester: 'Semester 1',
          amount: 1000
        },
        {
          courseCode: 'CS101',
          code: 'CS102',
          name: 'Data Structures',
          credits: 6,
          semester: 'Semester 2',
          amount: 1000
        },
        {
          courseCode: 'IT101',
          code: 'IT101',
          name: 'IT Fundamentals',
          credits: 6,
          semester: 'Semester 1',
          amount: 1000
        },
        {
          courseCode: 'BA101',
          code: 'BA101',
          name: 'Business Principles',
          credits: 6,
          semester: 'Semester 1',
          amount: 1000
        }
      ];

      for (const subject of subjects) {
        await addDoc(collection(db, 'subjects'), subject);
      }
      console.log('Subjects created successfully');
    }

    console.log('Basic data initialization completed');
  } catch (error) {
    console.error('Error initializing basic data:', error);
  }
};

// Call this function when the app starts
export const initializeAppData = async () => {
  try {
    await initializeBasicData();
  } catch (error) {
    console.error('Failed to initialize app data:', error);
  }
};
