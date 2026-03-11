import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function VademecumList() {
  const diseases = await prisma.disease.findMany({
    include: { medications: true },
    orderBy: { name: 'asc' },
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Enfermedades en el vademécum</h1>
      {diseases.length === 0 ? (
        <p>No hay enfermedades registradas.</p>
      ) : (
        <table className="min-w-full bg-white rounded shadow overflow-hidden">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Sinónimos</th>
              <th className="px-4 py-2 text-left">Medicamentos</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {diseases.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-2">
                  <Link href={`/admin/vademecum/${d.id}`} className="text-primary hover:underline">
                    {d.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{d.synonyms.join(', ')}</td>
                <td className="px-4 py-2">{d.medications.length}</td>
                <td className="px-4 py-2 text-center">{d.active ? 'Activo' : 'Inactivo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}