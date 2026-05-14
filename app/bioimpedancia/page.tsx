'use client';

import { useState, useEffect } from 'react';
import { getState, addBioimpedancia } from '@/lib/storage';
import { BioimpedanciaEntry } from '@/lib/types';

type BioField = {
  key: keyof BioimpedanciaEntry;
  label: string;
  unit: string;
};

const BIO_FIELDS: BioField[] = [
  { key: 'peso', label: 'Peso', unit: 'kg' },
  { key: 'imc', label: 'IMC', unit: '' },
  { key: 'gorduraCorporal', label: 'Gordura Corporal', unit: '%' },
  { key: 'musculoEsqueletico', label: 'Músculo Esquelético', unit: '%' },
  { key: 'massaLivreGordura', label: 'Massa Livre de Gordura', unit: 'kg' },
  { key: 'gorduraSubcutanea', label: 'Gordura Subcutânea', unit: '%' },
  { key: 'gorduraVisceral', label: 'Gordura Visceral', unit: '' },
  { key: 'aguaCorporal', label: 'Água Corporal', unit: '%' },
  { key: 'massaMuscular', label: 'Massa Muscular', unit: 'kg' },
  { key: 'massaOssea', label: 'Massa Óssea', unit: 'kg' },
  { key: 'proteina', label: 'Proteína', unit: '%' },
  { key: 'tmb', label: 'TMB', unit: 'kcal' },
  { key: 'idadeMetabolica', label: 'Idade Metabólica', unit: 'anos' },
];

const INITIAL_STATUSES: Record<string, { label: string; color: string }> = {
  peso: { label: 'Média', color: 'text-yellow-400' },
  imc: { label: 'Média', color: 'text-yellow-400' },
  gorduraCorporal: { label: 'Média', color: 'text-yellow-400' },
  musculoEsqueletico: { label: 'Média', color: 'text-yellow-400' },
  massaLivreGordura: { label: 'Média', color: 'text-yellow-400' },
  gorduraSubcutanea: { label: 'Alta', color: 'text-orange-400' },
  gorduraVisceral: { label: 'Excelente ✅', color: 'text-emerald-400' },
  aguaCorporal: { label: 'Média', color: 'text-yellow-400' },
  massaMuscular: { label: 'Média', color: 'text-yellow-400' },
  massaOssea: { label: 'Média', color: 'text-yellow-400' },
  proteina: { label: 'Alta ✅', color: 'text-emerald-400' },
  tmb: { label: 'Média', color: 'text-yellow-400' },
  idadeMetabolica: { label: 'Excelente ✅', color: 'text-emerald-400' },
};

export default function BioimpedanciaPage() {
  const [entries, setEntries] = useState<BioimpedanciaEntry[]>([]);
  const [form, setForm] = useState<Partial<BioimpedanciaEntry>>({});
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const state = getState();
    setEntries(state.bioimpedancia);
  }, []);

  const latest = entries[entries.length - 1];
  const initial = entries[0];

  function handleSave() {
    if (!form.peso) return;
    const today = new Date().toISOString().split('T')[0];
    const entry = { ...latest, ...form, date: today } as BioimpedanciaEntry;
    addBioimpedancia(entry);
    setEntries(getState().bioimpedancia);
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
      <h1 className="text-2xl font-bold text-zinc-100 mb-1">Bioimpedância</h1>
      <p className="text-zinc-500 text-sm mb-6">
        {initial ? new Date(initial.date + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
        {latest && latest !== initial ? ` · Última: ${new Date(latest.date + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
      </p>

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
        {showForm ? '✕ Cancelar' : '+ Nova Bioimpedância'}
      </button>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">Nova Medição</h2>
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
            {saved ? '✓ Salvo!' : 'Salvar Bioimpedância'}
          </button>
        </div>
      )}

      {entries.length > 1 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">Histórico</h2>
          <div className="space-y-2">
            {[...entries].reverse().map((entry) => (
              <div key={entry.date} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {entry.gorduraCorporal}% gordura · {entry.massaMuscular}kg músculo
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
