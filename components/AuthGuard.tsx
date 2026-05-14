'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginPage) {
      router.replace('/login');
    }
    if (user && isLoginPage) {
      router.replace('/');
    }
  }, [user, loading, isLoginPage, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // On login page: show it (login page handles its own layout)
  if (isLoginPage) return <>{children}</>;

  // Protected pages: only render if logged in
  if (!user) return null;

  return <>{children}</>;
}
