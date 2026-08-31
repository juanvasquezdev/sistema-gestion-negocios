import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
}

export function Paginacion({ pagina, totalPaginas, onCambiar }: PaginacionProps) {
  if (totalPaginas <= 1) return null;

  const numeros = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <Button
        variant="outline"
        size="icon"
        disabled={pagina === 1}
        onClick={() => onCambiar(pagina - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {numeros.map((n) => (
        <Button
          key={n}
          variant={n === pagina ? 'default' : 'outline'}
          size="icon"
          onClick={() => onCambiar(n)}
        >
          {n}
        </Button>
      ))}

      <Button
        variant="outline"
        size="icon"
        disabled={pagina === totalPaginas}
        onClick={() => onCambiar(pagina + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}