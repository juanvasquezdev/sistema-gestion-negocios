'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResumenResponse, obtenerResumen } from '@/lib/resumen';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Tab = 'general' | 'cobrar' | 'stock';

function formatoMoneda(valor: number) {
  return `$${valor.toLocaleString('es-CO')}`;
}

function formatoDiaCorto(fechaIso: string) {
  return new Date(fechaIso + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'short' });
}

function formatoFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface TarjetaProps {
  titulo: string;
  valor: string;
  detalle?: string;
  activa?: boolean;
  onClick?: () => void;
}

function Tarjeta({ titulo, valor, detalle, activa, onClick }: TarjetaProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left flex flex-col gap-1 rounded-lg border p-4 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md' : 'cursor-default'
      } ${activa ? 'border-[#0A0A0A] bg-[#0A0A0A] text-[#FAFAFA]' : 'border-neutral-200 bg-white'}`}
    >
      <span className={`text-xs ${activa ? 'text-neutral-300' : 'text-muted-foreground'}`}>{titulo}</span>
      <span className="text-2xl font-bold">{valor}</span>
      {detalle && (
        <span className={`text-xs ${activa ? 'text-neutral-300' : 'text-muted-foreground'}`}>{detalle}</span>
      )}
    </button>
  );
}

export default function ResumenPage() {
  const router = useRouter();
  const [datos, setDatos] = useState<ResumenResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('general');

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const data = await obtenerResumen();
        setDatos(data);
      } catch {
        setError('No se pudo cargar el resumen del negocio.');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Resumen</h1>
        <p className="text-muted-foreground text-sm">Estado general de tu negocio en tiempo real</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {cargando && <p className="text-sm text-muted-foreground">Cargando resumen...</p>}

      {datos && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Tarjeta
              titulo="Ventas de hoy"
              valor={formatoMoneda(datos.ventasHoy.monto)}
              detalle={`${datos.ventasHoy.cantidad} venta(s)`}
              onClick={() => router.push('/dashboard/ventas')}
            />
            <Tarjeta
              titulo="Ventas del mes"
              valor={formatoMoneda(datos.ventasMes.monto)}
              detalle={`${datos.ventasMes.cantidad} venta(s)`}
              onClick={() => router.push('/dashboard/ventas')}
            />
            <Tarjeta
              titulo="Por cobrar"
              valor={formatoMoneda(datos.totalPorCobrar)}
              detalle={`${datos.deudasPendientes.length} cliente(s)`}
              activa={tab === 'cobrar'}
              onClick={() => setTab(tab === 'cobrar' ? 'general' : 'cobrar')}
            />
            <Tarjeta
              titulo="Stock bajo"
              valor={String(datos.productosStockBajo.length)}
              detalle="producto(s) por reabastecer"
              activa={tab === 'stock'}
              onClick={() => setTab(tab === 'stock' ? 'general' : 'stock')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Tarjeta
              titulo="Clientes"
              valor={String(datos.totalClientes)}
              onClick={() => router.push('/dashboard/clientes')}
            />
            <Tarjeta
              titulo="Productos activos"
              valor={String(datos.totalProductosActivos)}
              onClick={() => router.push('/dashboard/productos')}
            />
          </div>

          <div className="transition-opacity duration-300">
            {tab === 'general' && (
              <div className="rounded-lg border border-neutral-200 p-4">
                <h2 className="text-sm font-medium mb-4">Ventas — últimos 7 días</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={datos.ventasUltimos7Dias}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="fecha" tickFormatter={formatoDiaCorto} stroke="#0A0A0A" />
                    <YAxis
                      stroke="#0A0A0A"
                      tickFormatter={(v) => `$${Number(v).toLocaleString('es-CO')}`}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value: number) => formatoMoneda(value)}
                      labelFormatter={(label) => formatoDiaCorto(label)}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#0A0A0A"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={800}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {tab === 'cobrar' && (
              <div className="rounded-lg border border-neutral-200 p-4">
                <h2 className="text-sm font-medium mb-4">Deudas pendientes y parciales</h2>
                {datos.deudasPendientes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay deudas pendientes. 🎉</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Saldo pendiente</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha límite</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datos.deudasPendientes.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>{d.cliente}</TableCell>
                          <TableCell className="font-medium">{formatoMoneda(d.saldoPendiente)}</TableCell>
                          <TableCell>{d.estado === 'PENDIENTE' ? 'Pendiente' : 'Parcial'}</TableCell>
                          <TableCell>{d.fechaLimite ? formatoFecha(d.fechaLimite) : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}

            {tab === 'stock' && (
              <div className="rounded-lg border border-neutral-200 p-4">
                <h2 className="text-sm font-medium mb-4">Productos con stock bajo</h2>
                {datos.productosStockBajo.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Todo el inventario está en niveles saludables. 🎉</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Stock actual</TableHead>
                        <TableHead>Stock mínimo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datos.productosStockBajo.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.nombre}</TableCell>
                          <TableCell className="font-medium text-red-600">
                            {p.stockActual.toLocaleString('es-CO')}
                            {p.unidadMedida === 'GRAMO' ? ' g' : ''}
                          </TableCell>
                          <TableCell>
                            {p.stockMinimo.toLocaleString('es-CO')}
                            {p.unidadMedida === 'GRAMO' ? ' g' : ''}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
