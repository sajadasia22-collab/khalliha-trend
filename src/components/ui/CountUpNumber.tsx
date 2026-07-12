"use client";

import { useEffect, useRef, useState } from "react";

/** Animates from 0 up to `value` once the element scrolls into view. */
export function CountUpNumber({
  value,
  durationMs = 1200,
  className,
}: {
  value: number | bigint;
  durationMs?: number;
  className?: string;
}) {
  const target = Number(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        observer.disconnect();

        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min((now - start) / durationMs, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * target));
          if (progress < 1) {
            requestAnimationFrame(tick);
          }
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString("ar-IQ", { numberingSystem: "latn" })}
    </span>
  );
}
