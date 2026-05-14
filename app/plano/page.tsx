'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserPlan, getWorkoutSessions } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import { WorkoutPlan } from '@/lib/types';

const LABEL_COLORS: Record<string, string> = {
  A: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  B: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  C: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  D: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  E: 'bg-red-500/10 border-red-500/30 text-red-400',
};
const REST_COLOR = 'bg-zinc-800 border-zinc-700 text-zinc-500';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function PlanoPage() {
  const { user } = useAuth();
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

  const today = new Date().getDay();

  if (loading) return <div className="text-zinc-500 text-sm p-4">Carregando...</div>;

  const trainingDays = plan.filter((d) => !d.isRest);

  if (trainingDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">📋</div>
        <h1 className="text-xl font-bold text-zinc-100 mb-2">Nenhum treino configurado</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Configure sua rotina semanal — escolha os dias e adicione seus exercícios.
        </p>
        <Link
          href="/plano/editar"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-2xl transition-colors"
        >
          Criar meu plano
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-zinc-100">Plano Semanal</h1>
        <Link
          href="/plano/editar"
          className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-colors"
        >
          ✏️ Editar
        </Link>
      </div>
      <p className="text-zinc-500 text-sm mb-6">
        {trainingDays.length} dias de treino por semana
      </p>

      <div className="space-y-3">
        {plan.map((day) => {
          const isToday = day.dayOfWeek === today;
          const colorClass = day.isRest ? REST_COLOR : (LABEL_COLORS[day.label] ?? LABEL_COLORS.A);
          const isExpanded = expanded === day.dayOfWeek;

          return (
            <div
              key={day.dayOfWeek}
              className={`rounded-2xl border ${isToday ? 'ring-2 ring-emerald-500/50' : ''} ${day.isRest ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-900 border-zinc-800'}`}
            >
              <button
                onClick={() => !day.isRest && setExpanded(isExpanded ? null : day.dayOfWeek)}
                className="w-full flex items-center gap-4 p-4 text-left"
                disabled={day.isRest}
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-sm font-bold flex-shrink-0 ${colorClass}`}>
                  {day.isRest ? '—' : (day.label || '?')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-100 text-sm">{DAYS[day.dayOfWeek]}</span>
                    {isToday && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Hoje</span>}
                  </div>
                  <p className="text-xs text-zinc-500">{day.isRest ? 'Descanso' : day.name}</p>
                </div>
                {!day.isRest && <span className="text-zinc-600">{isExpanded ? '▲' : '▼'}</span>}
              </button>

              {isExpanded && !day.isRest && (
                <div className="px-4 pb-4 border-t border-zinc-800">
                  {day.warmup.length > 0 && (
                    <>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-3 mb-2">Aquecimento</h3>
                      <ul className="space-y-1">
                        {day.warmup.map((w, i) => (
                          <li key={i} className="text-xs text-zinc-400 flex gap-2">
                            <span className="text-zinc-600">•</span>{w.text}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {day.exercises.length > 0 && (
                    <>
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-4 mb-2">Exercícios</h3>
                      <div className="space-y-2">
                        {day.exercises.map((ex, i) => (
                          <div key={ex.id} className="flex items-start gap-3 bg-zinc-800/50 rounded-xl p-3">
                            <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 flex-shrink-0 font-bold">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-200">{ex.name}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {ex.series && <span className="text-xs text-zinc-500">{ex.series}</span>}
                                {ex.rest && <><span className="text-xs text-zinc-600">·</span><span className="text-xs text-zinc-500">⏱ {ex.rest}</span></>}
                                {ex.initialWeight && <><span className="text-xs text-zinc-600">·</span><span className="text-xs text-zinc-500">{ex.initialWeight}</span></>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {day.tip && (
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <p className="text-xs text-yellow-400">💡 {day.tip}</p>
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
