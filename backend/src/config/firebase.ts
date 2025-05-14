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
const initializeFirebase = async () => {
  try {
    console.log('=== Firebase Configuration ===');
    console.log('Environment Variables:');
    console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('FIREBASE_STORAGE_BUCKET:', process.env.FIREBASE_STORAGE_BUCKET);
    console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY?.length);
    console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);

    // Ensure projectId is set
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('FIREBASE_PROJECT_ID is required but not set');
    }

    // Log the first few characters of the private key (safely)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      console.log('Private Key starts with:', privateKey.substring(0, 20) + '...');
      console.log('Private Key contains newlines:', privateKey.includes('\\n'));
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    // Remove .appspot.com from the bucket name if it exists
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET?.replace('.appspot.com', '');

    console.log('\nInitializing Firebase Admin with:');
    console.log('- Project ID:', projectId);
    console.log('- Storage Bucket:', storageBucket);
    console.log('- Has Private Key:', !!privateKey);
    console.log('- Has Client Email:', !!process.env.FIREBASE_CLIENT_EMAIL);

    const credential = admin.credential.cert({
      projectId,
      privateKey: privateKey?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    });

    // Initialize Firebase Admin
    app = admin.initializeApp({
      projectId,
      credential,
      storageBucket
    });

    // Initialize services
    auth = admin.auth();
    db = admin.firestore();
    storage = admin.storage();

    // Test storage bucket access
    console.log('\n=== Testing Storage Bucket ===');
    const bucket = storage.bucket();
    console.log('Bucket name:', bucket.name);
    console.log('Bucket exists:', !!bucket);
    
    // Log the configuration (without sensitive values)
    console.log('\nFirebase Admin Configuration:', {
      projectId: app.options.projectId,
      storageBucket: app.options.storageBucket,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL
    });

    // Try to get the bucket metadata and create if it doesn't exist
    const checkBucketMetadata = async () => {
      try {
        console.log('\nFetching bucket metadata...');
        const [metadata] = await bucket.getMetadata();
        console.log('Bucket metadata:', {
          name: metadata.name,
          location: metadata.location,
          storageClass: metadata.storageClass
        });
      } catch (error: any) {
        if (error.code === 404) {
          console.log('Bucket does not exist, attempting to create...');
          try {
            // Create the bucket
            await bucket.create({
              location: 'US',
              storageClass: 'STANDARD'
            });
            console.log('Bucket created successfully');

            // Wait a moment for the bucket to be ready
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify the bucket exists
            const [exists] = await bucket.exists();
            if (!exists) {
              throw new Error('Bucket creation verification failed');
            }
            console.log('Bucket verified and ready to use');
          } catch (createError) {
            console.error('Error creating bucket:', createError);
            throw createError;
          }
        } else {
          console.error('Error fetching bucket metadata:', error);
          throw error;
        }
      }
    };

    // Run the metadata check and wait for it to complete
    await checkBucketMetadata().catch(console.error);

    console.log('\nFirebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('=== Error in Firebase Initialization ===');
    console.error('Error Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error Message:', error instanceof Error ? error.message : error);
    if (error instanceof Error) {
      console.error('Error Stack:', error.stack);
    }
    throw error;
  }
};

// Initialize Firebase
initializeFirebase().catch(console.error);

export { auth, db, storage }; 