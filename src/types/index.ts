export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  profile?: UserProfile;
}

export type UserRole = 'student' | 'lecturer' | 'admin' | 'finance';

export interface UserProfile {
  firstName: string;
  lastName: string;
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
  profile: UserProfile;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  lecturer: string;
  department: string;
}

export interface Result {
  id: string;
  studentId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  mark: number;
  grade: string;
  semester: string;
  year: number;
}

export interface Timetable {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  lecturer: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  type: 'lecture' | 'practical' | 'tutorial';
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  type: 'registration' | 'tuition' | 'accommodation' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  proofOfPaymentUrl?: string;
  description: string;
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
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  category: 'document' | 'image' | 'video' | 'other';
}