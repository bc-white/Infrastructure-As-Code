import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  initializeFCM, 
  setupForegroundMessageHandler, 
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission 
} from '../utils/firebaseMessaging';
import { useAuth } from './AuthContext';

// Notification action types
const NOTIFICATION_ACTIONS = {
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  SET_PERMISSION: 'SET_PERMISSION',
  SET_TOKEN: 'SET_TOKEN',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  permission: 'default',
  fcmToken: null,
  isSupported: false,
  isLoading: false,
  error: null
};

// Notification reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.read).length
      };
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      const newNotification = {
        ...action.payload,
        id: action.payload.id || Date.now().toString(),
        timestamp: action.payload.timestamp || new Date().toISOString(),
        read: false
      };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      };
    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      const notification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: notification && !notification.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    case NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };
    case NOTIFICATION_ACTIONS.SET_PERMISSION:
      return {
        ...state,
        permission: action.payload
      };
    case NOTIFICATION_ACTIONS.SET_TOKEN:
      return {
        ...state,
        fcmToken: action.payload
      };
    case NOTIFICATION_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case NOTIFICATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
};

// Notification context
const NotificationContext = createContext();

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer(notificationReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // Check if notifications are supported
  useEffect(() => {
    const supported = isNotificationSupported();
    if (supported) {
      const permission = getNotificationPermission();
      dispatch({ type: NOTIFICATION_ACTIONS.SET_PERMISSION, payload: permission });
    }
  }, []);

  // Initialize FCM when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && isNotificationSupported()) {
      initializeNotifications();
    }
  }, [isAuthenticated, user]);

  // Initialize notifications
  const initializeNotifications = async () => {
    try {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: null });

      // Check permission first
      let permission = getNotificationPermission();
      
      if (permission === 'default') {
        permission = await requestNotificationPermission();
        dispatch({ type: NOTIFICATION_ACTIONS.SET_PERMISSION, payload: permission });
      }

      if (permission === 'granted') {
        // Initialize FCM and get token
        const token = await initializeFCM();
        
        if (token) {
          dispatch({ type: NOTIFICATION_ACTIONS.SET_TOKEN, payload: token });
        }

        // Set up foreground message handler
        setupForegroundMessageHandler(handleForegroundMessage);
      }
    } catch (error) {
     
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Handle foreground messages
  const handleForegroundMessage = useCallback((payload) => {
    const notification = {
      id: payload.messageId || Date.now().toString(),
      title: payload.notification?.title || payload.data?.title || 'New Notification',
      body: payload.notification?.body || payload.data?.body || 'You have a new message',
      icon: payload.notification?.icon || payload.data?.icon,
      data: payload.data || {},
      timestamp: new Date().toISOString(),
      read: false
    };

    dispatch({ type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION, payload: notification });
  }, []);

  // Request notification permission
  const requestPermission = async () => {
    try {
      const permission = await requestNotificationPermission();
      dispatch({ type: NOTIFICATION_ACTIONS.SET_PERMISSION, payload: permission });
      
      if (permission === 'granted') {
        await initializeNotifications();
      }
      
      return permission;
    } catch (error) {
     
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: error.message });
      return 'denied';
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    dispatch({ type: NOTIFICATION_ACTIONS.MARK_AS_READ, payload: notificationId });
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    dispatch({ type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ });
  };

  // Remove notification
  const removeNotification = (notificationId) => {
    dispatch({ type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION, payload: notificationId });
  };

  // Clear all notifications
  const clearNotifications = () => {
    dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS });
  };

  // Add notification manually (for testing or other sources)
  const addNotification = (notification) => {
    dispatch({ type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION, payload: notification });
  };

  const value = {
    ...state,
    requestPermission,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    addNotification,
    initializeNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

