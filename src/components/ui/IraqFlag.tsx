export function IraqFlag({ className }: { className?: string }) {
  return (
    <span className={`iraq-flag ${className ?? ""}`} aria-hidden="true">
      <svg viewBox="0 0 22 15" width="22" height="15">
        <rect width="22" height="5" y="0" fill="#CE1126" />
        <rect width="22" height="5" y="5" fill="#FFFFFF" />
        <rect width="22" height="5" y="10" fill="#000000" />
        <rect width="7" height="1.6" x="7.5" y="6.7" fill="#007A3D" />
      </svg>
    </span>
  );
}
