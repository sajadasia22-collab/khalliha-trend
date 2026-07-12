const PARTICLES = [
  { left: "6%", size: "13px", duration: "5.5s", delay: "0s", opacity: 0.4 },
  { left: "22%", size: "10px", duration: "4.8s", delay: "1.4s", opacity: 0.3 },
  { left: "40%", size: "15px", duration: "6.2s", delay: "0.6s", opacity: 0.35 },
  { left: "58%", size: "11px", duration: "5s", delay: "2.2s", opacity: 0.3 },
  { left: "74%", size: "13px", duration: "5.8s", delay: "1s", opacity: 0.4 },
  { left: "90%", size: "10px", duration: "4.6s", delay: "2.8s", opacity: 0.3 },
];

/**
 * Decorative floating "$" particles that drift around the hero's dashboard
 * mockup — deliberately placed outside/behind the card (via negative inset,
 * no clipping) rather than inside it, so they read as ambient scene dressing
 * instead of noise cluttering the mockup's own UI. Never opaque past ~0.4.
 */
export function FloatingDollars() {
  return (
    <div className="pointer-events-none absolute -inset-10 z-10" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="float-dollar"
          style={{
            left: p.left,
            fontSize: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
            // @ts-expect-error CSS custom property
            "--float-dollar-opacity": p.opacity,
          }}
        >
          $
        </span>
      ))}
    </div>
  );
}
