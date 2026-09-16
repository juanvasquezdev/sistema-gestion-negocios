// frontend/src/components/landing-hero.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { APP_NAME } from '@/lib/marca';
import { DotPattern } from '@/components/magicui/dot-pattern';

interface Usuario {
  email: string;
  rol: string;
  nombre: string;
  negocioNombre: string;
}

const SECUENCIA = [
  { texto: 'VELOCIDAD', bg: '#0A0A0A', fg: '#FAFAFA' },
  { texto: 'SEGURIDAD', bg: '#FAFAFA', fg: '#0A0A0A' },
  { texto: 'FACILIDAD', bg: '#0A0A0A', fg: '#FAFAFA' },
];

// La intro se muestra una sola vez por sesión del navegador.
const CLAVE_INTRO_VISTA = 'landing:intro-vista';

function introYaVista() {
  try {
    return sessionStorage.getItem(CLAVE_INTRO_VISTA) === '1';
  } catch {
    return false;
  }
}

function marcarIntroVista() {
  try {
    sessionStorage.setItem(CLAVE_INTRO_VISTA, '1');
  } catch {
    // Sin storage disponible: la intro se vuelve a mostrar, no pasa nada más.
  }
}

// 'inicio': todavía no se decidió si mostrar la intro (sessionStorage y reduced motion solo existen en el cliente).
type Paso = 'inicio' | 'secuencia' | 'marca' | 'auth';

export function LandingHero({ usuario }: { usuario: Usuario | null }) {
  const [paso, setPaso] = useState<Paso>(usuario ? 'auth' : 'inicio');
  const [indice, setIndice] = useState(0);
  const reducirMovimiento = useReducedMotion();
  const router = useRouter();

  // Se salta la intro si ya se vio en esta sesión o si el sistema pide reducir movimiento.
  useEffect(() => {
    if (paso !== 'inicio') return;
    queueMicrotask(() => {
      setPaso(introYaVista() || reducirMovimiento ? 'marca' : 'secuencia');
    });
  }, [paso, reducirMovimiento]);

  useEffect(() => {
    if (paso !== 'secuencia') return;

    if (indice >= SECUENCIA.length - 1) {
      const t = setTimeout(() => {
        marcarIntroVista();
        setPaso('marca');
      }, 800);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setIndice((i) => i + 1), 800);
    return () => clearTimeout(t);
  }, [paso, indice]);

  // Enter o Espacio saltan la intro.
  useEffect(() => {
    if (paso !== 'secuencia') return;

    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        marcarIntroVista();
        setPaso('marca');
      }
    }

    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, [paso]);

  function saltarIntro() {
    marcarIntroVista();
    setPaso('marca');
  }

  async function cerrarSesion() {
    await api.post('/auth/logout');
    router.refresh();
  }

  if (paso === 'inicio') {
    return <div className="min-h-screen w-full bg-[#FAFAFA]" />;
  }

  if (paso === 'secuencia') {
    const actual = SECUENCIA[indice];
    return (
      <div className="fixed inset-0 overflow-hidden cursor-pointer" onClick={saltarIntro}>
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
        {/* mix-blend-difference: se lee tanto sobre la cortina negra como sobre la blanca */}
        <p className="pointer-events-none absolute inset-x-0 bottom-8 z-10 text-center text-[10px] uppercase tracking-[0.25em] text-[#FAFAFA]/60 mix-blend-difference">
          Clic o Enter para saltar
        </p>
      </div>
    );
  }

  return (
    // reducedMotion="user": si el sistema pide reducir movimiento, framer-motion quita los desplazamientos
    // y escalados (y, scaleX) y deja solo los fundidos de opacidad.
    <MotionConfig reducedMotion="user">
      <div className="relative isolate min-h-screen w-full flex items-center justify-center bg-[#FAFAFA] px-6 py-16">
        {/* Fondo decorativo. -z-10 + isolate en el contenedor: los puntos quedan sobre el fondo
            #FAFAFA pero debajo del texto y de la tarjeta, sin restarles contraste. La mascara
            radial los apaga en el centro, justo donde va el contenido. */}
        <DotPattern
          width={24}
          height={24}
          cr={1}
          className="-z-10 text-[#0A0A0A]/[0.14] [mask-image:radial-gradient(ellipse_55%_45%_at_50%_50%,transparent_20%,black_80%)]"
        />
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
                {APP_NAME}
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
              className="w-full max-w-sm border border-[#0A0A0A]/12 rounded-2xl bg-[#FAFAFA] p-8 flex flex-col gap-3"
            >
              <h2 className="font-[family-name:var(--font-display)] font-medium text-2xl text-[#0A0A0A] mb-2 text-center">
                {APP_NAME}
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
              className="w-full max-w-sm border border-[#0A0A0A]/12 rounded-2xl bg-[#FAFAFA] p-8 flex flex-col gap-3"
            >
              <h2 className="font-[family-name:var(--font-display)] font-medium text-2xl text-[#0A0A0A]">
                Hola, {usuario.nombre.split(' ')[0]}
              </h2>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-[#0A0A0A]">{usuario.negocioNombre}</p>
                <p className="text-[#0A0A0A]/50 text-xs">{usuario.email}</p>
              </div>
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
    </MotionConfig>
  );
}
