'use client';

import { useState, useEffect } from 'react';
import { getUserPlan, saveWorkoutSession, getWorkoutSessions } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import { WorkoutPlan, WorkoutSession } from '@/lib/types';

const today = new Date();
const dayOfWeek = today.getDay();
const todayStr = today.toISOString().split('T')[0];

export default function TreinoHoje() {
  const { user } = useAuth();
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    Promise.all([
      getUserPlan(user.uid),
      getWorkoutSessions(user.uid),
    ]).then(([days, sessions]) => {
      const todayWorkout = days.find((d) => d.dayOfWeek === dayOfWeek) ?? null;
      setWorkout(todayWorkout);
      if (todayWorkout && !todayWorkout.isRest) {
        const existing = sessions.find(
          (s) => s.date === todayStr && s.workoutId === todayWorkout.id
        ) ?? null;
        if (existing) {
          setChecked(new Set(existing.checkedExercises));
          setDuration(String(existing.duration));
          setNotes(existing.notes);
          setAlreadyDone(true);
        }
      }
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, [user]);

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!user || !workout) return;
    const session: WorkoutSession = {
      id: `${todayStr}-${workout.id}`,
      date: todayStr,
      workoutId: workout.id,
      duration: Number(duration) || 0,
      notes,
      checkedExercises: Array.from(checked),
    };
    await saveWorkoutSession(user.uid, session);
    setSaved(true);
    setAlreadyDone(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  if (loadingData) {
    return <div className="text-zinc-500 text-sm p-4">Carregando...</div>;
  }

  if (!workout || workout.isRest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">😴</div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Dia de Descanso</h1>
        <p className="text-zinc-400">{days[dayOfWeek]} — recuperação ativa</p>
        <p className="text-zinc-500 mt-4 text-sm">Hidrate-se, durma bem, deixa o músculo crescer.</p>
      </div>
    );
  }

  const allExerciseIds = workout.exercises.map((e) => e.id);
  const warmupIds = workout.warmup.map((_, i) => `warmup-${i}`);
  const allIds = [...warmupIds, ...allExerciseIds];
  const progress = allIds.length > 0 ? (checked.size / allIds.length) * 100 : 0;

  return (
    <div>
      <div className="mb-6">
        <p className="text-zinc-500 text-sm">{days[dayOfWeek]}, {today.toLocaleDateString('pt-BR')}</p>
        <h1 className="text-2xl font-bold text-zinc-100 mt-1">{workout.label} — {workout.name}</h1>
        {alreadyDone && (
          <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
            ✓ Treino registrado hoje
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>Progresso</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Warmup */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Aquecimento
        </h2>
        <div className="space-y-2">
          {workout.warmup.map((item, i) => {
            const id = `warmup-${i}`;
            const done = checked.has(id);
            return (
              <button
                key={id}
                onClick={() => toggleCheck(id)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  done
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${
                  done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-600'
                }`}>
                  {done && '✓'}
                </span>
                <span className={`text-sm ${done ? 'line-through opacity-60' : ''}`}>{item.text}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Exercises */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Exercícios
        </h2>
        <div className="space-y-2">
          {workout.exercises.map((ex, i) => {
            const done = checked.has(ex.id);
            return (
              <button
                key={ex.id}
                onClick={() => toggleCheck(ex.id)}
                className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all ${
                  done
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-600 text-zinc-500'
                }`}>
                  {done ? '✓' : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${done ? 'text-emerald-300 line-through opacity-60' : 'text-zinc-100'}`}>
                    {ex.name}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{ex.series}</span>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">⏱ {ex.rest}</span>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">⚖ {ex.initialWeight}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {workout.tip && (
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-xs text-yellow-400">💡 {workout.tip}</p>
          </div>
        )}
      </section>

      {/* Save session */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Registrar Treino</h2>
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="text-xs text-zinc-500 block mb-1">Duração (min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="35"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-zinc-500 block mb-1">Exercícios ✓</label>
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100">
              {checked.size}/{allIds.length}
            </div>
          </div>
        </div>
        <div className="mb-3">
          <label className="text-xs text-zinc-500 block mb-1">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Como foi o treino? Pesos usados..."
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>
        <button
          onClick={handleSave}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {saved ? '✓ Salvo!' : alreadyDone ? 'Atualizar Treino' : 'Concluir Treino'}
        </button>
      </section>
    </div>
  );
}
