// frontend/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message ?? 'Credenciales incorrectas');
      } else {
        setError('No se pudo conectar con el servidor');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA] px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-4xl tracking-tight text-[#0A0A0A]">
            Fast Inventory
          </h1>
          <div className="h-[1.5px] w-14 bg-[#0A0A0A] mx-auto mt-3" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-[#0A0A0A]/12 rounded-2xl p-8 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-[#0A0A0A]/70">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#0A0A0A]/[0.02] border-[#0A0A0A]/20 text-[#0A0A0A] placeholder:text-[#0A0A0A]/30"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-[#0A0A0A]/70">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-[#0A0A0A]/[0.02] border-[#0A0A0A]/20 text-[#0A0A0A] placeholder:text-[#0A0A0A]/30"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={cargando}
            className="w-full mt-2 bg-[#0A0A0A] text-[#FAFAFA] hover:bg-[#2b2b2b]"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-[#0A0A0A]/40 hover:text-[#0A0A0A]/70">
            ← Volver
          </Link>
        </div>
      </motion.div>
    </div>
  );
}