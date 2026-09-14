'use client';

import { useEffect, useState } from 'react';
import { Deuda, listarDeudas, registrarAbono } from '@/lib/deudas';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Coins } from 'lucide-react';
import { Paginacion } from '@/components/paginacion';

function formatoMoneda(valor: string | number) {
  return `$${Number(valor).toLocaleString('es-CO')}`;
}

function formatoFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const ETIQUETA_ESTADO: Record<Deuda['estado'], { texto: string; clase: string }> = {
  PENDIENTE: { texto: 'Pendiente', clase: 'text-red-700 bg-red-100' },
  PARCIAL: { texto: 'Parcial', clase: 'text-amber-700 bg-amber-100' },
  PAGADA: { texto: 'Pagada', clase: 'text-green-700 bg-green-100' },
};

export default function DeudasPage() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [deudaActual, setDeudaActual] = useState<Deuda | null>(null);
  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const data = await listarDeudas(pagina);
      setDeudas(data.data);
      setTotalPaginas(data.totalPaginas);
    } catch {
      setError('No se pudieron cargar las deudas.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      cargar();
    });
  }, [pagina]);

  function abrirAbono(deuda: Deuda) {
    setDeudaActual(deuda);
    setMonto('');
    setErrorForm(null);
    setDialogAbierto(true);
  }

  async function guardarAbono(e: React.FormEvent) {
    e.preventDefault();
    if (!deudaActual) return;
    setGuardando(true);
    setErrorForm(null);
    try {
      await registrarAbono(deudaActual.id, Number(monto));
      setDialogAbierto(false);
      await cargar();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorForm(err.data?.message ?? 'No se pudo registrar el abono.');
      } else {
        setErrorForm('No se pudo conectar con el servidor.');
      }
    } finally {
      setGuardando(false);
    }
  }

  const totalPendiente = deudas
    .filter((d) => d.estado !== 'PAGADA')
    .reduce((acc, d) => acc + Number(d.saldoPendiente), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deudas</h1>
          <p className="text-muted-foreground text-sm">
            Deudas de clientes generadas por ventas a crédito
          </p>
        </div>
        {totalPendiente > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total por cobrar (esta página)</p>
            <p className="text-lg font-bold text-red-600">{formatoMoneda(totalPendiente)}</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {cargando ? (
        // Estado de carga: la misma tabla (encabezados reales) con 5 filas Skeleton. Son un término medio:
        // con listas cortas la tabla se encoge un poco al llegar los datos, y con páginas llenas crece.
        <Table aria-busy="true">
          <caption className="sr-only">Cargando deudas...</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto original</TableHead>
              <TableHead>Saldo pendiente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }, (_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  {/* píldora de estado */}
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  {/* h-7 = Button size="sm" ("Registrar abono") */}
                  <Skeleton className="ml-auto h-7 w-32" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : deudas.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay deudas registradas.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto original</TableHead>
                <TableHead>Saldo pendiente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deudas.map((deuda) => {
                const etiqueta = ETIQUETA_ESTADO[deuda.estado];
                return (
                  <TableRow key={deuda.id}>
                    <TableCell>{formatoFecha(deuda.createdAt)}</TableCell>
                    <TableCell>{deuda.cliente?.nombre ?? '—'}</TableCell>
                    <TableCell>{formatoMoneda(deuda.monto)}</TableCell>
                    <TableCell className="font-medium">
                      {formatoMoneda(deuda.saldoPendiente)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${etiqueta.clase}`}>
                        {etiqueta.texto}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {deuda.estado !== 'PAGADA' && (
                        <Button variant="outline" size="sm" onClick={() => abrirAbono(deuda)}>
                          <Coins className="h-4 w-4" />
                          Registrar abono
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
      )}

      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent>
          <form onSubmit={guardarAbono}>
            <DialogHeader>
              <DialogTitle>Registrar abono</DialogTitle>
              <DialogDescription>
                {deudaActual?.cliente?.nombre} — Saldo pendiente:{' '}
                <strong>{deudaActual && formatoMoneda(deudaActual.saldoPendiente)}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="monto">Monto del abono</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={deudaActual?.saldoPendiente}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {errorForm && (
                <p className="text-sm text-red-600" role="alert">
                  {errorForm}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? 'Registrando...' : 'Registrar abono'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}