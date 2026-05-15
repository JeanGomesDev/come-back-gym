'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import Navigation from './Navigation';
import { getUserProfile } from '@/lib/firestore';

type ProfileCache = { uid: string; needsOnboarding: boolean };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { setLang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const profileCache = useRef<ProfileCache | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  const isLoginPage = pathname === '/login';
  const isOnboardingPage = pathname === '/onboarding';

  useEffect(() => {
    if (loading) return;

    if (!user) {
      profileCache.current = null;
      setProfileReady(false);
      if (!isLoginPage) router.replace('/login');
      return;
    }

    const cached = profileCache.current;

    if (cached?.uid === user.uid && !cached.needsOnboarding) {
      setProfileReady(true);
      if (isLoginPage) router.replace('/');
      return;
    }

    getUserProfile(user.uid).then((profile) => {
      if (profile.language) setLang(profile.language);
      const needsOnboarding = !profile.onboardingCompleted && profile.goalWorkouts === 0;
      profileCache.current = { uid: user.uid, needsOnboarding };
      setProfileReady(true);

      if (needsOnboarding && !isOnboardingPage) {
        router.replace('/onboarding');
      } else if (isLoginPage) {
        router.replace(needsOnboarding ? '/onboarding' : '/');
      }
    });
  }, [user, loading, isLoginPage, isOnboardingPage, router, setLang]);

  if (loading || (user && !profileReady && !isLoginPage)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoginPage || isOnboardingPage) {
    return <>{children}</>;
  }

  if (!user) return null;

  return (
    <>
      <main className="flex-1 pb-20 max-w-2xl mx-auto w-full px-4 pt-6">
        {children}
      </main>
      <Navigation />
    </>
  );
}
