// src/firebase/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
console.log('Firebase Auth initialized: ', getAuth);

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "tomo-461d4.firebaseapp.com",
  projectId: "tomo-461d4",
  storageBucket: "tomo-461d4",
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

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);

export { app, auth };
  