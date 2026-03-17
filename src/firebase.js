import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  deleteUser,
  updateEmail,
  browserSessionPersistence,
  setPersistence
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from '../firebase-config.js';

// Fail-safe: Check if the config is valid
if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('FIREBASE_API_KEY')) {
  console.error("🔥 Error: Firebase Configuration is missing or invalid! Ensure environment variables are set correctly.");
  // Add a helpful visual indicator if possible, but at least prevent the loop
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Security: Use session persistence (session cleared when browser/tab closes)
setPersistence(auth, browserSessionPersistence).catch(err => console.warn('Persistence warning:', err));

export {
  auth, db,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, deleteUser, updateEmail,
  collection, addDoc, getDocs, getDoc, query, where, updateDoc, deleteDoc, doc
};
