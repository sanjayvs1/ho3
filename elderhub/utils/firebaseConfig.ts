// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth"; // Auth
import { getFirestore } from "firebase/firestore"; // Firestore

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPQ56m7iA7Mq2hRQKGXCq1Y2iX0fmw0d8",
  authDomain: "squirrel-ip-e8008.firebaseapp.com",
  projectId: "squirrel-ip-e8008",
  storageBucket: "squirrel-ip-e8008.appspot.com",
  messagingSenderId: "531998153352",
  appId: "1:531998153352:web:7c3822f9e9c49b44f75d3d",
  measurementId: "G-VCRDE8KVNY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
