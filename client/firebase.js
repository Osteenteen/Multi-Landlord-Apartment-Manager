import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Paste your actual configuration object here
export const firebaseConfig = {
  apiKey: "AIzaSyBFWjiE5_0sMJulvV-56fElTXpNFH9YMvE",
  authDomain: "multi-landlord-apartment.firebaseapp.com",
  projectId: "multi-landlord-apartment",
  storageBucket: "multi-landlord-apartment.firebasestorage.app",
  messagingSenderId: "1068018299163",
  appId: "1:1068018299163:web:15c9c1ddf8c32b711c63be",
  measurementId: "G-R1WKR95Q3N"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export them to use across your login/dashboard pages
export { db, auth };
