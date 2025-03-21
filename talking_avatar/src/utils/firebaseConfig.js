// firebase.js (or your config file name)

// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Added for Authentication
import { getFirestore, collection } from "firebase/firestore"; // Added for Firestore

// Your web app's Firebase configuration
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

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app); // Initialize Authentication
const db = getFirestore(app); // Initialize Firestore

// Reference to the "users" collection
const users = collection(db, "users");

// Export the initialized services and collection
export { auth, users, analytics, db }; // Added auth and users; db is optional