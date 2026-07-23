'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import {
  getFriends, addFriend, removeFriend,
  getUserGroups, createGroup,
  searchPublicUsers,
  Group, FriendEntry, PublicUserProfile,
} from '@/lib/firestore';

type Tab = 'friends' | 'groups';

export default function SocialPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isPt = lang === 'pt';

  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Add friend sheet
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUid, setAddingUid] = useState<string | null>(null);

  // Create group sheet
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [savingGroup, setSavingGroup] = useState(false);

  // Remove friend confirm
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getFriends(user.uid), getUserGroups(user.uid)])
      .then(([f, g]) => { setFriends(f); setGroups(g); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  async function handleSearch() {
    if (!emailSearch.trim() || !user) return;
    setSearching(true);
    const results = await searchPublicUsers(emailSearch.trim());
    const friendUids = new Set(friends.map((f) => f.uid));
    setSearchResults(results.filter((r) => r.uid !== user.uid && !friendUids.has(r.uid)));
    setSearching(false);
  }

  async function handleAddFriend(p: PublicUserProfile) {
    if (!user) return;
    setAddingUid(p.uid);
    const entry: FriendEntry = {
      uid: p.uid,
      displayName: p.displayName || p.email.split('@')[0],
      photoURL: p.photoURL,
      email: p.email,
      addedAt: new Date().toISOString().split('T')[0],
    };
    await addFriend(user.uid, entry);
    setFriends((prev) => [...prev, entry]);
    setSearchResults((prev) => prev.filter((r) => r.uid !== p.uid));
    setAddingUid(null);
  }

  async function handleRemoveFriend(friendUid: string) {
    if (!user) return;
    await removeFriend(user.uid, friendUid);
    setFriends((prev) => prev.filter((f) => f.uid !== friendUid));
    setConfirmRemove(null);
  }

  function toggleFriendSelect(uid: string) {
    setSelectedFriends((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  }

  async function handleCreateGroup() {
    if (!user || !groupName.trim()) return;
    setSavingGroup(true);
    const memberUids = Array.from(selectedFriends);
    const id = await createGroup(groupName.trim(), user.uid, memberUids);
    setGroups((prev) => [...prev, {
      id, name: groupName.trim(), createdBy: user.uid,
      memberUids: [user.uid, ...memberUids],
      createdAt: new Date().toISOString().split('T')[0],
    }]);
    setCreateGroupOpen(false);
    setGroupName('');
    setSelectedFriends(new Set());
    setSavingGroup(false);
    setTab('groups');
  }

  function closeAddFriend() {
    setAddFriendOpen(false);
    setEmailSearch('');
    setSearchResults([]);
  }

  if (loading) return <div className="text-zinc-500 text-sm p-4">{isPt ? 'Carregando...' : 'Loading...'}</div>;

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-zinc-100">Social</h1>
        <button
          onClick={() => tab === 'friends' ? setAddFriendOpen(true) : setCreateGroupOpen(true)}
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {tab === 'friends' ? (isPt ? 'Adicionar amigo' : 'Add friend') : (isPt ? 'Novo grupo' : 'New group')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-1 mb-5">
        {(['friends', 'groups'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'friends' ? (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></svg>
                {isPt ? 'Amigos' : 'Friends'}
                {friends.length > 0 && <span className="bg-zinc-700 text-zinc-400 text-xs px-1.5 py-0.5 rounded-full">{friends.length}</span>}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                {isPt ? 'Grupos' : 'Groups'}
                {groups.length > 0 && <span className="bg-zinc-700 text-zinc-400 text-xs px-1.5 py-0.5 rounded-full">{groups.length}</span>}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Friends tab */}
      {tab === 'friends' && (
        <>
          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[35vh] text-center px-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <svg className="w-7 h-7 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
              </div>
              <h2 className="text-base font-bold text-zinc-100 mb-1">{isPt ? 'Nenhum amigo ainda' : 'No friends yet'}</h2>
              <p className="text-zinc-500 text-sm mb-5">
                {isPt ? 'Adicione amigos pelo email e depois monte grupos para competir.' : 'Add friends by email then create groups to compete.'}
              </p>
              <button onClick={() => setAddFriendOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm transition-colors">
                {isPt ? 'Adicionar primeiro amigo' : 'Add first friend'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div key={f.uid} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center gap-3">
                  {f.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.photoURL} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300 flex-shrink-0">
                      {(f.displayName || f.email).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-100 truncate">{f.displayName}</p>
                    <p className="text-xs text-zinc-500 truncate">{f.email}</p>
                  </div>
                  {confirmRemove === f.uid ? (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => setConfirmRemove(null)} className="text-xs text-zinc-400 px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors">
                        {isPt ? 'Não' : 'No'}
                      </button>
                      <button onClick={() => handleRemoveFriend(f.uid)} className="text-xs text-red-400 px-2.5 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-colors">
                        {isPt ? 'Remover' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmRemove(f.uid)} className="text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0 p-1">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Groups tab */}
      {tab === 'groups' && (
        <>
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[35vh] text-center px-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <svg className="w-7 h-7 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <h2 className="text-base font-bold text-zinc-100 mb-1">{isPt ? 'Nenhum grupo ainda' : 'No groups yet'}</h2>
              <p className="text-zinc-500 text-sm mb-5">
                {isPt
                  ? friends.length === 0
                    ? 'Adicione amigos primeiro, depois crie um grupo para competir.'
                    : 'Crie um grupo com seus amigos e veja quem treina mais.'
                  : friends.length === 0
                    ? 'Add friends first, then create a group to compete.'
                    : 'Create a group with your friends and see who trains more.'}
              </p>
              <button
                onClick={() => friends.length === 0 ? setTab('friends') : setCreateGroupOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm transition-colors"
              >
                {friends.length === 0 ? (isPt ? 'Adicionar amigos primeiro' : 'Add friends first') : (isPt ? 'Criar grupo' : 'Create group')}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {groups.map((g) => (
                <Link key={g.id} href={`/social/grupos/${g.id}`} className="block bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {g.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-100">{g.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {g.memberUids.length} {isPt ? 'membros' : 'members'}
                        {g.createdBy === user?.uid && <span className="ml-2 text-emerald-500/70">{isPt ? '· criador' : '· owner'}</span>}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add friend sheet */}
      {addFriendOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={closeAddFriend} />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-200">
            <div className="max-w-2xl mx-auto bg-zinc-900 border-t border-zinc-700/60 rounded-t-3xl overflow-hidden shadow-2xl">
              <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-zinc-700 rounded-full" /></div>
              <div className="px-5 py-4 border-b border-zinc-800">
                <h2 className="text-base font-bold text-zinc-100">{isPt ? 'Adicionar amigo' : 'Add friend'}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{isPt ? 'Digite o email do seu amigo para encontrá-lo' : "Enter your friend's email to find them"}</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={isPt ? 'email@gmail.com' : 'email@gmail.com'}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm"
                    autoFocus
                  />
                  <button onClick={handleSearch} disabled={searching} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    {searching ? '…' : isPt ? 'Buscar' : 'Search'}
                  </button>
                </div>

                {searchResults.map((p) => (
                  <div key={p.uid} className="flex items-center gap-3 bg-zinc-800 rounded-xl p-3">
                    {p.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoURL} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0">
                        {(p.displayName || p.email).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-100 truncate">{p.displayName || p.email.split('@')[0]}</p>
                      <p className="text-xs text-zinc-500 truncate">{p.email}</p>
                    </div>
                    <button
                      onClick={() => handleAddFriend(p)}
                      disabled={addingUid === p.uid}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors flex-shrink-0"
                    >
                      {addingUid === p.uid ? '…' : isPt ? '+ Adicionar' : '+ Add'}
                    </button>
                  </div>
                ))}

                {searchResults.length === 0 && emailSearch && !searching && (
                  <p className="text-xs text-zinc-600 text-center py-2">
                    {isPt ? 'Nenhum usuário encontrado. O amigo precisa ter feito login no app ao menos uma vez.' : 'No user found. Your friend must have logged into the app at least once.'}
                  </p>
                )}

                <button onClick={closeAddFriend} className="w-full py-3 rounded-2xl border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-600 transition-colors">
                  {isPt ? 'Fechar' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create group sheet */}
      {createGroupOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={() => setCreateGroupOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-200">
            <div className="max-w-2xl mx-auto bg-zinc-900 border-t border-zinc-700/60 rounded-t-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 bg-zinc-700 rounded-full" /></div>
              <div className="px-5 py-4 border-b border-zinc-800 flex-shrink-0">
                <h2 className="text-base font-bold text-zinc-100">{isPt ? 'Criar novo grupo' : 'Create new group'}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{isPt ? 'Dê um nome e escolha quem entra' : 'Give it a name and choose who joins'}</p>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                {/* Name */}
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

                {/* Friend picker */}
                <div>
                  <label className="text-xs text-zinc-400 block mb-2">
                    {isPt ? 'Convidar amigos' : 'Invite friends'}
                    {selectedFriends.size > 0 && <span className="ml-1.5 text-emerald-400">· {selectedFriends.size} {isPt ? 'selecionado(s)' : 'selected'}</span>}
                  </label>
                  {friends.length === 0 ? (
                    <p className="text-xs text-zinc-600">{isPt ? 'Você ainda não tem amigos adicionados.' : 'You have no friends added yet.'}</p>
                  ) : (
                    <div className="space-y-2">
                      {friends.map((f) => {
                        const selected = selectedFriends.has(f.uid);
                        return (
                          <button
                            key={f.uid}
                            onClick={() => toggleFriendSelect(f.uid)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                              selected ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-zinc-800 hover:bg-zinc-700 border border-transparent'
                            }`}
                          >
                            {f.photoURL ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={f.photoURL} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0">
                                {f.displayName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-200 truncate">{f.displayName}</p>
                              <p className="text-xs text-zinc-500 truncate">{f.email}</p>
                            </div>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${selected ? 'bg-emerald-500' : 'border border-zinc-600'}`}>
                              {selected && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 border-t border-zinc-800 flex-shrink-0 flex gap-2">
                <button onClick={() => setCreateGroupOpen(false)} className="flex-1 py-3 rounded-2xl border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-600 transition-colors">
                  {isPt ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || savingGroup}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {savingGroup ? '…' : isPt ? 'Criar grupo' : 'Create group'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
