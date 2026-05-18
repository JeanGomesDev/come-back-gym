'use client';

import { useState, useEffect } from 'react';
import { getUserPlan, saveWorkoutSession, getWorkoutSessions, getUserProfile, updateUserProfile } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { WorkoutPlan, WorkoutSession } from '@/lib/types';

const today = new Date();
const dayOfWeek = today.getDay();
const todayStr = today.toISOString().split('T')[0];

export default function TreinoHoje() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [allDays, setAllDays] = useState<WorkoutPlan[]>([]);
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [planOffset, setPlanOffset] = useState(0);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [swapOpen, setSwapOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    Promise.all([
      getUserPlan(user.uid),
      getWorkoutSessions(user.uid),
      getUserProfile(user.uid),
    ]).then(([days, sessions, profile]) => {
      setAllDays(days);
      const offset = profile.planOffset ?? 0;
      setPlanOffset(offset);
      const effectiveDayOfWeek = (dayOfWeek + offset) % 7;
      const todayWorkout = days.find((d) => d.dayOfWeek === effectiveDayOfWeek) ?? null;
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

  function handleSwap(day: WorkoutPlan) {
    if (!user) return;
    // Compute how many days ahead the chosen workout is relative to today,
    // so the sequence advances correctly from tomorrow onward.
    const newOffset = ((day.dayOfWeek - dayOfWeek) + 7) % 7;
    setPlanOffset(newOffset);
    updateUserProfile(user.uid, { planOffset: newOffset });
    setWorkout(day);
    setChecked(new Set());
    setDuration('');
    setNotes('');
    setAlreadyDone(false);
    setSaved(false);
    setSwapOpen(false);
  }

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

  if (loadingData) {
    return <div className="text-zinc-500 text-sm p-4">{t.loading}</div>;
  }

  if (!workout || workout.isRest) {
    const hasNoplan = !workout || (!workout.name && !workout.label);
    const effectiveDayOfWeek = (dayOfWeek + planOffset) % 7;
    const workoutDays = allDays.filter((d) => d.dayOfWeek !== effectiveDayOfWeek && !d.isRest && (d.name || d.label));
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="text-6xl mb-5">{hasNoplan ? '📋' : '😴'}</div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">
            {hasNoplan ? t.today.noPlan.title : t.today.restDay.title}
          </h1>
          <p className="text-zinc-500 text-sm mb-6">{t.today.days[dayOfWeek]}</p>
          {hasNoplan ? (
            <a
              href="/plano/editar"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-150 shadow-lg shadow-emerald-900/30"
            >
              <span className="text-base">+</span>
              {t.today.noPlan.btn}
            </a>
          ) : (
            <>
              <p className="text-zinc-500 text-sm mb-6">{t.today.restDay.subtitle}</p>
              {workoutDays.length > 0 && (
                <button
                  onClick={() => setSwapOpen(true)}
                  className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 font-semibold px-6 py-3 rounded-2xl transition-all duration-150"
                >
                  {t.today.swap.btn}
                </button>
              )}
            </>
          )}
        </div>

        {swapOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setSwapOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-200">
              <div className="max-w-2xl mx-auto bg-zinc-900 border-t border-zinc-700 rounded-t-3xl overflow-hidden shadow-2xl">
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-zinc-700 rounded-full" />
                </div>
                <div className="px-5 py-4 border-b border-zinc-800">
                  <p className="text-sm font-semibold text-zinc-100">{t.today.swap.title}</p>
                </div>
                <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
                  {workoutDays.map((day) => (
                    <button
                      key={day.dayOfWeek}
                      onClick={() => handleSwap(day)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-left"
                    >
                      <span className="text-base w-6 text-center">🏋️</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {t.today.days[day.dayOfWeek]}
                          {day.label && day.name ? ` — ${day.label} · ${day.name}` : ''}
                        </p>
                        {day.exercises.length > 0 && (
                          <p className="text-xs text-zinc-500">{day.exercises.length} ex.</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-3">
                  <button
                    onClick={() => setSwapOpen(false)}
                    className="w-full py-3 rounded-2xl border border-zinc-700 text-zinc-400 text-sm font-medium hover:border-zinc-600 transition-colors"
                  >
                    {t.today.swap.cancel}
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

  const allExerciseIds = workout.exercises.map((e) => e.id);
  const warmupIds = workout.warmup.map((_, i) => `warmup-${i}`);
  const allIds = [...warmupIds, ...allExerciseIds];
  const progress = allIds.length > 0 ? (checked.size / allIds.length) * 100 : 0;

  const effectiveDayOfWeek = (dayOfWeek + planOffset) % 7;
  const swappableDays = allDays.filter((d) => d.dayOfWeek !== effectiveDayOfWeek);

  return (
    <div>
      <div className="mb-6">
        <p className="text-zinc-500 text-sm">{t.today.days[dayOfWeek]}, {today.toLocaleDateString(t.today.locale)}</p>
        <div className="flex items-start justify-between gap-2 mt-1">
          <h1 className="text-2xl font-bold text-zinc-100">{workout.label} — {workout.name}</h1>
          {swappableDays.length > 0 && (
            <button
              onClick={() => setSwapOpen(true)}
              className="flex-shrink-0 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl transition-colors mt-1"
            >
              {t.today.swap.btn}
            </button>
          )}
        </div>
        {alreadyDone && (
          <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
            {t.today.alreadyDone}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>{t.today.progress}</span>
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
          {t.today.warmup}
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
          {t.today.exercises}
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
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">{t.today.save.title}</h2>
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="text-xs text-zinc-500 block mb-1">{t.today.save.duration}</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="35"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-zinc-500 block mb-1">{t.today.save.done}</label>
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100">
              {checked.size}/{allIds.length}
            </div>
          </div>
        </div>
        <div className="mb-3">
          <label className="text-xs text-zinc-500 block mb-1">{t.today.save.notes}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.today.save.notesPlaceholder}
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>
        <button
          onClick={handleSave}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {saved ? t.today.save.saved : alreadyDone ? t.today.save.update : t.today.save.save}
        </button>
      </section>

      {/* Swap workout bottom sheet */}
      {swapOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setSwapOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-200">
            <div className="max-w-2xl mx-auto bg-zinc-900 border-t border-zinc-700 rounded-t-3xl overflow-hidden shadow-2xl">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-zinc-700 rounded-full" />
              </div>
              <div className="px-5 py-4 border-b border-zinc-800">
                <p className="text-sm font-semibold text-zinc-100">{t.today.swap.title}</p>
              </div>
              <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
                {swappableDays.map((day) => (
                  <button
                    key={day.dayOfWeek}
                    onClick={() => handleSwap(day)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-left"
                  >
                    <span className="text-base w-6 text-center">{day.isRest ? '😴' : '🏋️'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {t.today.days[day.dayOfWeek]}
                        {day.label && day.name ? ` — ${day.label} · ${day.name}` : ''}
                      </p>
                      {day.isRest && (
                        <p className="text-xs text-zinc-500">{t.today.swap.restLabel}</p>
                      )}
                      {!day.isRest && day.exercises.length > 0 && (
                        <p className="text-xs text-zinc-500">{day.exercises.length} ex.</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-3">
                <button
                  onClick={() => setSwapOpen(false)}
                  className="w-full py-3 rounded-2xl border border-zinc-700 text-zinc-400 text-sm font-medium hover:border-zinc-600 transition-colors"
                >
                  {t.today.swap.cancel}
                </button>
              </div>
              <div className="h-6" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
