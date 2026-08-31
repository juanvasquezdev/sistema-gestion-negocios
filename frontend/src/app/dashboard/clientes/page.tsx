'use client';

import { useEffect, useState } from 'react';
import {
  Cliente,
  ClienteInput,
  listarClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from '@/lib/clientes';
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

const FORM_VACIO: ClienteInput = { nombre: '', documento: '', telefono: '' };

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClienteInput>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const [porEliminar, setPorEliminar] = useState<Cliente | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await listarClientes(pagina, 10);
      setClientes(respuesta.data);
      setTotalPaginas(respuesta.totalPaginas);
    } catch {
      setError('No se pudieron cargar los clientes.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [pagina]);

  function abrirCrear() {
    setEditando(null);
    setForm(FORM_VACIO);
    setErrorForm(null);
    setDialogAbierto(true);
  }

  function abrirEditar(cliente: Cliente) {
    setEditando(cliente);
    setForm({
      nombre: cliente.nombre,
      documento: cliente.documento ?? '',
      telefono: cliente.telefono ?? '',
    });
    setErrorForm(null);
    setDialogAbierto(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setErrorForm(null);
    try {
      if (editando) {
        await actualizarCliente(editando.id, form);
      } else {
        await crearCliente(form);
      }
      setDialogAbierto(false);
      await cargar();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorForm(err.data?.message ?? 'No se pudo guardar el cliente.');
      } else {
        setErrorForm('No se pudo conectar con el servidor.');
      }
    } finally {
      setGuardando(false);
    }
  }

  function abrirEliminar(cliente: Cliente) {
    setErrorEliminar(null);
    setPorEliminar(cliente);
  }

  async function confirmarEliminar() {
    if (!porEliminar) return;
    setEliminando(true);
    setErrorEliminar(null);
    try {
      await eliminarCliente(porEliminar.id);
      setPorEliminar(null);
      await cargar();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorEliminar(err.data?.message ?? 'No se pudo eliminar el cliente.');
      } else {
        setErrorEliminar('No se pudo conectar con el servidor.');
      }
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona los clientes de tu negocio
          </p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando clientes...</p>
      ) : clientes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no tienes clientes registrados.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">{cliente.nombre}</TableCell>
                <TableCell>{cliente.documento || '—'}</TableCell>
                <TableCell>{cliente.telefono || '—'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => abrirEditar(cliente)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => abrirEliminar(cliente)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
      
      {/* Diálogo crear/editar */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent>
          <form onSubmit={guardar}>
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
              <DialogDescription>
                {editando
                  ? 'Actualiza los datos del cliente.'
                  : 'Completa los datos del nuevo cliente.'}
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
                <Label htmlFor="documento">Documento</Label>
                <Input
                  id="documento"
                  value={form.documento}
                  onChange={(e) => setForm({ ...form, documento: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
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

      {/* Confirmación de eliminar */}
      <AlertDialog
        open={porEliminar !== null}
        onOpenChange={(abierto) => !abierto && setPorEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente a{' '}
              <strong>{porEliminar?.nombre}</strong>.
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