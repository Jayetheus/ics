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

// @section: Users (Unified User Management)
export const createUser = async (userData: Partial<User>, password: string): Promise<User> => {
  // Create Firebase Auth user
  const authUser = await createUserWithEmailAndPassword(
    secondaryAuth,
    userData.email!,
    password
  );
  // Persist the user document using the Auth UID as the document ID to avoid
  // mismatches and accidental orphaned documents. Use setDoc so we control the
  // document id and contents.
  const uid = authUser.user.uid;
  const userDoc = {
    uid,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email || '',
    role: userData.role || 'student',
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...userData
  };

  // Use merge to avoid overwriting any fields if a document already exists
  await setDoc(doc(db, 'users', uid), userDoc, { merge: true });

  return userDoc as User;
};

export const getUsers = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(docSnap => ({
    uid: docSnap.id,
    ...docSnap.data(),
  } as User));
};

export const getUserById = async (uid: string): Promise<User | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { uid: docSnap.id, ...docSnap.data() } as User : null;
};

export const updateUser = async (uid: string, data: Partial<User>): Promise<User> => {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });

  const updatedDoc = await getDoc(docRef);
  return { uid: updatedDoc.id, ...updatedDoc.data() } as User;
};

export const deleteUser = async (uid: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', uid));
};

// Legacy Student functions for backward compatibility
const createStudent = async (studentData: any) => {
  const data = { ...studentData, displayName: `${studentData.profile.firstName} ${studentData.profile.lastName}` }
  await setDoc(doc(db, 'students', data.uid), {
    ...data,
    registrationDate: Timestamp.now(),
  });
  return true;
};

export const getStudents = async () => {
  const q = query(collection(db, "users"), where("role", "==", "student"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data() } as User)) as User[];
};

export const getStudentById = async (id: string) => {
  const q = query(collection(db, "users"), where("uid", "==", id));

  const docSnap = await getDocs(q);
  return docSnap.docs[0].exists() ? { ...docSnap.docs[0].data() } as User : null;
};

const updateStudent = async (id: string, data: Partial<Student>) => {
  const docRef = doc(db, 'students', id);
  await updateDoc(docRef, data);
};
//@endsection

// @section: Courses
export const createCourse = async (courseData: Omit<Course, 'id'>) => {
  const docRef = await addDoc(collection(db, 'courses'), courseData);
  return docRef.id;
};

export const getCourses = async () => {
  const querySnapshot = await getDocs(collection(db, 'courses'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
};
//@endsection

// @section: Results
export const createResult = async (resultData: Omit<Result, 'id'>) => {
  const docRef = await addDoc(collection(db, 'results'), resultData);
  return docRef.id;
};

export const getResultsByStudent = async (studentId: string) => {
  const q = query(collection(db, 'results'), where('uid', '==', studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result));
};
//@endsection

// Get results by subject code for a student
export const getResultsByStudentAndSubject = async (studentId: string, subjectCode: string) => {
  const q = query(
    collection(db, 'results'),
    where('studentId', '==', studentId),
    where('subjectCode', '==', subjectCode)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result));
};

//@section: Timetable
export const createTimetableEntry = async (timetableData: Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, 'timetable'), {
    ...timetableData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getTimetable = async () => {
  const querySnapshot = await getDocs(collection(db, 'timetable'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Timetable));
};

// Get timetable by course and semester
export const getTimetableByCourse = async (courseCode: string, semester?: 1 | 2, year?: number) => {
  let q = query(collection(db, 'timetable'), where('courseCode', '==', courseCode));

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
const getCoursesWithTimetables = async () => {
  const querySnapshot = await getDocs(collection(db, 'timetable'));
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

const getCourseByCode = async (code: any): Promise<Course> => {
  const q = query(collection(db, "courses"), where("code", "==", code));
  const snapShot = (await getDocs(q)).docs[0];

  return { ...snapShot.data() as Course }
}

// @section: Attendance
export const createAttendanceSession = async (sessionData: Omit<AttendanceSession, 'id' | 'createdAt' | 'expiresAt'>) => {
  const docRef = await addDoc(collection(db, 'attendanceSessions'), {
    ...sessionData,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 60 * 1000)) // 2 hours from now
  });
  return docRef.id;
};

export const getAttendanceSessionsByLecturer = async (lecturerId: string) => {
  const q = query(collection(db, 'attendanceSessions'), where('lecturerId', '==', lecturerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession));
};

const getActiveAttendanceSessions = async () => {
  const q = query(collection(db, 'attendanceSessions'), where('isActive', '==', true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceSession));
};

export const updateAttendanceSession = async (sessionId: string, data: Partial<AttendanceSession>) => {
  const docRef = doc(db, 'attendanceSessions', sessionId);
  await updateDoc(docRef, data);
};

export const createAttendanceRecord = async (recordData: Omit<AttendanceRecord, 'id' | 'timestamp'>) => {
  const docRef = await addDoc(collection(db, 'attendanceRecords'), {
    ...recordData,
    timestamp: Timestamp.now()
  });
  return docRef.id;
};

export const getAttendanceRecordsBySession = async (sessionId: string) => {
  const q = query(collection(db, 'attendanceRecords'), where('sessionId', '==', sessionId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
};

export const getAttendanceRecordsByStudent = async (studentId: string) => {
  const q = query(collection(db, 'attendanceRecords'), where('studentId', '==', studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
};

export const checkStudentAttendance = async (sessionId: string, studentId: string | null) => {
  const q = query(
    collection(db, 'attendanceRecords'),
    where('sessionId', '==', sessionId),
    where('studentId', '==', studentId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.length > 0;
};


// @section: Payments
export const createPayment = async (paymentData: Omit<Payment, 'id'>) => {
  const docRef = await addDoc(collection(db, 'payments'), {
    ...paymentData,
    date: paymentData.date || Timestamp.now(),
  });
  return docRef.id;
};

export const getPaymentsByStudent = async (studentId: string) => {
  const q = query(collection(db, 'payments'), where('studentId', '==', studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const getAllPayments = async () => {
  const querySnapshot = await getDocs(collection(db, 'payments'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const updatePaymentStatus = async (id: string, status: Payment['status']) => {
  const docRef = doc(db, 'payments', id);
  await updateDoc(docRef, { status });
};
// @endsection

// @section: Tickets
export const createTicket = async (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, 'tickets'), {
    ...ticketData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getTickets = async () => {
  const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
};

export const getTicketsByStudent = async (studentId: string) => {
  const q = query(
    collection(db, 'tickets'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
};

export const updateTicket = async (id: string, data: Partial<Ticket>) => {
  const docRef = doc(db, 'tickets', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};
// @endsection

// @section: Assets
export const createAsset = async (assetData: Omit<Asset, 'id' | 'uploadedAt'>) => {
  const docRef = await addDoc(collection(db, 'assets'), {
    ...assetData,
    uploadedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getAssets = async () => {
  const q = query(collection(db, 'assets'), orderBy('uploadedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
};

export const deleteAsset = async (id: string) => {
  const docRef = doc(db, 'assets', id);
  await deleteDoc(docRef);
};

// @endsection

// @section: Applications
export const createApplication = async (applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, 'applications'), {
    ...applicationData,
    status: 'pending',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getApplicationsByStudent = async (studentId: string) => {
  const q = query(collection(db, 'applications'), where('studentId', '==', studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
};

export const updateApplicationStatus = async (applicationId: string, status: Application['status'], notes?: string) => {
  const ref = doc(db, 'applications', applicationId);
  const updateData: any = { status, updatedAt: Timestamp.now() };
  if (notes) {
    updateData.notes = notes;
  }
  await updateDoc(ref, updateData);
};


// @endsection

// @section: Registrations
export const getStudentRegistration = async (studentId: string) => {
  const q = query(collection(db, 'users'), where('uid', '==', studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data()} as any))[0];
}

export async function registerStudent(currentUser: any, approvedApp: Application) {
  console.log(currentUser.uid && approvedApp)

  if (!(currentUser.uid && approvedApp)) throw new Error('Missing parameters');

  const studentRef = doc(db, 'users', currentUser.uid);
  await setDoc(studentRef, {
    ...currentUser,
    courseCode: approvedApp.courseCode,
    college: (await getColleges()).filter(async college => college.id === (await getCourses()).filter(course => course.code === approvedApp.courseCode)[0].collegeId),
    year: 1, 
    registrationDate: new Date()
  });
}


// @endsection




// @section: STUDENT

// @section: Subjects (STUDENT)
// Get all subjects
export const getAllSubjects = async () => {
  const querySnapshot = await getDocs(collection(db, 'subjects'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
};

// Update subject
export const updateSubject = async (id: string, data: Partial<Subject>) => {
  const docRef = doc(db, 'subjects', id);
  await updateDoc(docRef, data);
};

// Delete subject
export const deleteSubject = async (id: string) => {
  const docRef = doc(db, 'subjects', id);
  await deleteDoc(docRef);
};

// @endsection

// @section: Courses
// Update course
export const updateCourse = async (id: string, data: Partial<Course>) => {
  const docRef = doc(db, 'courses', id);
  await updateDoc(docRef, data);
};

// Delete course
export const deleteCourse = async (id: string) => {
  const docRef = doc(db, 'courses', id);
  await deleteDoc(docRef);
};
// @section: Colleges
export const createCollege = async (collegeData: Omit<College, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'colleges'), {
    ...collegeData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getColleges = async () => {
  const querySnapshot = await getDocs(collection(db, 'colleges'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as College));
};

export const updateCollege = async (id: string, data: Partial<College>) => {
  const docRef = doc(db, 'colleges', id);
  await setDoc(docRef, data);
};

export const deleteCollege = async (id: string) => {
  const docRef = doc(db, 'colleges', id);
  await deleteDoc(docRef);
};
// @endsection

export const createSubject = async (subjectData: Omit<Subject, 'id'>) => {
  const docRef = await addDoc(collection(db, 'subjects'), subjectData);
  return docRef.id;
};

export const getSubjectsByCourse = async (courseCode: string) => {
  const q = query(collection(db, 'subjects'), where('courseCode', '==', courseCode));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
};

export const getStudentSubjects = async (subjectCodes: string[]) => {
  const courses = [] as Subject[];

  subjectCodes.forEach(async code => {
    const q = query(collection(db, 'subjects'), where('code', '==', code));
    const querySnapshot = await getDocs(q);
    console.log(querySnapshot.docs[0].data())
    courses.push(querySnapshot.docs[0].data() as Subject)
  })
  
  return courses as Subject[];
}

// @endsection

// @section: Results
// Update result
export const updateResult = async (id: string, data: Partial<Result>) => {
  const docRef = doc(db, 'results', id);
  await updateDoc(docRef, data);
};

// Delete result
export const deleteResult = async (id: string) => {
  const docRef = doc(db, 'results', id);
  await deleteDoc(docRef);
};
// @endsection

// @section: Finances
export const getFinancesByStudentId = async (id: string) => {
  const docRef = doc(db, "finance", id);
  const snapShot = await getDoc(docRef);
  return snapShot.exists() ? snapShot.data() as any : { records: [], total: 0 }
}

export const updateFinancesByStudentId = async (id: string, newData: { amount: number, detail: string }[]) => {
  const docRef = doc(db, "finance", id);

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
  const docRef = doc(db, 'timetable', id);
  await updateDoc(docRef, data);
};

// Delete timetable entry
export const deleteTimetableEntry = async (id: string) => {
  const docRef = doc(db, 'timetable', id);
  await deleteDoc(docRef);
};

// Delete payment
const deletePayment = async (id: string) => {
  const docRef = doc(db, 'payments', id);
  await deleteDoc(docRef);
};

// Delete ticket
const deleteTicket = async (id: string) => {
  const docRef = doc(db, 'tickets', id);
  await deleteDoc(docRef);
};

// Delete application
const deleteApplication = async (id: string) => {
  const docRef = doc(db, 'applications', id);
  await deleteDoc(docRef);
};

// Get all applications (for admin)
export const getAllApplications = async () => {
  const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
};

// Get all tickets (for admin)
export const getAllTickets = async () => {
  const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
};

// Get tickets by status
const getTicketsByStatus = async (status: Ticket['status']) => {
  const q = query(
    collection(db, 'tickets'),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
};

// Get payments by status
const getPaymentsByStatus = async (status: Payment['status']) => {
  const q = query(
    collection(db, 'payments'),
    where('status', '==', status),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

// Get results by course
export const getResultsByCourse = async (courseCode: string) => {
  const q = query(collection(db, 'results'), where('courseCode', '==', courseCode));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result));
};

// Get timetable by day
const getTimetableByDay = async (day: string) => {
  const q = query(collection(db, 'timetable'), where('day', '==', day));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Timetable));
};

// Get assets by category
const getAssetsByCategory = async (category: Asset['category']) => {
  const q = query(
    collection(db, 'assets'),
    where('category', '==', category),
    orderBy('uploadedAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
};

// Get assets by uploader
export const getAssetsByUploader = async (uploadedBy: string) => {
  const q = query(
    collection(db, 'assets'),
    where('uploadedBy', '==', uploadedBy),
    orderBy('uploadedAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
};

// Simple enrolled subjects storage per student
export const enrollStudentSubjects = async (studentId: string, subjectCodes: string[]) => {
  const ref = doc(db, 'users', studentId);
  // Merge enrolledSubjects into existing user doc to avoid clearing other fields
  await setDoc(ref, { enrolledSubjects: subjectCodes }, { merge: true });
};

// Populate subjects for a course
const populateSubjectsForCourse = async (courseName: string) => {
  const { COURSE_SUBJECTS } = await import('../data/constants');
  const subjects = COURSE_SUBJECTS[courseName as keyof typeof COURSE_SUBJECTS];

  if (!subjects) {
    throw new Error(`No subjects defined for course: ${courseName}`);
  }

  const subjectPromises = subjects.map(subject =>
    createSubject({
      courseCode: courseName,
      code: subject.code,
      name: subject.name,
      credits: subject.credits,
      semester: subject.semester,
      amount: subject.amount,
    })
  );

  return Promise.all(subjectPromises);
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

    // Use merge so we don't overwrite any existing fields unintentionally
    await setDoc(doc(db, 'users', authUser.user.uid), userData, { merge: true });
    return true;
  } catch (error) {
    console.error('Error creating lecturer:', error);
    throw error;
  }
};

// Get all lecturers (from unified users collection)
export const getLecturers = async (): Promise<User[]> => {
  const q = query(collection(db, 'users'), where('role', '==', 'lecturer'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
};

// Get lecturer by ID
const getLecturerById = async (uid: string): Promise<User | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const userData = docSnap.data();
  if (userData.role !== 'lecturer') return null;

  return { uid: docSnap.id, ...userData } as User;
};

// Update lecturer
const updateLecturer = async (id: string, data: Partial<Lecturer>) => {
  const docRef = doc(db, 'lecturers', id);
  await updateDoc(docRef, data);
};

// Delete lecturer
const deleteLecturer = async (id: string) => {
  const docRef = doc(db, 'lecturers', id);
  await deleteDoc(docRef);
};
// @endsection



// Generate student number in format: YYYY + sequential number (e.g., 2024001234)
export const generateStudentNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const studentsRef = collection(db, 'students');
  const q = query(studentsRef, where('studentNumber', '>=', `${currentYear}000000`), where('studentNumber', '<', `${currentYear + 1}000000`));
  const snapshot = await getDocs(q);

  const nextNumber = snapshot.size + 1;
  return `${currentYear}${nextNumber.toString().padStart(6, '0')}`;
};

// Generate staff number in format: LEC + sequential number (e.g., LEC001234)
export const generateStaffNumber = async (): Promise<string> => {
  const lecturersRef = collection(db, 'lecturers');
  const q = query(lecturersRef, where('staffNumber', '>=', 'LEC000000'), where('staffNumber', '<', 'LEC999999'));
  const snapshot = await getDocs(q);

  const nextNumber = snapshot.size + 1;
  return `LEC${nextNumber.toString().padStart(6, '0')}`;
};