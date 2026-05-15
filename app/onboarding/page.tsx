'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getUserPlan, saveUserPlan, saveWeightEntry, updateUserProfile } from '@/lib/firestore';
import { Lang } from '@/lib/translations';

export default function OnboardingPage() {
  const { user } = useAuth();
  const { t, setLang } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Lang>('pt');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [endDate, setEndDate] = useState(`${new Date().getFullYear()}-12-31`);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());

  function toggleDay(d: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
  }

  function handleSelectLang(l: Lang) {
    setSelectedLang(l);
    setLang(l);
  }

  async function handleSkipAll() {
    if (!user || saving) return;
    setSaving(true);
    await updateUserProfile(user.uid, { onboardingCompleted: true, language: selectedLang });
    window.location.href = '/';
  }

  async function handleComplete() {
    if (!user || saving) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    if (currentWeight) await saveWeightEntry(user.uid, { date: today, weight: parseFloat(currentWeight) });
    await updateUserProfile(user.uid, {
      goalWeight: parseFloat(goalWeight) || 0,
      goalWorkouts: selectedDays.size,
      endDate, startDate: today,
      onboardingCompleted: true,
      language: selectedLang,
    });
    if (selectedDays.size > 0) {
      const plan = await getUserPlan(user.uid);
      const updatedPlan = plan.map((day) => ({ ...day, isRest: !selectedDays.has(day.dayOfWeek) }));
      await saveUserPlan(user.uid, updatedPlan);
    }
    router.replace('/');
  }

  if (!user) return null;

  const progressBar = (activeSteps: number) => (
    <div className="flex gap-1.5 mb-8">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < activeSteps ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
      ))}
    </div>
  );

  // Step 0: Language selection
  if (step === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 px-6 py-12">
        <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
          {progressBar(1)}
          <div className="mb-8">
            <div className="text-4xl mb-3">🌍</div>
            <h1 className="text-2xl font-bold text-zinc-100">{t.onboarding.stepLang.title}</h1>
            <p className="text-zinc-500 text-sm mt-1">{t.onboarding.stepLang.subtitle}</p>
          </div>
          <div className="space-y-3 mb-8">
            {([['pt', '🇧🇷', 'Português'], ['en', '🇺🇸', 'English']] as [Lang, string, string][]).map(([l, flag, name]) => (
              <button
                key={l}
                onClick={() => handleSelectLang(l)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  selectedLang === l
                    ? 'bg-emerald-500/15 border-emerald-500'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="text-3xl">{flag}</span>
                <span className={`text-base font-semibold ${selectedLang === l ? 'text-emerald-400' : 'text-zinc-200'}`}>{name}</span>
                {selectedLang === l && <span className="ml-auto text-emerald-400">✓</span>}
              </button>
            ))}
          </div>
          <div className="mt-auto">
            <button
              onClick={() => setStep(1)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-2xl transition-colors"
            >
              {t.onboarding.stepLang.next}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Done
  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">{t.onboarding.stepDone.title}</h1>
          <p className="text-zinc-400 text-sm mb-8">{t.onboarding.stepDone.subtitle}</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-8 text-left">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{t.onboarding.stepDone.tipTitle}</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{t.onboarding.stepDone.tipText}</p>
          </div>
          <button
            onClick={handleComplete}
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
          >
            {saving ? t.onboarding.stepDone.saving : t.onboarding.stepDone.btn}
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Training days
  if (step === 2) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 px-6 py-12">
        <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
          {progressBar(3)}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-100">{t.onboarding.stepDays.title}</h1>
            <p className="text-zinc-500 text-sm mt-1">{t.onboarding.stepDays.subtitle}</p>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-6">
            {t.onboarding.days.map((day, i) => {
              const selected = selectedDays.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`flex flex-col items-center py-3 rounded-xl border transition-all ${
                    selected ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-semibold">{day}</span>
                  {selected && <span className="text-emerald-500 text-xs mt-1">•</span>}
                </button>
              );
            })}
          </div>
          {selectedDays.size > 0 && (
            <p className="text-center text-sm text-zinc-400 mb-4">{t.onboarding.stepDays.daysCount(selectedDays.size)}</p>
          )}
          <div className="mt-auto flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-2xl border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-600 transition-colors">{t.onboarding.stepDays.back}</button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors">
              {selectedDays.size > 0 ? t.onboarding.stepDays.finish : t.onboarding.stepDays.skip}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Goals
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 px-6 py-12">
      <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
        {progressBar(2)}
        <div className="mb-8">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-2xl font-bold text-zinc-100">{t.onboarding.stepGoals.subtitle.split('.')[0]}, {user.displayName?.split(' ')[0] ?? ''}!</h1>
          <p className="text-zinc-500 text-sm mt-1">{t.onboarding.stepGoals.subtitle}</p>
        </div>
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">{t.onboarding.stepGoals.currentWeight}</label>
            <input type="number" step="0.1" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)}
              placeholder={t.onboarding.stepGoals.currentWeightPlaceholder}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">{t.onboarding.stepGoals.goalWeight}</label>
            <input type="number" step="0.1" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)}
              placeholder={t.onboarding.stepGoals.goalWeightPlaceholder}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">{t.onboarding.stepGoals.endDate}</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
        </div>
        <div className="mt-auto space-y-3">
          <button onClick={() => setStep(2)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-2xl transition-colors">
            {t.onboarding.stepGoals.next}
          </button>
          <button onClick={handleSkipAll} disabled={saving}
            className="w-full text-zinc-500 hover:text-zinc-300 text-sm py-2 transition-colors disabled:opacity-40">
            {t.onboarding.stepGoals.skipAll}
          </button>
        </div>
      </div>
    </div>
  );
}
