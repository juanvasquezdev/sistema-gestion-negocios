'use client';

import { useEffect, useState } from 'react';
import {
  Producto,
  ProductoCreateInput,
  ProductoUpdateInput,
  UnidadMedida,
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from '@/lib/productos';
import { Categoria, listarCategorias, crearCategoria } from '@/lib/categorias';
import { ProveedorSelector, listarProveedoresSelector, crearProveedor } from '@/lib/proveedores';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Paginacion } from '@/components/paginacion';

const ESTILO_SELECT =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

interface FormState {
  nombre: string;
  categoriaId: string;
  proveedorId: string;
  unidadMedida: UnidadMedida;
  precioVenta: string;
  stockInicial: string;
  stockMinimo: string;
}

const FORM_VACIO: FormState = {
  nombre: '',
  categoriaId: '',
  proveedorId: '',
  unidadMedida: 'UNIDAD',
  precioVenta: '',
  stockInicial: '',
  stockMinimo: '',
};

function formatoNumero(valor: string | number) {
  return Number(valor).toLocaleString('es-CO');
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorSelector[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [nombreNuevaCategoria, setNombreNuevaCategoria] = useState('');
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);

  const [creandoProveedor, setCreandoProveedor] = useState(false);
  const [nombreNuevoProveedor, setNombreNuevoProveedor] = useState('');
  const [guardandoProveedor, setGuardandoProveedor] = useState(false);

  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [porEliminar, setPorEliminar] = useState<Producto | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const [prods, cats, provs] = await Promise.all([
        listarProductos(pagina),
        listarCategorias(),
        listarProveedoresSelector(),
      ]);
      setProductos(prods.data);
      setTotalPaginas(prods.totalPaginas);
      setCategorias(cats);
      setProveedores(provs);
    } catch {
      setError('No se pudieron cargar los productos.');
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
    setEditando(null);
    setForm(FORM_VACIO);
    setErrorForm(null);
    setCreandoCategoria(false);
    setCreandoProveedor(false);
    setDialogAbierto(true);
  }

  function abrirEditar(producto: Producto) {
    setEditando(producto);
    setForm({
      nombre: producto.nombre,
      categoriaId: producto.categoriaId,
      proveedorId: producto.proveedorId ?? '',
      unidadMedida: producto.unidadMedida,
      precioVenta: producto.precioVenta,
      stockInicial: '',
      stockMinimo: producto.inventario?.stockMinimo ?? '',
    });
    setErrorForm(null);
    setCreandoCategoria(false);
    setCreandoProveedor(false);
    setDialogAbierto(true);
  }

  async function crearCategoriaInline() {
    if (!nombreNuevaCategoria.trim()) return;
    setGuardandoCategoria(true);
    try {
      const nueva = await crearCategoria({ nombre: nombreNuevaCategoria.trim() });
      setCategorias((prev) => [...prev, nueva]);
      setForm((f) => ({ ...f, categoriaId: nueva.id }));
      setNombreNuevaCategoria('');
      setCreandoCategoria(false);
    } catch (err) {
      setErrorForm(
        err instanceof ApiError ? err.data?.message ?? 'No se pudo crear la categoría.' : 'Error de conexión.',
      );
    } finally {
      setGuardandoCategoria(false);
    }
  }

  async function crearProveedorInline() {
    if (!nombreNuevoProveedor.trim()) return;
    setGuardandoProveedor(true);
    try {
      const nuevo = await crearProveedor({ nombre: nombreNuevoProveedor.trim() });
      setProveedores((prev) => [...prev, nuevo]);
      setForm((f) => ({ ...f, proveedorId: nuevo.id }));
      setNombreNuevoProveedor('');
      setCreandoProveedor(false);
    } catch (err) {
      setErrorForm(
        err instanceof ApiError ? err.data?.message ?? 'No se pudo crear el proveedor.' : 'Error de conexión.',
      );
    } finally {
      setGuardandoProveedor(false);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setErrorForm(null);
    try {
      if (editando) {
        const payload: ProductoUpdateInput = {
          nombre: form.nombre,
          categoriaId: form.categoriaId,
          unidadMedida: form.unidadMedida,
          precioVenta: Number(form.precioVenta),
        };
        if (form.proveedorId) payload.proveedorId = form.proveedorId;
        if (form.stockMinimo) payload.stockMinimo = Number(form.stockMinimo);
        await actualizarProducto(editando.id, payload);
      } else {
        const payload: ProductoCreateInput = {
          nombre: form.nombre,
          categoriaId: form.categoriaId,
          unidadMedida: form.unidadMedida,
          precioVenta: Number(form.precioVenta),
          stockInicial: Number(form.stockInicial),
        };
        if (form.proveedorId) payload.proveedorId = form.proveedorId;
        if (form.stockMinimo) payload.stockMinimo = Number(form.stockMinimo);
        await crearProducto(payload);
      }
      setDialogAbierto(false);
      await cargar();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorForm(err.data?.message ?? 'No se pudo guardar el producto.');
      } else {
        setErrorForm('No se pudo conectar con el servidor.');
      }
    } finally {
      setGuardando(false);
    }
  }

  function abrirEliminar(producto: Producto) {
    setErrorEliminar(null);
    setPorEliminar(producto);
  }

  async function confirmarEliminar() {
    if (!porEliminar) return;
    setEliminando(true);
    setErrorEliminar(null);
    try {
      await eliminarProducto(porEliminar.id);
      setPorEliminar(null);
      await cargar();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorEliminar(err.data?.message ?? 'No se pudo eliminar el producto.');
      } else {
        setErrorEliminar('No se pudo conectar con el servidor.');
      }
    } finally {
      setEliminando(false);
    }
  }

  const esGramo = form.unidadMedida === 'GRAMO';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona el catálogo e inventario de tu negocio
          </p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="h-4 w-4" />
          Nuevo producto
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no tienes productos registrados.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((producto) => {
                const bajoStock =
                  producto.inventario?.stockMinimo &&
                  Number(producto.inventario.stockActual) <= Number(producto.inventario.stockMinimo);
                return (
                  <TableRow key={producto.id}>
                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                    <TableCell>{producto.categoria.nombre}</TableCell>
                    <TableCell>{producto.proveedor?.nombre || '—'}</TableCell>
                    <TableCell>
                      ${formatoNumero(producto.precioVenta)}
                      <span className="text-muted-foreground text-xs">
                        {' '}
                        /{producto.unidadMedida === 'GRAMO' ? 'kg' : 'unidad'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={bajoStock ? 'text-red-600 font-medium' : ''}>
                        {formatoNumero(producto.inventario?.stockActual ?? 0)}
                        {producto.unidadMedida === 'GRAMO' ? ' g' : ''}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(producto)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => abrirEliminar(producto)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form onSubmit={guardar}>
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
              <DialogDescription>
                {editando ? 'Actualiza los datos del producto.' : 'Completa los datos del nuevo producto.'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="unidadMedida">Unidad de medida</Label>
                <select
                  id="unidadMedida"
                  className={ESTILO_SELECT}
                  value={form.unidadMedida}
                  onChange={(e) => setForm({ ...form, unidadMedida: e.target.value as UnidadMedida })}
                >
                  <option value="UNIDAD">Unidad</option>
                  <option value="GRAMO">Gramo (peso, se vende por kg)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="categoriaId">Categoría</Label>
                {!creandoCategoria ? (
                  <select
                    id="categoriaId"
                    className={ESTILO_SELECT}
                    value={form.categoriaId}
                    onChange={(e) => {
                      if (e.target.value === '__nueva__') {
                        setCreandoCategoria(true);
                      } else {
                        setForm({ ...form, categoriaId: e.target.value });
                      }
                    }}
                    required
                  >
                    <option value="" disabled>
                      Selecciona una categoría
                    </option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                    <option value="__nueva__">+ Crear nueva categoría</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      placeholder="Nombre de la nueva categoría"
                      value={nombreNuevaCategoria}
                      onChange={(e) => setNombreNuevaCategoria(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={guardandoCategoria}
                      onClick={crearCategoriaInline}
                    >
                      {guardandoCategoria ? '...' : 'Crear'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCreandoCategoria(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="proveedorId">Proveedor (opcional)</Label>
                {!creandoProveedor ? (
                  <select
                    id="proveedorId"
                    className={ESTILO_SELECT}
                    value={form.proveedorId}
                    onChange={(e) => {
                      if (e.target.value === '__nuevo__') {
                        setCreandoProveedor(true);
                      } else {
                        setForm({ ...form, proveedorId: e.target.value });
                      }
                    }}
                  >
                    <option value="">Sin proveedor</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                    <option value="__nuevo__">+ Crear nuevo proveedor</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      placeholder="Nombre del nuevo proveedor"
                      value={nombreNuevoProveedor}
                      onChange={(e) => setNombreNuevoProveedor(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={guardandoProveedor}
                      onClick={crearProveedorInline}
                    >
                      {guardandoProveedor ? '...' : 'Crear'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCreandoProveedor(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="precioVenta">
                  Precio de venta {esGramo ? '(por kilogramo)' : '(por unidad)'}
                </Label>
                <Input
                  id="precioVenta"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precioVenta}
                  onChange={(e) => setForm({ ...form, precioVenta: e.target.value })}
                  required
                />
              </div>

              {!editando && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="stockInicial">
                    Stock inicial {esGramo ? '(en gramos)' : '(en unidades)'}
                  </Label>
                  <Input
                    id="stockInicial"
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.stockInicial}
                    onChange={(e) => setForm({ ...form, stockInicial: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="stockMinimo">
                  Stock mínimo (alerta de reabastecimiento, opcional)
                </Label>
                <Input
                  id="stockMinimo"
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.stockMinimo}
                  onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
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
                {guardando ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={porEliminar !== null}
        onOpenChange={(abierto) => !abierto && setPorEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente{' '}
              <strong>{porEliminar?.nombre}</strong> y su inventario asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorEliminar && (
            <p className="text-sm text-red-600" role="alert">
              {errorEliminar}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarEliminar} disabled={eliminando}>
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}