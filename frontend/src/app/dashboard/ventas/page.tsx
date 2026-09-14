'use client';

import { useEffect, useState } from 'react';
import { Venta, VentaInput, listarVentas, crearVenta } from '@/lib/ventas';
import { ClienteSelector, listarClientesSelector } from '@/lib/clientes';
import { ProductoSelector, listarProductosSelector } from '@/lib/productos';
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
import { Plus, Trash2 } from 'lucide-react';
import { Paginacion } from '@/components/paginacion';

const ESTILO_SELECT =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

interface ItemCarrito {
  productoId: string;
  cantidad: string;
}

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

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<ClienteSelector[]>([]);
  const [productos, setProductos] = useState<ProductoSelector[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [estado, setEstado] = useState<'PAGADA' | 'PENDIENTE'>('PAGADA');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const [v, c, p] = await Promise.all([
        listarVentas(pagina),
        listarClientesSelector(),
        listarProductosSelector(),
      ]);
      setVentas(v.data);
      setTotalPaginas(v.totalPaginas);
      setClientes(c);
      setProductos(p);
    } catch {
      setError('No se pudieron cargar las ventas.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      cargar();
    });
  }, [pagina]);

  function abrirCrear() {
    setClienteId('');
    setEstado('PAGADA');
    setCarrito([]);
    setErrorForm(null);
    setDialogAbierto(true);
  }

  function agregarItem() {
    setCarrito((c) => [...c, { productoId: '', cantidad: '' }]);
  }

  function quitarItem(index: number) {
    setCarrito((c) => c.filter((_, i) => i !== index));
  }

  function actualizarItem(index: number, campo: keyof ItemCarrito, valor: string) {
    setCarrito((c) => c.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  }

  function productoDe(id: string) {
    return productos.find((p) => p.id === id);
  }

  function subtotalDe(item: ItemCarrito) {
    const producto = productoDe(item.productoId);
    if (!producto || !item.cantidad) return 0;
    const cantidad = Number(item.cantidad);
    const precio = Number(producto.precioVenta);
    return producto.unidadMedida === 'GRAMO' ? precio * (cantidad / 1000) : precio * cantidad;
  }

  const totalCarrito = carrito.reduce((acc, item) => acc + subtotalDe(item), 0);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForm(null);

    if (!clienteId) {
      setErrorForm('Selecciona un cliente.');
      return;
    }
    if (carrito.length === 0) {
      setErrorForm('Agrega al menos un producto.');
      return;
    }
    if (carrito.some((item) => !item.productoId || !item.cantidad)) {
      setErrorForm('Completa producto y cantidad en todas las filas.');
      return;
    }

    setGuardando(true);
    try {
      const payload: VentaInput = {
        clienteId,
        estado,
        detalles: carrito.map((item) => ({
          productoId: item.productoId,
          cantidad: Number(item.cantidad),
        })),
      };
      await crearVenta(payload);
      setDialogAbierto(false);
      await cargar();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorForm(err.data?.message ?? 'No se pudo registrar la venta.');
      } else {
        setErrorForm('No se pudo conectar con el servidor.');
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ventas</h1>
          <p className="text-muted-foreground text-sm">Registra y consulta las ventas de tu negocio</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="h-4 w-4" />
          Nueva venta
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {cargando ? (
        // Estado de carga: la misma tabla (encabezados reales) con 5 filas Skeleton. Son un término medio:
        // con listas cortas la tabla se encoge un poco al llegar los datos, y con páginas llenas crece.
        <Table aria-busy="true">
          <caption className="sr-only">Cargando ventas...</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
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
                  <Skeleton className="h-4 w-14" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  {/* píldora de estado (Pagada/Pendiente) */}
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : ventas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no tienes ventas registradas.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.map((venta) => (
                <TableRow key={venta.id}>
                  <TableCell>{formatoFecha(venta.fecha)}</TableCell>
                  <TableCell>{venta.cliente?.nombre ?? '—'}</TableCell>
                  <TableCell>{venta.detalles.length} ítem(s)</TableCell>
                  <TableCell className="font-medium">{formatoMoneda(venta.total)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        venta.estado === 'PAGADA'
                          ? 'text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs font-medium'
                          : 'text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs font-medium'
                      }
                    >
                      {venta.estado === 'PAGADA' ? 'Pagada' : 'Pendiente'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
      )}

      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={guardar}>
            <DialogHeader>
              <DialogTitle>Nueva venta</DialogTitle>
              <DialogDescription>
                Selecciona el cliente y agrega los productos vendidos.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cliente">Cliente</Label>
                <select
                  id="cliente"
                  className={ESTILO_SELECT}
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Selecciona un cliente
                  </option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Productos</Label>
                {carrito.map((item, index) => {
                  const producto = productoDe(item.productoId);
                  return (
                    <div key={index} className="flex gap-2 items-start">
                      <select
                        className={ESTILO_SELECT}
                        value={item.productoId}
                        onChange={(e) => actualizarItem(index, 'productoId', e.target.value)}
                        required
                      >
                        <option value="" disabled>
                          Producto
                        </option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder={producto?.unidadMedida === 'GRAMO' ? 'gramos' : 'cant.'}
                        className="w-28"
                        value={item.cantidad}
                        onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                        required
                      />
                      <span className="text-sm text-muted-foreground w-20 pt-2 text-right">
                        {formatoMoneda(subtotalDe(item))}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => quitarItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  );
                })}
                <Button type="button" variant="outline" size="sm" onClick={agregarItem} className="w-fit">
                  <Plus className="h-4 w-4" />
                  Agregar producto
                </Button>
              </div>

              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold">{formatoMoneda(totalCarrito)}</span>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="estado">Estado de la venta</Label>
                <select
                  id="estado"
                  className={ESTILO_SELECT}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as 'PAGADA' | 'PENDIENTE')}
                >
                  <option value="PAGADA">Pagada</option>
                  <option value="PENDIENTE">Pendiente (crea deuda automáticamente)</option>
                </select>
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
                {guardando ? 'Guardando...' : 'Registrar venta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}