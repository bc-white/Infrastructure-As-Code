// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA2wUp_yPc8VM_IyYUOwIQCkjHzKamUCQU",
  authDomain: "mocksurvey365.firebaseapp.com",
  projectId: "mocksurvey365",
  storageBucket: "mocksurvey365.firebasestorage.app",
  messagingSenderId: "45895243240",
  appId: "1:45895243240:web:4b7422b296c61f4d6f405d",
  measurementId: "G-GNFMD4NCWS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    // Analytics initialization failed
  }
}

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    // Messaging initialization failed
  }
}

export { app, analytics, messaging, getToken, onMessage };

