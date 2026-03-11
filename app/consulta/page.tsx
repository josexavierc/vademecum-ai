"use client";
import { useState } from 'react';

const profiles = [
  'adulto',
  'pediátrico',
  'adulto mayor',
  'embarazada',
  'lactancia',
  'alérgico',
  'comorbilidades',
  'otro',
];

export default function ConsultaPage() {
  const [condition, setCondition] = useState('');
  const [profile, setProfile] = useState('adulto');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAnswer(null);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition, patientProfile: profile }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setAnswer(data.answer);
      }
    } catch (err) {
      setError('Error al consultar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-center">Consulta del vademécum</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Enfermedad o condición</label>
          <input
            type="text"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded py-2 px-3"
            placeholder="gripe, migraña, etc."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Perfil del paciente (opcional)</label>
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded py-2 px-3"
          >
            {profiles.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-primary text-white px-4 py-2 rounded hover:bg-teal-700"
          disabled={loading}
        >
          {loading ? 'Consultando...' : 'Consultar'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {answer && (
        <div className="mt-6 bg-white p-4 rounded shadow whitespace-pre-wrap text-sm">
          {answer}
        </div>
      )}
    </div>
  );
}