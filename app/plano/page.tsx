'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserPlan, getWorkoutSessions } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { WorkoutPlan } from '@/lib/types';

const LABEL_COLORS: Record<string, { card: string; badge: string; dot: string }> = {
  A: { card: 'border-blue-500/25 bg-blue-500/5', badge: 'bg-blue-500/15 border-blue-500/30 text-blue-400', dot: 'bg-blue-400' },
  B: { card: 'border-purple-500/25 bg-purple-500/5', badge: 'bg-purple-500/15 border-purple-500/30 text-purple-400', dot: 'bg-purple-400' },
  C: { card: 'border-emerald-500/25 bg-emerald-500/5', badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', dot: 'bg-emerald-400' },
  D: { card: 'border-orange-500/25 bg-orange-500/5', badge: 'bg-orange-500/15 border-orange-500/30 text-orange-400', dot: 'bg-orange-400' },
  E: { card: 'border-red-500/25 bg-red-500/5', badge: 'bg-red-500/15 border-red-500/30 text-red-400', dot: 'bg-red-400' },
  F: { card: 'border-cyan-500/25 bg-cyan-500/5', badge: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400', dot: 'bg-cyan-400' },
  G: { card: 'border-yellow-500/25 bg-yellow-500/5', badge: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400', dot: 'bg-yellow-400' },
};
const FALLBACK = { card: 'border-zinc-700 bg-zinc-900', badge: 'bg-zinc-800 border-zinc-700 text-zinc-400', dot: 'bg-zinc-500' };

export default function PlanoPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [plan, setPlan] = useState<WorkoutPlan[]>([]);
  const [doneDates, setDoneDates] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserPlan(user.uid),
      getWorkoutSessions(user.uid),
    ]).then(([days, sessions]) => {
      setPlan(days);
      setDoneDates(new Set(sessions.map((s) => s.date)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const todayNum = new Date().getDay();

  // Build a set of workout IDs done this week
  const thisWeekDone = new Set<string>();
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (doneDates.has(dateStr)) thisWeekDone.add(String(d.getDay()));
  }

  if (loading) return <div className="text-zinc-500 text-sm p-4">{t.loading}</div>;

  const trainingDays = plan.filter((d) => !d.isRest);

  if (trainingDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <svg className="w-8 h-8 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
        </div>
        <h1 className="text-xl font-bold text-zinc-100 mb-2">{t.plan.empty.title}</h1>
        <p className="text-zinc-500 text-sm mb-6">{t.plan.empty.subtitle}</p>
        <Link
          href="/plano/editar"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-2xl transition-colors"
        >
          {t.plan.empty.btn}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-zinc-100">{t.plan.title}</h1>
        <Link
          href="/plano/editar"
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          {t.plan.edit}
        </Link>
      </div>
      <p className="text-zinc-500 text-sm mb-5">{t.plan.subtitle(trainingDays.length)}</p>

      {/* Weekly strip */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {plan.map((day) => {
          const isToday = day.dayOfWeek === todayNum;
          const isDone = thisWeekDone.has(String(day.dayOfWeek));
          const colors = !day.isRest && day.label ? (LABEL_COLORS[day.label] ?? FALLBACK) : FALLBACK;
          return (
            <button
              key={day.dayOfWeek}
              onClick={() => !day.isRest && setExpanded(expanded === day.dayOfWeek ? null : day.dayOfWeek)}
              className={`flex flex-col items-center flex-1 min-w-[40px] py-2.5 rounded-xl border transition-all ${
                isToday
                  ? 'bg-emerald-500/15 border-emerald-500/50 ring-1 ring-emerald-500/30'
                  : day.isRest
                  ? 'bg-zinc-900 border-zinc-800'
                  : `${colors.card} border`
              }`}
            >
              <span className={`text-[10px] font-semibold mb-1 ${isToday ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {t.plan.days[day.dayOfWeek].slice(0, 3)}
              </span>
              {day.isRest ? (
                <span className="text-zinc-700 text-sm">—</span>
              ) : isDone ? (
                <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              ) : (
                <span className={`text-xs font-bold ${isToday ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {day.label || '·'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day cards */}
      <div className="space-y-2.5">
        {plan.map((day) => {
          const isToday = day.dayOfWeek === todayNum;
          const isDone = thisWeekDone.has(String(day.dayOfWeek));
          const colors = !day.isRest && day.label ? (LABEL_COLORS[day.label] ?? FALLBACK) : FALLBACK;
          const isExpanded = expanded === day.dayOfWeek;

          return (
            <div
              key={day.dayOfWeek}
              className={`rounded-2xl border overflow-hidden transition-all ${
                isToday
                  ? 'ring-1 ring-emerald-500/40 border-emerald-500/30 bg-zinc-900'
                  : day.isRest
                  ? 'bg-zinc-950 border-zinc-800/60'
                  : `bg-zinc-900 ${colors.card} border`
              }`}
            >
              <button
                onClick={() => !day.isRest && setExpanded(isExpanded ? null : day.dayOfWeek)}
                className="w-full flex items-center gap-3 p-4 text-left"
                disabled={day.isRest}
              >
                {/* Label badge */}
                {!day.isRest && day.label ? (
                  <span className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-bold flex-shrink-0 ${colors.badge}`}>
                    {isDone ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : day.label}
                  </span>
                ) : (
                  <span className="w-10 h-10 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-700 flex-shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14"/></svg>
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${day.isRest ? 'text-zinc-600' : 'text-zinc-100'}`}>
                      {t.plan.days[day.dayOfWeek]}
                    </span>
                    {isToday && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                        {t.plan.today}
                      </span>
                    )}
                    {isDone && !day.isRest && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">✓ feito</span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${day.isRest ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    {day.isRest ? t.plan.rest : (day.name || `${day.exercises.length} exercícios`)}
                  </p>
                </div>

                {!day.isRest && (
                  <svg
                    className={`w-4 h-4 text-zinc-600 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                )}
              </button>

              {isExpanded && !day.isRest && (
                <div className="px-4 pb-4 border-t border-zinc-800/60 space-y-4">
                  {day.warmup.length > 0 && (
                    <div className="pt-3">
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{t.plan.warmup}</h3>
                      <ul className="space-y-1.5">
                        {day.warmup.map((w, i) => (
                          <li key={i} className="text-xs text-zinc-400 flex gap-2 items-start">
                            <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 flex-shrink-0" />
                            {w.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {day.exercises.length > 0 && (
                    <div className={day.warmup.length === 0 ? 'pt-3' : ''}>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{t.plan.exercises}</h3>
                      <div className="space-y-2">
                        {day.exercises.map((ex, i) => (
                          <div key={ex.id} className="flex items-start gap-3 bg-zinc-800/50 rounded-xl p-3">
                            <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 flex-shrink-0 font-bold">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-200">{ex.name}</p>
                              <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                {ex.series && <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{ex.series}</span>}
                                {ex.rest && <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">⏱ {ex.rest}</span>}
                                {ex.initialWeight && <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">⚖ {ex.initialWeight}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {day.tip && (
                    <div className="p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
                      <p className="text-xs text-yellow-400 leading-relaxed">💡 {day.tip}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
