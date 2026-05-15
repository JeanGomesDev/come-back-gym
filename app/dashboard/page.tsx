'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { getUserProfile, getWorkoutSessions, getWeightHistory, saveWeightEntry, updateUserProfile, UserProfile } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { WorkoutSession, WeightEntry } from '@/lib/types';

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
  const { user } = useAuth();
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [weightSaved, setWeightSaved] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalForm, setGoalForm] = useState({ goalWeight: '', goalWorkouts: '', endDate: '' });

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    Promise.all([
      getUserProfile(user.uid),
      getWorkoutSessions(user.uid),
      getWeightHistory(user.uid),
    ]).then(([prof, sess, weights]) => {
      setProfile(prof);
      setSessions(sess);
      setWeightHistory(weights);
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, [user]);

  async function handleAddWeight() {
    if (!newWeight || !user) return;
    const today = new Date().toISOString().split('T')[0];
    const entry: WeightEntry = { date: today, weight: parseFloat(newWeight) };
    await saveWeightEntry(user.uid, entry);
    setWeightHistory((prev) => {
      const filtered = prev.filter((w) => w.date !== today);
      return [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
    });
    setNewWeight('');
    setWeightSaved(true);
    setTimeout(() => setWeightSaved(false), 2000);
  }

  async function handleSaveGoals() {
    if (!user || !profile) return;
    const updated: Partial<UserProfile> = {
      goalWeight: parseFloat(goalForm.goalWeight) || profile.goalWeight,
      goalWorkouts: parseInt(goalForm.goalWorkouts) || profile.goalWorkouts,
      endDate: goalForm.endDate || profile.endDate,
    };
    await updateUserProfile(user.uid, updated);
    setProfile((p) => ({ ...p!, ...updated }));
    setEditingGoals(false);
  }

  if (loadingData) return <div className="text-zinc-500 text-sm p-4">{t.loading}</div>;
  if (!profile) return null;

  const totalWorkouts = sessions.length;
  const goal = profile.goalWorkouts;
  const progress = Math.min((totalWorkouts / goal) * 100, 100);
  const lastWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : null;
  const firstName = user?.displayName?.split(' ')[0] ?? 'Você';

  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (sessions.find((s) => s.date === d.toISOString().split('T')[0])) streak++;
    else if (i > 0) break;
  }

  const monthMap: Record<string, number> = {};
  sessions.forEach((s) => {
    const month = s.date.slice(0, 7);
    monthMap[month] = (monthMap[month] || 0) + 1;
  });
  const monthData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      name: new Date(month + '-01').toLocaleDateString(t.dashboard.locale, { month: 'short' }),
      treinos: count,
    }));

  const weightData = weightHistory.map((w) => ({
    date: new Date(w.date).toLocaleDateString(t.dashboard.locale, { day: '2-digit', month: 'short' }),
    peso: w.weight,
  }));

  const endDate = new Date(profile.endDate);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86400000));
  const remaining = goal - totalWorkouts;
  const recentSessions = sortedSessions.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-zinc-100">{t.dashboard.title}</h1>
        <button
          onClick={() => {
            setGoalForm({
              goalWeight: String(profile.goalWeight),
              goalWorkouts: String(profile.goalWorkouts),
              endDate: profile.endDate,
            });
            setEditingGoals(true);
          }}
          className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-xl transition-colors"
        >
          {t.dashboard.goalsBtn}
        </button>
      </div>
      <p className="text-zinc-500 text-sm mb-6">
        {t.dashboard.greeting(firstName, new Date().getFullYear())}
      </p>

      {/* Edit goals modal */}
      {editingGoals && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-zinc-100">{t.dashboard.editGoals.title}</h2>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">{t.dashboard.editGoals.goalWeight}</label>
              <input type="number" step="0.1" value={goalForm.goalWeight}
                onChange={(e) => setGoalForm((f) => ({ ...f, goalWeight: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">{t.dashboard.editGoals.goalWorkouts}</label>
              <input type="number" value={goalForm.goalWorkouts}
                onChange={(e) => setGoalForm((f) => ({ ...f, goalWorkouts: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">{t.dashboard.editGoals.endDate}</label>
              <input type="date" value={goalForm.endDate}
                onChange={(e) => setGoalForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditingGoals(false)} className="flex-1 py-2 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 transition-colors">{t.dashboard.editGoals.cancel}</button>
              <button onClick={handleSaveGoals} className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">{t.dashboard.editGoals.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* Main goal */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-zinc-300">{t.dashboard.goalCard.title}</p>
          <p className="text-sm font-bold text-emerald-400">{totalWorkouts}/{goal}</p>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{remaining > 0 ? t.dashboard.goalCard.remaining(remaining) : t.dashboard.goalCard.goalReached}</span>
          <span>{t.dashboard.goalCard.daysLeft(daysLeft, new Date(profile.endDate).toLocaleDateString(t.dashboard.locale, { day: '2-digit', month: 'short' }))}</span>
        </div>
        {daysLeft > 0 && remaining > 0 && (
          <p className="text-xs text-zinc-600 mt-2">{t.dashboard.goalCard.pace((remaining / (daysLeft / 7)).toFixed(1))}</p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label={t.dashboard.stats.workoutsDone} value={totalWorkouts} sub={t.dashboard.stats.workoutsSub(goal, new Date().getFullYear())} color="emerald" />
        <StatCard label={t.dashboard.stats.streak} value={t.dashboard.stats.daysLabel(streak)} sub={t.dashboard.stats.streakSub} color="orange" />
        {lastWeight !== null ? (
          <>
            <StatCard label={t.dashboard.stats.currentWeight} value={`${lastWeight} kg`} sub={profile.goalWeight > 0 ? t.dashboard.stats.goalWeight(profile.goalWeight) : undefined} color="blue" />
            {profile.goalWeight > 0 && (
              <StatCard
                label={lastWeight < profile.goalWeight ? t.dashboard.stats.toGain : t.dashboard.stats.toLose}
                value={`${Math.abs(profile.goalWeight - lastWeight).toFixed(1)} kg`}
                sub={t.dashboard.stats.ofMass}
                color="purple"
              />
            )}
          </>
        ) : (
          <StatCard label={t.dashboard.stats.currentWeight} value="—" sub={t.dashboard.stats.addWeight} color="blue" />
        )}
      </div>

      {/* Monthly chart */}
      {monthData.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">{t.dashboard.charts.monthly}</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={monthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa', fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="treinos" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weight tracker */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">{t.dashboard.charts.weightEvolution}</h2>
        {weightData.length > 1 && (
          <ResponsiveContainer width="100%" height={120} className="mb-3">
            <LineChart data={weightData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa', fontSize: 12 }} />
              <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="flex gap-2">
          <input type="number" value={newWeight} onChange={(e) => setNewWeight(e.target.value)}
            placeholder={t.dashboard.weight.placeholder} step="0.1"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500" />
          <button onClick={handleAddWeight} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            {weightSaved ? t.dashboard.weight.saved : t.dashboard.weight.add}
          </button>
        </div>
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">{t.dashboard.recent.title}</h2>
          <div className="space-y-2">
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-start gap-3 py-2 border-b border-zinc-800 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                  {s.workoutId.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 font-medium">{s.workoutId}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(s.date + 'T12:00:00').toLocaleDateString(t.dashboard.locale)}
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
