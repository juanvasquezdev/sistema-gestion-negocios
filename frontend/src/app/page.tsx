import { cookies } from 'next/headers';
import { LandingHero } from '@/components/landing-hero';

async function obtenerSesion() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  if (!token) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const res = await fetch(`${API_URL}/auth/perfil`, {
    headers: { Cookie: `token=${token.value}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function HomePage() {
  const usuario = await obtenerSesion();
  return <LandingHero usuario={usuario} />;
}
