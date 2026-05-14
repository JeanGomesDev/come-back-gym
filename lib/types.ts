export interface Exercise {
  id: string;
  name: string;
  series: string;
  rest: string;
  initialWeight: string;
}

export interface WarmupItem {
  text: string;
}

export interface WorkoutPlan {
  id: string;
  label: string;
  name: string;
  dayOfWeek: number;
  isRest: boolean;
  warmup: WarmupItem[];
  exercises: Exercise[];
  tip?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  workoutId: string;
  duration: number;
  notes: string;
  checkedExercises: string[];
}

export interface BodyMeasurement {
  date: string;
  ombro: number;
  peito: number;
  gluteo: number;
  abdomen: number;
  cintura: number;
  bicepeD: number;
  bicepeE: number;
  antebracoD: number;
  antebracoE: number;
  coxaD: number;
  coxaE: number;
  panturrilhaD: number;
  panturrilhaE: number;
}

export interface BioimpedanciaEntry {
  date: string;
  peso: number;
  imc: number;
  gorduraCorporal: number;
  musculoEsqueletico: number;
  massaLivreGordura: number;
  gorduraSubcutanea: number;
  gorduraVisceral: number;
  aguaCorporal: number;
  massaMuscular: number;
  massaOssea: number;
  proteina: number;
  tmb: number;
  idadeMetabolica: number;
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface AppState {
  workoutSessions: WorkoutSession[];
  measurements: BodyMeasurement[];
  bioimpedancia: BioimpedanciaEntry[];
  weightHistory: WeightEntry[];
  goalWeight: number;
  goalWorkouts: number;
  startDate: string;
  endDate: string;
}
