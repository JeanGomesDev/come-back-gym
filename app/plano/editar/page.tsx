'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getUserPlan, saveUserPlan } from '@/lib/firestore';
import { WorkoutPlan, Exercise } from '@/lib/types';
import { exerciseLibrary, MuscleGroup } from '@/lib/exercise-library';
import type { Lang } from '@/lib/translations';

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

function SeriesInput({ value, onChange, seriesLabel, repsLabel, seriesRepsLabel }: {
  value: string;
  onChange: (v: string) => void;
  seriesLabel: string;
  repsLabel: string;
  seriesRepsLabel: string;
}) {
  const match = value.match(/^(\d+)x(\d+)$/);

  if (match) {
    const sets = parseInt(match[1]);
    const reps = parseInt(match[2]);
    return (
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <p className="text-xs text-zinc-500 mb-1.5 text-center">{seriesLabel}</p>
          <Stepper value={sets} max={10} label={seriesLabel} onChange={(v) => onChange(`${v}x${reps}`)} />
        </div>
        <span className="text-zinc-600 text-sm pb-2.5 select-none">×</span>
        <div className="flex-1">
          <p className="text-xs text-zinc-500 mb-1.5 text-center">{repsLabel}</p>
          <Stepper value={reps} max={50} label={repsLabel} onChange={(v) => onChange(`${sets}x${v}`)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1.5">{seriesRepsLabel}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="4x10"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function RestInput({ value, onChange, restLabel, customPlaceholder }: {
  value: string;
  onChange: (v: string) => void;
  restLabel: string;
  customPlaceholder: string;
}) {
  const isPreset = REST_OPTIONS.some((o) => o.value === value);

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1.5">{restLabel}</p>
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
          placeholder={customPlaceholder}
          className="mt-2 w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
        />
      )}
    </div>
  );
}

function ExerciseLibrarySheet({
  lang,
  labels,
  onAdd,
  onClose,
}: {
  lang: Lang;
  labels: { title: string; back: string; cancel: string; add: (n: number) => string };
  onAdd: (exercises: Exercise[]) => void;
  onClose: () => void;
}) {
  const [group, setGroup] = useState<MuscleGroup | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function toggleSelect(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  function handleAdd() {
    if (!group) return;
    const exercises: Exercise[] = Array.from(selected).sort((a, b) => a - b).map((idx) => ({
      id: crypto.randomUUID(),
      name: group.exercises[idx].name[lang],
      series: group.exercises[idx].series,
      rest: group.exercises[idx].rest,
      initialWeight: '',
    }));
    onAdd(exercises);
    onClose();
  }

  function handleBack() {
    setGroup(null);
    setSelected(new Set());
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-200">
        <div className="max-w-2xl mx-auto bg-zinc-900 border-t border-zinc-700 rounded-t-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800 flex-shrink-0">
            {group ? (
              <button onClick={handleBack} className="text-zinc-400 hover:text-zinc-200 text-sm">
                {labels.back}
              </button>
            ) : (
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto" />
            )}
            <p className="text-sm font-semibold text-zinc-100 flex-1 text-center">
              {group ? `${group.icon} ${group.name[lang]}` : labels.title}
            </p>
            {group ? (
              <div className="w-14" />
            ) : (
              <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm">✕</button>
            )}
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {!group ? (
              /* Muscle group grid */
              <div className="grid grid-cols-2 gap-2 p-4">
                {exerciseLibrary.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGroup(g)}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 transition-colors text-left"
                  >
                    <span className="text-2xl">{g.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{g.name[lang]}</p>
                      <p className="text-xs text-zinc-500">{g.exercises.length} ex.</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Exercise list */
              <div className="p-3 space-y-1">
                {group.exercises.map((ex, idx) => {
                  const checked = selected.has(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleSelect(idx)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors text-left ${
                        checked
                          ? 'bg-emerald-500/15 border border-emerald-500/30'
                          : 'hover:bg-zinc-800 border border-transparent'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${
                        checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-600'
                      }`}>
                        {checked && '✓'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${checked ? 'text-emerald-300' : 'text-zinc-200'}`}>
                          {ex.name[lang]}
                        </p>
                        <p className="text-xs text-zinc-500">{ex.series} · {ex.rest}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-zinc-800 flex-shrink-0 space-y-2">
            {group && selected.size > 0 && (
              <button
                onClick={handleAdd}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
              >
                {labels.add(selected.size)}
              </button>
            )}
            <button
              onClick={group ? handleBack : onClose}
              className="w-full py-3 rounded-2xl border border-zinc-700 text-zinc-400 text-sm font-medium hover:border-zinc-600 transition-colors"
            >
              {group ? labels.back : labels.cancel}
            </button>
          </div>
          <div className="h-6" />
        </div>
      </div>
    </>
  );
}

export default function EditarPlanoPage() {
  const { user, } = useAuth();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [plan, setPlan] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [libraryDay, setLibraryDay] = useState<number | null>(null);

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

  function addExercisesFromLibrary(dayOfWeek: number, exercises: Exercise[]) {
    setPlan((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, exercises: [...d.exercises, ...exercises] } : d
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

  function moveExercise(dayOfWeek: number, exId: string, direction: 'up' | 'down') {
    setPlan((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const exercises = [...d.exercises];
        const idx = exercises.findIndex((e) => e.id === exId);
        if (idx === -1) return d;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= exercises.length) return d;
        [exercises[idx], exercises[newIdx]] = [exercises[newIdx], exercises[idx]];
        return { ...d, exercises };
      })
    );
  }

  function moveWarmup(dayOfWeek: number, index: number, direction: 'up' | 'down') {
    setPlan((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const warmup = [...d.warmup];
        const newIdx = direction === 'up' ? index - 1 : index + 1;
        if (newIdx < 0 || newIdx >= warmup.length) return d;
        [warmup[index], warmup[newIdx]] = [warmup[newIdx], warmup[index]];
        return { ...d, warmup };
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

  if (loading) return <div className="text-zinc-500 text-sm p-4">{t.loading}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">{t.editPlan.title}</h1>
        <p className="text-zinc-500 text-sm">{t.editPlan.subtitle}</p>
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
                {t.editPlan.days[day.dayOfWeek].slice(0, 3)}
              </span>
              <button
                onClick={() => updateDay(day.dayOfWeek, { isRest: !day.isRest })}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  day.isRest
                    ? 'bg-zinc-800 text-zinc-500'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {day.isRest ? t.editPlan.rest : t.editPlan.training}
              </button>
              {!day.isRest && (
                <button
                  onClick={() =>
                    setExpandedDay(expandedDay === day.dayOfWeek ? null : day.dayOfWeek)
                  }
                  className="ml-auto text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
                >
                  {expandedDay === day.dayOfWeek ? t.editPlan.closeExercises : t.editPlan.editExercises}
                </button>
              )}
            </div>

            {!day.isRest && (
              <>
                {/* Label + name */}
                <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">{t.editPlan.labelInput}</label>
                    <input
                      value={day.label}
                      onChange={(e) => updateDay(day.dayOfWeek, { label: e.target.value })}
                      placeholder="A"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">{t.editPlan.nameInput}</label>
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
                          {t.editPlan.warmup.title}
                        </h3>
                        <button
                          onClick={() => addWarmup(day.dayOfWeek)}
                          className="text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          {t.editPlan.warmup.add}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {day.warmup.map((w, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input
                              value={w.text}
                              onChange={(e) => updateWarmup(day.dayOfWeek, i, e.target.value)}
                              placeholder={t.editPlan.warmup.placeholder}
                              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                            />
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => moveWarmup(day.dayOfWeek, i, 'up')}
                                disabled={i === 0}
                                className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-20 flex items-center justify-center transition-colors"
                              >
                                <svg className="w-2.5 h-2.5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                              </button>
                              <button
                                onClick={() => moveWarmup(day.dayOfWeek, i, 'down')}
                                disabled={i === day.warmup.length - 1}
                                className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-20 flex items-center justify-center transition-colors"
                              >
                                <svg className="w-2.5 h-2.5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                              </button>
                            </div>
                            <button
                              onClick={() => removeWarmup(day.dayOfWeek, i)}
                              className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                            >
                              <svg className="w-3 h-3 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exercises */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          {t.editPlan.exercises.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setLibraryDay(day.dayOfWeek)}
                            className="text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            {t.editPlan.library.btn}
                          </button>
                          <button
                            onClick={() => addExercise(day.dayOfWeek)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            + {t.editPlan.exercises.add}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {day.exercises.map((ex, idx) => (
                          <div key={ex.id} className="bg-zinc-800/40 border border-zinc-700/50 rounded-2xl p-4 space-y-4">
                            {/* Exercise name row */}
                            <div className="flex gap-2 items-center">
                              <span className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 font-bold flex-shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                value={ex.name}
                                onChange={(e) =>
                                  updateExercise(day.dayOfWeek, ex.id, { name: e.target.value })
                                }
                                placeholder={t.editPlan.exercises.namePlaceholder}
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                              />
                              {/* Reorder + delete */}
                              <div className="flex flex-col gap-0.5 flex-shrink-0">
                                <button
                                  onClick={() => moveExercise(day.dayOfWeek, ex.id, 'up')}
                                  disabled={idx === 0}
                                  className="w-6 h-6 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-20 flex items-center justify-center transition-colors"
                                  title="Mover para cima"
                                >
                                  <svg className="w-3 h-3 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                                </button>
                                <button
                                  onClick={() => moveExercise(day.dayOfWeek, ex.id, 'down')}
                                  disabled={idx === day.exercises.length - 1}
                                  className="w-6 h-6 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-20 flex items-center justify-center transition-colors"
                                  title="Mover para baixo"
                                >
                                  <svg className="w-3 h-3 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                                </button>
                              </div>
                              <button
                                onClick={() => removeExercise(day.dayOfWeek, ex.id)}
                                className="w-7 h-7 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center flex-shrink-0 transition-colors group"
                                title="Remover exercício"
                              >
                                <svg className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            </div>

                            {/* Series stepper */}
                            <SeriesInput
                              value={ex.series}
                              onChange={(v) =>
                                updateExercise(day.dayOfWeek, ex.id, { series: v })
                              }
                              seriesLabel={t.editPlan.exercises.seriesLabel}
                              repsLabel={t.editPlan.exercises.repsLabel}
                              seriesRepsLabel={t.editPlan.exercises.seriesReps}
                            />

                            {/* Rest chips */}
                            <RestInput
                              value={ex.rest}
                              onChange={(v) =>
                                updateExercise(day.dayOfWeek, ex.id, { rest: v })
                              }
                              restLabel={t.editPlan.exercises.rest}
                              customPlaceholder={t.editPlan.exercises.customRest}
                            />

                            {/* Weight text */}
                            <div>
                              <p className="text-xs text-zinc-500 mb-1.5">{t.editPlan.exercises.weight}</p>
                              <input
                                value={ex.initialWeight}
                                onChange={(e) =>
                                  updateExercise(day.dayOfWeek, ex.id, {
                                    initialWeight: e.target.value,
                                  })
                                }
                                placeholder={t.editPlan.exercises.weightPlaceholder}
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
                        {t.editPlan.tip}
                      </label>
                      <input
                        value={day.tip ?? ''}
                        onChange={(e) => updateDay(day.dayOfWeek, { tip: e.target.value })}
                        placeholder={t.editPlan.tipPlaceholder}
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
        {saving ? t.editPlan.saving : t.editPlan.savePlan}
      </button>

      {libraryDay !== null && (
        <ExerciseLibrarySheet
          lang={lang}
          labels={t.editPlan.library}
          onAdd={(exercises) => addExercisesFromLibrary(libraryDay, exercises)}
          onClose={() => setLibraryDay(null)}
        />
      )}
    </div>
  );
}
