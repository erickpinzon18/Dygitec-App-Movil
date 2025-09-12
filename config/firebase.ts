// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDqW9knfv77_znA2gUgVBZDrxrHV2CFSCA",
  authDomain: "dygitec-9d253.firebaseapp.com",
  projectId: "dygitec-9d253",
  storageBucket: "dygitec-9d253.firebasestorage.app",
  messagingSenderId: "575359459387",
  appId: "1:575359459387:web:ecfed6123610e152f6bc1e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth, Firestore, and Storage
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
