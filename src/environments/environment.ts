declare const FIREBASE_API_KEY: string;
declare const FIREBASE_AUTH_DOMAIN: string;
declare const FIREBASE_PROJECT_ID: string;
declare const FIREBASE_STORAGE_BUCKET: string;
declare const FIREBASE_MESSAGING_SENDER_ID: string;
declare const FIREBASE_APP_ID: string;

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
  }
};
