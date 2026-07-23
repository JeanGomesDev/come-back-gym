'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getUserGroups, searchPublicUsers, createGroup, Group, PublicUserProfile } from '@/lib/firestore';

export default function SocialPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isPt = lang === 'pt';

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Create group form state
  const [groupName, setGroupName] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<PublicUserProfile[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserGroups(user.uid).then((g) => {
      setGroups(g);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  async function handleSearch() {
    if (!emailSearch.trim() || !user) return;
    setSearching(true);
    const results = await searchPublicUsers(emailSearch.trim());
    setSearchResults(results.filter((r) => r.uid !== user.uid));
    setSearching(false);
  }

  function toggleMember(u: PublicUserProfile) {
    setSelectedMembers((prev) => {
      const exists = prev.find((m) => m.uid === u.uid);
      if (exists) return prev.filter((m) => m.uid !== u.uid);
      return [...prev, u];
    });
  }

  async function handleCreate() {
    if (!user || !groupName.trim()) return;
    setSaving(true);
    const id = await createGroup(groupName.trim(), user.uid, selectedMembers.map((m) => m.uid));
    setGroups((prev) => [...prev, {
      id,
      name: groupName.trim(),
      createdBy: user.uid,
      memberUids: [user.uid, ...selectedMembers.map((m) => m.uid)],
      createdAt: new Date().toISOString().split('T')[0],
    }]);
    setCreating(false);
    setGroupName('');
    setSelectedMembers([]);
    setEmailSearch('');
    setSearchResults([]);
    setSaving(false);
  }

  if (loading) return <div className="text-zinc-500 text-sm p-4">{isPt ? 'Carregando...' : 'Loading...'}</div>;

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-zinc-100">{isPt ? 'Social' : 'Social'}</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {isPt ? 'Novo grupo' : 'New group'}
        </button>
      </div>
      <p className="text-zinc-500 text-sm mb-6">
        {isPt ? 'Compete com amigos e acompanhe quem está treinando' : 'Compete with friends and see who is training'}
      </p>

      {/* Groups list */}
      {groups.length === 0 && !creating ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <svg className="w-7 h-7 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <h2 className="text-lg font-bold text-zinc-100 mb-2">{isPt ? 'Nenhum grupo ainda' : 'No groups yet'}</h2>
          <p className="text-zinc-500 text-sm mb-6 max-w-xs">
            {isPt
              ? 'Crie um grupo com seus amigos e veja quem está mais consistente na academia.'
              : 'Create a group with your friends and see who is most consistent at the gym.'}
          </p>
          <button
            onClick={() => setCreating(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-2xl transition-colors"
          >
            {isPt ? 'Criar meu primeiro grupo' : 'Create my first group'}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 mb-6">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/social/grupos/${g.id}`}
              className="block bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {g.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100">{g.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {g.memberUids.length} {isPt ? 'membros' : 'members'}
                    {g.createdBy === user?.uid && (
                      <span className="ml-2 text-emerald-500/70">{isPt ? '· criador' : '· owner'}</span>
                    )}
                  </p>
                </div>
                <svg className="w-4 h-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create group sheet */}
      {creating && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={() => setCreating(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-200">
            <div className="max-w-2xl mx-auto bg-zinc-900 border-t border-zinc-700/60 rounded-t-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-zinc-700 rounded-full" />
              </div>

              <div className="px-5 py-4 border-b border-zinc-800">
                <h2 className="text-base font-bold text-zinc-100">{isPt ? 'Criar novo grupo' : 'Create new group'}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{isPt ? 'Adicione um nome e convide amigos pelo email' : 'Add a name and invite friends by email'}</p>
              </div>

              <div className="p-5 space-y-5">
                {/* Group name */}
                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">{isPt ? 'Nome do grupo' : 'Group name'}</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder={isPt ? 'Ex: Academia Bros' : 'E.g. Gym Squad'}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>

                {/* Member search */}
                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">{isPt ? 'Buscar amigo por email' : 'Search friend by email'}</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailSearch}
                      onChange={(e) => setEmailSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder={isPt ? 'amigo@gmail.com' : 'friend@gmail.com'}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={searching}
                      className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      {searching ? '…' : isPt ? 'Buscar' : 'Search'}
                    </button>
                  </div>

                  {/* Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {searchResults.map((u) => {
                        const selected = !!selectedMembers.find((m) => m.uid === u.uid);
                        return (
                          <button
                            key={u.uid}
                            onClick={() => toggleMember(u)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                              selected ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-zinc-800 hover:bg-zinc-700'
                            }`}
                          >
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
                            {selected ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full border border-zinc-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {searchResults.length === 0 && emailSearch && !searching && (
                    <p className="text-xs text-zinc-600 mt-2 text-center">
                      {isPt ? 'Nenhum usuário encontrado com esse email.' : 'No user found with this email.'}
                    </p>
                  )}
                </div>

                {/* Selected members */}
                {selectedMembers.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-400 mb-2">{isPt ? 'Membros selecionados:' : 'Selected members:'}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((m) => (
                        <span
                          key={m.uid}
                          className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-1 rounded-full"
                        >
                          {m.displayName || m.email.split('@')[0]}
                          <button onClick={() => toggleMember(m)} className="hover:text-white">✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pb-2">
                  <button
                    onClick={() => setCreating(false)}
                    className="flex-1 py-3 rounded-2xl border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-600 transition-colors"
                  >
                    {isPt ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!groupName.trim() || saving}
                    className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                  >
                    {saving ? '…' : isPt ? 'Criar grupo' : 'Create group'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
