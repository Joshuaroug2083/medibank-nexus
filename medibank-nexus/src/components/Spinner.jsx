/**
 * Spinner
 *
 * Usage:
 *   <Spinner />
 *   <Spinner size="lg" color="var(--teal)" />
 *   <Spinner size="sm" dark />
 */

export default function Spinner({
  /** 'sm' | 'md' | 'lg' */
  size  = 'md',
  /** Custom CSS color */
  color,
  /** Dark variant (blue on white) instead of white on colour */
  dark  = false,
  className = '',
  style,
}) {
  const pxMap = { sm: 14, md: 20, lg: 30 };
  const bwMap = { sm: 2,  md: 2.5, lg: 3  };
  const px = pxMap[size] ?? 20;
  const bw = bwMap[size] ?? 2.5;

  const trackColor = color
    ? `color-mix(in srgb, ${color} 28%, transparent)`
    : dark
      ? 'rgba(10, 40, 80, 0.14)'
      : 'rgba(255, 255, 255, 0.3)';

  const spinColor = color ?? (dark ? 'var(--primary)' : 'white');

  return (
    <div
      className={`spinner-base ${className}`}
      role="status"
      aria-label="Loading"
      style={{
        width:       px,
        height:      px,
        borderRadius: '50%',
        border:      `${bw}px solid ${trackColor}`,
        borderTopColor: spinColor,
        animation:   'spin 0.65s linear infinite',
        flexShrink:  0,
        ...style,
      }}
    />
  );
}
