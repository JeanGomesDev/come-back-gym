'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import {
  getGroup, getPublicUsers, addMemberToGroup, removeMemberFromGroup,
  deleteGroup, searchPublicUsers, Group, PublicUserProfile,
} from '@/lib/firestore';

type MemberWithScore = PublicUserProfile & { rank: number };

export default function GroupPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isPt = lang === 'pt';
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const groupId = params.id;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<MemberWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  // Add member flow
  const [addingMember, setAddingMember] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUid, setAddingUid] = useState<string | null>(null);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !groupId) return;
    Promise.all([getGroup(groupId)]).then(async ([g]) => {
      if (!g) { router.replace('/social'); return; }
      setGroup(g);
      const profiles = await getPublicUsers(g.memberUids);
      const ranked = profiles
        .sort((a, b) => (b.totalWorkouts || 0) - (a.totalWorkouts || 0))
        .map((m, i) => ({ ...m, rank: i + 1 }));
      setMembers(ranked);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, groupId, router]);

  async function handleSearch() {
    if (!emailSearch.trim()) return;
    setSearching(true);
    const results = await searchPublicUsers(emailSearch.trim());
    const memberUids = new Set(group?.memberUids ?? []);
    setSearchResults(results.filter((r) => !memberUids.has(r.uid)));
    setSearching(false);
  }

  async function handleAddMember(profile: PublicUserProfile) {
    if (!group) return;
    setAddingUid(profile.uid);
    await addMemberToGroup(group.id, profile.uid);
    setGroup((g) => g ? { ...g, memberUids: [...g.memberUids, profile.uid] } : g);
    setMembers((prev) => {
      const updated = [...prev, { ...profile, rank: prev.length + 1 }]
        .sort((a, b) => (b.totalWorkouts || 0) - (a.totalWorkouts || 0))
        .map((m, i) => ({ ...m, rank: i + 1 }));
      return updated;
    });
    setSearchResults((prev) => prev.filter((r) => r.uid !== profile.uid));
    setAddingUid(null);
  }

  async function handleRemoveSelf() {
    if (!user || !group) return;
    await removeMemberFromGroup(group.id, user.uid);
    router.replace('/social');
  }

  async function handleDelete() {
    if (!group) return;
    setDeleting(true);
    await deleteGroup(group.id);
    router.replace('/social');
  }

  const isCreator = group?.createdBy === user?.uid;

  const medals = ['🥇', '🥈', '🥉'];
  const maxWorkouts = members[0]?.totalWorkouts || 1;

  if (loading) return <div className="text-zinc-500 text-sm p-4">{isPt ? 'Carregando...' : 'Loading...'}</div>;
  if (!group) return null;

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-zinc-100 truncate">{group.name}</h1>
        </div>
      </div>
      <p className="text-zinc-500 text-sm mb-6 ml-11">
        {members.length} {isPt ? 'membros' : 'members'} · {isPt ? 'desde' : 'since'} {group.createdAt}
      </p>

      {/* Leaderboard */}
      <section className="mb-5">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">
          {isPt ? 'Classificação — total de treinos' : 'Leaderboard — total workouts'}
        </h2>
        <div className="space-y-2">
          {members.map((m) => {
            const isMe = m.uid === user?.uid;
            const barWidth = maxWorkouts > 0 ? Math.round((m.totalWorkouts / maxWorkouts) * 100) : 0;
            return (
              <div
                key={m.uid}
                className={`rounded-2xl border p-4 transition-all ${
                  isMe ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl w-8 text-center flex-shrink-0">
                    {m.rank <= 3 ? medals[m.rank - 1] : <span className="text-sm font-bold text-zinc-500">#{m.rank}</span>}
                  </span>
                  {m.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photoURL} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0">
                      {(m.displayName || m.email).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isMe ? 'text-emerald-300' : 'text-zinc-100'}`}>
                      {m.displayName || m.email.split('@')[0]}
                      {isMe && <span className="ml-1.5 text-xs text-emerald-500/70">{isPt ? '(você)' : '(you)'}</span>}
                    </p>
                    <p className="text-xs text-zinc-500">{m.email}</p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${isMe ? 'text-emerald-400' : 'text-zinc-300'}`}>
                    {m.totalWorkouts ?? 0}
                    <span className="text-xs font-normal text-zinc-500 ml-0.5">{isPt ? ' pts' : ' pts'}</span>
                  </span>
                </div>
                <div className="ml-11 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isMe ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add member (creator only) */}
      {isCreator && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {isPt ? 'Adicionar membro' : 'Add member'}
            </h2>
            <button
              onClick={() => setAddingMember(!addingMember)}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {addingMember ? (isPt ? 'Fechar' : 'Close') : (isPt ? '+ Adicionar' : '+ Add')}
            </button>
          </div>

          {addingMember && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={isPt ? 'email do amigo' : 'friend email'}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  {searching ? '…' : isPt ? 'Buscar' : 'Search'}
                </button>
              </div>

              {searchResults.map((u) => (
                <div key={u.uid} className="flex items-center gap-3">
                  {u.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0">
                      {(u.displayName || u.email).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{u.displayName || u.email}</p>
                    <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                  </div>
                  <button
                    onClick={() => handleAddMember(u)}
                    disabled={addingUid === u.uid}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors flex-shrink-0"
                  >
                    {addingUid === u.uid ? '…' : isPt ? 'Adicionar' : 'Add'}
                  </button>
                </div>
              ))}

              {searchResults.length === 0 && emailSearch && !searching && (
                <p className="text-xs text-zinc-600 text-center">
                  {isPt ? 'Nenhum usuário encontrado.' : 'No user found.'}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Leave / Delete */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">
          {isPt ? 'Zona de risco' : 'Danger zone'}
        </h2>
        {!isCreator ? (
          <button
            onClick={handleRemoveSelf}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors text-left"
          >
            <span className="text-xl">🚪</span>
            <div>
              <p className="text-sm font-medium text-zinc-300">{isPt ? 'Sair do grupo' : 'Leave group'}</p>
              <p className="text-xs text-zinc-500">{isPt ? 'Você deixa de ver o leaderboard' : 'You will no longer see the leaderboard'}</p>
            </div>
          </button>
        ) : (
          <div className={`rounded-2xl border overflow-hidden ${confirmDelete ? 'bg-red-500/5 border-red-500/25' : 'bg-zinc-900 border-zinc-800'}`}>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-800 transition-colors text-left"
              >
                <span className="text-xl">🗑️</span>
                <div>
                  <p className="text-sm font-medium text-zinc-300">{isPt ? 'Excluir grupo' : 'Delete group'}</p>
                  <p className="text-xs text-zinc-500">{isPt ? 'Remove o grupo para todos os membros' : 'Removes the group for all members'}</p>
                </div>
              </button>
            ) : (
              <div className="px-4 py-4 space-y-3">
                <p className="text-sm font-semibold text-zinc-100">{isPt ? 'Excluir grupo?' : 'Delete group?'}</p>
                <p className="text-xs text-zinc-500">{isPt ? 'Esta ação não pode ser desfeita.' : 'This action cannot be undone.'}</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-600 transition-colors">
                    {isPt ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-60 transition-colors">
                    {deleting ? '…' : isPt ? 'Sim, excluir' : 'Yes, delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
