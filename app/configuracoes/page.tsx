'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import {
  updateUserProfile,
  resetUserPlan,
  resetGoals,
  resetMeasurements,
  resetBioimpedancia,
  resetWeightHistory,
  resetWorkoutSessions,
} from '@/lib/firestore';
import { Lang } from '@/lib/translations';

type ResetKey = 'plan' | 'goals' | 'sessions' | 'weight' | 'medidas' | 'bio';

const RESET_ITEMS: {
  key: ResetKey;
  icon: string;
  title: string;
  subtitle: string;
  warning: string;
  titleEn: string;
  subtitleEn: string;
  warningEn: string;
}[] = [
  {
    key: 'plan',
    icon: '🏋️',
    title: 'Treinos e exercícios',
    subtitle: 'Remove todos os exercícios e dias configurados',
    warning: 'Seu histórico de treinos realizados não será apagado.',
    titleEn: 'Workouts & exercises',
    subtitleEn: 'Removes all configured exercises and training days',
    warningEn: 'Your completed workout history will not be affected.',
  },
  {
    key: 'goals',
    icon: '🎯',
    title: 'Metas',
    subtitle: 'Redefine peso meta, frequência e data final',
    warning: 'Dados de treinos, medidas e histórico não serão afetados.',
    titleEn: 'Goals',
    subtitleEn: 'Resets goal weight, frequency and end date',
    warningEn: 'Workout data, measurements and history will not be affected.',
  },
  {
    key: 'sessions',
    icon: '📅',
    title: 'Histórico de treinos',
    subtitle: 'Apaga todos os treinos realizados registrados',
    warning: 'Seu plano de treino e medidas não serão afetados.',
    titleEn: 'Workout history',
    subtitleEn: 'Deletes all logged workout sessions',
    warningEn: 'Your workout plan and measurements will not be affected.',
  },
  {
    key: 'weight',
    icon: '⚖️',
    title: 'Histórico de peso',
    subtitle: 'Apaga todos os registros de peso corporal',
    warning: 'Treinos, medidas e bio não serão afetados.',
    titleEn: 'Weight history',
    subtitleEn: 'Deletes all body weight entries',
    warningEn: 'Workouts, measurements and bio will not be affected.',
  },
  {
    key: 'medidas',
    icon: '📏',
    title: 'Medidas corporais',
    subtitle: 'Apaga todos os registros de medidas (ombro, peito, etc.)',
    warning: 'Treinos, peso e bio não serão afetados.',
    titleEn: 'Body measurements',
    subtitleEn: 'Deletes all body measurement records',
    warningEn: 'Workouts, weight and bio will not be affected.',
  },
  {
    key: 'bio',
    icon: '🔬',
    title: 'Bioimpedância',
    subtitle: 'Apaga todos os registros de bioimpedância',
    warning: 'Treinos, peso e medidas não serão afetados.',
    titleEn: 'Bioimpedance',
    subtitleEn: 'Deletes all bioimpedance records',
    warningEn: 'Workouts, weight and measurements will not be affected.',
  },
];

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [confirming, setConfirming] = useState<ResetKey | null>(null);
  const [loading, setLoading] = useState<ResetKey | null>(null);
  const [done, setDone] = useState<ResetKey | null>(null);

  async function handleLangChange(l: Lang) {
    setLang(l);
    if (user) await updateUserProfile(user.uid, { language: l });
  }

  async function handleReset(key: ResetKey) {
    if (!user) return;
    setLoading(key);
    const fn = {
      plan: resetUserPlan,
      goals: resetGoals,
      sessions: resetWorkoutSessions,
      weight: resetWeightHistory,
      medidas: resetMeasurements,
      bio: resetBioimpedancia,
    }[key];
    await fn(user.uid);
    setLoading(null);
    setConfirming(null);
    setDone(key);
    setTimeout(() => setDone(null), 3000);
  }

  const isPt = lang === 'pt';

  return (
    <div className="pb-6">
      <h1 className="text-2xl font-bold text-zinc-100 mb-1">{t.configuracoes.title}</h1>
      <p className="text-zinc-500 text-sm mb-6">Gerencie idioma e dados do app</p>

      {/* Language */}
      <section className="mb-5">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">
          {t.configuracoes.language.title}
        </h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {([['pt', '🇧🇷', 'Português'], ['en', '🇺🇸', 'English']] as [Lang, string, string][]).map(([l, flag, name], i, arr) => (
            <button
              key={l}
              onClick={() => handleLangChange(l)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 transition-colors ${
                i < arr.length - 1 ? 'border-b border-zinc-800' : ''
              } ${lang === l ? 'bg-emerald-500/8' : 'hover:bg-zinc-800'}`}
            >
              <span className="text-xl">{flag}</span>
              <span className={`text-sm font-medium flex-1 text-left ${lang === l ? 'text-emerald-400' : 'text-zinc-300'}`}>{name}</span>
              {lang === l && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Data management */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">
          Gerenciar dados
        </h2>
        <div className="space-y-2">
          {RESET_ITEMS.map((item) => {
            const isConfirming = confirming === item.key;
            const isLoading = loading === item.key;
            const isDone = done === item.key;
            const title = isPt ? item.title : item.titleEn;
            const subtitle = isPt ? item.subtitle : item.subtitleEn;
            const warning = isPt ? item.warning : item.warningEn;

            return (
              <div
                key={item.key}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  isConfirming
                    ? 'bg-red-500/5 border-red-500/25'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                {!isConfirming ? (
                  <button
                    onClick={() => setConfirming(item.key)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-800 transition-colors"
                  >
                    <span className="text-xl w-8 flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">{title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
                    </div>
                    {isDone ? (
                      <span className="text-xs text-emerald-400 font-medium flex-shrink-0">✓ Feito</span>
                    ) : (
                      <svg className="w-4 h-4 text-zinc-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    )}
                  </button>
                ) : (
                  <div className="px-4 py-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{isPt ? 'Apagar' : 'Reset'} {title.toLowerCase()}?</p>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{warning}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirming(null)}
                        className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-medium hover:border-zinc-600 transition-colors"
                      >
                        {isPt ? 'Cancelar' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => handleReset(item.key)}
                        disabled={isLoading}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                      >
                        {isLoading ? '…' : isPt ? 'Sim, apagar' : 'Yes, reset'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
