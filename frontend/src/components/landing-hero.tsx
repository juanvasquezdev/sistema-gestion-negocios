// frontend/src/components/landing-hero.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface Usuario {
  email: string;
  rol: string;
}

const SECUENCIA = [
  { texto: 'VELOCIDAD', bg: '#0A0A0A', fg: '#FAFAFA' },
  { texto: 'SEGURIDAD', bg: '#FAFAFA', fg: '#0A0A0A' },
  { texto: 'FACILIDAD', bg: '#0A0A0A', fg: '#FAFAFA' },
];

type Paso = 'secuencia' | 'marca' | 'auth';

export function LandingHero({ usuario }: { usuario: Usuario | null }) {
  const [paso, setPaso] = useState<Paso>(usuario ? 'auth' : 'secuencia');
  const [indice, setIndice] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (paso !== 'secuencia') return;

    if (indice >= SECUENCIA.length - 1) {
      const t = setTimeout(() => setPaso('marca'), 800);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setIndice((i) => i + 1), 800);
    return () => clearTimeout(t);
  }, [paso, indice]);

  async function cerrarSesion() {
    await api.post('/auth/logout');
    router.refresh();
  }

  if (paso === 'secuencia') {
    const actual = SECUENCIA[indice];
    return (
      <div className="fixed inset-0 overflow-hidden">
        <AnimatePresence>
          <motion.div
            key={actual.texto}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: actual.bg }}
          >
            <h1
              className="font-[family-name:var(--font-display)] font-medium text-4xl sm:text-6xl tracking-tight"
              style={{ color: actual.fg }}
            >
              {actual.texto}
            </h1>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA] px-6 py-16">
      <AnimatePresence mode="wait">
        {paso === 'marca' && (
          <motion.div
            key="marca"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center"
          >
            <h1 className="font-[family-name:var(--font-display)] font-medium text-5xl sm:text-7xl tracking-tight text-[#0A0A0A]">
              Fast Inventory
            </h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="h-[1.5px] w-32 sm:w-44 bg-[#0A0A0A] mt-5 origin-center"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="text-[#0A0A0A]/50 text-xs mt-5 tracking-[0.25em] uppercase"
            >
              by Juan Vasquez
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
            >
              <Button
                onClick={() => setPaso('auth')}
                className="mt-10 bg-[#0A0A0A] text-[#FAFAFA] hover:bg-[#2b2b2b] px-8"
              >
                Siguiente →
              </Button>
            </motion.div>
          </motion.div>
        )}

        {paso === 'auth' && !usuario && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm border border-[#0A0A0A]/12 rounded-2xl p-8 flex flex-col gap-3"
          >
            <h2 className="font-[family-name:var(--font-display)] font-medium text-2xl text-[#0A0A0A] mb-2 text-center">
              Fast Inventory
            </h2>
            <Button
              className="bg-[#0A0A0A] text-[#FAFAFA] hover:bg-[#2b2b2b]"
              render={<Link href="/login">Iniciar sesión</Link>}
              nativeButton={false}
            />
            <Button
              variant="outline"
              className="bg-transparent border-[#0A0A0A]/25 text-[#0A0A0A] hover:bg-[#0A0A0A]/5"
              render={<Link href="/registrar">Crear cuenta</Link>}
              nativeButton={false}
            />
          </motion.div>
        )}

        {paso === 'auth' && usuario && (
          <motion.div
            key="sesion"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="w-full max-w-sm border border-[#0A0A0A]/12 rounded-2xl p-8 flex flex-col gap-3"
          >
            <h2 className="font-[family-name:var(--font-display)] font-medium text-2xl text-[#0A0A0A]">
              Ya iniciaste sesión
            </h2>
            <p className="text-[#0A0A0A]/60 text-sm">{usuario.email}</p>
            <Button
              className="bg-[#0A0A0A] text-[#FAFAFA] hover:bg-[#2b2b2b] mt-2"
              render={<Link href="/dashboard">Ir al panel</Link>}
              nativeButton={false}
            />
            <button
              onClick={cerrarSesion}
              className="text-xs text-[#0A0A0A]/50 hover:text-[#0A0A0A]/80 mt-1 self-start"
            >
              Cerrar sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}