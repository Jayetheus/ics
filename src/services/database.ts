import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  orderBy,
  Timestamp, 
  setDoc
} from 'firebase/firestore';
import { db, secondaryAuth } from './firebase';
import { Student, Course, Result, Timetable, Payment, Ticket, Asset, Application, Subject, AttendanceSession, AttendanceRecord } from '../types';
import type { College, Lecturer, User } from '../types';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// Helper function to check if database is initialized
const checkDatabase = () => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
};

// @section: Users (Unified User Management)
export const createUser = async (userData: Partial<User>, password: string): Promise<User> => {
  const database = checkDatabase();
  
  // Create Firebase Auth user
    const authUser = await createUserWithEmailAndPassword(
      secondaryAuth, 
      userData.email!, 
      password
    );


  const docRef = await addDoc(collection(database, 'users'), {
    uid: authUser.user.uid,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email || '',
    role: userData.role || 'student',
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...userData
  });
  
  return {
    uid: docRef.id,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email || '',
    role: userData.role || 'student',
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...userData
  } as User;
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const database = checkDatabase();
    const querySnapshot = await getDocs(collection(database, 'users'));
    return querySnapshot.docs.map(docSnap => ({
      uid: docSnap.id,
      ...docSnap.data(),
    } as User));
  } catch (error) {
    console.error('Firestore not initialized:', error);
    return [];
  }
};

export const getUserById = async (uid: string): Promise<User | null> => {
  try {
    const database = checkDatabase();
    const docRef = doc(database, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { uid: docSnap.id, ...docSnap.data() } as User : null;
  } catch (error) {
    console.error('Firestore not initialized:', error);
    return null;
  }
};

export const updateUser = async (uid: string, data: Partial<User>): Promise<User> => {
  const database = checkDatabase();
  const docRef = doc(database, 'users', uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
  
  const updatedDoc = await getDoc(docRef);
  return { uid: updatedDoc.id, ...updatedDoc.data() } as User;
};

export const deleteUser = async (uid: string): Promise<void> => {
  const database = checkDatabase();
  await deleteDoc(doc(database, 'users', uid));
};

// Legacy Student functions for backward compatibility
export const createStudent = async (studentData: any) => {
  const database = checkDatabase();
  const data = {...studentData, displayName: `${studentData.profile.firstName} ${studentData.profile.lastName}`}
  await setDoc(doc(database, 'students', data.uid), {
    ...data,
    registrationDate: Timestamp.now(),
  });
  return true;
};

export const getStudents = async () => {
  const database = checkDatabase();
  const q = query(collection(database, "users"), where("role", "==", "student"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({...doc.data() } as User)) as User[];
};

// Get students by course
export const getStudentsByCourse = async (courseCode: string) => {
  try {
    const database = checkDatabase();
    const q = query(
      collection(database, "users"),
      where("role", "==", "student"),
      where("courseCode", "==", courseCode)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({...doc.data() } as User)) as User[];
  } catch (error) {
    console.error('Error getting students by course:', error);
    return [];
  }
};

// Get students enrolled in a specific subject
export const getStudentsBySubject = async (subjectCode: string) => {
  try {
    const database = checkDatabase();
    // First try to get students with enrolledSubjects array
    const q = query(
      collection(database, "users"), 
      where("role", "==", "student"),
      where("enrolledSubjects", "array-contains", subjectCode)
    );
    const querySnapshot = await getDocs(q);
    const enrolledStudents = querySnapshot.docs.map(doc => ({...doc.data() } as User));
    
    // If no students found with enrolledSubjects, get all students and filter by course
    if (enrolledStudents.length === 0) {
      console.log('No students found with enrolledSubjects, trying alternative approach...');
      
      // Get the subject to find its course
      const subjectQuery = query(
        collection(database, "subjects"),
        where("code", "==", subjectCode)
      );
      const subjectSnapshot = await getDocs(subjectQuery);
      
      if (subjectSnapshot.docs.length > 0) {
        const subject = subjectSnapshot.docs[0].data();
        const courseCode = subject.courseCode;
        
        // Get all students in this course
        const courseStudents = await getStudentsByCourse(courseCode);
        
        console.log(`Found ${courseStudents.length} students in course ${courseCode} for subject ${subjectCode}`);
        return courseStudents;
      }
    }
    
    return enrolledStudents;
  } catch (error) {
    console.error('Error getting students by subject:', error);
    // Fallback: return all students
    const database = checkDatabase();
    const q = query(collection(database, "users"), where("role", "==", "student"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({...doc.data() } as User)) as User[];
  }
};

export const getStudentById = async (id: string) => {
  const database = checkDatabase();
  const q = query(collection(database,"users"), where("uid", "==", id));

  const docSnap = await getDocs(q);
  return docSnap.docs[0].exists() ?{...docSnap.docs[0].data()} as User : null;
};

export const updateStudent = async (id: string, data: Partial<Student>) => {
  const database = checkDatabase();
  const docRef = doc(database, 'students', id);
  await updateDoc(docRef, data);
};
//@endsection

// @section: Courses
export const createCourse = async (courseData: Omit<Course, 'id'>) => {
  const database = checkDatabase();
  const docRef = await addDoc(collection(database, 'courses'), courseData);
  return docRef.id;
};

export const getCourses = async () => {
  try {
    const database = checkDatabase();
    const querySnapshot = await getDocs(collection(database, 'courses'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};
//@endsection

// @section: Results
export const createResult = async (resultData: Omit<Result, 'id'>) => {
  const database = checkDatabase();
  const docRef = await addDoc(collection(database, 'results'), resultData);
  return docRef.id;
};

export const getResultsByStudent = async (studentId: string) => {
  const database = checkDatabase();
  const q = query(collection(database, 'results'), where('studentId', '==', studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result));
};
//@endsection

// Get results by subject code for a student
export const getResultsByStudentAndSubject = async (studentId: string, subjectCode: string) => {
  const database = checkDatabase();
  const q = query(
    collection(database, 'results'), 
    where('studentId', '==', studentId),
    where('subjectCode', '==', subjectCode)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result));
};

//@section: Timetable
export const createTimetableEntry = async (timetableData: Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'>) => {
  const database = checkDatabase();
  const docRef = await addDoc(collection(database, 'timetable'), {
    ...timetableData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getTimetable = async () => {
  const database = checkDatabase();
  const querySnapshot = await getDocs(collection(database, 'timetable'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Timetable));
};

// Get timetable by course and semester
export const getTimetableByCourse = async (courseCode: string, semester?: 1 | 2, year?: number) => {
  const database = checkDatabase();
  let q = query(collection(database, 'timetable'), where('courseCode', '==', courseCode));
  
  if (semester) {
    q = query(q, where('semester', '==', semester));
  }
  
  if (year) {
    q = query(q, where('year', '==', year));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Timetable));
};

// Get all courses with timetables
export const getCoursesWithTimetables = async () => {
  const database = checkDatabase();
  const querySnapshot = await getDocs(collection(database, 'timetable'));
  const timetables = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Timetable));
  
  // Get unique courses
  const courseCodes = [...new Set(timetables.map(t => t.courseCode))];
  const courses = await Promise.all(
    courseCodes.map(async (code) => {
      // Assuming you have a function getCourseByCode
      const course = await getCourseByCode(code);
      return course;
    })
  );
  
  return courses.filter((course: any) => course !== null);
};

export const getCourseByCode = async (code: any): Promise<Course>=>{
  const database = checkDatabase();
  const q = query(collection(database, "courses"), where("code", "==", code));
  const snapShot = (await getDocs(q)).docs[0];

  return {...snapShot.data() as Course }
}

// @section: Attendance
export const createAttendanceSession = async (sessionData: Omit<AttendanceSession, 'id' | 'createdAt' | 'expiresAt'>) => {
  const docRef = await addDoc(collection(checkDatabase(), 'attendanceSessions'), {
    ...sessionData,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 60 * 1000)) // 2 hours from now
  });
  return docRef.id;
};

export const getAttendanceSessionsByLecturer = async (lecturerId: string) => {
  const q = query(collection(checkDatabase(), 'attendanceSessions'), where('lecturerId', '==', lecturerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession));
};

export const getActiveAttendanceSessions = async () => {
  const q = query(collection(checkDatabase(), 'attendanceSessions'), where('isActive', '==', true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession));
};

export const updateAttendanceSession = async (sessionId: string, data: Partial<AttendanceSession>) => {
  const docRef = doc(checkDatabase(), 'attendanceSessions', sessionId);
  await updateDoc(docRef, data);
};

export const createAttendanceRecord = async (recordData: Omit<AttendanceRecord, 'id' | 'timestamp'>) => {
  const docRef = await addDoc(collection(checkDatabase(), 'attendanceRecords'), {
    ...recordData,
    timestamp: Timestamp.now()
  });
  return docRef.id;
};

export const getAttendanceRecordsBySession = async (sessionId: string) => {
  const q = query(collection(checkDatabase(), 'attendanceRecords'), where('sessionId', '==', sessionId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
};

export const getAttendanceRecordsByStudent = async (studentId: string) => {
  const q = query(collection(checkDatabase(), 'attendanceRecords'), where('studentId', '==', studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
};

export const checkStudentAttendance = async (sessionId: string, studentId: string | null) => {
  const q = query(
    collection(checkDatabase(), 'attendanceRecords'), 
    where('sessionId', '==', sessionId),
    where('studentId', '==', studentId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.length > 0;
};


// @section: Payments
export const createPayment = async (paymentData: Omit<Payment, 'id'>) => {
  const docRef = await addDoc(collection(checkDatabase(), 'payments'), {
    ...paymentData,
    date: paymentData.date || Timestamp.now(),
  });
  return docRef.id;
};

export const getPaymentsByStudent = async (studentId: string) => {
  const q = query(collection(checkDatabase(), 'payments'), where('studentId', '==', studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const getAllPayments = async () => {
  const querySnapshot = await getDocs(collection(checkDatabase(), 'payments'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const updatePaymentStatus = async (id: string, status: Payment['status']) => {
  const docRef = doc(checkDatabase(), 'payments', id);
  await updateDoc(docRef, { status });
};
// @endsection

// @section: Tickets
export const createTicket = async (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(checkDatabase(), 'tickets'), {
    ...ticketData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getTickets = async () => {
  const q = query(collection(checkDatabase(), 'tickets'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
};

export const getTicketsByStudent = async (studentId: string) => {
  const q = query(
    collection(checkDatabase(), 'tickets'), 
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
};

export const updateTicket = async (id: string, data: Partial<Ticket>) => {
  const docRef = doc(checkDatabase(), 'tickets', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};
// @endsection

// @section: Assets
export const createAsset = async (assetData: Omit<Asset, 'id' | 'uploadedAt'>) => {
  const docRef = await addDoc(collection(checkDatabase(), 'assets'), {
    ...assetData,
    uploadedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getAssets = async () => {
  const q = query(collection(checkDatabase(), 'assets'), orderBy('uploadedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
};

export const deleteAsset = async (id: string) => {
  const docRef = doc(checkDatabase(), 'assets', id);
  await deleteDoc(docRef);
};

// @endsection

// @section: Applications
export const createApplication = async (applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(checkDatabase(), 'applications'), {
    ...applicationData,
    status: 'pending',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getApplicationsByStudent = async (studentId: string) => {
  const q = query(collection(checkDatabase(), 'applications'), where('studentId', '==', studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
};

export const updateApplicationStatus = async (applicationId: string, status: Application['status'], notes?: string) => {
  const ref = doc(checkDatabase(), 'applications', applicationId);
  const updateData: any = { status, updatedAt: Timestamp.now() };
  if (notes) {
    updateData.notes = notes;
  }
  await updateDoc(ref, updateData);
};


// @endsection

// @section: Registrations
export const getStudentRegistration =  async (studentId: string) => {
  const q = query(collection(checkDatabase(), 'students'), where('uid', '==', studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id,courseCode: doc.data().profile.course, year: doc.data().profile.year} as any))[0];
}
// @endsection




// @section: STUDENT

// @section: Subjects (STUDENT)
// Get all subjects
export const getAllSubjects = async () => {
  const querySnapshot = await getDocs(collection(checkDatabase(), 'subjects'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
};

// Update subject
export const updateSubject = async (id: string, data: Partial<Subject>) => {
  const docRef = doc(checkDatabase(), 'subjects', id);
  await updateDoc(docRef, data);
};

// Delete subject
export const deleteSubject = async (id: string) => {
  const docRef = doc(checkDatabase(), 'subjects', id);
  await deleteDoc(docRef);
};

// @endsection

// @section: Courses
// Update course
export const updateCourse = async (id: string, data: Partial<Course>) => {
  const docRef = doc(checkDatabase(), 'courses', id);
  await updateDoc(docRef, data);
};

// Delete course
export const deleteCourse = async (id: string) => {
  const docRef = doc(checkDatabase(), 'courses', id);
  await deleteDoc(docRef);
};

// @section: Colleges
export const createCollege = async (collegeData: Omit<College, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(checkDatabase(), 'colleges'), {
    ...collegeData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getColleges = async () => {
  try {
    const database = checkDatabase();
    const querySnapshot = await getDocs(collection(database, 'colleges'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as College));
  } catch (error) {
    console.error('Firestore not initialized:', error);
    return [];
  }
};

export const updateCollege = async (id: string, data: Partial<College>) => {
  const docRef = doc(checkDatabase(), 'colleges', id);
  await setDoc(docRef, data);
};

export const deleteCollege = async (id: string) => {
  const docRef = doc(checkDatabase(), 'colleges', id);
  await deleteDoc(docRef);
};
// @endsection

export const createSubject = async (subjectData: Omit<Subject, 'id'>) => {
  const docRef = await addDoc(collection(checkDatabase(), 'subjects'), subjectData);
  return docRef.id;
};

export const getSubjectsByCourse = async (courseCode: string) => {
  const q = query(collection(checkDatabase(), 'subjects'), where('courseCode', '==', courseCode));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
};


// @endsection

// @section: Results
// Update result
export const updateResult = async (id: string, data: Partial<Result>) => {
  const docRef = doc(checkDatabase(), 'results', id);
  await updateDoc(docRef, data);
};

// Delete result
export const deleteResult = async (id: string) => {
  const docRef = doc(checkDatabase(), 'results', id);
  await deleteDoc(docRef);
};
// @endsection

// @section: Finances
export const getFinancesByStudentId = async (id: string) => {
  const docRef = doc(checkDatabase(), "finance", id);
  const snapShot = await getDoc(docRef);
  return snapShot.exists() ? snapShot.data() as any : {records: [], total: 0}
}

export const updateFinancesByStudentId = async (id: string, newData: {amount: number, detail: string}[]) => {
  const docRef = doc(checkDatabase(), "finance", id);
  
  // Get existing data first
  const existingData = await getFinancesByStudentId(id);
  const existingRecords = existingData.records || [];
  
  // Merge new data with existing records
  const updatedRecords = [...existingRecords, ...newData];
  
  // Update the document with merged records
  await setDoc(docRef, {
    records: updatedRecords,
    total: updatedRecords.reduce((sum, record) => sum + record.amount, 0)
  }, { merge: true });
}


// @endsection

// @endsection: STUDENT


// Update timetable entry
export const updateTimetableEntry = async (id: string, data: Partial<Timetable>) => {
  const docRef = doc(checkDatabase(), 'timetable', id);
  await updateDoc(docRef, data);
};

// Delete timetable entry
export const deleteTimetableEntry = async (id: string) => {
  const docRef = doc(checkDatabase(), 'timetable', id);
  await deleteDoc(docRef);
};

// Delete payment
export const deletePayment = async (id: string) => {
  const docRef = doc(checkDatabase(), 'payments', id);
  await deleteDoc(docRef);
};

// Delete ticket
export const deleteTicket = async (id: string) => {
  const docRef = doc(checkDatabase(), 'tickets', id);
  await deleteDoc(docRef);
};

// Delete application
export const deleteApplication = async (id: string) => {
  const docRef = doc(checkDatabase(), 'applications', id);
  await deleteDoc(docRef);
};

// Get all applications (for admin)
export const getAllApplications = async () => {
  const q = query(collection(checkDatabase(), 'applications'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
};

// Get all tickets (for admin)
export const getAllTickets = async () => {
  const q = query(collection(checkDatabase(), 'tickets'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
};

// Get tickets by status
export const getTicketsByStatus = async (status: Ticket['status']) => {
  const q = query(
    collection(checkDatabase(), 'tickets'), 
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
};

// Get payments by status
export const getPaymentsByStatus = async (status: Payment['status']) => {
  const q = query(
    collection(checkDatabase(), 'payments'), 
    where('status', '==', status),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

// Get results by course
export const getResultsByCourse = async (courseCode: string) => {
  const q = query(collection(checkDatabase(), 'results'), where('courseCode', '==', courseCode));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result));
};

// Get timetable by day
export const getTimetableByDay = async (day: string) => {
  const q = query(collection(checkDatabase(), 'timetable'), where('day', '==', day));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Timetable));
};

// Get assets by category
export const getAssetsByCategory = async (category: Asset['category']) => {
  const q = query(
    collection(checkDatabase(), 'assets'), 
    where('category', '==', category),
    orderBy('uploadedAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
};

// Get assets by uploader
export const getAssetsByUploader = async (uploadedBy: string) => {
  const q = query(
    collection(checkDatabase(), 'assets'), 
    where('uploadedBy', '==', uploadedBy),
    orderBy('uploadedAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
};

// Simple enrolled subjects storage per student
export const enrollStudentSubjects = async (studentId: string, subjectCodes: string[]) => {
  const database = checkDatabase();
  const ref = doc(database, 'users', studentId);
  await updateDoc(ref, { enrolledSubjects: subjectCodes });
};

// Generate student number in format: YYYY + sequential number (e.g., 2024001234)
export const generateStudentNumber = async (): Promise<string> => {
  try {
    if (!db) {
      console.error('Firestore not initialized');
      return `${new Date().getFullYear()}000001`;
    }
    
    const currentYear = new Date().getFullYear();
    const studentsRef = collection(checkDatabase(), 'users');
    const q = query(studentsRef, where('role', '==', 'student'), where('studentNumber', '>=', `${currentYear}000000`), where('studentNumber', '<', `${currentYear + 1}000000`));
    const snapshot = await getDocs(q);
    
    const nextNumber = snapshot.size + 1;
    return `${currentYear}${nextNumber.toString().padStart(6, '0')}`;
  } catch (error) {
    console.error('Error generating student number:', error);
    // Fallback: return current year + random number
    const currentYear = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000000);
    return `${currentYear}${randomNum.toString().padStart(6, '0')}`;
  }
};

// Generate staff number in format: LEC + sequential number (e.g., LEC001234)
export const generateStaffNumber = async (): Promise<string> => {
  try {
    if (!db) {
      console.error('Firestore not initialized');
      return 'LEC000001';
    }
    
    const lecturersRef = collection(checkDatabase(), 'users');
    const q = query(lecturersRef, where('role', '==', 'lecturer'), where('staffNumber', '>=', 'LEC000000'), where('staffNumber', '<', 'LEC999999'));
    const snapshot = await getDocs(q);
    
    const nextNumber = snapshot.size + 1;
    return `LEC${nextNumber.toString().padStart(6, '0')}`;
  } catch (error) {
    console.error('Error generating staff number:', error);
    // Fallback: return LEC + random number
    const randomNum = Math.floor(Math.random() * 1000000);
    return `LEC${randomNum.toString().padStart(6, '0')}`;
  }
};



//THESE ARE MADE BY ME

// @section: ADMIN METHODS
// These functions are now defined above in the unified user management section


// Create lecturer user (using unified User interface)
export const createLecturer = async (lecturerData: Partial<User>, password: string) => {
  try {
    
    // Create Firebase Auth user
    const authUser = await createUserWithEmailAndPassword(
      secondaryAuth, 
      lecturerData.email!, 
      password
    );

    // Create user document with lecturer-specific data
    const userData: Partial<User> = {
      uid: authUser.user.uid,
      firstName: lecturerData.firstName || '',
      lastName: lecturerData.lastName || '',
      email: lecturerData.email || '',
      role: 'lecturer',
      status: 'active',
      staffNumber: lecturerData.staffNumber || '',
      department: lecturerData.department || '',
      collegeId: lecturerData.collegeId || '',
      hireDate: lecturerData.hireDate || new Date().toISOString().split('T')[0],
      phone: lecturerData.phone || '',
      address: lecturerData.address || '',
      qualifications: lecturerData.qualifications || '',
      subjects: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(doc(checkDatabase(), 'users', authUser.user.uid), userData);
    return true;
  } catch (error) {
    console.error('Error creating lecturer:', error);
    throw error;
  }
};

// Get all lecturers (from unified users collection)
export const getLecturers = async (): Promise<User[]> => {
  const q = query(collection(checkDatabase(), 'users'), where('role', '==', 'lecturer'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
};

// Get lecturer by ID
export const getLecturerById = async (uid: string): Promise<User | null> => {
  const docRef = doc(checkDatabase(), 'users', uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  
  const userData = docSnap.data();
  if (userData.role !== 'lecturer') return null;
  
  return { uid: docSnap.id, ...userData } as User;
};

// Update lecturer
export const updateLecturer = async (id: string, data: Partial<Lecturer>) => {
  const docRef = doc(checkDatabase(), 'lecturers', id);
  await updateDoc(docRef, data);
};

// Delete lecturer
export const deleteLecturer = async (id: string) => {
  const docRef = doc(checkDatabase(), 'lecturers', id);
  await deleteDoc(docRef);
};

// @endsection
