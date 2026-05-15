'use client';

import { useState, useEffect } from 'react';
import { getBioimpedancia, saveBioimpedancia } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { BioimpedanciaEntry } from '@/lib/types';

type BioField = {
  key: keyof BioimpedanciaEntry;
  label: string;
  unit: string;
};

export default function BioimpedanciaPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [entries, setEntries] = useState<BioimpedanciaEntry[]>([]);
  const [form, setForm] = useState<Partial<BioimpedanciaEntry>>({});
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const BIO_FIELDS: BioField[] = [
    { key: 'peso', label: t.bio.fields.peso, unit: t.bio.units.peso },
    { key: 'imc', label: t.bio.fields.imc, unit: t.bio.units.imc },
    { key: 'gorduraCorporal', label: t.bio.fields.gorduraCorporal, unit: t.bio.units.gorduraCorporal },
    { key: 'musculoEsqueletico', label: t.bio.fields.musculoEsqueletico, unit: t.bio.units.musculoEsqueletico },
    { key: 'massaLivreGordura', label: t.bio.fields.massaLivreGordura, unit: t.bio.units.massaLivreGordura },
    { key: 'gorduraSubcutanea', label: t.bio.fields.gorduraSubcutanea, unit: t.bio.units.gorduraSubcutanea },
    { key: 'gorduraVisceral', label: t.bio.fields.gorduraVisceral, unit: t.bio.units.gorduraVisceral },
    { key: 'aguaCorporal', label: t.bio.fields.aguaCorporal, unit: t.bio.units.aguaCorporal },
    { key: 'massaMuscular', label: t.bio.fields.massaMuscular, unit: t.bio.units.massaMuscular },
    { key: 'massaOssea', label: t.bio.fields.massaOssea, unit: t.bio.units.massaOssea },
    { key: 'proteina', label: t.bio.fields.proteina, unit: t.bio.units.proteina },
    { key: 'tmb', label: t.bio.fields.tmb, unit: t.bio.units.tmb },
    { key: 'idadeMetabolica', label: t.bio.fields.idadeMetabolica, unit: t.bio.units.idadeMetabolica },
  ];

  const INITIAL_STATUSES: Record<string, { label: string; color: string }> = {
    peso: { label: t.bio.statuses.media, color: 'text-yellow-400' },
    imc: { label: t.bio.statuses.media, color: 'text-yellow-400' },
    gorduraCorporal: { label: t.bio.statuses.media, color: 'text-yellow-400' },
    musculoEsqueletico: { label: t.bio.statuses.media, color: 'text-yellow-400' },
    massaLivreGordura: { label: t.bio.statuses.media, color: 'text-yellow-400' },
    gorduraSubcutanea: { label: t.bio.statuses.alta, color: 'text-orange-400' },
    gorduraVisceral: { label: t.bio.statuses.excelente, color: 'text-emerald-400' },
    aguaCorporal: { label: t.bio.statuses.media, color: 'text-yellow-400' },
    massaMuscular: { label: t.bio.statuses.media, color: 'text-yellow-400' },
    massaOssea: { label: t.bio.statuses.media, color: 'text-yellow-400' },
    proteina: { label: t.bio.statuses.altaOk, color: 'text-emerald-400' },
    tmb: { label: t.bio.statuses.media, color: 'text-yellow-400' },
    idadeMetabolica: { label: t.bio.statuses.excelente, color: 'text-emerald-400' },
  };

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    getBioimpedancia(user.uid).then((data) => {
      setEntries(data);
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, [user]);

  if (loadingData) {
    return <div className="text-zinc-500 text-sm p-4">{t.loading}</div>;
  }

  const latest = entries[entries.length - 1];
  const initial = entries[0];

  async function handleSave() {
    if (!form.peso || !user) return;
    const today = new Date().toISOString().split('T')[0];
    const entry = { ...latest, ...form, date: today } as BioimpedanciaEntry;
    await saveBioimpedancia(user.uid, entry);
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== today);
      return [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
    });
    setSaved(true);
    setForm({});
    setShowForm(false);
    setTimeout(() => setSaved(false), 2000);
  }

  function diff(key: keyof BioimpedanciaEntry): string {
    if (!latest || !initial || key === 'date' || entries.length < 2) return '';
    const cur = latest[key] as number;
    const ini = initial[key] as number;
    if (cur === ini) return '';
    const d = cur - ini;
    return d > 0 ? `+${d.toFixed(1)}` : `${d.toFixed(1)}`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100 mb-1">{t.bio.title}</h1>
      <p className="text-zinc-500 text-sm mb-6">
        {initial ? new Date(initial.date + 'T12:00:00').toLocaleDateString(t.bio.locale) : ''}
        {latest && latest !== initial ? ` · ${t.bio.history}: ${new Date(latest.date + 'T12:00:00').toLocaleDateString(t.bio.locale)}` : ''}
      </p>

      {!initial && (
        <p className="text-zinc-500 text-sm mb-4">{t.bio.noData}</p>
      )}

      {latest && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
          {BIO_FIELDS.map(({ key, label, unit }) => {
            const val = latest[key];
            const d = diff(key);
            const status = INITIAL_STATUSES[key as string];
            return (
              <div key={key} className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50 last:border-0">
                <div className="flex-1">
                  <p className="text-sm text-zinc-300">{label}</p>
                  {status && <p className={`text-xs ${status.color}`}>{status.label}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-100">
                    {typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(2)) : val}
                    {unit && ` ${unit}`}
                  </p>
                  {d && (
                    <p className={`text-xs font-semibold ${parseFloat(d) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {d}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-semibold py-3 rounded-xl transition-colors mb-4"
      >
        {showForm ? t.bio.cancelBio : t.bio.newBio}
      </button>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">{t.bio.newMeasurement}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {BIO_FIELDS.map(({ key, label, unit }) => (
              <div key={key}>
                <label className="text-xs text-zinc-500 block mb-1">
                  {label} {unit && `(${unit})`}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={(form[key] as number | undefined) ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || undefined }))}
                  placeholder={latest ? String(latest[key]) : ''}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saved ? t.bio.saved : t.bio.save}
          </button>
        </div>
      )}

      {entries.length > 1 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">{t.bio.history}</h2>
          <div className="space-y-2">
            {[...entries].reverse().map((entry) => (
              <div key={entry.date} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {new Date(entry.date + 'T12:00:00').toLocaleDateString(t.bio.locale)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {entry.gorduraCorporal}% {t.bio.fatLabel} · {entry.massaMuscular}kg {t.bio.muscleLabel}
                  </p>
                </div>
                <p className="text-lg font-bold text-zinc-100">{entry.peso} kg</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
