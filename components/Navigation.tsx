'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Hoje', icon: '🏋️' },
  { href: '/plano', label: 'Plano', icon: '📅' },
  { href: '/dashboard', label: 'Stats', icon: '📊' },
  { href: '/medidas', label: 'Medidas', icon: '📏' },
  { href: '/bioimpedancia', label: 'Bio', icon: '⚖️' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50">
      <div className="max-w-2xl mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                active ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className={active ? 'font-semibold' : ''}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
