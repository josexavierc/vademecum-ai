import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface Params {
  params: { id: string };
}

export default async function DiseaseDetail({ params }: Params) {
  const disease = await prisma.disease.findUnique({
    where: { id: params.id },
    include: {
      medications: {
        include: { medication: true },
      },
    },
  });
  if (!disease) return notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Detalle de enfermedad</h1>
      <p><strong>Nombre:</strong> {disease.name}</p>
      <p><strong>Sinónimos:</strong> {disease.synonyms.join(', ')}</p>
      <p><strong>Descripción:</strong> {disease.description}</p>
      <p><strong>Estado:</strong> {disease.active ? 'Activo' : 'Inactivo'}</p>
      <h2 className="text-xl font-semibold mt-4">Medicamentos</h2>
      {disease.medications.length === 0 ? (
        <p>No hay medicamentos asociados.</p>
      ) : (
        <ul className="list-disc list-inside space-y-2">
          {disease.medications.map((dm) => (
            <li key={dm.id}>
              <span className="font-semibold">{dm.medication.name}:</span>
              {' '}
              Dosis {dm.dosage || 'N/A'}, frecuencia {dm.frequency || 'N/A'}, duración {dm.duration || 'N/A'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}