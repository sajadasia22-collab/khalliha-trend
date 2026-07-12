"use client";

import { useEffect, useState } from "react";

/**
 * Purely decorative — used only in the hero's illustrative dashboard mockup
 * (not real data, unlike the verified stats section further down the page).
 * Loops 0 → target → hold → reset, forever, to suggest live growth.
 */
export function LiveMockStat({
  target,
  suffix = "",
  durationMs = 2600,
  holdMs = 1600,
  className,
}: {
  target: number;
  suffix?: string;
  durationMs?: number;
  holdMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    let timeout: number;
    let cancelled = false;

    function runCycle() {
      const start = performance.now();
      function tick(now: number) {
        if (cancelled) return;
        const progress = Math.min((now - start) / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * target));
        if (progress < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          timeout = window.setTimeout(() => {
            if (cancelled) return;
            setDisplay(0);
            timeout = window.setTimeout(runCycle, 500);
          }, holdMs);
        }
      }
      frame = requestAnimationFrame(tick);
    }

    runCycle();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [target, durationMs, holdMs]);

  return (
    <span className={className}>
      {display.toLocaleString("ar-IQ", { numberingSystem: "latn" })}
      {suffix}
    </span>
  );
}
