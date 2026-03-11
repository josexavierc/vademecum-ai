"use client";
import { useState } from 'react';

/**
 * Página de carga del vademécum. Permite seleccionar un archivo (JSON, CSV o
 * XLSX) y enviarlo al backend para procesarlo. También muestra mensajes de
 * éxito o error. Sólo accesible para usuarios administradores (protegido
 * mediante middleware).
 */
export default function UploadVademecumPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Selecciona un archivo para cargar');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      let body: BodyInit | null = null;
      let contentType = '';
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        body = text;
        contentType = 'application/json';
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text();
        body = text;
        contentType = 'text/csv';
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        body = arrayBuffer;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        setError('Formato de archivo no soportado');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/vademecum/upload', {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
        },
        body,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage(`Carga completada: ${data.inserted} registros insertados`);
      }
    } catch (err) {
      setError('Error al cargar el archivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Cargar vademécum</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="file"
            accept=".json,.csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-teal-700"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-teal-700"
        >
          {loading ? 'Cargando...' : 'Subir'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {message && <p className="text-green-600 mt-4">{message}</p>}
    </div>
  );
}