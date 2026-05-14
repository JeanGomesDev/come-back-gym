'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserPlan, saveUserPlan } from '@/lib/firestore';
import { WorkoutPlan, Exercise } from '@/lib/types';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function EditarPlanoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserPlan(user.uid).then((days) => {
      setPlan(days);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  function updateDay(dayOfWeek: number, updates: Partial<WorkoutPlan>) {
    setPlan((prev) => prev.map((d) => d.dayOfWeek === dayOfWeek ? { ...d, ...updates } : d));
  }

  function addExercise(dayOfWeek: number) {
    const ex: Exercise = { id: crypto.randomUUID(), name: '', series: '', rest: '', initialWeight: '' };
    setPlan((prev) => prev.map((d) => d.dayOfWeek === dayOfWeek ? { ...d, exercises: [...d.exercises, ex] } : d));
  }

  function updateExercise(dayOfWeek: number, exId: string, updates: Partial<Exercise>) {
    setPlan((prev) => prev.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      return { ...d, exercises: d.exercises.map((e) => e.id === exId ? { ...e, ...updates } : e) };
    }));
  }

  function removeExercise(dayOfWeek: number, exId: string) {
    setPlan((prev) => prev.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      return { ...d, exercises: d.exercises.filter((e) => e.id !== exId) };
    }));
  }

  function addWarmup(dayOfWeek: number) {
    setPlan((prev) => prev.map((d) => d.dayOfWeek === dayOfWeek ? { ...d, warmup: [...d.warmup, { text: '' }] } : d));
  }

  function updateWarmup(dayOfWeek: number, index: number, text: string) {
    setPlan((prev) => prev.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      const warmup = [...d.warmup];
      warmup[index] = { text };
      return { ...d, warmup };
    }));
  }

  function removeWarmup(dayOfWeek: number, index: number) {
    setPlan((prev) => prev.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      return { ...d, warmup: d.warmup.filter((_, i) => i !== index) };
    }));
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await saveUserPlan(user.uid, plan);
    setSaving(false);
    router.push('/plano');
  }

  if (loading) return <div className="text-zinc-500 text-sm p-4">Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Editar Plano</h1>
          <p className="text-zinc-500 text-sm">Configure seus dias de treino</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="space-y-3">
        {plan.map((day) => (
          <div key={day.dayOfWeek} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Day header */}
            <div className="flex items-center gap-3 p-4">
              <span className="text-sm font-semibold text-zinc-400 w-8">{DAYS[day.dayOfWeek].slice(0, 3)}</span>
              <button
                onClick={() => updateDay(day.dayOfWeek, { isRest: !day.isRest })}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  day.isRest ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {day.isRest ? 'Descanso' : 'Treino'}
              </button>
              {!day.isRest && (
                <button
                  onClick={() => setExpandedDay(expandedDay === day.dayOfWeek ? null : day.dayOfWeek)}
                  className="ml-auto text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
                >
                  {expandedDay === day.dayOfWeek ? '▲ fechar' : '▼ editar exercícios'}
                </button>
              )}
            </div>

            {!day.isRest && (
              <>
                {/* Label + name */}
                <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Label (A, B, C…)</label>
                    <input
                      value={day.label}
                      onChange={(e) => updateDay(day.dayOfWeek, { label: e.target.value })}
                      placeholder="A"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Nome do treino</label>
                    <input
                      value={day.name}
                      onChange={(e) => updateDay(day.dayOfWeek, { name: e.target.value })}
                      placeholder="Peito + Tríceps"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Expandable exercise editor */}
                {expandedDay === day.dayOfWeek && (
                  <div className="px-4 pb-4 space-y-5 border-t border-zinc-800 pt-4">
                    {/* Warmup */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Aquecimento</h3>
                        <button onClick={() => addWarmup(day.dayOfWeek)} className="text-xs text-emerald-400 hover:text-emerald-300">+ adicionar</button>
                      </div>
                      <div className="space-y-2">
                        {day.warmup.map((w, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              value={w.text}
                              onChange={(e) => updateWarmup(day.dayOfWeek, i, e.target.value)}
                              placeholder="Ex: Rotação de ombros 15x"
                              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                            />
                            <button onClick={() => removeWarmup(day.dayOfWeek, i)} className="text-zinc-600 hover:text-red-400 px-2 text-lg leading-none">×</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exercises */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Exercícios</h3>
                        <button onClick={() => addExercise(day.dayOfWeek)} className="text-xs text-emerald-400 hover:text-emerald-300">+ adicionar</button>
                      </div>
                      <div className="space-y-3">
                        {day.exercises.map((ex) => (
                          <div key={ex.id} className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
                            <div className="flex gap-2">
                              <input
                                value={ex.name}
                                onChange={(e) => updateExercise(day.dayOfWeek, ex.id, { name: e.target.value })}
                                placeholder="Nome do exercício"
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                              />
                              <button onClick={() => removeExercise(day.dayOfWeek, ex.id)} className="text-zinc-600 hover:text-red-400 px-2 text-lg leading-none">×</button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                value={ex.series}
                                onChange={(e) => updateExercise(day.dayOfWeek, ex.id, { series: e.target.value })}
                                placeholder="Séries (4x10)"
                                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                              />
                              <input
                                value={ex.rest}
                                onChange={(e) => updateExercise(day.dayOfWeek, ex.id, { rest: e.target.value })}
                                placeholder="Descanso (90s)"
                                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                              />
                              <input
                                value={ex.initialWeight}
                                onChange={(e) => updateExercise(day.dayOfWeek, ex.id, { initialWeight: e.target.value })}
                                placeholder="Peso (30kg)"
                                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tip */}
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">Dica do treino (opcional)</label>
                      <input
                        value={day.tip ?? ''}
                        onChange={(e) => updateDay(day.dayOfWeek, { tip: e.target.value })}
                        placeholder="Ex: Desça até tocar o peito no supino..."
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold py-3 rounded-2xl transition-colors"
      >
        {saving ? 'Salvando...' : 'Salvar Plano'}
      </button>
    </div>
  );
}
