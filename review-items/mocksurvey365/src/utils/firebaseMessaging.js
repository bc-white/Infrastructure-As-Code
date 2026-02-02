import { messaging, getToken, onMessage } from '../lib/firebase';
import { notificationAPI } from '../service/api';

// VAPID key - Get this from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
// Add it to your .env file as VITE_FIREBASE_VAPID_KEY
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || null;

/**
 * Request notification permission from the user
 * @returns {Promise<NotificationPermission>}
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
   
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
  
    return 'denied';
  }
};

/**
 * Get FCM token for the current device
 * @returns {Promise<string|null>}
 */
export const getFCMToken = async () => {
  if (!messaging) {
    
    return null;
  }

  try {
    // Request notification permission first
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
    
      return null;
    }

    // Get registration token
    if (!VAPID_KEY) {
    
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
    });

    if (token) {
    
      // Store token in localStorage for persistence
      localStorage.setItem('fcm_token', token);
      return token;
    } else {
     
      return null;
    }
  } catch (error) {
    
    return null;
  }
};

/**
 * Register FCM token with backend
 * @param {string} token - FCM token
 * @returns {Promise<boolean>}
 * 
 * Sends FCM token to backend endpoint: POST /api/v1/user/fcmtoken
 * Backend should accept: { fcmtoken: string }
 * Backend should return: { statusCode: 200, success: true } or { status: true }
 */
export const registerFCMToken = async (token) => {
  if (!token) {
    return false;
  }

  try {
    const response = await notificationAPI.updateFcmToken(token);
    
    // Handle various response formats from backend
    const isSuccess = 
      response.statusCode === 200 || 
      response.status === 200 ||
      response.success === true ||
      response.status === true;
    
    if (isSuccess) {
     
      localStorage.setItem('fcm_token_registered', 'true');
      return true;
    } else {
   
      // Still return true if we got a response (backend might use different format)
      // Backend team can adjust response format as needed
      return false;
    }
  } catch (error) {
   
    // Log the error but don't break the app
    // Token is still stored locally and can be retried
    return false;
  }
};

/**
 * Initialize FCM and register token
 * @returns {Promise<string|null>}
 */
export const initializeFCM = async () => {
  try {
    // Check if token already exists and is registered
    const existingToken = localStorage.getItem('fcm_token');
    const isRegistered = localStorage.getItem('fcm_token_registered') === 'true';

    if (existingToken && isRegistered) {
   
      return existingToken;
    }

    // Get new token
    const token = await getFCMToken();
    
    if (token) {
      // Register token with backend
      await registerFCMToken(token);
      return token;
    }

    return null;
  } catch (error) {

    return null;
  }
};

/**
 * Set up foreground message handler
 * @param {Function} callback - Callback function to handle messages
 */
export const setupForegroundMessageHandler = (callback) => {
  if (!messaging) {

    return;
  }

  try {
    onMessage(messaging, (payload) => {
   
      
      if (callback) {
        callback(payload);
      }

      // Show notification if permission is granted
      if (Notification.permission === 'granted') {
        const notificationTitle = payload.notification?.title || 'New Notification';
        const notificationOptions = {
          body: payload.notification?.body || payload.data?.body || 'You have a new message',
          icon: payload.notification?.icon || '/favicon-96x96.png',
          badge: '/favicon-96x96.png',
          tag: payload.data?.tag || 'notification',
          data: payload.data || {},
          requireInteraction: payload.data?.requireInteraction === 'true',
        };

        new Notification(notificationTitle, notificationOptions);
      }
    });
  } catch (error) {
    // Log error but don't break app
  }
};

/**
 * Check if notifications are supported
 * @returns {boolean}
 */
export const isNotificationSupported = () => {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
};

/**
 * Get current notification permission status
 * @returns {NotificationPermission}
 */
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

