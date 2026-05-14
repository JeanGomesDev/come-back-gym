'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { INITIAL_MEASUREMENTS, INITIAL_BIO } from '@/lib/data';

export default function SeedPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const uid = user.uid;

      // Sessões de treino históricas
      await setDoc(doc(db, 'users', uid, 'sessions', '2026-05-12-A'), {
        id: '2026-05-12-A',
        date: '2026-05-12',
        workoutId: 'A',
        duration: 35,
        notes: 'Supino inclinado 12.5kg, Tríceps pulley 36kg, Tríceps testa 14kg. Desafiador no final!',
        checkedExercises: [],
      });

      await setDoc(doc(db, 'users', uid, 'sessions', '2026-05-14-B'), {
        id: '2026-05-14-B',
        date: '2026-05-14',
        workoutId: 'B',
        duration: 35,
        notes: 'Costas 35-40kg, Bíceps corda 25kg, Bíceps halteres 7.5kg',
        checkedExercises: [],
      });

      // Medidas iniciais (10/05/2026)
      await setDoc(doc(db, 'users', uid, 'measurements', INITIAL_MEASUREMENTS.date), INITIAL_MEASUREMENTS);

      // Bioimpedância inicial (11/05/2026)
      await setDoc(doc(db, 'users', uid, 'bioimpedancia', INITIAL_BIO.date), INITIAL_BIO);

      // Peso inicial
      await setDoc(doc(db, 'users', uid, 'weight', '2026-05-11'), {
        date: '2026-05-11',
        weight: 61.80,
      });

      // Perfil com metas
      await setDoc(doc(db, 'users', uid, 'meta', 'profile'), {
        goalWeight: 70,
        goalWorkouts: 175,
        startDate: '2026-05-10',
        endDate: '2026-12-31',
        onboardingCompleted: true,
      }, { merge: true });

      setDone(true);
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Faça login primeiro.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="text-center">
        <div className="text-4xl mb-3">📦</div>
        <h1 className="text-xl font-bold text-zinc-100">Importar Dados Iniciais</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Vai importar seus 2 treinos, medidas, bioimpedância e peso inicial para o Firestore.
        </p>
      </div>

      {done ? (
        <div className="text-center">
          <p className="text-emerald-400 font-semibold text-lg">✓ Dados importados com sucesso!</p>
          <p className="text-zinc-500 text-sm mt-2">Pode fechar esta página e voltar ao app.</p>
        </div>
      ) : (
        <button
          onClick={handleSeed}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold px-8 py-3 rounded-2xl transition-colors"
        >
          {loading ? 'Importando...' : 'Importar meus dados'}
        </button>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
