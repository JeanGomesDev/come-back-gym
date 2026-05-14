'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserPlan, saveUserPlan } from '@/lib/firestore';
import { WorkoutPlan, Exercise } from '@/lib/types';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const REST_OPTIONS = [
  { label: '30s', value: '30s' },
  { label: '45s', value: '45s' },
  { label: '60s', value: '60s' },
  { label: '90s', value: '90s' },
  { label: '2min', value: '120s' },
  { label: '3min', value: '180s' },
];

function NumberPickerSheet({
  value,
  min,
  max,
  label,
  onSelect,
  onClose,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  onSelect: (v: number) => void;
  onClose: () => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, []);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col max-h-[55vh] rounded-t-3xl overflow-hidden shadow-2xl">
        <div className="max-w-2xl mx-auto w-full bg-zinc-900 border-t border-zinc-700 rounded-t-3xl flex flex-col max-h-[55vh]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
            <span className="text-sm font-semibold text-zinc-100">{label}</span>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">✕</button>
          </div>
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {numbers.map((n) => (
              <button
                key={n}
                ref={n === value ? selectedRef : null}
                onClick={() => { onSelect(n); onClose(); }}
                className={`w-full py-4 text-center text-lg font-medium transition-colors ${
                  n === value
                    ? 'text-emerald-400 bg-emerald-500/10 font-bold'
                    : 'text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Stepper({
  value,
  min = 1,
  max = 50,
  label,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  label: string;
  onChange: (v: number) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="px-3 py-2.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 active:bg-zinc-600 transition-colors text-base font-bold select-none"
        >
          −
        </button>
        <button
          onClick={() => setPickerOpen(true)}
          className="flex-1 py-2.5 text-sm text-zinc-100 font-bold text-center hover:text-emerald-400 transition-colors select-none"
        >
          {value}
        </button>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="px-3 py-2.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 active:bg-zinc-600 transition-colors text-base font-bold select-none"
        >
          +
        </button>
      </div>
      {pickerOpen && (
        <NumberPickerSheet
          value={value}
          min={min}
          max={max}
          label={label}
          onSelect={onChange}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

function SeriesInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const match = value.match(/^(\d+)x(\d+)$/);

  if (match) {
    const sets = parseInt(match[1]);
    const reps = parseInt(match[2]);
    return (
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <p className="text-xs text-zinc-500 mb-1.5 text-center">Séries</p>
          <Stepper value={sets} max={10} label="Número de séries" onChange={(v) => onChange(`${v}x${reps}`)} />
        </div>
        <span className="text-zinc-600 text-sm pb-2.5 select-none">×</span>
        <div className="flex-1">
          <p className="text-xs text-zinc-500 mb-1.5 text-center">Reps</p>
          <Stepper value={reps} max={50} label="Número de repetições" onChange={(v) => onChange(`${sets}x${v}`)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1.5">Séries × Reps</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="4x10"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function RestInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isPreset = REST_OPTIONS.some((o) => o.value === value);

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1.5">Descanso</p>
      <div className="flex gap-1.5 flex-wrap">
        {REST_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
              value === opt.value
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {!isPreset && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Personalizado (ex: 60-90s)"
          className="mt-2 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
        />
      )}
    </div>
  );
}

export default function EditarPlanoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserPlan(user.uid)
      .then((days) => {
        setPlan(days);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  function updateDay(dayOfWeek: number, updates: Partial<WorkoutPlan>) {
    setPlan((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...updates } : d))
    );
  }

  function addExercise(dayOfWeek: number) {
    const ex: Exercise = {
      id: crypto.randomUUID(),
      name: '',
      series: '3x10',
      rest: '60s',
      initialWeight: '',
    };
    setPlan((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, exercises: [...d.exercises, ex] } : d
      )
    );
  }

  function updateExercise(dayOfWeek: number, exId: string, updates: Partial<Exercise>) {
    setPlan((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        return { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, ...updates } : e)) };
      })
    );
  }

  function removeExercise(dayOfWeek: number, exId: string) {
    setPlan((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        return { ...d, exercises: d.exercises.filter((e) => e.id !== exId) };
      })
    );
  }

  function addWarmup(dayOfWeek: number) {
    setPlan((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, warmup: [...d.warmup, { text: '' }] } : d
      )
    );
  }

  function updateWarmup(dayOfWeek: number, index: number, text: string) {
    setPlan((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const warmup = [...d.warmup];
        warmup[index] = { text };
        return { ...d, warmup };
      })
    );
  }

  function removeWarmup(dayOfWeek: number, index: number) {
    setPlan((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        return { ...d, warmup: d.warmup.filter((_, i) => i !== index) };
      })
    );
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
          <div
            key={day.dayOfWeek}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
          >
            {/* Day header */}
            <div className="flex items-center gap-3 p-4">
              <span className="text-sm font-semibold text-zinc-400 w-8">
                {DAYS[day.dayOfWeek].slice(0, 3)}
              </span>
              <button
                onClick={() => updateDay(day.dayOfWeek, { isRest: !day.isRest })}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  day.isRest
                    ? 'bg-zinc-800 text-zinc-500'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {day.isRest ? 'Descanso' : 'Treino'}
              </button>
              {!day.isRest && (
                <button
                  onClick={() =>
                    setExpandedDay(expandedDay === day.dayOfWeek ? null : day.dayOfWeek)
                  }
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
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          Aquecimento
                        </h3>
                        <button
                          onClick={() => addWarmup(day.dayOfWeek)}
                          className="text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          + adicionar
                        </button>
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
                            <button
                              onClick={() => removeWarmup(day.dayOfWeek, i)}
                              className="text-zinc-600 hover:text-red-400 px-2 text-lg leading-none"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exercises */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          Exercícios
                        </h3>
                        <button
                          onClick={() => addExercise(day.dayOfWeek)}
                          className="text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          + adicionar
                        </button>
                      </div>
                      <div className="space-y-4">
                        {day.exercises.map((ex, idx) => (
                          <div key={ex.id} className="bg-zinc-800/50 rounded-2xl p-4 space-y-4">
                            {/* Exercise name */}
                            <div className="flex gap-2 items-center">
                              <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 font-bold flex-shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                value={ex.name}
                                onChange={(e) =>
                                  updateExercise(day.dayOfWeek, ex.id, { name: e.target.value })
                                }
                                placeholder="Nome do exercício"
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                              />
                              <button
                                onClick={() => removeExercise(day.dayOfWeek, ex.id)}
                                className="text-zinc-600 hover:text-red-400 px-1 text-xl leading-none flex-shrink-0"
                              >
                                ×
                              </button>
                            </div>

                            {/* Series stepper */}
                            <SeriesInput
                              value={ex.series}
                              onChange={(v) =>
                                updateExercise(day.dayOfWeek, ex.id, { series: v })
                              }
                            />

                            {/* Rest chips */}
                            <RestInput
                              value={ex.rest}
                              onChange={(v) =>
                                updateExercise(day.dayOfWeek, ex.id, { rest: v })
                              }
                            />

                            {/* Weight text */}
                            <div>
                              <p className="text-xs text-zinc-500 mb-1.5">Peso inicial</p>
                              <input
                                value={ex.initialWeight}
                                onChange={(e) =>
                                  updateExercise(day.dayOfWeek, ex.id, {
                                    initialWeight: e.target.value,
                                  })
                                }
                                placeholder="Ex: 8-10kg cada, barra + 10kg…"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tip */}
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">
                        Dica do treino (opcional)
                      </label>
                      <input
                        value={day.tip ?? ''}
                        onChange={(e) => updateDay(day.dayOfWeek, { tip: e.target.value })}
                        placeholder="Ex: Desça até tocar o peito no supino…"
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
