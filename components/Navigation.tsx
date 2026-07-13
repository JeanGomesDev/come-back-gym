'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { clearUserData } from '@/lib/firestore';

function IconDumbbell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4M6 12h12"/>
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}

function IconRuler({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h18v10H3z"/>
      <line x1="7" y1="7" x2="7" y2="12"/>
      <line x1="11" y1="7" x2="11" y2="10"/>
      <line x1="15" y1="7" x2="15" y2="10"/>
      <line x1="19" y1="7" x2="19" y2="12"/>
    </svg>
  );
}

function IconScale({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="20" height="12" rx="2"/>
      <path d="M12 8V5"/>
      <circle cx="12" cy="4" r="1"/>
      <path d="M8 14 l2-3 2 2 2-3 2 2"/>
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const NAV_ITEMS = [
    { href: '/', label: t.nav.hoje, Icon: IconDumbbell },
    { href: '/plano', label: t.nav.plano, Icon: IconCalendar },
    { href: '/dashboard', label: t.nav.stats, Icon: IconChart },
    { href: '/medidas', label: t.nav.medidas, Icon: IconRuler },
    { href: '/bioimpedancia', label: t.nav.bio, Icon: IconScale },
  ];

  function closeMenu() { setMenuOpen(false); setConfirmClear(false); }

  async function handleClearData() {
    if (!user) return;
    setClearing(true);
    await clearUserData(user.uid);
    setClearing(false);
    window.location.href = '/onboarding';
  }

  async function handleLogout() { closeMenu(); await logout(); }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800/80 z-40">
        <div className="max-w-2xl mx-auto flex items-stretch h-16">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-150 relative ${
                  active ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-full" />
                )}
                <Icon className={`w-5 h-5 transition-all ${active ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                <span className={`text-[11px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
              </Link>
            );
          })}

          {/* Profile button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors relative"
          >
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full ring-1 ring-zinc-600" />
            ) : (
              <IconUser className="w-5 h-5" />
            )}
            <span className="text-[11px] font-medium leading-none">{user?.displayName?.split(' ')[0] ?? 'Perfil'}</span>
          </button>
        </div>
        {/* Safe area bottom padding */}
        <div className="h-safe-area-inset-bottom" />
      </nav>

      {/* Profile menu sheet */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={closeMenu} />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-200">
            <div className="max-w-2xl mx-auto bg-zinc-900 border-t border-zinc-700/60 rounded-t-3xl overflow-hidden shadow-2xl">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-zinc-700 rounded-full" />
              </div>

              {/* User header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
                {user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full ring-2 ring-zinc-700" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center">
                    <IconUser className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{user?.displayName}</p>
                  <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-3 space-y-1">
                <Link
                  href="/configuracoes"
                  onClick={closeMenu}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
                >
                  <span className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <IconSettings className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium">{t.nav.settings}</span>
                </Link>

                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <IconTrash className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-medium">{t.nav.clearData}</span>
                  </button>
                ) : (
                  <div className="px-4 py-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <p className="text-xs text-red-300 mb-3 leading-relaxed">{t.nav.clearConfirm}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmClear(false)}
                        className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-xs font-medium hover:border-zinc-600 transition-colors"
                      >
                        {t.nav.cancel}
                      </button>
                      <button
                        onClick={handleClearData}
                        disabled={clearing}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-60 transition-colors"
                      >
                        {clearing ? t.nav.clearing : t.nav.confirmDelete}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
                >
                  <span className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <IconLogout className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium">{t.nav.logout}</span>
                </button>
              </div>
              <div className="h-6" />
            </div>
          </div>
        </>
      )}
    </>
  );
}
