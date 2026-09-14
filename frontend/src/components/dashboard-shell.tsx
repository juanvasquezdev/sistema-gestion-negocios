'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  ShoppingCart,
  Receipt,
  LogOut,
} from 'lucide-react';
import { api } from '@/lib/api';

const navegacion = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/proveedores', label: 'Proveedores', icon: Truck },
  { href: '/dashboard/productos', label: 'Productos', icon: Package },
  { href: '/dashboard/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/dashboard/deudas', label: 'Deudas', icon: Receipt },
];

interface Usuario {
  email: string;
  rol: string;
  nombre: string;
  negocioNombre: string;
}

const ETIQUETA_ROL: Record<string, string> = {
  ADMIN: 'Admin',
  VENDEDOR: 'Vendedor',
};

export function DashboardShell({
  usuario,
  children,
}: {
  usuario: Usuario;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await api.post('/auth/logout');
    router.push('/login');
    router.refresh();
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="gap-3 px-4 pt-5 pb-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight tracking-tight text-[#0A0A0A] break-words">
            {usuario.negocioNombre}
          </h2>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate text-sm font-medium">{usuario.nombre}</span>
              <span className="shrink-0 rounded-full border border-[#0A0A0A] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#0A0A0A]">
                {ETIQUETA_ROL[usuario.rol] ?? usuario.rol}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">{usuario.email}</p>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Módulos</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navegacion.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    {/* Activo: fondo negro / texto blanco (como la tarjeta activa del Resumen).
                        transition-[...] conserva la transición de tamaño del componente y agrega la de colores. */}
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      className="transition-[color,background-color,width,height,padding] duration-200 hover:bg-neutral-200/70 data-active:bg-[#0A0A0A] data-active:text-[#FAFAFA] data-active:hover:bg-[#0A0A0A] data-active:hover:text-[#FAFAFA]"
                      render={
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t px-4 pt-4 pb-5">
          <Button variant="outline" onClick={handleLogout} className="h-9 w-full justify-center gap-2">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 p-6">
        <SidebarTrigger className="mb-4" />
        {children}
      </main>
    </SidebarProvider>
  );
}
