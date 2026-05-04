import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User as FbUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  referralCode: string;
  TTokens: number;
  xp: number;
  level: number;
  createdAt: number;
}

interface AuthCtx {
  user: FbUser | null;
  profile: UserProfile | null;
  loading: boolean;
  register: (email: string, username: string, password: string, referralCode?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function genReferralCode(username: string) {
  return (
    username.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase() +
    Math.random().toString(36).slice(2, 6).toUpperCase()
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FbUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(u: FbUser) {
    try {
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.warn("profile load failed", e);
      setProfile(null);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await loadProfile(u);
      else setProfile(null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function register(email: string, username: string, password: string, referralCode?: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: username });
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      username,
      email,
      referralCode: genReferralCode(username),
      TTokens: 0,
      xp: 0,
      level: 1,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, "users", cred.user.uid), {
      ...newProfile,
      referredBy: referralCode || null,
      createdAt: serverTimestamp(),
    });
    setProfile(newProfile);
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    await fbSignOut(auth);
  }

  async function refreshProfile() {
    if (user) await loadProfile(user);
  }

  return (
    <Ctx.Provider value={{ user, profile, loading, register, login, signOut, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
