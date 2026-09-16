// Magic UI — Dot Pattern (https://magicui.design/r/dot-pattern.json)
// Adaptado del registro por rendimiento: el original mide el contenedor y monta un <circle> por
// punto (~2300 nodos en 1440x900); acá un <pattern> de SVG repite un solo punto, con el mismo
// resultado visual y 5 nodos fijos sin importar el tamaño. Se quitó la opción `glow` (animaba cada
// punto por separado, no se puede con <pattern>), así que ya no depende de framer-motion.
// Ver docs/design-system.md.
import { useId, type SVGProps } from "react"

import { cn } from "@/lib/utils"

interface DotPatternProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height" | "x" | "y"> {
  /** Separación horizontal entre puntos */
  width?: number
  /** Separación vertical entre puntos */
  height?: number
  /** Desplazamiento de todo el patrón */
  x?: number
  y?: number
  /** Desplazamiento de cada punto dentro de su celda */
  cx?: number
  cy?: number
  /** Radio de cada punto */
  cr?: number
}

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  ...props
}: DotPatternProps) {
  // useId: dos DotPattern en la misma página no comparten el id del <pattern>.
  const id = `dot-pattern-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-neutral-400/80",
        className
      )}
      {...props}
    >
      <defs>
        <pattern id={id} width={width} height={height} x={x} y={y} patternUnits="userSpaceOnUse">
          <circle cx={cx} cy={cy} r={cr} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
