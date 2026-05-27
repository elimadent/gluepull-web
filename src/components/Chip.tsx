interface ChipProps {
  label: string;
  /** Accent color for the dot + text. Defaults to muted. */
  tint?: string;
}

export function Chip({ label, tint }: ChipProps) {
  return (
    <span className={`chip${tint ? ' tinted' : ''}`}>
      {tint ? <span className="dot" style={{ background: tint }} /> : null}
      {label}
    </span>
  );
}
