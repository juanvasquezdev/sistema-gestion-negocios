// Magic UI — Number Ticker (https://magicui.design/r/number-ticker.json)
// Copiado del registro sin la CLI: la CLI lo escribe en components/ui e instala `motion`.
// Cambios respecto del original: import desde `framer-motion` (ya instalado) en vez de
// `motion/react`, formato `es-CO` en vez de `en-US`, y con reduced motion muestra el valor final
// sin animar (useReducedMotion). Ver docs/design-system.md.
"use client"

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react"
import { useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion"

import { cn } from "@/lib/utils"

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number
  startValue?: number
  direction?: "up" | "down"
  delay?: number
  decimalPlaces?: number
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : startValue)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: "0px" })
  const reducirMovimiento = useReducedMotion()

  useEffect(() => {
    // Reduced motion: se escribe el valor final directo, sin resorte ni retraso.
    if (reducirMovimiento) {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("es-CO", {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(Number((direction === "down" ? startValue : value).toFixed(decimalPlaces)))
      }
      return
    }

    let timer: ReturnType<typeof setTimeout> | null = null

    if (isInView) {
      timer = setTimeout(() => {
        motionValue.set(direction === "down" ? startValue : value)
      }, delay * 1000)
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer)
      }
    }
  }, [motionValue, isInView, delay, value, direction, startValue, reducirMovimiento, decimalPlaces])

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = Intl.NumberFormat("es-CO", {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(Number(latest.toFixed(decimalPlaces)))
        }
      }),
    [springValue, decimalPlaces]
  )

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block tracking-wider text-black tabular-nums dark:text-white",
        className
      )}
      {...props}
    >
      {startValue}
    </span>
  )
}
