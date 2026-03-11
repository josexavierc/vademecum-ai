import './globals.css';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vademécum IA',
  description: 'Consulta de medicamentos con inteligencia artificial basada en vademécum.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Providers>
          <Navbar />
          <main className="container mx-auto px-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}