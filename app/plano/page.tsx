'use client';

import { useState, useEffect } from 'react';
import { WORKOUTS, WEEK_PLAN } from '@/lib/data';
import { getWorkoutSessions } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';

const COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  red: 'bg-red-500/10 border-red-500/30 text-red-400',
  zinc: 'bg-zinc-800 border-zinc-700 text-zinc-500',
};

export default function PlanoPage() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [doneDates, setDoneDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    getWorkoutSessions(user.uid).then((sessions) => {
      const dates = new Set(sessions.map((s) => s.date));
      setDoneDates(dates);
    }).catch(() => {});
  }, [user]);

  const today = new Date().getDay();

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100 mb-1">Plano Semanal</h1>
      <p className="text-zinc-500 text-sm mb-6">Divisão ABCDE — 5 dias/semana</p>

      <div className="space-y-3">
        {WEEK_PLAN.map((item, idx) => {
          const workout = WORKOUTS.find((w) => w.dayOfWeek === idx);
          const isToday = idx === today;
          const colorClass = COLOR_MAP[item.color] || COLOR_MAP.zinc;
          const isExpanded = expanded === idx;

          return (
            <div key={idx} className={`rounded-2xl border ${isToday ? 'ring-2 ring-emerald-500/50' : ''} ${item.workout ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-950 border-zinc-800'}`}>
              <button
                onClick={() => setExpanded(isExpanded ? null : idx)}
                className="w-full flex items-center gap-4 p-4 text-left"
                disabled={!item.workout}
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-sm font-bold flex-shrink-0 ${colorClass}`}>
                  {item.workout ?? '—'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-100 text-sm">{item.day}</span>
                    {isToday && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Hoje</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{item.name}</p>
                </div>
                {item.workout && (
                  <span className="text-zinc-600">{isExpanded ? '▲' : '▼'}</span>
                )}
              </button>

              {isExpanded && workout && !workout.isRest && (
                <div className="px-4 pb-4 border-t border-zinc-800">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-3 mb-2">Aquecimento</h3>
                  <ul className="space-y-1">
                    {workout.warmup.map((w, i) => (
                      <li key={i} className="text-xs text-zinc-400 flex gap-2">
                        <span className="text-zinc-600">•</span>
                        {w.text}
                      </li>
                    ))}
                  </ul>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-4 mb-2">Exercícios</h3>
                  <div className="space-y-2">
                    {workout.exercises.map((ex, i) => (
                      <div key={ex.id} className="flex items-start gap-3 bg-zinc-800/50 rounded-xl p-3">
                        <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 flex-shrink-0 font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-200">{ex.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-xs text-zinc-500">{ex.series}</span>
                            <span className="text-xs text-zinc-600">·</span>
                            <span className="text-xs text-zinc-500">⏱ {ex.rest}</span>
                            <span className="text-xs text-zinc-600">·</span>
                            <span className="text-xs text-zinc-500">{ex.initialWeight}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {workout.tip && (
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <p className="text-xs text-yellow-400">💡 {workout.tip}</p>
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
