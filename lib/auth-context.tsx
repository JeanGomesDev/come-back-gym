'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User, onAuthStateChanged, signInWithRedirect,
  getRedirectResult, signOut,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Keep loading=true until BOTH redirect result and auth state are resolved.
    // This prevents AppShell from redirecting to /login before the redirect
    // result from Google is processed (which happens on the return trip).
    let redirectDone = false;
    let authDone = false;

    function tryFinish() {
      if (redirectDone && authDone) setLoading(false);
    }

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) setUser(result.user);
      })
      .catch(() => {})
      .finally(() => {
        redirectDone = true;
        tryFinish();
      });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      authDone = true;
      tryFinish();
    });

    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    await signInWithRedirect(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
