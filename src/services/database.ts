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
  arrayUnion, 
  Timestamp, 
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Student, Course, Result, Timetable, Payment, Ticket, Asset, Application, Subject } from '../types';
import type { College } from '../types';

// @section: Students
export const createStudent = async (studentData: any) => {
  
  const data = {...studentData, displayName: `${studentData.profile.firstName} ${studentData.profile.lastName}`}
  await setDoc(doc(db, 'students', data.uid), {
    ...data,
    registrationDate: Timestamp.now(),
  });
  return true;
};

export const getStudents = async () => {
  const querySnapshot = await getDocs(collection(db, 'students'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
};

export const getStudentById = async (id: string) => {
  const docRef = doc(db, 'students', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Student : null;
};

export const updateStudent = async (id: string, data: Partial<Student>) => {
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
  const q = query(collection(db, 'results'), where('studentId', '==', studentId));
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
export const createTimetableEntry = async (timetableData: Omit<Timetable, 'id'>) => {
  const docRef = await addDoc(collection(db, 'timetable'), timetableData);
  return docRef.id;
};

export const getTimetable = async () => {
  const querySnapshot = await getDocs(collection(db, 'timetable'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Timetable));
};
//@endsection

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

export const updateApplicationStatus = async (applicationId: string, status: Application['status']) => {
  const ref = doc(db, 'applications', applicationId);
  await updateDoc(ref, { status, updatedAt: Timestamp.now() });
};


// @endsection

// @section: Registrations
export const getStudentRegistration =  async (studentId: string) => {
  const q = query(collection(db, 'students'), where('uid', '==', studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id,courseCode: doc.data().profile.course, year: doc.data().profile.year} as any))[0];
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
  await updateDoc(docRef, data);
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
export const getFinancesByStudentId = async (id: string)=>{
  const docRef = doc(db, "finance", id);
  const snapShot = await getDoc(docRef);
  return snapShot.exists() ? snapShot.data() as any : {records: null, total: 0}
}

export const updateFinancesByStudentId = async (id: string, newData: {amount: number, detail: string}[])=>{
  const docRef = doc(db, "finance", id); 

  newData.forEach(async data => {
  await setDoc(docRef, {
    records: arrayUnion(data)
  }).then(async () => await updateTotalFinanceForStudent(id))
  })
}

const updateTotalFinanceForStudent = async function(id: string){
  const docRef = doc(db, "finance", id);
  await getFinancesByStudentId(id).then(async data => {
    let amounts = 0;
    data.records.forEach((record: any) => amounts += record.amount);
    await updateDoc(docRef, {total: amounts})
  })
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
export const deletePayment = async (id: string) => {
  const docRef = doc(db, 'payments', id);
  await deleteDoc(docRef);
};

// Delete ticket
export const deleteTicket = async (id: string) => {
  const docRef = doc(db, 'tickets', id);
  await deleteDoc(docRef);
};

// Delete application
export const deleteApplication = async (id: string) => {
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
export const getTicketsByStatus = async (status: Ticket['status']) => {
  const q = query(
    collection(db, 'tickets'), 
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
};

// Get payments by status
export const getPaymentsByStatus = async (status: Payment['status']) => {
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
export const getTimetableByDay = async (day: string) => {
  const q = query(collection(db, 'timetable'), where('day', '==', day));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Timetable));
};

// Get assets by category
export const getAssetsByCategory = async (category: Asset['category']) => {
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
  const ref = doc(db, 'students', studentId);
  await setDoc(ref, { enrolledSubjects: subjectCodes });
};

// Populate subjects for a course
export const populateSubjectsForCourse = async (courseName: string) => {
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