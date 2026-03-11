"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data || {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (session?.user) fetchProfile();
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setProfile({
      ...profile,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error al guardar');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return <p className="p-4">Inicia sesión para ver tu perfil.</p>;
  }
  if (loading) return <p className="p-4">Cargando...</p>;
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Tu perfil clínico</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block mb-1 font-medium" htmlFor="ageGroup">
            Grupo etario
          </label>
          <select
            id="ageGroup"
            name="ageGroup"
            value={profile.ageGroup || ''}
            onChange={handleChange}
            className="w-full rounded border p-2"
          >
            <option value="">Seleccione...</option>
            <option value="ADULT">Adulto</option>
            <option value="PEDIATRIC">Pediátrico</option>
            <option value="ELDERLY">Adulto mayor</option>
          </select>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="pregnant"
            name="pregnant"
            checked={profile.pregnant || false}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="pregnant">Embarazada</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="lactating"
            name="lactating"
            checked={profile.lactating || false}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="lactating">Lactancia</label>
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="allergies">
            Alergias relevantes
          </label>
          <input
            type="text"
            id="allergies"
            name="allergies"
            value={profile.allergies || ''}
            onChange={handleChange}
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="comorbidities">
            Comorbilidades
          </label>
          <input
            type="text"
            id="comorbidities"
            name="comorbidities"
            value={profile.comorbidities || ''}
            onChange={handleChange}
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="medications">
            Medicamentos concomitantes
          </label>
          <input
            type="text"
            id="medications"
            name="medications"
            value={profile.medications || ''}
            onChange={handleChange}
            className="w-full rounded border p-2"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}