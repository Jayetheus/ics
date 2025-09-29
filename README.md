# EduTech Student Management System

A comprehensive student management system built with React, TypeScript, and Vite. This system provides role-based access control for students, lecturers, and administrators with features including attendance tracking via QR codes, document management, financial tracking, and more.

## 🚀 Features

### Core Functionality
- **Role-based Authentication**: Secure login system for students, lecturers, and administrators
- **QR Code Attendance**: Students can scan QR codes to mark attendance
- **Document Management**: Upload, view, and manage documents for all user roles
- **User Management**: Comprehensive user administration with detailed user information viewing
- **Financial Tracking**: Payment management and financial reporting
- **Timetable Management**: Course scheduling and timetable viewing
- **Results Management**: Grade entry and result viewing
- **Helpdesk System**: Support ticket management
- **Real-time Notifications**: Toast notifications for user feedback

### User Roles

#### 👨‍🎓 Student
- View personal dashboard with attendance, results, and financial status
- Scan QR codes to mark attendance
- Upload and manage personal documents
- View timetable and course information
- Access financial information and payment history
- Submit helpdesk tickets

#### 👨‍🏫 Lecturer
- Manage student attendance and generate reports
- Enter and manage student results
- View and manage assigned subjects
- Access student information and performance data
- Upload course materials and documents

#### 👨‍💼 Administrator
- Complete user management with detailed user information viewing
- Manage colleges, courses, and subjects
- Generate comprehensive reports
- Manage financial records and payments
- Handle helpdesk tickets
- Upload documents for any user
- View and manage all system data

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Backend**: Appwrite (Database, Authentication, Storage)
- **Additional Services**: Firebase (Firestore), EmailJS
- **QR Code**: @yudiel/react-qr-scanner
- **Testing**: Vitest, React Testing Library
- **Build Tool**: Vite

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── admin/           # Admin-specific components
│   │   └── EmailTestPanel.tsx
│   ├── auth/            # Authentication components
│   │   └── ProtectedRoute.tsx
│   ├── common/          # Shared components
│   │   ├── ErrorBoundary.tsx
│   │   ├── FileUpload.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── Notification.tsx
│   │   ├── NotificationContainer.tsx
│   │   └── Skeleton.tsx
│   ├── dashboard/       # Dashboard components
│   │   ├── AdminDashboard.tsx
│   │   ├── FinanceDashboard.tsx
│   │   ├── LecturerDashboard.tsx
│   │   └── StudentDashboard.tsx
│   └── layout/          # Layout components
│       ├── Layout.tsx
│       ├── Navbar.tsx
│       └── Sidebar.tsx
├── context/             # React Context providers
│   ├── AuthContext.tsx
│   └── NotificationContext.tsx
├── data/                # Static data and constants
│   └── constants.ts
├── docs/                # Documentation
│   └── DATA_STRUCTURE.md
├── pages/               # Page components
│   ├── Applications.tsx
│   ├── ApplicationsManagement.tsx
│   ├── AssetManagement.tsx
│   ├── CollegeManagement.tsx
│   ├── CourseManagement.tsx
│   ├── Courses.tsx
│   ├── Dashboard.tsx
│   ├── Documents.tsx
│   ├── FinalizeRegistration.tsx
│   ├── Finance.tsx
│   ├── FinancialReports.tsx
│   ├── Helpdesk.tsx
│   ├── HelpdeskManagement.tsx
│   ├── LecturerAttendance.tsx
│   ├── LecturerReports.tsx
│   ├── LecturerStudentManagement.tsx
│   ├── Login.tsx
│   ├── PaymentManagement.tsx
│   ├── PaymentProofs.tsx
│   ├── Profile.tsx
│   ├── Register.tsx
│   ├── Reports.tsx
│   ├── Results.tsx
│   ├── ResultsEntry.tsx
│   ├── Schedule.tsx
│   ├── Settings.tsx
│   ├── StudentAttendance.tsx
│   ├── StudentFinance.tsx
│   ├── SubjectManagement.tsx
│   ├── Subjects.tsx
│   ├── Timetable.tsx
│   ├── TimetableManagement.tsx
│   └── UserManagement.tsx
├── services/            # API and service layer
│   ├── appwrite.ts
│   ├── database.ts
│   ├── dataLoader.ts
│   ├── emailService.ts
│   ├── firebase.ts
│   └── storage.ts
├── test/                # Test files
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── utils/
│   └── setup.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   ├── dataMigration.ts
│   ├── qrCodeUtils.ts
│   └── validation.ts
├── App.tsx
├── index.css
├── main.tsx
└── vite-env.d.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Appwrite account and project
- Firebase project (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_APPWRITE_ENDPOINT=your_appwrite_endpoint
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   ```

   **Note**: The Appwrite storage bucket ID is hardcoded as `6894f208002ce1ab60b5` in the application.

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## 🧪 Testing

The project includes comprehensive test coverage using Vitest and React Testing Library.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Structure

- **Unit Tests**: Individual component and utility function tests
- **Integration Tests**: Page-level tests with mocked services
- **Context Tests**: Authentication and notification context tests
- **Utility Tests**: Validation and QR code utility tests

## 📱 Key Features Explained

### QR Code Attendance System

The attendance system uses QR codes for secure, contactless attendance marking:

1. **QR Code Generation**: Lecturers generate QR codes for attendance sessions
2. **QR Code Scanning**: Students scan QR codes using their device camera
3. **Validation**: System validates QR code authenticity and expiration
4. **Attendance Recording**: Attendance is automatically recorded with timestamp

**Files involved:**
- `src/pages/StudentAttendance.tsx` - Student attendance interface
- `src/pages/LecturerAttendance.tsx` - Lecturer attendance management
- `src/utils/qrCodeUtils.ts` - QR code parsing and validation utilities

### Document Management System

Comprehensive document management for all user roles:

1. **File Upload**: Drag-and-drop file upload with validation
2. **File Storage**: Secure cloud storage via Appwrite
3. **File Organization**: User-specific folder structure
4. **File Operations**: View, download, and delete documents

**Files involved:**
- `src/components/common/FileUpload.tsx` - Reusable file upload component
- `src/pages/Documents.tsx` - Document management page
- `src/pages/Profile.tsx` - User profile with document section
- `src/services/storage.ts` - File storage service

### User Management System

Advanced user management for administrators:

1. **User Information**: Complete user profile viewing
2. **Document Management**: Upload and manage user documents
3. **Role Management**: Assign and modify user roles
4. **User Search**: Advanced search and filtering

**Files involved:**
- `src/pages/UserManagement.tsx` - Main user management interface
- `src/services/database.ts` - User data operations

### Financial Management

Comprehensive financial tracking and management:

1. **Payment Tracking**: Monitor student payments
2. **Financial Reports**: Generate detailed financial reports
3. **Payment Management**: Handle payment approvals and rejections
4. **Student Finance**: Individual student financial information

**Files involved:**
- `src/pages/Finance.tsx` - Financial overview
- `src/pages/PaymentManagement.tsx` - Payment administration
- `src/pages/StudentFinance.tsx` - Student financial information
- `src/pages/FinancialReports.tsx` - Financial reporting

## 🔧 Configuration

### Appwrite Setup

1. Create an Appwrite project
2. Set up authentication
3. Create storage bucket with ID: `6894f208002ce1ab60b5`
4. Create database collections:
   - `6894f208002ce1ab60b6` - Assets (documents)
   - `6894f208002ce1ab60b7` - Results
   - `6894f208002ce1ab60b8` - Users
   - `6894f208002ce1ab60b9` - Subjects
   - `users` - User information (Firebase)
   - `attendance` - Attendance records (Firebase)
   - `payments` - Payment records (Firebase)
   - `courses` - Course information (Firebase)
   - `timetables` - Timetable data (Firebase)
   - `helpdesk` - Support tickets (Firebase)

### Firebase Setup (Optional)

1. Create a Firebase project
2. Enable Firestore database
3. Configure authentication
4. Add Firebase configuration to environment variables

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Deploy to Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

## 📊 Database Schema

### Users Collection
```typescript
interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'student' | 'lecturer';
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  photoUrl?: string;
  studentNumber?: string;
  staffNumber?: string;
  department?: string;
  collegeId?: string;
  courseCode?: string;
  year?: number;
  qualifications?: string;
  subjects?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Attendance Collection
```typescript
interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  timestamp: string;
  status: 'present' | 'absent' | 'late';
  location?: string;
  notes?: string;
}
```

### Documents Collection
```typescript
interface Asset {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  category: 'document' | 'image' | 'video' | 'other';
}
```

## 🔒 Security Features

- **Authentication**: Secure user authentication via Appwrite
- **Authorization**: Role-based access control
- **Data Validation**: Client and server-side validation
- **File Security**: Secure file upload and storage
- **QR Code Security**: Time-based QR code expiration
- **Input Sanitization**: Protection against XSS attacks

## 🐛 Troubleshooting

### Common Issues

1. **QR Scanner Not Working**
   - Ensure camera permissions are granted
   - Check if HTTPS is enabled (required for camera access)
   - Verify QR scanner library compatibility

2. **File Upload Issues**
   - Check file size limits (default: 10MB)
   - Verify file type restrictions
   - Ensure Appwrite storage is properly configured

3. **Authentication Problems**
   - Verify Appwrite configuration
   - Check environment variables
   - Ensure user has proper permissions

4. **Build Errors**
   - Clear node_modules and reinstall dependencies
   - Check TypeScript configuration
   - Verify all environment variables are set

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `docs/` folder

## 🎯 Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Video conferencing integration
- [ ] Advanced reporting features
- [ ] Multi-language support
- [ ] Dark mode theme

### Recent Updates
- ✅ Fixed QR scanner dependency issues
- ✅ Implemented comprehensive testing suite
- ✅ Enhanced user management with document support
- ✅ Added real-time notifications
- ✅ Improved error handling and validation
- ✅ Enhanced mobile responsiveness

---

**Built with ❤️ using React, TypeScript, and modern web technologies.**
