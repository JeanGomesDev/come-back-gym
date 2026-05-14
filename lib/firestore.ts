import { collection, doc, getDoc, getDocs, setDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { WorkoutSession, BodyMeasurement, BioimpedanciaEntry, WeightEntry } from './types';

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
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  await setDoc(ref, DEFAULT_PROFILE);
  return DEFAULT_PROFILE;
}

export async function getWorkoutSessions(uid: string): Promise<WorkoutSession[]> {
  const ref = collection(db, 'users', uid, 'sessions');
  const q = query(ref, orderBy('date'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as WorkoutSession);
}

export async function saveWorkoutSession(uid: string, session: WorkoutSession): Promise<void> {
  const docId = `${session.date}-${session.workoutId}`;
  const ref = doc(db, 'users', uid, 'sessions', docId);
  await setDoc(ref, session);
}

export async function getMeasurements(uid: string): Promise<BodyMeasurement[]> {
  const ref = collection(db, 'users', uid, 'measurements');
  const q = query(ref, orderBy('date'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as BodyMeasurement);
}

export async function saveMeasurement(uid: string, m: BodyMeasurement): Promise<void> {
  const ref = doc(db, 'users', uid, 'measurements', m.date);
  await setDoc(ref, m);
}

export async function getBioimpedancia(uid: string): Promise<BioimpedanciaEntry[]> {
  const ref = collection(db, 'users', uid, 'bioimpedancia');
  const q = query(ref, orderBy('date'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as BioimpedanciaEntry);
}

export async function saveBioimpedancia(uid: string, b: BioimpedanciaEntry): Promise<void> {
  const ref = doc(db, 'users', uid, 'bioimpedancia', b.date);
  await setDoc(ref, b);
}

export async function getWeightHistory(uid: string): Promise<WeightEntry[]> {
  const ref = collection(db, 'users', uid, 'weight');
  const q = query(ref, orderBy('date'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as WeightEntry);
}

export async function saveWeightEntry(uid: string, w: WeightEntry): Promise<void> {
  const ref = doc(db, 'users', uid, 'weight', w.date);
  await setDoc(ref, w);
}
