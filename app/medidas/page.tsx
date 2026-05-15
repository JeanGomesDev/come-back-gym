'use client';

import { useState, useEffect } from 'react';
import { getMeasurements, saveMeasurement } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { BodyMeasurement } from '@/lib/types';

export default function MedidasPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [form, setForm] = useState<Partial<BodyMeasurement>>({});
  const [saved, setSaved] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const FIELDS: { key: keyof BodyMeasurement; label: string }[] = [
    { key: 'ombro', label: t.medidas.fields.ombro },
    { key: 'peito', label: t.medidas.fields.peito },
    { key: 'gluteo', label: t.medidas.fields.gluteo },
    { key: 'abdomen', label: t.medidas.fields.abdomen },
    { key: 'cintura', label: t.medidas.fields.cintura },
    { key: 'bicepeD', label: t.medidas.fields.bicepeD },
    { key: 'bicepeE', label: t.medidas.fields.bicepeE },
    { key: 'antebracoD', label: t.medidas.fields.antebracoD },
    { key: 'antebracoE', label: t.medidas.fields.antebracoE },
    { key: 'coxaD', label: t.medidas.fields.coxaD },
    { key: 'coxaE', label: t.medidas.fields.coxaE },
    { key: 'panturrilhaD', label: t.medidas.fields.panturrilhaD },
    { key: 'panturrilhaE', label: t.medidas.fields.panturrilhaE },
  ];

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    getMeasurements(user.uid).then((data) => {
      setMeasurements(data);
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, [user]);

  if (loadingData) {
    return <div className="text-zinc-500 text-sm p-4">{t.loading}</div>;
  }

  const latest = measurements[measurements.length - 1];
  const initial = measurements[0];

  async function handleSave() {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const base = latest ?? ({} as BodyMeasurement);
    const entry = { ...base, ...form, date: today } as BodyMeasurement;
    await saveMeasurement(user.uid, entry);
    setMeasurements((prev) => {
      const filtered = prev.filter((m) => m.date !== today);
      return [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
    });
    setSaved(true);
    setForm({});
    setTimeout(() => setSaved(false), 2000);
  }

  function diff(key: keyof BodyMeasurement): string {
    if (!latest || !initial || key === 'date') return '';
    const cur = latest[key] as number;
    const ini = initial[key] as number;
    if (cur === ini) return '';
    const d = cur - ini;
    return d > 0 ? `+${d.toFixed(1)}` : `${d.toFixed(1)}`;
  }

  function diffColor(key: keyof BodyMeasurement): string {
    if (!latest || !initial || key === 'date') return '';
    const cur = latest[key] as number;
    const ini = initial[key] as number;
    if (cur > ini) return 'text-emerald-400';
    if (cur < ini) return 'text-red-400';
    return 'text-zinc-500';
  }

  if (!initial) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">{t.medidas.title}</h1>
        <p className="text-zinc-500 text-sm mb-6">{t.medidas.noData}</p>

        {/* Add new measurement */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">{t.medidas.newMeasurement}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-zinc-500 block mb-1">{label} (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={(form[key] as number | undefined) ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || undefined }))}
                  placeholder="0"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saved ? t.medidas.saved : t.medidas.save}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100 mb-1">{t.medidas.title}</h1>
      <p className="text-zinc-500 text-sm mb-6">
        {t.medidas.initial}: {new Date(initial.date + 'T12:00:00').toLocaleDateString(t.medidas.locale)}
        {latest && latest.date !== initial.date && (
          <> · {t.medidas.latest}: {new Date(latest.date + 'T12:00:00').toLocaleDateString(t.medidas.locale)}</>
        )}
      </p>

      {/* Comparison table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
        <div className="grid grid-cols-4 gap-0 border-b border-zinc-800 px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
          <span>{t.medidas.tableHeaders.muscle}</span>
          <span className="text-center">{t.medidas.tableHeaders.initial}</span>
          <span className="text-center">{t.medidas.tableHeaders.current}</span>
          <span className="text-right">{t.medidas.tableHeaders.change}</span>
        </div>
        {FIELDS.map(({ key, label }) => (
          <div key={key} className="grid grid-cols-4 gap-0 px-4 py-2.5 border-b border-zinc-800/50 last:border-0">
            <span className="text-sm text-zinc-300">{label}</span>
            <span className="text-sm text-zinc-500 text-center">{initial[key] as number} cm</span>
            <span className="text-sm text-zinc-200 text-center font-medium">
              {latest ? (latest[key] as number) : (initial[key] as number)} cm
            </span>
            <span className={`text-xs text-right font-semibold ${diffColor(key)}`}>
              {diff(key) || '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Add new measurement */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">{t.medidas.newMeasurement}</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-zinc-500 block mb-1">{label} (cm)</label>
              <input
                type="number"
                step="0.1"
                value={(form[key] as number | undefined) ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || undefined }))}
                placeholder={String(latest ? (latest[key] as number) : (initial[key] as number))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {saved ? t.medidas.saved : t.medidas.save}
        </button>
      </div>
    </div>
  );
}
