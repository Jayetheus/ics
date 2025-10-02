import { Timestamp } from "firebase/firestore";

export type UserRole = 'student' | 'lecturer' | 'admin' | 'finance';

export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Role-specific fields
  studentNumber?: string;
  staffNumber?: string;
  courseCode?: string;
  year?: number;
  department?: string;
  collegeId?: string;
  hireDate?: string;
  registrationDate?: string;
  examNumber?: string;
  phone?: string;
  address?: string;
  idNumber?: string;
  dateOfBirth?: string;
  photoUrl?: string;
  qualifications?: string;
  subjects?: string[]; // Array of subject IDs for lecturers
  enrolledSubjects?: string[]; // Array of subject IDs for students
  results?: any[]; // For students
}

// Legacy interfaces for backward compatibility - will be deprecated
export interface UserProfile {
  firstName: string;
  lastName: string;
  college?: string;
  studentNumber?: string;
  staffNumber?: string;
  course?: string;
  year?: number;
  phone?: string;
  address?: string;
  idNumber?: string;
  dateOfBirth?: string;
  photoUrl?: string;
}

export interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  course: string;
  year: number;
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string;
  examNumber: string;
  results: any[];
}

// Lecturer is now just a User with role='lecturer' - keeping for backward compatibility
export interface Lecturer {
  uid: string;
  staffNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  collegeId: string;
  status: 'active' | 'inactive' | 'suspended';
  hireDate: string;
  phone?: string;
  address?: string;
  qualifications?: string;
  subjects?: string[]; // Array of subject IDs
}

export interface Course {
  requirements: string;
  apsRequired: string;
  id: string;
  code: string;
  name: string;
  credits: number;
  lecturer: string;
  department: string;
  collegeId: string;
  subjects?: Subject[];
}

export interface College {
  id: string;
  name: string;
  code: string;
  location: string;
  established: string;
  type: 'university' | 'college' | 'institute';
  accreditation: string;
  website?: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface Result {
  assessmentType: any;
  assessmentName: any;
  createdAt: any;
  createdBy: any;
  maxMarks: any;
  id: string;
  studentId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  courseCode: string;
  mark: number;
  grade: string;
  semester: string;
  year: number;
}

export interface Timetable {
  id: string;
  courseCode: string;
  courseName: string;
  subjectCode: string;
  subjectName: string;
  lecturerId: string;
  lecturerName: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  type: 'lecture' | 'practical' | 'tutorial';
  semester: 1 | 2;
  year: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  type: 'registration' | 'tuition' | 'accommodation' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  date: Timestamp;
  proofOfPaymentUrl?: string;
  description: string;
}

export interface Application {
  id: string;
  studentId: string;
  courseCode: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
}

export interface AttendanceSession {
  id: string;
  lecturerId: string;
  lecturerName: string;
  subjectCode: string;
  subjectName: string;
  courseCode: string;
  venue: string;
  date: string; // YYYY-MM-DD format
  startTime: string;
  endTime: string;
  qrCode: string; // Generated QR code data
  isActive: boolean;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  timestamp: Timestamp;
  status: 'present' | 'late' | 'absent';
  notes?: string;
}

export interface Registration {
  id: string;
  studentId: string;
  courseCode: string;
  createdAt: Timestamp;
  startDate: string;
  endDate: string;
}

export interface Subject {
  id: string;
  courseCode: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  amount: number;
}

export interface Ticket {
  id: string;
  studentId: string;
  title: string;
  description: string;
  category: 'technical' | 'academic' | 'finance' | 'general';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  response?: string;
}

export interface Asset {
  id: string;
  name: string;
  originalName: string;
  type: string;
  url?: string; // Optional for backward compatibility
  fileId?: string; // Appwrite file ID for storage operations
  bucketId?: string; // Appwrite bucket ID
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  category: 'document' | 'image' | 'video' | 'other';
}