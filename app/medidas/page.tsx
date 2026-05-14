'use client';

import { useState, useEffect } from 'react';
import { getMeasurements, saveMeasurement } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import { BodyMeasurement } from '@/lib/types';

const FIELDS: { key: keyof BodyMeasurement; label: string }[] = [
  { key: 'ombro', label: 'Ombro' },
  { key: 'peito', label: 'Peito' },
  { key: 'gluteo', label: 'Glúteo' },
  { key: 'abdomen', label: 'Abdômen' },
  { key: 'cintura', label: 'Cintura' },
  { key: 'bicepeD', label: 'Bíceps D' },
  { key: 'bicepeE', label: 'Bíceps E' },
  { key: 'antebracoD', label: 'Antebraço D' },
  { key: 'antebracoE', label: 'Antebraço E' },
  { key: 'coxaD', label: 'Coxa D' },
  { key: 'coxaE', label: 'Coxa E' },
  { key: 'panturrilhaD', label: 'Panturrilha D' },
  { key: 'panturrilhaE', label: 'Panturrilha E' },
];

export default function MedidasPage() {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [form, setForm] = useState<Partial<BodyMeasurement>>({});
  const [saved, setSaved] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    getMeasurements(user.uid).then((data) => {
      setMeasurements(data);
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, [user]);

  if (loadingData) {
    return <div className="text-zinc-500 text-sm p-4">Carregando...</div>;
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
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Medidas Corporais</h1>
        <p className="text-zinc-500 text-sm mb-6">Nenhuma medida registrada ainda</p>

        {/* Add new measurement */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">Nova Medição</h2>
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
            {saved ? '✓ Salvo!' : 'Salvar Medidas'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100 mb-1">Medidas Corporais</h1>
      <p className="text-zinc-500 text-sm mb-6">
        Inicial: {new Date(initial.date + 'T12:00:00').toLocaleDateString('pt-BR')}
        {latest && latest.date !== initial.date && (
          <> · Última: {new Date(latest.date + 'T12:00:00').toLocaleDateString('pt-BR')}</>
        )}
      </p>

      {/* Comparison table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
        <div className="grid grid-cols-4 gap-0 border-b border-zinc-800 px-4 py-2 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
          <span>Músculo</span>
          <span className="text-center">Inicial</span>
          <span className="text-center">Atual</span>
          <span className="text-right">Δ</span>
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
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Nova Medição</h2>
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
          {saved ? '✓ Salvo!' : 'Salvar Medidas'}
        </button>
      </div>
    </div>
  );
}
