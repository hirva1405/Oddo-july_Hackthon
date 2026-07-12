"use client";
import { useEffect, useRef } from "react";

export default function CountUp({ value, duration = 1300, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const t0 = performance.now() + 250;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, Math.max(0, (t - t0) / duration));
      el.textContent = Math.round(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span ref={ref} className={className}>0</span>;
}
