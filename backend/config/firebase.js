const admin = require('firebase-admin');
require('dotenv').config();

let messaging = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  
  // Replace escape characters in private key to support single-line .env inputs
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
    messaging = admin.messaging();
    console.log('[Firebase Admin] Initialize success. Registered with Firebase Project:', projectId);
  } else {
    console.warn('[Firebase Admin WARNING] Credentials missing in .env. FCM will operate in Simulated Mode.');
  }
} catch (err) {
  console.error('[Firebase Admin ERROR] Initialization failed:', err.message);
}

/**
 * Send FCM Push Notification to a single device token
 * @param {string} token - FCM Registration Token
 * @param {string} title - Title of push
 * @param {string} body - Body content
 * @param {object} [extraData] - Optional key-value pairs
 */
const sendSinglePush = async (token, title, body, extraData = {}) => {
  if (!token) return;

  const payload = {
    token: token,
    notification: { title, body },
    data: extraData,
    android: { priority: 'high' },
    apns: { payload: { aps: { contentAvailable: true } } }
  };

  if (messaging) {
    try {
      const response = await messaging.send(payload);
      console.log('[FCM Success] Sent push to token:', response);
      return response;
    } catch (err) {
      console.error('[FCM Error] Single push failed:', err.message);
      throw err;
    }
  } else {
    console.log(`[FCM Simulator] Token: ${token.substring(0, 12)}... | Title: "${title}" | Body: "${body}"`);
    return { simulated: true, token };
  }
};

/**
 * Send FCM Push Notification to multiple device tokens (multicast)
 * @param {string[]} tokens - Array of FCM registration tokens
 * @param {string} title - Title of push
 * @param {string} body - Body content
 * @param {object} [extraData] - Optional metadata
 */
const sendMulticastPush = async (tokens, title, body, extraData = {}) => {
  if (!tokens || tokens.length === 0) return;

  const payload = {
    tokens: tokens,
    notification: { title, body },
    data: extraData
  };

  if (messaging) {
    try {
      const response = await messaging.sendEachForMulticast(payload);
      console.log(`[FCM Multicast Success] Dispatched. Successes: ${response.successCount}, Failures: ${response.failureCount}`);
      return response;
    } catch (err) {
      console.error('[FCM Multicast Error] Multicast failed:', err.message);
      throw err;
    }
  } else {
    console.log(`[FCM Multicast Simulator] Count: ${tokens.length} devices | Title: "${title}" | Body: "${body}"`);
    return { simulated: true, count: tokens.length };
  }
};

module.exports = {
  sendSinglePush,
  sendMulticastPush
};
