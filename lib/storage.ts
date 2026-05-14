import { AppState, WorkoutSession, BodyMeasurement, BioimpedanciaEntry, WeightEntry } from './types';
import { INITIAL_MEASUREMENTS, INITIAL_BIO } from './data';

const KEY = 'come-back-gym-v1';

const DEFAULT_STATE: AppState = {
  workoutSessions: [
    {
      id: '1',
      date: '2026-05-12',
      workoutId: 'A',
      duration: 35,
      notes: 'Supino inclinado 12.5kg, Tríceps pulley 36kg, Tríceps testa 14kg. Desafiador no final!',
      checkedExercises: [],
    },
    {
      id: '2',
      date: '2026-05-14',
      workoutId: 'B',
      duration: 35,
      notes: 'Costas 35-40kg, Bíceps corda 25kg, Bíceps halteres 7.5kg',
      checkedExercises: [],
    },
  ],
  measurements: [INITIAL_MEASUREMENTS],
  bioimpedancia: [INITIAL_BIO],
  weightHistory: [{ date: '2026-05-11', weight: 61.80 }],
  goalWeight: 70,
  goalWorkouts: 175,
  startDate: '2026-05-10',
  endDate: '2026-12-31',
};

export function getState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function addWorkoutSession(session: WorkoutSession): void {
  const state = getState();
  const filtered = state.workoutSessions.filter((s) => s.date !== session.date || s.workoutId !== session.workoutId);
  saveState({ ...state, workoutSessions: [...filtered, session] });
}

export function updateWorkoutSession(session: WorkoutSession): void {
  const state = getState();
  const updated = state.workoutSessions.map((s) => (s.id === session.id ? session : s));
  saveState({ ...state, workoutSessions: updated });
}

export function addMeasurement(m: BodyMeasurement): void {
  const state = getState();
  const filtered = state.measurements.filter((x) => x.date !== m.date);
  saveState({ ...state, measurements: [...filtered, m].sort((a, b) => a.date.localeCompare(b.date)) });
}

export function addBioimpedancia(b: BioimpedanciaEntry): void {
  const state = getState();
  const filtered = state.bioimpedancia.filter((x) => x.date !== b.date);
  saveState({ ...state, bioimpedancia: [...filtered, b].sort((a, b) => a.date.localeCompare(b.date)) });
}

export function addWeightEntry(w: WeightEntry): void {
  const state = getState();
  const filtered = state.weightHistory.filter((x) => x.date !== w.date);
  saveState({ ...state, weightHistory: [...filtered, w].sort((a, b) => a.date.localeCompare(b.date)) });
}
