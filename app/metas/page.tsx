'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getUserProfile, getWorkoutSessions, updateUserProfile, resetGoals, UserProfile } from '@/lib/firestore';
import { WorkoutSession } from '@/lib/types';

export default function MetasPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [form, setForm] = useState({
    goalWeight: '',
    goalWorkouts: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (!user) return;
    Promise.all([getUserProfile(user.uid), getWorkoutSessions(user.uid)]).then(([prof, sess]) => {
      setProfile(prof);
      setSessions(sess);
      setForm({
        goalWeight: prof.goalWeight > 0 ? String(prof.goalWeight) : '',
        goalWorkouts: prof.goalWorkouts > 0 ? String(prof.goalWorkouts) : '',
        startDate: prof.startDate || new Date().toISOString().split('T')[0],
        endDate: prof.endDate || `${new Date().getFullYear()}-12-31`,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  async function handleSave() {
    if (!user || !profile) return;
    setSaving(true);
    const updated: Partial<UserProfile> = {
      goalWeight: parseFloat(form.goalWeight) || 0,
      goalWorkouts: parseInt(form.goalWorkouts) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
    };
    await updateUserProfile(user.uid, updated);
    setProfile((p) => ({ ...p!, ...updated }));
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); router.back(); }, 1200);
  }

  async function handleReset() {
    if (!user) return;
    setResetting(true);
    await resetGoals(user.uid);
    const today = new Date().toISOString().split('T')[0];
    setProfile((p) => p ? { ...p, goalWeight: 0, goalWorkouts: 0, startDate: today, endDate: `${new Date().getFullYear()}-12-31` } : p);
    setForm({ goalWeight: '', goalWorkouts: '', startDate: today, endDate: `${new Date().getFullYear()}-12-31` });
    setConfirmReset(false);
    setResetting(false);
  }

  const isPt = lang === 'pt';

  if (loading) return <div className="text-zinc-500 text-sm p-4">{t.loading}</div>;
  if (!profile) return null;

  const totalWorkouts = sessions.length;
  const goal = profile.goalWorkouts;
  const progress = goal > 0 ? Math.min((totalWorkouts / goal) * 100, 100) : 0;
  const endDate = new Date(profile.endDate);
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86400000));

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="text-2xl font-bold text-zinc-100">{isPt ? 'Minhas Metas' : 'My Goals'}</h1>
      </div>
      <p className="text-zinc-500 text-sm mb-6 ml-11">{isPt ? 'Edite ou redefina seus objetivos' : 'Edit or reset your objectives'}</p>

      {/* Current progress summary */}
      {goal > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            {isPt ? 'Progresso atual' : 'Current progress'}
          </p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-300">{isPt ? 'Treinos feitos' : 'Workouts done'}</span>
            <span className="text-sm font-bold text-emerald-400">{totalWorkouts} / {goal}</span>
          </div>
          <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{Math.round(progress)}% {isPt ? 'concluído' : 'complete'}</span>
            {daysLeft > 0 && <span>{daysLeft} {isPt ? 'dias restantes' : 'days left'}</span>}
          </div>
          {profile.goalWeight > 0 && (
            <p className="text-xs text-zinc-500 mt-2">
              {isPt ? `Meta de peso: ${profile.goalWeight} kg` : `Weight goal: ${profile.goalWeight} kg`}
            </p>
          )}
        </div>
      )}

      {/* Edit form */}
      <section className="mb-5">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">
          {isPt ? 'Editar metas' : 'Edit goals'}
        </h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">

          {/* Goal weight */}
          <div className="px-4 py-3.5">
            <label className="text-xs text-zinc-500 block mb-1.5">
              {isPt ? 'Peso meta (kg)' : 'Goal weight (kg)'}
            </label>
            <input
              type="number"
              step="0.1"
              value={form.goalWeight}
              onChange={(e) => setForm((f) => ({ ...f, goalWeight: e.target.value }))}
              placeholder={isPt ? 'Ex: 80' : 'E.g. 180'}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
            />
          </div>

          {/* Goal workouts */}
          <div className="px-4 py-3.5">
            <label className="text-xs text-zinc-500 block mb-1.5">
              {isPt ? 'Meta de treinos no ano' : 'Yearly workout goal'}
            </label>
            <input
              type="number"
              value={form.goalWorkouts}
              onChange={(e) => setForm((f) => ({ ...f, goalWorkouts: e.target.value }))}
              placeholder={isPt ? 'Ex: 150' : 'E.g. 150'}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
            />
          </div>

          {/* Start date */}
          <div className="px-4 py-3.5">
            <label className="text-xs text-zinc-500 block mb-1.5">
              {isPt ? 'Data de início' : 'Start date'}
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
            />
          </div>

          {/* End date */}
          <div className="px-4 py-3.5">
            <label className="text-xs text-zinc-500 block mb-1.5">
              {isPt ? 'Data final da meta' : 'Goal end date'}
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors mb-6"
      >
        {saved ? (isPt ? '✓ Salvo!' : '✓ Saved!') : saving ? (isPt ? 'Salvando…' : 'Saving…') : (isPt ? 'Salvar metas' : 'Save goals')}
      </button>

      {/* Reset / start fresh */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">
          {isPt ? 'Zona de risco' : 'Danger zone'}
        </h2>
        <div className={`rounded-2xl border overflow-hidden transition-all ${confirmReset ? 'bg-red-500/5 border-red-500/25' : 'bg-zinc-900 border-zinc-800'}`}>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-800 transition-colors"
            >
              <span className="text-xl w-8 flex-shrink-0">🔄</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200">
                  {isPt ? 'Iniciar nova meta' : 'Start a new goal'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isPt ? 'Redefine peso meta, treinos e datas para zero' : 'Resets goal weight, workouts and dates to zero'}
                </p>
              </div>
              <svg className="w-4 h-4 text-zinc-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ) : (
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    {isPt ? 'Iniciar nova meta?' : 'Start a new goal?'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    {isPt
                      ? 'Seus treinos, medidas e histórico de peso não serão afetados.'
                      : 'Your workouts, measurements and weight history will not be affected.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-medium hover:border-zinc-600 transition-colors"
                >
                  {isPt ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                >
                  {resetting ? '…' : isPt ? 'Sim, redefinir' : 'Yes, reset'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
