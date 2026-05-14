'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserPlan, saveUserPlan, saveWeightEntry, updateUserProfile } from '@/lib/firestore';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [endDate, setEndDate] = useState(`${new Date().getFullYear()}-12-31`);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());

  function toggleDay(d: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  async function handleSkipAll() {
    if (!user || saving) return;
    setSaving(true);
    await updateUserProfile(user.uid, { onboardingCompleted: true });
    router.replace('/');
  }

  async function handleComplete() {
    if (!user || saving) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];

    if (currentWeight) {
      await saveWeightEntry(user.uid, { date: today, weight: parseFloat(currentWeight) });
    }

    await updateUserProfile(user.uid, {
      goalWeight: parseFloat(goalWeight) || 0,
      goalWorkouts: selectedDays.size,
      endDate,
      startDate: today,
      onboardingCompleted: true,
    });

    if (selectedDays.size > 0) {
      const plan = await getUserPlan(user.uid);
      const updatedPlan = plan.map((day) => ({
        ...day,
        isRest: !selectedDays.has(day.dayOfWeek),
      }));
      await saveUserPlan(user.uid, updatedPlan);
    }

    router.replace('/');
  }

  if (!user) return null;

  const progressBar = (activeSteps: number) => (
    <div className="flex gap-1.5 mb-8">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${i < activeSteps ? 'bg-emerald-500' : 'bg-zinc-700'}`}
        />
      ))}
    </div>
  );

  if (step === 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">Tudo pronto!</h1>
          <p className="text-zinc-400 text-sm mb-8">
            Seu perfil está configurado. Bem-vindo ao Come Back Gym!
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-8 text-left">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Dica</p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Você também pode registrar{' '}
              <span className="text-emerald-400 font-medium">medidas corporais</span> e{' '}
              <span className="text-emerald-400 font-medium">bioimpedância</span> nas seções do
              menu para acompanhar sua evolução completa.
            </p>
          </div>

          <button
            onClick={handleComplete}
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
          >
            {saving ? 'Salvando...' : 'Ir para o app →'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 px-6 py-12">
        <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
          {progressBar(2)}

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">Quando você treina?</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Selecione os dias que pretende ir à academia.
            </p>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-6">
            {DAYS.map((day, i) => {
              const selected = selectedDays.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`flex flex-col items-center py-3 rounded-xl border transition-all ${
                    selected
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-semibold">{day}</span>
                  {selected && <span className="text-emerald-500 text-xs mt-1">•</span>}
                </button>
              );
            })}
          </div>

          {selectedDays.size > 0 && (
            <p className="text-center text-sm text-zinc-400 mb-4">
              {selectedDays.size} {selectedDays.size === 1 ? 'dia' : 'dias'} de treino por semana
            </p>
          )}

          <div className="mt-auto flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 py-3 rounded-2xl border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-600 transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
            >
              {selectedDays.size > 0 ? 'Concluir →' : 'Pular →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 px-6 py-12">
      <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
        {progressBar(1)}

        <div className="mb-8">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Olá, {user.displayName?.split(' ')[0] ?? 'atleta'}!
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Vamos configurar seu perfil. Tudo é opcional — você pode preencher depois.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Peso atual (kg)</label>
            <input
              type="number"
              step="0.1"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              placeholder="Ex: 70.5"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Peso que deseja alcançar (kg)</label>
            <input
              type="number"
              step="0.1"
              value={goalWeight}
              onChange={(e) => setGoalWeight(e.target.value)}
              placeholder="Ex: 80"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Data limite da meta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <button
            onClick={() => setStep(1)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-2xl transition-colors"
          >
            Próximo →
          </button>
          <button
            onClick={handleSkipAll}
            disabled={saving}
            className="w-full text-zinc-500 hover:text-zinc-300 text-sm py-2 transition-colors disabled:opacity-40"
          >
            Pular tudo e ir para o app
          </button>
        </div>
      </div>
    </div>
  );
}
