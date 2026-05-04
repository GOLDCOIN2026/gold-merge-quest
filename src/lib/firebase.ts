import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7e9auqCvXawBsdj9iTiFlBiTKPNgWh_Y",
  authDomain: "gold-coin-2026.firebaseapp.com",
  databaseURL: "https://gold-coin-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gold-coin-2026",
  storageBucket: "gold-coin-2026.firebasestorage.app",
  messagingSenderId: "523822015728",
  appId: "1:523822015728:web:8340f1c86a7781dc904e35",
  measurementId: "G-78WY8Y6FQP",
};

export const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics is browser-only and requires measurementId support — guard it.
if (typeof window !== "undefined") {
  analyticsSupported()
    .then(ok => { if (ok) getAnalytics(app); })
    .catch(() => { /* analytics unavailable — ignore */ });
}
