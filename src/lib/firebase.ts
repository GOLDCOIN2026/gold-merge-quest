import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Firebase web config — these are publishable keys, safe in the codebase.
 * Replace each value with your project's web app config (Firebase Console →
 * Project settings → Your apps → Web). Reuse the same project as your main app.
 *
 * If left as the placeholder strings, Firebase calls are skipped gracefully
 * so the game still works locally without Firebase.
 */
export const firebaseConfig = {
  apiKey: "REPLACE_ME_API_KEY",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith("REPLACE_ME");

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

export function fbApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (_app) return _app;
  _app = getApps()[0] ?? initializeApp(firebaseConfig);
  return _app;
}

export function fbAuth(): Auth | null {
  if (!isFirebaseConfigured) return null;
  if (_auth) return _auth;
  const app = fbApp();
  if (!app) return null;
  _auth = getAuth(app);
  return _auth;
}

export function fbDb(): Firestore | null {
  if (!isFirebaseConfigured) return null;
  if (_db) return _db;
  const app = fbApp();
  if (!app) return null;
  _db = getFirestore(app);
  return _db;
}
