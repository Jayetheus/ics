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
  limit,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Student, Course, Result, Timetable, Payment, Ticket, Asset } from '../types';

// Students
export const createStudent = async (studentData: Omit<Student, 'id'>) => {
  const docRef = await addDoc(collection(db, 'students'), {
    ...studentData,
    registrationDate: Timestamp.now(),
  });
  return docRef.id;
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

// Courses
export const createCourse = async (courseData: Omit<Course, 'id'>) => {
  const docRef = await addDoc(collection(db, 'courses'), courseData);
  return docRef.id;
};

export const getCourses = async () => {
  const querySnapshot = await getDocs(collection(db, 'courses'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
};

// Results
export const createResult = async (resultData: Omit<Result, 'id'>) => {
  const docRef = await addDoc(collection(db, 'results'), resultData);
  return docRef.id;
};

export const getResultsByStudent = async (studentId: string) => {
  const q = query(collection(db, 'results'), where('studentId', '==', studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result));
};

// Timetable
export const createTimetableEntry = async (timetableData: Omit<Timetable, 'id'>) => {
  const docRef = await addDoc(collection(db, 'timetable'), timetableData);
  return docRef.id;
};

export const getTimetable = async () => {
  const querySnapshot = await getDocs(collection(db, 'timetable'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Timetable));
};

// Payments
export const createPayment = async (paymentData: Omit<Payment, 'id'>) => {
  const docRef = await addDoc(collection(db, 'payments'), {
    ...paymentData,
    date: Timestamp.now(),
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

// Tickets
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

// Assets
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