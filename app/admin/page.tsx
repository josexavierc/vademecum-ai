import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AdminDashboard() {
  // Verifica el rol en servidor; si no es admin, se devolverá 403 gracias a middleware.
  const session = await getServerSession(authOptions);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Panel de administración</h1>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <Link href="/admin/vademecum/upload" className="text-primary hover:underline">
            Cargar vademécum
          </Link>
        </li>
        <li>
          <Link href="/admin/vademecum" className="text-primary hover:underline">
            Ver enfermedades
          </Link>
        </li>
        <li>
          <Link href="/admin/historial" className="text-primary hover:underline">
            Historial de consultas
          </Link>
        </li>
      </ul>
    </div>
  );
}