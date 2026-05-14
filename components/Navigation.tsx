'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { clearUserData } from '@/lib/firestore';

const NAV_ITEMS = [
  { href: '/', label: 'Hoje', icon: '🏋️' },
  { href: '/plano', label: 'Plano', icon: '📅' },
  { href: '/dashboard', label: 'Stats', icon: '📊' },
  { href: '/medidas', label: 'Medidas', icon: '📏' },
  { href: '/bioimpedancia', label: 'Bio', icon: '⚖️' },
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
    setConfirmClear(false);
  }

  async function handleClearData() {
    if (!user) return;
    setClearing(true);
    await clearUserData(user.uid);
    setClearing(false);
    // Full reload so AppShell re-checks profile and redirects to /onboarding
    window.location.href = '/onboarding';
  }

  async function handleLogout() {
    closeMenu();
    await logout();
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 z-40">
        <div className="max-w-2xl mx-auto flex items-stretch h-16">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  active ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="text-[20px] leading-none">{item.icon}</span>
                <span className={`text-[10px] ${active ? 'font-semibold' : ''}`}>{item.label}</span>
              </Link>
            );
          })}

          {/* Profile button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt=""
                className="w-[22px] h-[22px] rounded-full ring-1 ring-zinc-600"
              />
            ) : (
              <span className="text-[20px] leading-none">👤</span>
            )}
            <span className="text-[10px]">{user?.displayName?.split(' ')[0] ?? 'Perfil'}</span>
          </button>
        </div>
      </nav>

      {/* Profile menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={closeMenu}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-200">
            <div className="max-w-2xl mx-auto bg-zinc-900 border-t border-zinc-700 rounded-t-3xl overflow-hidden shadow-2xl">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-zinc-700 rounded-full" />
              </div>

              {/* User info */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
                {user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="" className="w-11 h-11 rounded-full" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-zinc-700 flex items-center justify-center text-xl">
                    👤
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{user?.displayName}</p>
                  <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Menu options */}
              <div className="p-3 space-y-1">
                <Link
                  href="/configuracoes"
                  onClick={closeMenu}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
                >
                  <span className="text-xl w-6 text-center">⚙️</span>
                  <span className="text-sm font-medium">Configurações</span>
                </Link>

                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
                  >
                    <span className="text-xl w-6 text-center">🗑️</span>
                    <span className="text-sm font-medium">Limpar meus dados</span>
                  </button>
                ) : (
                  <div className="px-4 py-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <p className="text-xs text-red-300 mb-3 leading-relaxed">
                      Isso vai apagar <strong>todos</strong> os seus treinos, medidas, peso e histórico. Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmClear(false)}
                        className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-xs font-medium hover:border-zinc-600 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleClearData}
                        disabled={clearing}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-60 transition-colors"
                      >
                        {clearing ? 'Limpando...' : 'Sim, apagar tudo'}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
                >
                  <span className="text-xl w-6 text-center">🚪</span>
                  <span className="text-sm font-medium">Sair</span>
                </button>
              </div>

              {/* Safe area bottom */}
              <div className="h-6" />
            </div>
          </div>
        </>
      )}
    </>
  );
}
