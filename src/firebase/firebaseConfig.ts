// src/firebase/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
console.log('Firebase Auth initialized: ', getAuth);

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Log the configuration (without sensitive values)
console.log('Firebase Configuration:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  hasApiKey: !!firebaseConfig.apiKey,
});

console.log('Initializing Firebase App...');
const app = initializeApp(firebaseConfig);
console.log('Firebase App initialized:', app);

console.log('Initializing Firebase Auth...');
const auth = getAuth(app);
console.log('Firebase Auth initialized:', auth);

export { app, auth };
  