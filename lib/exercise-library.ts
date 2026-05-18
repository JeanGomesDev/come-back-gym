export interface LibraryExercise {
  name: { pt: string; en: string };
  series: string;
  rest: string;
}

export interface MuscleGroup {
  id: string;
  icon: string;
  name: { pt: string; en: string };
  exercises: LibraryExercise[];
}

export const exerciseLibrary: MuscleGroup[] = [
  {
    id: 'peito',
    icon: '🫁',
    name: { pt: 'Peito', en: 'Chest' },
    exercises: [
      { name: { pt: 'Supino Reto', en: 'Flat Bench Press' }, series: '4x10', rest: '90s' },
      { name: { pt: 'Supino Inclinado', en: 'Incline Bench Press' }, series: '3x12', rest: '90s' },
      { name: { pt: 'Supino Declinado', en: 'Decline Bench Press' }, series: '3x10', rest: '90s' },
      { name: { pt: 'Supino com Halteres', en: 'Dumbbell Bench Press' }, series: '3x12', rest: '90s' },
      { name: { pt: 'Crucifixo Reto', en: 'Flat Dumbbell Fly' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Crucifixo Inclinado', en: 'Incline Dumbbell Fly' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Crossover', en: 'Cable Crossover' }, series: '3x15', rest: '60s' },
      { name: { pt: 'Pullover', en: 'Dumbbell Pullover' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Flexão', en: 'Push-up' }, series: '3x15', rest: '60s' },
    ],
  },
  {
    id: 'costas',
    icon: '🔙',
    name: { pt: 'Costas', en: 'Back' },
    exercises: [
      { name: { pt: 'Puxada Frente', en: 'Lat Pulldown' }, series: '4x10', rest: '90s' },
      { name: { pt: 'Puxada Atrás', en: 'Behind-neck Pulldown' }, series: '3x10', rest: '90s' },
      { name: { pt: 'Remada Curvada', en: 'Bent-over Row' }, series: '4x10', rest: '90s' },
      { name: { pt: 'Remada Unilateral', en: 'Single-arm Row' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Remada Cavalinho', en: 'T-bar Row' }, series: '3x10', rest: '90s' },
      { name: { pt: 'Barra Fixa', en: 'Pull-up' }, series: '3x8', rest: '90s' },
      { name: { pt: 'Levantamento Terra', en: 'Deadlift' }, series: '4x6', rest: '120s' },
      { name: { pt: 'Remada Sentado no Cabo', en: 'Seated Cable Row' }, series: '3x12', rest: '60s' },
    ],
  },
  {
    id: 'pernas',
    icon: '🦵',
    name: { pt: 'Pernas', en: 'Legs' },
    exercises: [
      { name: { pt: 'Agachamento Livre', en: 'Barbell Squat' }, series: '4x10', rest: '120s' },
      { name: { pt: 'Leg Press 45°', en: 'Leg Press 45°' }, series: '4x12', rest: '90s' },
      { name: { pt: 'Cadeira Extensora', en: 'Leg Extension' }, series: '3x15', rest: '60s' },
      { name: { pt: 'Mesa Flexora', en: 'Lying Leg Curl' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Cadeira Flexora', en: 'Seated Leg Curl' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Avanço', en: 'Lunge' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Stiff', en: 'Romanian Deadlift' }, series: '4x10', rest: '90s' },
      { name: { pt: 'Agachamento Bulgaro', en: 'Bulgarian Split Squat' }, series: '3x10', rest: '90s' },
      { name: { pt: 'Hack Squat', en: 'Hack Squat' }, series: '4x10', rest: '90s' },
      { name: { pt: 'Panturrilha em Pé', en: 'Standing Calf Raise' }, series: '4x15', rest: '60s' },
      { name: { pt: 'Panturrilha Sentado', en: 'Seated Calf Raise' }, series: '3x15', rest: '60s' },
    ],
  },
  {
    id: 'gluteos',
    icon: '🍑',
    name: { pt: 'Glúteos', en: 'Glutes' },
    exercises: [
      { name: { pt: 'Hip Thrust', en: 'Hip Thrust' }, series: '4x12', rest: '90s' },
      { name: { pt: 'Agachamento Sumô', en: 'Sumo Squat' }, series: '4x12', rest: '90s' },
      { name: { pt: 'Abdução de Quadril', en: 'Hip Abduction' }, series: '3x15', rest: '60s' },
      { name: { pt: 'Coice no Cabo', en: 'Cable Kickback' }, series: '3x15', rest: '60s' },
      { name: { pt: 'Hip Thrust Unilateral', en: 'Single-leg Hip Thrust' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Stiff Unilateral', en: 'Single-leg Romanian Deadlift' }, series: '3x10', rest: '60s' },
      { name: { pt: 'Agachamento Sumô com Halter', en: 'Goblet Squat' }, series: '3x15', rest: '60s' },
    ],
  },
  {
    id: 'ombros',
    icon: '🏈',
    name: { pt: 'Ombros', en: 'Shoulders' },
    exercises: [
      { name: { pt: 'Desenvolvimento com Barra', en: 'Military Press' }, series: '4x10', rest: '90s' },
      { name: { pt: 'Desenvolvimento com Halteres', en: 'Dumbbell Shoulder Press' }, series: '3x12', rest: '90s' },
      { name: { pt: 'Elevação Lateral', en: 'Lateral Raise' }, series: '4x15', rest: '60s' },
      { name: { pt: 'Elevação Frontal', en: 'Front Raise' }, series: '3x15', rest: '60s' },
      { name: { pt: 'Pássaro', en: 'Reverse Fly' }, series: '3x15', rest: '60s' },
      { name: { pt: 'Encolhimento', en: 'Shrug' }, series: '4x12', rest: '60s' },
      { name: { pt: 'Arnold Press', en: 'Arnold Press' }, series: '3x12', rest: '90s' },
    ],
  },
  {
    id: 'biceps',
    icon: '💪',
    name: { pt: 'Bíceps', en: 'Biceps' },
    exercises: [
      { name: { pt: 'Rosca Direta', en: 'Barbell Curl' }, series: '4x12', rest: '60s' },
      { name: { pt: 'Rosca Alternada', en: 'Alternating Dumbbell Curl' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Rosca Martelo', en: 'Hammer Curl' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Rosca Concentrada', en: 'Concentration Curl' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Rosca no Cabo', en: 'Cable Curl' }, series: '3x15', rest: '60s' },
      { name: { pt: 'Rosca Scott', en: 'Preacher Curl' }, series: '3x10', rest: '60s' },
      { name: { pt: 'Rosca 21', en: '21s Curl' }, series: '3x21', rest: '60s' },
    ],
  },
  {
    id: 'triceps',
    icon: '🔱',
    name: { pt: 'Tríceps', en: 'Triceps' },
    exercises: [
      { name: { pt: 'Tríceps Corda', en: 'Cable Rope Pushdown' }, series: '4x12', rest: '60s' },
      { name: { pt: 'Tríceps Testa', en: 'Skull Crusher' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Tríceps Francês', en: 'French Press' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Tríceps Banco', en: 'Bench Dip' }, series: '3x15', rest: '60s' },
      { name: { pt: 'Tríceps Unilateral no Cabo', en: 'Single-arm Pushdown' }, series: '3x12', rest: '60s' },
      { name: { pt: 'Mergulho (Paralelas)', en: 'Parallel Bar Dip' }, series: '3x10', rest: '90s' },
    ],
  },
  {
    id: 'abdomen',
    icon: '🎯',
    name: { pt: 'Abdômen', en: 'Core' },
    exercises: [
      { name: { pt: 'Prancha', en: 'Plank' }, series: '3x60s', rest: '60s' },
      { name: { pt: 'Abdominal Crunch', en: 'Crunch' }, series: '3x20', rest: '60s' },
      { name: { pt: 'Abdominal Bicicleta', en: 'Bicycle Crunch' }, series: '3x20', rest: '60s' },
      { name: { pt: 'Elevação de Pernas', en: 'Leg Raise' }, series: '3x15', rest: '60s' },
      { name: { pt: 'Russian Twist', en: 'Russian Twist' }, series: '3x20', rest: '60s' },
      { name: { pt: 'Abdominal Infra', en: 'Reverse Crunch' }, series: '3x15', rest: '60s' },
      { name: { pt: 'Hollow Body', en: 'Hollow Body Hold' }, series: '3x30s', rest: '60s' },
    ],
  },
];
