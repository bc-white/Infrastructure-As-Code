import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import useSurveyStore from './stores/useSurveyStore'
import surveySyncService from './utils/surveySyncService'
import { toast } from 'sonner'
import { Auth0Provider } from '@auth0/auth0-react'

// Initialize sync service and IndexedDB
surveySyncService.init().catch((error) => {
  // Handle initialization errors
});

// Check initial online/offline status and set up listeners
const checkOnlineStatus = () => {
  const isOnline = navigator.onLine;
  
  // Update Zustand store with current status
  useSurveyStore.getState().setIsOffline(!isOnline);
  
  // Initialize sync service if online
  if (isOnline) {
    surveySyncService.startPeriodicSync();
  } else {
    surveySyncService.stopPeriodicSync();
    // Show offline notification (only on initial load if offline)
    // Don't show if user just went offline (handled by event listener)
    setTimeout(() => {
      toast.warning('Connection lost - You are offline', {
        description: 'Your data will be saved locally and automatically synced when connection is restored. Check your internet connection.',
        duration: Infinity, // Keep visible until user dismisses or goes online
        position: 'top-center',
        action: {
          label: 'Reload Page',
          onClick: () => {
            window.location.reload();
          },
        },
        cancel: {
          label: 'Dismiss',
          onClick: () => {
            // Toast will be dismissed automatically
          },
        },
      });
    }, 1000); // Delay to avoid showing immediately on page load
  }
};

// Set up online/offline event listeners (complement sync service's internal listeners)
// These update the Zustand store and show user notifications
window.addEventListener('online', () => {
  useSurveyStore.getState().setIsOffline(false);
  
  // Dismiss any offline toasts
  toast.dismiss();
  
  // Show online notification with action
  const onlineToastId = toast.success('Connection restored', {
    description: 'Syncing your offline data with the server. This may take a moment.',
    duration: 8000, // Show for 8 seconds to give user time to see it
    position: 'top-center',
    action: {
      label: 'Reload Page',
      onClick: () => {
        window.location.reload();
      },
    },
  });
  
  // Trigger immediate sync attempt after a short delay to allow socket to reconnect
  setTimeout(() => {
    surveySyncService.syncUnsyncedData()
      .then(() => {
        // Update toast to show sync completed
        toast.dismiss(onlineToastId);
        toast.success('Sync completed', {
          description: 'All offline data has been successfully synced.',
          duration: 4000,
          position: 'top-center',
        });
      })
      .catch((error) => {
       
        // Update toast to show sync failed
        toast.dismiss(onlineToastId);
        toast.error('Sync failed', {
          description: `Some data could not be synced: ${error.message || 'Unknown error'}. It will be retried automatically.`,
          duration: 6000,
          position: 'top-center',
          action: {
            label: 'Retry Now',
            onClick: () => {
              surveySyncService.syncUnsyncedData().catch((err) => {
                // Ignore further errors here; user can retry again
              });
            },
          },
        });
      });
  }, 2000); // Increased delay to 2 seconds to allow socket reconnection
});

window.addEventListener('offline', () => {
  useSurveyStore.getState().setIsOffline(true);
  
  // Dismiss any online toasts
  toast.dismiss();
  
  // Show offline notification with action - keep visible until user goes online
  toast.warning('Connection lost - You are offline', {
    description: 'Your data will be saved locally and automatically synced when connection is restored. Check your internet connection.',
    duration: Infinity, // Keep visible until user dismisses or goes online
    position: 'top-center',
    action: {
      label: 'Reload Page',
      onClick: () => {
        window.location.reload();
      },
    },
    cancel: {
      label: 'Dismiss',
      onClick: () => {
        // Toast will be dismissed automatically
      },
    },
  });
});

// Check status on app initialization
checkOnlineStatus();

// Register service worker for Firebase Cloud Messaging
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
      
      })
      .catch((error) => {
        
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/login`,
        scope: 'openid profile email',
         audience: import.meta.env.VITE_AUTH0_AUDIENCE
      }}
     
      cacheLocation="localstorage"
    >
      <App />
    </Auth0Provider>
  </StrictMode>
)
