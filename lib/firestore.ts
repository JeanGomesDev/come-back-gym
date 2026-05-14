import { collection, doc, getDoc, getDocs, setDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { WorkoutPlan, WorkoutSession, BodyMeasurement, BioimpedanciaEntry, WeightEntry } from './types';
import { WORKOUTS } from './data';

export interface UserProfile {
  goalWeight: number;
  goalWorkouts: number;
  startDate: string;
  endDate: string;
}

const DEFAULT_PROFILE: UserProfile = {
  goalWeight: 70,
  goalWorkouts: 175,
  startDate: '2026-05-10',
  endDate: '2026-12-31',
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
  const defaultDays = Array.from({ length: 7 }, (_, i) => {
    const found = WORKOUTS.find((w) => w.dayOfWeek === i);
    return found ?? { id: String(i), label: '', name: '', dayOfWeek: i, isRest: true, warmup: [], exercises: [] };
  });
  await setDoc(ref, { days: defaultDays });
  return defaultDays;
}

export async function saveUserPlan(uid: string, days: WorkoutPlan[]): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'meta', 'plan'), { days });
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
