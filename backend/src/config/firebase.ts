import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for required environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_STORAGE_BUCKET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  throw new Error('Missing required Firebase configuration environment variables');
}

let app: admin.app.App;
let auth: admin.auth.Auth;
let db: admin.firestore.Firestore;
let storage: admin.storage.Storage;

// Initialize Firebase Admin with service account credentials
try {
  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });

  // Initialize services
  auth = admin.auth();
  db = admin.firestore();
  storage = admin.storage();

  // Log the configuration (without sensitive values)
  console.log('Firebase Admin Configuration:', {
    projectId: app.options.projectId,
    storageBucket: app.options.storageBucket,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL
  });

  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  throw error;
}

export { auth, db, storage }; 