# Document Storage Setup Guide

This guide explains how to set up and configure Appwrite bucket storage for the Migigawa project's document upload and download functionality.

## Overview

The document storage system has been completely refactored to properly leverage Appwrite's bucket storage instead of storing files in the database. This provides better performance, scalability, and follows best practices.

## Key Changes Made

### 1. Storage Service (`src/services/storage.ts`)
- **Fixed URL generation**: Now uses proper Appwrite SDK methods instead of manual URL construction
- **Added proper error handling**: Better error messages and error propagation
- **Added new functions**:
  - `getFileDownloadUrl()` - Get download URL for files
  - `getFileViewUrl()` - Get view URL for browser display
  - `getFilePreviewUrl()` - Get preview URL for thumbnails
  - `getFileInfo()` - Get file metadata
  - `listFiles()` - List files in bucket

### 2. Asset Type (`src/types/index.ts`)
- **Added new fields**:
  - `originalName` - Original filename before upload
  - `fileId` - Appwrite file ID for storage operations
  - `bucketId` - Appwrite bucket ID
  - Made `url` optional for backward compatibility

### 3. FileUpload Component (`src/components/common/FileUpload.tsx`)
- **Updated to use new storage service**: Now properly stores file metadata with Appwrite file IDs
- **Improved error handling**: Better error messages and user feedback
- **Maintains backward compatibility**: Works with existing database structure

### 4. Documents Page (`src/pages/Documents.tsx`)
- **Added proper file viewing**: Uses Appwrite's `getFileViewUrl()` for browser display
- **Added proper file downloading**: Uses Appwrite's `getFileDownloadUrl()` for downloads
- **Added image previews**: Uses Appwrite's `getFilePreviewUrl()` for thumbnails
- **Improved error handling**: Better user feedback for failed operations
- **Backward compatibility**: Falls back to old URL system for existing documents

### 5. Database Service (`src/services/appwriteDatabase.ts`)
- **Enhanced deleteAsset function**: Now deletes files from both database and storage
- **Proper cleanup**: Ensures no orphaned files in storage

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_actual_project_id_here
```

**Important**: Replace `your_actual_project_id_here` with your actual Appwrite project ID from the Appwrite console.

### 2. Appwrite Console Setup

#### Create Storage Bucket
1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Navigate to **Storage** section
3. Create a new bucket with these settings:
   - **Name**: `migigawa-documents`
   - **ID**: `6894f208002ce1ab60b5` (use this exact ID)
   - **File Size Limit**: 10MB (recommended)
   - **Allowed File Extensions**: `.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.mp4`, `.avi`, `.txt`
   - **Access**: Private (requires authentication)

#### Configure Security Rules
Set up the following security rules for the bucket:

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

### 3. Database Collection Setup

Ensure the **Assets** collection exists with the following attributes:

- **Collection ID**: `6894f208002ce1ab60b6`
- **Name**: `assets`

**Required Attributes**:
```json
{
  "name": "string",
  "originalName": "string", 
  "type": "string",
  "url": "string (optional)",
  "fileId": "string (optional)",
  "bucketId": "string (optional)",
  "uploadedBy": "string",
  "uploadedAt": "datetime",
  "size": "integer",
  "category": "string"
}
```

## How It Works

### File Upload Process
1. User selects file(s) in the FileUpload component
2. File is uploaded to Appwrite storage bucket using `uploadFile()`
3. File metadata is stored in the database with the Appwrite file ID
4. User receives success notification

### File Display Process
1. Documents page loads asset metadata from database
2. For viewing: Uses `getFileViewUrl()` to get browser-compatible URL
3. For downloading: Uses `getFileDownloadUrl()` to get download URL
4. For image previews: Uses `getFilePreviewUrl()` for optimized thumbnails

### File Deletion Process
1. User clicks delete button
2. System deletes asset record from database
3. System also deletes actual file from Appwrite storage
4. UI updates to reflect changes

## Benefits of This Implementation

1. **Proper File Storage**: Files are stored in Appwrite's optimized storage system, not in the database
2. **Better Performance**: Faster uploads/downloads with proper CDN integration
3. **Scalability**: Can handle large files and many users efficiently
4. **Security**: Proper access control through Appwrite's security rules
5. **Cost Effective**: Only metadata stored in database, actual files in storage
6. **Backward Compatible**: Existing documents with URLs still work

## Troubleshooting

### Common Issues

1. **"Failed to upload file" Error**
   - Check if `.env` file exists with correct project ID
   - Verify bucket ID matches exactly: `6894f208002ce1ab60b5`
   - Ensure user is authenticated

2. **"Failed to get view/download URL" Error**
   - Check if file exists in storage bucket
   - Verify security rules allow user access
   - Ensure file ID is correctly stored in database

3. **Images Not Displaying**
   - Check if file type is supported for previews
   - Verify image files are properly uploaded
   - Check browser console for CORS errors

4. **Files Not Downloading**
   - Check if download URL is accessible
   - Verify file permissions in Appwrite console
   - Ensure file hasn't been deleted from storage

### Debug Steps

1. **Check Environment Variables**:
   ```javascript
   console.log('Endpoint:', import.meta.env.VITE_APPWRITE_ENDPOINT);
   console.log('Project ID:', import.meta.env.VITE_APPWRITE_PROJECT_ID);
   ```

2. **Check File Upload Response**:
   ```javascript
   const uploadedFile = await uploadFile(file, folder);
   console.log('Upload response:', uploadedFile);
   ```

3. **Check Database Records**:
   - Verify asset records have `fileId` field populated
   - Check if `uploadedBy` matches current user ID

4. **Check Storage Bucket**:
   - Verify files exist in Appwrite console
   - Check file permissions and access rules

## Testing the Implementation

1. **Upload Test**:
   - Try uploading different file types (PDF, images, documents)
   - Verify files appear in Documents page
   - Check that file metadata is stored correctly

2. **View Test**:
   - Click "View" button on uploaded files
   - Verify files open in new browser tab
   - Test with different file types

3. **Download Test**:
   - Click "Download" button on uploaded files
   - Verify files download with correct names
   - Test with different file types

4. **Delete Test**:
   - Delete uploaded files
   - Verify files are removed from both database and storage
   - Check that UI updates correctly

## Support

For technical support:
- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Console](https://cloud.appwrite.io)
- [Appwrite Community](https://appwrite.io/discord)

## Migration Notes

If you have existing documents with the old URL-based system:
- They will continue to work with the fallback mechanisms
- New uploads will use the improved Appwrite storage system
- Consider migrating old documents to the new system for better performance

