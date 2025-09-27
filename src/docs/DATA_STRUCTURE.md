# Unified Data Structure Documentation

## Overview

This document outlines the unified data structure implemented to resolve inconsistencies in the EduTech project. The system now uses a single `User` interface that accommodates all user types (students, lecturers, admins, finance) with role-specific fields.

## Core Data Structure

### User Interface

```typescript
export interface User {
  uid: string;                    // Firebase Auth UID (primary key)
  email: string;                  // User's email address
  firstName: string;              // User's first name
  lastName: string;               // User's last name
  role: UserRole;                 // 'student' | 'lecturer' | 'admin' | 'finance'
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Timestamp;           // Account creation timestamp
  updatedAt: Timestamp;           // Last update timestamp
  
  // Role-specific fields (optional based on role)
  studentNumber?: string;         // For students
  staffNumber?: string;           // For lecturers
  courseCode?: string;            // For students
  year?: number;                  // For students
  department?: string;            // For lecturers
  collegeId?: string;             // For lecturers
  hireDate?: string;              // For lecturers
  registrationDate?: string;      // For students
  examNumber?: string;            // For students
  phone?: string;                 // Optional contact info
  address?: string;               // Optional address
  idNumber?: string;              // Optional ID number
  dateOfBirth?: string;           // Optional date of birth
  photoUrl?: string;              // Optional profile photo
  qualifications?: string;        // For lecturers
  subjects?: string[];            // Array of subject IDs for lecturers
  enrolledSubjects?: string[];   // Array of subject IDs for students
  results?: any[];                // For students
}
```

## Database Collections

### Primary Collection: `users`

All user data is stored in a single `users` collection with documents keyed by Firebase Auth UID.

**Document Structure:**
```
users/{uid} = {
  uid: string,
  email: string,
  firstName: string,
  lastName: string,
  role: 'student' | 'lecturer' | 'admin' | 'finance',
  status: 'active' | 'inactive' | 'suspended',
  createdAt: Timestamp,
  updatedAt: Timestamp,
  // Role-specific fields...
}
```

### Supporting Collections

- `courses` - Course information
- `subjects` - Subject information
- `colleges` - College information
- `applications` - Student applications
- `payments` - Payment records
- `results` - Student results
- `timetable` - Class schedules
- `attendanceSessions` - QR code attendance sessions
- `attendanceRecords` - Individual attendance records

## Database Functions

### User Management

```typescript
// Create a new user
createUser(userData: Partial<User>): Promise<User>

// Get all users
getUsers(): Promise<User[]>

// Get user by ID
getUserById(uid: string): Promise<User | null>

// Update user
updateUser(uid: string, data: Partial<User>): Promise<User>

// Delete user
deleteUser(uid: string): Promise<void>

// Get users by role
getUsersByRole(role: UserRole): Promise<User[]>
```

### Role-Specific Functions

```typescript
// Lecturer-specific functions
createLecturer(lecturerData: Partial<User>): Promise<boolean>
getLecturers(): Promise<User[]>  // Returns users with role='lecturer'
getLecturerById(uid: string): Promise<User | null>

// Student-specific functions (legacy support)
createStudent(studentData: any): Promise<boolean>
getStudents(): Promise<Student[]>
getStudentById(id: string): Promise<Student | null>
```

## Data Access Patterns

### Getting Students

```typescript
// Method 1: Get all users and filter
const allUsers = await getUsers();
const students = allUsers.filter(user => user.role === 'student');

// Method 2: Use role-specific function
const students = await getUsersByRole('student');

// Method 3: Legacy function (still supported)
const students = await getStudents();
```

### Getting Lecturers

```typescript
// Method 1: Get all users and filter
const allUsers = await getUsers();
const lecturers = allUsers.filter(user => user.role === 'lecturer');

// Method 2: Use lecturer-specific function
const lecturers = await getLecturers();
```

### Accessing Role-Specific Data

```typescript
// For students
const student = await getUserById(uid);
if (student?.role === 'student') {
  const studentNumber = student.studentNumber;
  const courseCode = student.courseCode;
  const year = student.year;
}

// For lecturers
const lecturer = await getUserById(uid);
if (lecturer?.role === 'lecturer') {
  const staffNumber = lecturer.staffNumber;
  const department = lecturer.department;
  const subjects = lecturer.subjects;
}
```

## Migration Strategy

### Phase 1: Unified Interface (Current)

- ✅ Updated `User` interface to accommodate all roles
- ✅ Updated database functions to use unified structure
- ✅ Updated components to use unified data access
- ✅ Maintained backward compatibility with legacy functions

### Phase 2: Data Migration (Optional)

Use the migration utility to consolidate existing data:

```typescript
import { migrateToUnifiedUsers, validateDataConsistency } from '../utils/dataMigration';

// Run migration
const stats = await migrateToUnifiedUsers();
console.log('Migration completed:', stats);

// Validate consistency
const validation = await validateDataConsistency();
if (!validation.isValid) {
  console.log('Data issues found:', validation.issues);
}
```

### Phase 3: Cleanup (Future)

- Remove legacy `Student` and `Lecturer` interfaces
- Remove legacy database functions
- Consolidate all data into `users` collection

## Best Practices

### 1. Always Check User Role

```typescript
const user = await getUserById(uid);
if (!user) return;

switch (user.role) {
  case 'student':
    // Access student-specific fields
    break;
  case 'lecturer':
    // Access lecturer-specific fields
    break;
  case 'admin':
    // Access admin-specific fields
    break;
  case 'finance':
    // Access finance-specific fields
    break;
}
```

### 2. Use Type Guards

```typescript
const isStudent = (user: User): user is User & { studentNumber: string } => {
  return user.role === 'student' && !!user.studentNumber;
};

const isLecturer = (user: User): user is User & { staffNumber: string } => {
  return user.role === 'lecturer' && !!user.staffNumber;
};
```

### 3. Handle Optional Fields Safely

```typescript
const studentNumber = user.studentNumber || 'N/A';
const department = user.department || 'Not specified';
```

## Component Usage Examples

### UserManagement Component

```typescript
// Display all users with role-specific information
const allUsers = await getUsers();

// Filter by role
const students = allUsers.filter(user => user.role === 'student');
const lecturers = allUsers.filter(user => user.role === 'lecturer');

// Display role-specific data
{user.role === 'lecturer' && (
  <div>
    <div>Department: {user.department}</div>
    <div>Staff Number: {user.staffNumber}</div>
  </div>
)}
```

### StudentDashboard Component

```typescript
// Get current user data
const currentUser = await getUserById(authUser.uid);

// Access student-specific fields
const studentNumber = currentUser?.studentNumber;
const courseCode = currentUser?.courseCode;
const year = currentUser?.year;
```

## Error Handling

### Common Issues and Solutions

1. **Missing Role-Specific Fields**
   ```typescript
   const studentNumber = user.studentNumber || 'Not assigned';
   ```

2. **Type Casting Issues**
   ```typescript
   const student = user as User & { studentNumber: string };
   ```

3. **Legacy Data Compatibility**
   ```typescript
   // Use legacy functions for existing data
   const legacyStudent = await getStudentById(id);
   ```

## Testing

### Unit Tests

```typescript
describe('User Management', () => {
  it('should create a student user', async () => {
    const studentData: Partial<User> = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'student',
      studentNumber: '2024001',
      courseCode: 'CS101'
    };
    
    const user = await createUser(studentData);
    expect(user.role).toBe('student');
    expect(user.studentNumber).toBe('2024001');
  });
});
```

### Integration Tests

```typescript
describe('Data Consistency', () => {
  it('should maintain data integrity across operations', async () => {
    const user = await createUser(testData);
    const retrieved = await getUserById(user.uid);
    expect(retrieved).toEqual(user);
  });
});
```

## Performance Considerations

### Indexing

Ensure proper Firestore indexes for common queries:

```javascript
// Composite index for role-based queries
{
  "collectionGroup": "users",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "role", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```

### Caching

```typescript
// Cache user data in components
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchUsers = async () => {
    const userData = await getUsers();
    setUsers(userData);
    setLoading(false);
  };
  fetchUsers();
}, []);
```

## Conclusion

The unified data structure provides:

- ✅ **Consistency**: Single source of truth for user data
- ✅ **Flexibility**: Role-specific fields without separate interfaces
- ✅ **Maintainability**: Easier to manage and update
- ✅ **Scalability**: Easy to add new roles and fields
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Backward Compatibility**: Legacy functions still work

This structure resolves the previous inconsistencies and provides a solid foundation for future development.
