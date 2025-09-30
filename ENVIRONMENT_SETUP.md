# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

### Firebase Configuration
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

### Appwrite Configuration
```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_appwrite_project_id_here
```

## How to Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click "Add app" and select Web
6. Copy the configuration values to your `.env` file

## How to Get Appwrite Configuration

1. Go to [Appwrite Console](https://cloud.appwrite.io/)
2. Create a new project or select existing one
3. Go to Settings > General
4. Copy the Project ID and Endpoint URL

## Demo Mode

If you don't have Firebase/Appwrite configured, the app will run in demo mode with placeholder values. However, you won't be able to:
- Authenticate users
- Store data in the database
- Upload files

## Quick Start

1. Copy the example above to create your `.env` file
2. Replace the placeholder values with your actual configuration
3. Restart the development server: `npm run dev`
4. The app should now load properly

## Troubleshooting

If you're still seeing a blank screen:
1. Check the browser console for errors
2. Verify your environment variables are correct
3. Make sure Firebase project is properly configured
4. Check that all required collections exist in Firestore
