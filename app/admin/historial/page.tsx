import { prisma } from '@/lib/prisma';

export default async function HistorialPage() {
  const histories = await prisma.query.findMany({
    include: {
      user: true,
      disease: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Historial de consultas</h1>
      {histories.length === 0 ? (
        <p>No hay consultas registradas.</p>
      ) : (
        <table className="min-w-full bg-white rounded shadow overflow-hidden text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Usuario</th>
              <th className="px-4 py-2 text-left">Condición</th>
              <th className="px-4 py-2 text-left">Perfil</th>
            </tr>
          </thead>
          <tbody>
            {histories.map((h) => (
              <tr key={h.id} className="border-t">
                <td className="px-4 py-2">{h.createdAt.toISOString().replace('T', ' ').substring(0, 19)}</td>
                <td className="px-4 py-2">{h.user.email}</td>
                <td className="px-4 py-2">{h.disease.name}</td>
                <td className="px-4 py-2">{h.patientProfile || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}