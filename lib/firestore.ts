import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy, where, limit, addDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from './firebase';
import { WorkoutPlan, WorkoutSession, BodyMeasurement, BioimpedanciaEntry, WeightEntry } from './types';

export interface UserProfile {
  goalWeight: number;
  goalWorkouts: number;
  startDate: string;
  endDate: string;
  onboardingCompleted?: boolean;
  language?: 'pt' | 'en';
  planOffset?: number;
}

const DEFAULT_PROFILE: UserProfile = {
  goalWeight: 0,
  goalWorkouts: 0,
  startDate: new Date().toISOString().split('T')[0],
  endDate: `${new Date().getFullYear()}-12-31`,
};

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const ref = doc(db, 'users', uid, 'meta', 'profile');
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserProfile;
  await setDoc(ref, DEFAULT_PROFILE);
  return DEFAULT_PROFILE;
}

export async function getUserPlan(uid: string): Promise<WorkoutPlan[]> {
  const ref = doc(db, 'users', uid, 'meta', 'plan');
  const snap = await getDoc(ref);
  if (snap.exists()) return (snap.data() as { days: WorkoutPlan[] }).days;
  const emptyDays: WorkoutPlan[] = Array.from({ length: 7 }, (_, i) => ({
    id: String(i),
    label: '',
    name: '',
    dayOfWeek: i,
    isRest: true,
    warmup: [],
    exercises: [],
  }));
  await setDoc(ref, { days: emptyDays });
  return emptyDays;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'meta', 'profile'), data, { merge: true });
}

export async function saveUserPlan(uid: string, days: WorkoutPlan[]): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'meta', 'plan'), { days });
}

export async function resetUserPlan(uid: string): Promise<void> {
  const emptyDays: WorkoutPlan[] = Array.from({ length: 7 }, (_, i) => ({
    id: String(i), label: '', name: '', dayOfWeek: i, isRest: true, warmup: [], exercises: [],
  }));
  await setDoc(doc(db, 'users', uid, 'meta', 'plan'), { days: emptyDays });
}

export async function getWorkoutSessions(uid: string): Promise<WorkoutSession[]> {
  const q = query(collection(db, 'users', uid, 'sessions'), orderBy('date'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as WorkoutSession);
}

export async function saveWorkoutSession(uid: string, session: WorkoutSession): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'sessions', `${session.date}-${session.workoutId}`), session);
}

export async function getMeasurements(uid: string): Promise<BodyMeasurement[]> {
  const q = query(collection(db, 'users', uid, 'measurements'), orderBy('date'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as BodyMeasurement);
}

export async function saveMeasurement(uid: string, m: BodyMeasurement): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'measurements', m.date), m);
}

export async function getBioimpedancia(uid: string): Promise<BioimpedanciaEntry[]> {
  const q = query(collection(db, 'users', uid, 'bioimpedancia'), orderBy('date'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as BioimpedanciaEntry);
}

export async function saveBioimpedancia(uid: string, b: BioimpedanciaEntry): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'bioimpedancia', b.date), b);
}

export async function getWeightHistory(uid: string): Promise<WeightEntry[]> {
  const q = query(collection(db, 'users', uid, 'weight'), orderBy('date'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as WeightEntry);
}

export async function saveWeightEntry(uid: string, w: WeightEntry): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'weight', w.date), w);
}

export async function resetGoals(uid: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await setDoc(doc(db, 'users', uid, 'meta', 'profile'), {
    goalWeight: 0,
    goalWorkouts: 0,
    startDate: today,
    endDate: `${new Date().getFullYear()}-12-31`,
  }, { merge: true });
}

export async function resetMeasurements(uid: string): Promise<void> {
  const snap = await getDocs(collection(db, 'users', uid, 'measurements'));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export async function resetBioimpedancia(uid: string): Promise<void> {
  const snap = await getDocs(collection(db, 'users', uid, 'bioimpedancia'));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export async function resetWeightHistory(uid: string): Promise<void> {
  const snap = await getDocs(collection(db, 'users', uid, 'weight'));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export async function resetWorkoutSessions(uid: string): Promise<void> {
  const snap = await getDocs(collection(db, 'users', uid, 'sessions'));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

// ─── Social ────────────────────────────────────────────────────────────────

export interface PublicUserProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  email: string;
  totalWorkouts: number;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  memberUids: string[];
  createdAt: string;
}

export async function upsertPublicProfile(uid: string, data: { displayName: string; photoURL: string | null; email: string }): Promise<void> {
  await setDoc(doc(db, 'publicUsers', uid), data, { merge: true });
}

export async function incrementPublicWorkoutCount(uid: string): Promise<void> {
  await setDoc(doc(db, 'publicUsers', uid), { totalWorkouts: increment(1) }, { merge: true });
}

export async function searchPublicUsers(emailPrefix: string): Promise<PublicUserProfile[]> {
  if (!emailPrefix.trim()) return [];
  const q = query(
    collection(db, 'publicUsers'),
    where('email', '>=', emailPrefix.toLowerCase()),
    where('email', '<=', emailPrefix.toLowerCase() + ''),
    limit(8)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, totalWorkouts: 0, ...d.data() } as PublicUserProfile));
}

export async function getPublicUsers(uids: string[]): Promise<PublicUserProfile[]> {
  if (uids.length === 0) return [];
  const results = await Promise.all(uids.map((uid) => getDoc(doc(db, 'publicUsers', uid))));
  return results
    .filter((s) => s.exists())
    .map((s) => ({ uid: s.id, totalWorkouts: 0, ...s.data() } as PublicUserProfile));
}

export async function createGroup(name: string, creatorUid: string, memberUids: string[]): Promise<string> {
  const ref = await addDoc(collection(db, 'groups'), {
    name,
    createdBy: creatorUid,
    memberUids: Array.from(new Set([creatorUid, ...memberUids])),
    createdAt: new Date().toISOString().split('T')[0],
  });
  return ref.id;
}

export async function getUserGroups(uid: string): Promise<Group[]> {
  const q = query(collection(db, 'groups'), where('memberUids', 'array-contains', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group));
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, 'groups', groupId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Group;
}

export async function addMemberToGroup(groupId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), { memberUids: arrayUnion(uid) });
}

export async function removeMemberFromGroup(groupId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), { memberUids: arrayRemove(uid) });
}

export async function deleteGroup(groupId: string): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId));
}

// ─── Clear all ─────────────────────────────────────────────────────────────

export async function clearUserData(uid: string): Promise<void> {
  for (const col of ['sessions', 'measurements', 'bioimpedancia', 'weight']) {
    const snap = await getDocs(collection(db, 'users', uid, col));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }
  const emptyDays: WorkoutPlan[] = Array.from({ length: 7 }, (_, i) => ({
    id: String(i), label: '', name: '', dayOfWeek: i, isRest: true, warmup: [], exercises: [],
  }));
  await setDoc(doc(db, 'users', uid, 'meta', 'plan'), { days: emptyDays });
  await setDoc(doc(db, 'users', uid, 'meta', 'profile'), DEFAULT_PROFILE);
}
