import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import axios from 'axios';

// Firebase Client Configuration
const firebaseConfig = {
  apiKey: "AIzaSyFakeKey_ForSmartCityPortalDemo2026",
  authDomain: "smartcity-fcm-project.firebaseapp.com",
  projectId: "smartcity-fcm-project",
  storageBucket: "smartcity-fcm-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f6g7"
};

let messaging: any = null;

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  // Check if messaging is supported in current environment
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (err) {
  console.warn('[Firebase Client] Initialization bypassed or unsupported in this browser context.');
}

/**
 * Request permission and fetch FCM token to register in backend database
 * @param {number} userId - ID of authenticated user
 * @param {string} jwtToken - Current JWT token for authorization header
 */
export const requestNotificationPermission = async (userId: number, jwtToken: string) => {
  if (!messaging) {
    console.log('[FCM Client] Operating in Sandbox Simulation Mode. Registering virtual token...');
    // Simulated token registration in our db
    try {
      const mockToken = `FCM-WEB-TOKEN-SIMULATOR-${userId}-${Math.random().toString(36).substring(2)}`;
      await axios.post('http://localhost:5000/api/notifications/register-device', 
        { token: mockToken, platform: 'web' },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      return mockToken;
    } catch (e) {
      console.warn('Sandbox token registration skipped (Backend not running).');
      return null;
    }
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[FCM Client] Push permissions granted.');
      
      // Fetch FCM Registration Token (Vapid key required)
      const token = await getToken(messaging, { 
        vapidKey: 'BM_FakeVapidKeyForCitizenServicePortalEvaluation' 
      });

      if (token) {
        console.log('[FCM Client] Generated Token:', token);
        
        // POST to backend database
        await axios.post('http://localhost:5000/api/notifications/register-device', 
          { token, platform: 'web' },
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );
        
        return token;
      }
    } else {
      console.warn('[FCM Client] Notification permissions denied.');
    }
  } catch (err: any) {
    console.error('[FCM Client Error] Permission request failed:', err.message);
  }
  return null;
};

/**
 * Set up real-time onMessage event listener
 * @param {function} callback - Function to trigger when push arrives
 */
export const listenForMessages = (callback: (payload: any) => void) => {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    console.log('[FCM Client] Foreground message received:', payload);
    callback(payload);
  });
};
