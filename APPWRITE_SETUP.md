# Appwrite Configuration Setup

This document outlines the Appwrite configuration required for the Migigawa project.

## Storage Bucket Configuration

### Bucket ID: `6894f208002ce1ab60b5`

This bucket is used for storing all documents and files uploaded by users.

**Bucket Settings:**
- **Name**: `migigawa-documents`
- **ID**: `6894f208002ce1ab60b5`
- **File Size Limit**: 10MB (recommended)
- **Allowed File Extensions**: `.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.mp4`, `.avi`, `.txt`
- **Access**: Private (requires authentication)

## Database Collections

### Main Database: `main`

#### 1. Assets Collection
- **Collection ID**: `6894f208002ce1ab60b6`
- **Name**: `assets`
- **Purpose**: Store document metadata and file information

**Attributes:**
```json
{
  "name": "string",
  "type": "string", 
  "url": "string",
  "uploadedBy": "string",
  "uploadedAt": "datetime",
  "size": "integer",
  "category": "string"
}
```

#### 2. Results Collection
- **Collection ID**: `6894f208002ce1ab60b7`
- **Name**: `results`
- **Purpose**: Store student academic results

**Attributes:**
```json
{
  "studentId": "string",
  "subjectCode": "string",
  "lecturerId": "string",
  "assignment": "integer",
  "exam": "integer", 
  "project": "integer",
  "total": "integer",
  "grade": "string",
  "comments": "string",
  "semester": "integer",
  "academicYear": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

#### 3. Users Collection
- **Collection ID**: `6894f208002ce1ab60b8`
- **Name**: `users`
- **Purpose**: Store user profile information (complementary to Firebase Auth)

**Attributes:**
```json
{
  "uid": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "string",
  "enrolledSubjects": "string[]",
  "subjects": "string[]"
}
```

#### 4. Subjects Collection
- **Collection ID**: `6894f208002ce1ab60b9`
- **Name**: `subjects`
- **Purpose**: Store subject information and lecturer assignments

**Attributes:**
```json
{
  "code": "string",
  "name": "string",
  "credits": "integer",
  "semester": "integer",
  "lecturerId": "string",
  "courseCode": "string"
}
```

## Security Rules

### Storage Bucket Rules
```javascript
// Allow authenticated users to upload files
function() {
  return request.auth != null;
}

// Allow users to read their own files
function() {
  return request.auth.uid == resource.metadata.uploadedBy;
}

// Allow admins to read all files
function() {
  return request.auth.claims.role == "admin";
}
```

### Database Collection Rules

#### Assets Collection
```javascript
// Allow authenticated users to create assets
function() {
  return request.auth != null;
}

// Allow users to read their own assets
function() {
  return request.auth.uid == resource.uploadedBy;
}

// Allow admins to read all assets
function() {
  return request.auth.claims.role == "admin";
}
```

#### Results Collection
```javascript
// Allow lecturers to create results for their subjects
function() {
  return request.auth != null && 
         request.auth.claims.role == "lecturer" &&
         request.auth.uid == resource.lecturerId;
}

// Allow students to read their own results
function() {
  return request.auth.uid == resource.studentId;
}

// Allow admins to read all results
function() {
  return request.auth.claims.role == "admin";
}
```

## Environment Variables Required

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
```

## Setup Instructions

1. **Create Appwrite Project**
   - Go to [Appwrite Console](https://cloud.appwrite.io)
   - Create a new project
   - Note the Project ID

2. **Create Storage Bucket**
   - Go to Storage section
   - Create bucket with ID: `6894f208002ce1ab60b5`
   - Set appropriate file size limits and allowed extensions

3. **Create Database**
   - Go to Databases section
   - Create database with ID: `main`

4. **Create Collections**
   - Create collections with the specified IDs and attributes
   - Set up appropriate security rules

5. **Configure Authentication**
   - Set up authentication providers (Email/Password recommended)
   - Configure user roles and permissions

6. **Update Environment Variables**
   - Add your Appwrite endpoint and project ID to `.env` file

## File Upload Flow

1. User selects file(s) in the application
2. File is uploaded to Appwrite storage bucket `6894f208002ce1ab60b5`
3. File metadata is stored in `assets` collection `6894f208002ce1ab60b6`
4. User can view, download, or delete their files
5. Admins can manage all files across the system

## Results Management Flow

1. Lecturer selects a subject they teach
2. System loads students enrolled in that subject
3. Lecturer creates/edits results for students
4. Results are stored in `results` collection `6894f208002ce1ab60b7`
5. Students can view their results
6. Admins can view all results

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check bucket ID is correct
   - Verify file size is within limits
   - Ensure user is authenticated

2. **Database Access Denied**
   - Check collection IDs are correct
   - Verify security rules are properly configured
   - Ensure user has appropriate role

3. **Results Not Saving**
   - Verify lecturer is assigned to the subject
   - Check student is enrolled in the subject
   - Ensure all required fields are provided

### Support

For technical support with Appwrite configuration, refer to:
- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Console](https://cloud.appwrite.io)
- [Appwrite Community](https://appwrite.io/discord)

