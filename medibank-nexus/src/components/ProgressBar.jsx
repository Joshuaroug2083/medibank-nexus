/**
 * ProgressBar
 *
 * Usage:
 *   <ProgressBar value={68} />
 *   <ProgressBar value={18} max={50} color="var(--danger)" label="Low Stock" />
 *   <ProgressBar value={92} showPercent />
 */

export default function ProgressBar({
  /** Current value */
  value   = 0,
  /** Maximum value (defaults to 100) */
  max     = 100,
  /** CSS color string for the fill */
  color   = 'var(--primary)',
  /** Optional label shown above the bar */
  label,
  /** Show percentage text next to label */
  showPercent = false,
  /** Height in px */
  height  = 6,
  className = '',
  style,
}) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={className} style={style}>
      {(label || showPercent) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: 'var(--text-500)',
          marginBottom: 5,
          fontWeight: 500,
        }}>
          {label && <span>{label}</span>}
          {showPercent && (
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}

      <div
        className="progress-track"
        style={{ height }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
