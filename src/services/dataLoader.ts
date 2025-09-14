import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  query, 
  where,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';
import { COLLEGES, COURSES, DEPARTMENTS, PAYMENT_TYPES, TICKET_CATEGORIES, CLASS_TYPES, SEMESTERS, COURSE_SUBJECTS } from '../data/constants';
import { User, Student, Course, Result, Timetable, Payment, Ticket, Asset, UserRole, Subject } from '../types';

// Generate student number in format: YYYY + sequential number (e.g., 2024001234)
export const generateStudentNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const studentsRef = collection(db, 'students');
  const q = query(studentsRef, where('studentNumber', '>=', `${currentYear}000000`), where('studentNumber', '<', `${currentYear + 1}000000`));
  const snapshot = await getDocs(q);
  
  const nextNumber = snapshot.size + 1;
  return `${currentYear}${nextNumber.toString().padStart(6, '0')}`;
};

// Generate staff number in format: STAFF + sequential number (e.g., STAFF001234)
export const generateStaffNumber = async (): Promise<string> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('profile.staffNumber', '>=', 'STAFF000000'));
  const snapshot = await getDocs(q);
  
  const nextNumber = snapshot.size + 1;
  return `STAFF${nextNumber.toString().padStart(6, '0')}`;
};

// Clear all collections
export const clearAllData = async () => {
  const collections = ['users', 'students', 'courses', 'subjects', 'results', 'timetable', 'payments', 'tickets', 'assets'];
  
  for (const collectionName of collections) {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    if (snapshot.docs.length > 0) {
      await batch.commit();
    }
  }
  
  console.log('All data cleared from Firestore');
};

// Load mock users
export const loadMockUsers = async () => {
  const mockUsers = [
    {
      email: 'student@ics.ac.za',
      password: 'password123',
      role: 'student' as UserRole,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '083 123 4567',
        address: '123 Main St, Cape Town, Western Cape',
        idNumber: '9901015800123',
        dateOfBirth: '1999-01-01',
        course: COURSES[0], // Computer Science
        year: 2
      }
    },
    {
      email: 'lecturer@ics.ac.za',
      password: 'password123',
      role: 'lecturer' as UserRole,
      profile: {
        firstName: 'Dr. Sarah',
        lastName: 'Smith',
        phone: '084 567 8901',
        address: '456 Oak Ave, Johannesburg, Gauteng',
        idNumber: '7505125800456',
        dateOfBirth: '1975-05-12'
      }
    },
    {
      email: 'admin@ics.ac.za',
      password: 'password123',
      role: 'admin' as UserRole,
      profile: {
        firstName: 'Michael',
        lastName: 'Johnson',
        phone: '082 345 6789',
        address: '789 Pine St, Durban, KwaZulu-Natal',
        idNumber: '8003125800789',
        dateOfBirth: '1980-03-12'
      }
    },
    {
      email: 'finance@ics.ac.za',
      password: 'password123',
      role: 'finance' as UserRole,
      profile: {
        firstName: 'Lisa',
        lastName: 'Brown',
        phone: '081 234 5678',
        address: '321 Elm St, Pretoria, Gauteng',
        idNumber: '8507085800321',
        dateOfBirth: '1985-07-08'
      }
    }
  ];

  for (const userData of mockUsers) {
    try {
      // Create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      
      // Generate student or staff number
      let additionalData = { ...userData.profile };
      if (userData.role === 'student') {
        additionalData.studentNumber = await generateStudentNumber();
      } else {
        additionalData.staffNumber = await generateStaffNumber();
      }
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: userData.email,
        role: userData.role,
        profile: additionalData,
        createdAt: new Date().toISOString(),
      });
      
      console.log(`Created user: ${userData.email}`);
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }
};

// Load mock students
export const loadMockStudents = async () => {
  const mockStudents = [
    {
      firstName: 'Emma',
      lastName: 'Wilson',
      email: 'emma.wilson@student.ics.ac.za',
      course: COURSES[1], // Information Technology
      year: 1,
      status: 'active' as const,
      profile: {
        firstName: 'Emma',
        lastName: 'Wilson',
        phone: '083 456 7890',
        address: '456 Beach Rd, Cape Town, Western Cape',
        idNumber: '0002285800456',
        dateOfBirth: '2000-02-28',
        course: COURSES[1],
        year: 1
      }
    },
    {
      firstName: 'David',
      lastName: 'Miller',
      email: 'david.miller@student.ics.ac.za',
      course: COURSES[6], // Business Management
      year: 3,
      status: 'active' as const,
      profile: {
        firstName: 'David',
        lastName: 'Miller',
        phone: '084 789 0123',
        address: '789 Hill St, Johannesburg, Gauteng',
        idNumber: '9812155800789',
        dateOfBirth: '1998-12-15',
        course: COURSES[6],
        year: 3
      }
    },
    {
      firstName: 'Sophie',
      lastName: 'Taylor',
      email: 'sophie.taylor@student.ics.ac.za',
      course: COURSES[17], // Medicine
      year: 4,
      status: 'active' as const,
      profile: {
        firstName: 'Sophie',
        lastName: 'Taylor',
        phone: '082 567 8901',
        address: '321 Valley Rd, Durban, KwaZulu-Natal',
        idNumber: '9706205800321',
        dateOfBirth: '1997-06-20',
        course: COURSES[17],
        year: 4
      }
    }
  ];

  for (const studentData of mockStudents) {
    const studentNumber = await generateStudentNumber();
    const student = {
      ...studentData,
      studentNumber,
      registrationDate: new Date().toISOString(),
      profile: {
        ...studentData.profile,
        studentNumber
      }
    };

    await addDoc(collection(db, 'students'), student);
    console.log(`Created student: ${student.firstName} ${student.lastName} (${studentNumber})`);
  }
};

// Load mock courses
export const loadMockCourses = async () => {
  const mockCourses = [
    {
      code: 'CS101',
      name: 'Introduction to Computer Science',
      credits: 16,
      lecturer: 'Dr. Sarah Smith',
      department: DEPARTMENTS[0] // Faculty of Science
    },
    {
      code: 'IT201',
      name: 'Database Systems',
      credits: 16,
      lecturer: 'Prof. Michael Johnson',
      department: DEPARTMENTS[0]
    },
    {
      code: 'BUS301',
      name: 'Strategic Management',
      credits: 16,
      lecturer: 'Dr. Lisa Brown',
      department: DEPARTMENTS[2] // Faculty of Business
    },
    {
      code: 'MED401',
      name: 'Clinical Medicine',
      credits: 32,
      lecturer: 'Prof. James Wilson',
      department: DEPARTMENTS[3] // Faculty of Health Sciences
    },
    {
      code: 'ENG201',
      name: 'Structural Engineering',
      credits: 20,
      lecturer: 'Dr. Anna Davis',
      department: DEPARTMENTS[1] // Faculty of Engineering
    }
  ];

  for (const course of mockCourses) {
    await addDoc(collection(db, 'courses'), course);
    console.log(`Created course: ${course.code} - ${course.name}`);
  }
};

// Load mock subjects per course
export const loadMockSubjects = async () => {
  for (const [courseName, subjects] of Object.entries(COURSE_SUBJECTS)) {
    for (const subject of subjects) {
      await addDoc(collection(db, 'subjects'), {
        courseCode: courseName,
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
        semester: subject.semester
      });
    }
  }
  console.log('Created subjects for all courses');
};

// Load mock results
export const loadMockResults = async () => {
  // Get students to assign results to
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const students = usersSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(user => (user as any).role === 'student');

  // Get subjects to assign results for
  const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
  const subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (students.length === 0 || subjects.length === 0) {
    console.log('No students or subjects found. Skipping results creation.');
    return;
  }

  for (const student of students) {
    // Get subjects for the student's course
    const studentCourse = (student as any).profile?.course;
    const courseSubjects = subjects.filter(subject => (subject as any).courseCode === studentCourse);
    
    if (courseSubjects.length === 0) continue;

    // Create 3-5 results per student
    const numResults = Math.floor(Math.random() * 3) + 3;
    const selectedSubjects = courseSubjects.slice(0, Math.min(numResults, courseSubjects.length));

    for (const subject of selectedSubjects) {
      const mark = Math.floor(Math.random() * 40) + 60; // 60-100
      let grade = 'F';
      
      if (mark >= 90) grade = 'A+';
      else if (mark >= 80) grade = 'A';
      else if (mark >= 75) grade = 'B+';
      else if (mark >= 70) grade = 'B';
      else if (mark >= 65) grade = 'C+';
      else if (mark >= 60) grade = 'C';
      else if (mark >= 55) grade = 'D+';
      else if (mark >= 50) grade = 'D';

      const result = {
        studentId: student.id,
        courseName: (subject as any).name,
        courseCode: (subject as any).courseCode,
        mark,
        grade,
        semester: (subject as any).semester,
        year: 2024
      };

      await addDoc(collection(db, 'results'), result);
    }
  }
  
  console.log('Created mock results');
};

// Load mock timetable
export const loadMockTimetable = async () => {
  const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
  const subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (subjects.length === 0) {
    console.log('No subjects found. Skipping timetable creation.');
    return;
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = ['09:00', '11:00', '14:00', '16:00'];
  const venues = ['Room 101', 'Room 203', 'Lab A', 'Lab B', 'Auditorium', 'Library Hall'];
  const lecturers = ['Dr. Sarah Smith', 'Prof. Michael Johnson', 'Dr. Lisa Brown', 'Prof. James Wilson', 'Dr. Anna Davis'];

  for (const subject of subjects) {
    // Create 1-2 time slots per subject
    const numSlots = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < numSlots; i++) {
      const day = days[Math.floor(Math.random() * days.length)];
      const startTime = times[Math.floor(Math.random() * times.length)];
      const startHour = parseInt(startTime.split(':')[0]);
      const endTime = `${(startHour + 1).toString().padStart(2, '0')}:30`;
      
      const timetableEntry = {
        subjectId: subject.id,
        subjectName: (subject as any).name,
        subjectCode: (subject as any).code,
        courseCode: (subject as any).courseCode,
        lecturer: lecturers[Math.floor(Math.random() * lecturers.length)],
        day,
        startTime,
        endTime,
        venue: venues[Math.floor(Math.random() * venues.length)],
        type: CLASS_TYPES[Math.floor(Math.random() * CLASS_TYPES.length)]
      };

      await addDoc(collection(db, 'timetable'), timetableEntry);
    }
  }
  
  console.log('Created mock timetable');
};

// Load mock payments
export const loadMockPayments = async () => {
  const studentsSnapshot = await getDocs(collection(db, 'students'));
  const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (students.length === 0) {
    console.log('No students found. Skipping payments creation.');
    return;
  }

  const statuses = ['pending', 'approved', 'rejected'];
  
  for (const student of students) {
    // Create 2-4 payments per student
    const numPayments = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < numPayments; i++) {
      const amount = Math.floor(Math.random() * 20000) + 5000; // R5,000 - R25,000
      const type = PAYMENT_TYPES[Math.floor(Math.random() * PAYMENT_TYPES.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const payment = {
        studentId: student.id,
        amount,
        type,
        status,
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date within last 90 days
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} payment - ${student.firstName} ${student.lastName}`,
        proofOfPaymentUrl: status !== 'pending' ? 'https://example.com/proof.pdf' : undefined
      };

      await addDoc(collection(db, 'payments'), payment);
    }
  }
  
  console.log('Created mock payments');
};

// Load mock tickets
export const loadMockTickets = async () => {
  const studentsSnapshot = await getDocs(collection(db, 'students'));
  const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (students.length === 0) {
    console.log('No students found. Skipping tickets creation.');
    return;
  }

  const priorities = ['low', 'medium', 'high'];
  const statuses = ['open', 'in-progress', 'resolved', 'closed'];
  
  const ticketTemplates = [
    {
      title: 'Cannot access student portal',
      description: 'I am unable to log into the student portal since yesterday. Getting authentication error.',
      category: 'technical'
    },
    {
      title: 'Question about course registration',
      description: 'I need help understanding the course registration process for next semester.',
      category: 'academic'
    },
    {
      title: 'Payment confirmation issue',
      description: 'My payment was processed but not showing in my account balance.',
      category: 'finance'
    },
    {
      title: 'Library access problem',
      description: 'My student card is not working at the library entrance.',
      category: 'general'
    },
    {
      title: 'Accommodation request',
      description: 'I would like to request a room change due to noise issues.',
      category: 'accommodation'
    }
  ];

  for (const student of students) {
    // Create 1-3 tickets per student
    const numTickets = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numTickets; i++) {
      const template = ticketTemplates[Math.floor(Math.random() * ticketTemplates.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const ticket = {
        studentId: student.id,
        title: template.title,
        description: template.description,
        category: template.category,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
        updatedAt: new Date().toISOString(),
        response: status === 'resolved' || status === 'closed' ? 'Issue has been resolved. Thank you for your patience.' : undefined
      };

      await addDoc(collection(db, 'tickets'), ticket);
    }
  }
  
  console.log('Created mock tickets');
};

// Load mock assets
export const loadMockAssets = async () => {
  const studentsSnapshot = await getDocs(collection(db, 'students'));
  const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (students.length === 0) {
    console.log('No students found. Skipping assets creation.');
    return;
  }

  const assetTemplates = [
    {
      name: 'ID_Document.pdf',
      type: 'application/pdf',
      url: 'https://example.com/documents/id.pdf',
      size: 2048000,
      category: 'document'
    },
    {
      name: 'Matric_Certificate.pdf',
      type: 'application/pdf',
      url: 'https://example.com/documents/matric.pdf',
      size: 1536000,
      category: 'document'
    },
    {
      name: 'Profile_Photo.jpg',
      type: 'image/jpeg',
      url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
      size: 512000,
      category: 'image'
    },
    {
      name: 'Proof_of_Payment.pdf',
      type: 'application/pdf',
      url: 'https://example.com/documents/payment.pdf',
      size: 1024000,
      category: 'document'
    }
  ];

  for (const student of students) {
    // Create 2-4 assets per student
    const numAssets = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < numAssets; i++) {
      const template = assetTemplates[Math.floor(Math.random() * assetTemplates.length)];
      
      const asset = {
        name: `${student.firstName}_${student.lastName}_${template.name}`,
        type: template.type,
        url: template.url,
        uploadedBy: student.id,
        uploadedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 60 days
        size: template.size,
        category: template.category
      };

      await addDoc(collection(db, 'assets'), asset);
    }
  }
  
  console.log('Created mock assets');
};

// Main function to load all mock data
export const loadAllMockData = async () => {
  try {
    console.log('Starting to load mock data...');
    
    // Clear existing data
    await clearAllData();
    
    // Load data in sequence to maintain relationships
    await loadMockUsers();
    await loadMockStudents();
    await loadMockCourses();
    await loadMockSubjects();
    await loadMockResults();
    await loadMockTimetable();
    await loadMockPayments();
    await loadMockTickets();
    await loadMockAssets();
    
    console.log('All mock data loaded successfully!');
  } catch (error) {
    console.error('Error loading mock data:', error);
    throw error;
  }
};

// Development helper function
export const initializeDatabase = async () => {
  if (import.meta.env.DEV) {
    console.log('Initializing database with mock data...');
    await loadAllMockData();
  }
};