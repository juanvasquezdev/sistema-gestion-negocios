// frontend/src/app/registrar/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registrarNegocio } from '@/lib/auth';
import { ApiError } from '@/lib/api';

interface FormState {
  nombreNegocio: string;
  nombreUsuario: string;
  email: string;
  password: string;
  confirmarPassword: string;
}

const FORM_VACIO: FormState = {
  nombreNegocio: '',
  nombreUsuario: '',
  email: '',
  password: '',
  confirmarPassword: '',
};

export default function RegistrarPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function actualizar(campo: keyof FormState, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setCargando(true);
    try {
      await registrarNegocio({
        nombreNegocio: form.nombreNegocio,
        nombreUsuario: form.nombreUsuario,
        email: form.email,
        password: form.password,
      });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message ?? 'No se pudo crear la cuenta.');
      } else {
        setError('No se pudo conectar con el servidor.');
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
          <p className="text-sm text-[#0A0A0A]/50 mt-3">Crea la cuenta de tu negocio</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-[#0A0A0A]/12 rounded-2xl p-8 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombreNegocio" className="text-[#0A0A0A]/70">
              Nombre del negocio
            </Label>
            <Input
              id="nombreNegocio"
              value={form.nombreNegocio}
              onChange={(e) => actualizar('nombreNegocio', e.target.value)}
              required
              minLength={2}
              maxLength={100}
              className="bg-[#0A0A0A]/[0.02] border-[#0A0A0A]/20 text-[#0A0A0A]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nombreUsuario" className="text-[#0A0A0A]/70">
              Tu nombre
            </Label>
            <Input
              id="nombreUsuario"
              value={form.nombreUsuario}
              onChange={(e) => actualizar('nombreUsuario', e.target.value)}
              required
              minLength={2}
              maxLength={100}
              className="bg-[#0A0A0A]/[0.02] border-[#0A0A0A]/20 text-[#0A0A0A]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-[#0A0A0A]/70">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => actualizar('email', e.target.value)}
              required
              className="bg-[#0A0A0A]/[0.02] border-[#0A0A0A]/20 text-[#0A0A0A]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-[#0A0A0A]/70">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => actualizar('password', e.target.value)}
              required
              minLength={8}
              maxLength={72}
              className="bg-[#0A0A0A]/[0.02] border-[#0A0A0A]/20 text-[#0A0A0A]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmarPassword" className="text-[#0A0A0A]/70">
              Confirmar contraseña
            </Label>
            <Input
              id="confirmarPassword"
              type="password"
              value={form.confirmarPassword}
              onChange={(e) => actualizar('confirmarPassword', e.target.value)}
              required
              className="bg-[#0A0A0A]/[0.02] border-[#0A0A0A]/20 text-[#0A0A0A]"
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
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="text-center mt-6 flex flex-col gap-2">
          <Link href="/login" className="text-xs text-[#0A0A0A]/50 hover:text-[#0A0A0A]/80">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
          <Link href="/" className="text-xs text-[#0A0A0A]/40 hover:text-[#0A0A0A]/70">
            ← Volver
          </Link>
        </div>
      </motion.div>
    </div>
  );
}