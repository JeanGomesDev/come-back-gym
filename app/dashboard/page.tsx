'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { getState, addWeightEntry } from '@/lib/storage';
import { AppState } from '@/lib/types';

function StatCard({ label, value, sub, color = 'emerald' }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color] || colorMap.emerald}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [newWeight, setNewWeight] = useState('');
  const [weightSaved, setWeightSaved] = useState(false);

  useEffect(() => {
    setState(getState());
  }, []);

  function handleAddWeight() {
    if (!newWeight || !state) return;
    const today = new Date().toISOString().split('T')[0];
    addWeightEntry({ date: today, weight: parseFloat(newWeight) });
    setState(getState());
    setNewWeight('');
    setWeightSaved(true);
    setTimeout(() => setWeightSaved(false), 2000);
  }

  if (!state) return <div className="text-zinc-500 text-sm">Carregando...</div>;

  const sessions = state.workoutSessions;
  const totalWorkouts = sessions.length;
  const goal = state.goalWorkouts;
  const progress = Math.min((totalWorkouts / goal) * 100, 100);

  const lastWeight = state.weightHistory.length > 0
    ? state.weightHistory[state.weightHistory.length - 1].weight
    : 61.8;

  // Streak calculation
  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (sessions.find((s) => s.date === dateStr)) streak++;
    else if (i > 0) break;
  }

  // Monthly chart data
  const monthMap: Record<string, number> = {};
  sessions.forEach((s) => {
    const month = s.date.slice(0, 7);
    monthMap[month] = (monthMap[month] || 0) + 1;
  });
  const monthData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      name: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
      treinos: count,
    }));

  // Weight chart
  const weightData = state.weightHistory.map((w) => ({
    date: new Date(w.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    peso: w.weight,
  }));

  // Days until end
  const endDate = new Date(state.endDate);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86400000));
  const remaining = goal - totalWorkouts;

  // Last 5 workouts
  const recentSessions = sortedSessions.slice(0, 5);

  const WORKOUT_NAMES: Record<string, string> = {
    A: 'Peito + Tríceps',
    B: 'Costas + Bíceps',
    C: 'Perna I',
    D: 'Ombro',
    E: 'Perna II',
    REST_TUE: 'Descanso',
    REST_SAT: 'Descanso',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100 mb-1">Dashboard</h1>
      <p className="text-zinc-500 text-sm mb-6">Meta 2026 — Jean, Dublin 🇮🇪</p>

      {/* Main goal */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-zinc-300">Meta de Treinos 2026</p>
          <p className="text-sm font-bold text-emerald-400">{totalWorkouts}/{goal}</p>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{remaining} treinos restantes</span>
          <span>{daysLeft} dias até 31/dez</span>
        </div>
        {daysLeft > 0 && remaining > 0 && (
          <p className="text-xs text-zinc-600 mt-2">
            Ritmo necessário: {(remaining / (daysLeft / 7)).toFixed(1)} treinos/semana
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="Treinos Feitos" value={totalWorkouts} sub={`de ${goal} em 2026`} color="emerald" />
        <StatCard label="Sequência" value={`${streak} dias`} sub="consecutivos" color="orange" />
        <StatCard label="Peso Atual" value={`${lastWeight} kg`} sub={`meta: ${state.goalWeight} kg`} color="blue" />
        <StatCard label="Falta Ganhar" value={`${(state.goalWeight - lastWeight).toFixed(1)} kg`} sub="de massa magra" color="purple" />
      </div>

      {/* Monthly chart */}
      {monthData.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Treinos por Mês</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={monthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa', fontSize: 12 }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="treinos" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weight tracker */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Evolução do Peso</h2>
        {weightData.length > 1 && (
          <ResponsiveContainer width="100%" height={120} className="mb-3">
            <LineChart data={weightData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa', fontSize: 12 }}
              />
              <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="flex gap-2">
          <input
            type="number"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder="Peso hoje (kg)"
            step="0.1"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleAddWeight}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            {weightSaved ? '✓' : 'Add'}
          </button>
        </div>
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">Treinos Recentes</h2>
          <div className="space-y-2">
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-start gap-3 py-2 border-b border-zinc-800 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                  {s.workoutId.replace('REST_TUE', 'R').replace('REST_SAT', 'R')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 font-medium">{WORKOUT_NAMES[s.workoutId] ?? s.workoutId}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(s.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    {s.duration > 0 && ` · ${s.duration} min`}
                  </p>
                  {s.notes && <p className="text-xs text-zinc-600 mt-0.5 truncate">{s.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
