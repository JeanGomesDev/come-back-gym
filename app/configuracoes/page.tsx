'use client';

import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { updateUserProfile } from '@/lib/firestore';
import { Lang } from '@/lib/translations';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { lang, setLang, t } = useLanguage();

  async function handleLangChange(l: Lang) {
    setLang(l);
    if (user) await updateUserProfile(user.uid, { language: l });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100 mb-1">{t.configuracoes.title}</h1>
      <p className="text-zinc-500 text-sm mb-6"> </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-zinc-300 mb-1">{t.configuracoes.language.title}</h2>
        <p className="text-xs text-zinc-500 mb-4">{t.configuracoes.language.subtitle}</p>
        <div className="space-y-2">
          {([['pt', '🇧🇷', 'Português'], ['en', '🇺🇸', 'English']] as [Lang, string, string][]).map(([l, flag, name]) => (
            <button
              key={l}
              onClick={() => handleLangChange(l)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                lang === l
                  ? 'bg-emerald-500/15 border-emerald-500'
                  : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <span className="text-2xl">{flag}</span>
              <span className={`text-sm font-semibold ${lang === l ? 'text-emerald-400' : 'text-zinc-300'}`}>{name}</span>
              {lang === l && <span className="ml-auto text-emerald-400 text-sm">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
