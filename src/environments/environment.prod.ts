declare const FIREBASE_API_KEY: string;
declare const FIREBASE_AUTH_DOMAIN: string;
declare const FIREBASE_PROJECT_ID: string;
declare const FIREBASE_STORAGE_BUCKET: string;
declare const FIREBASE_MESSAGING_SENDER_ID: string;
declare const FIREBASE_APP_ID: string;
declare const CLOUDINARY_CLOUD_NAME: string;
declare const CLOUDINARY_UPLOAD_PRESET: string;
declare const CLOUDINARY_FOLDER: string;
declare const CLOUDINARY_FOLDER_PROFILE: string;

export const environment = {
  production: true,
  firebaseConfig: {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
  },
  cloudinaryConfig: {
    cloudName: CLOUDINARY_CLOUD_NAME,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
    folder: CLOUDINARY_FOLDER,
    folderProfile: CLOUDINARY_FOLDER_PROFILE
  }
};

//export const environment = {
//  production: true,
//  firebaseConfig : {
//    apiKey: "XXXXXXXXXXX-XXXXXXXXXXX-E",
//    authDomain: "XXXXXXXXXXX",
//    projectId: "XXXXXXXXXXX",
//    storageBucket: "XXXXXXXXXXX.XXXXXXXXXXX.XXXXXXXXXXX",
//    messagingSenderId: "XXXXXXXXXXX",
//    appId: "XXXXXXXXXXX:XXXXXXXXXXX:XXXXXXXXXXX:XXXXXXXXXXX"
//  }
//};