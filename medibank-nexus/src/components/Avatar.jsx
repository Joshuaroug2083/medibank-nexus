/**
 * Avatar
 *
 * Usage:
 *   <Avatar initials="EN" />
 *   <Avatar initials="AO" color="var(--teal)" size={40} />
 *   <Avatar initials="JB" size="lg" />
 *   <Avatar initials="CO" shape="square" />
 *   <Avatar src="data:image/jpeg;base64,..." initials="EN" size={40} />
 */

const SIZE_MAP = { xs: 24, sm: 28, md: 34, lg: 44, xl: 56 };

export default function Avatar({
  /** 1-2 character string shown when no src is set */
  initials = '?',
  /** CSS color string for text and border accent */
  color    = 'var(--primary)',
  /** px number or size key: 'xs' | 'sm' | 'md' | 'lg' | 'xl' */
  size     = 'md',
  /** 'circle' | 'square' */
  shape    = 'circle',
  /** Optional image URL or base64 data URL — hides initials when set */
  src,
  className = '',
  style,
  ...rest
}) {
  const px = typeof size === 'number' ? size : (SIZE_MAP[size] ?? 34);
  const fontSize = Math.round(px * 0.32);
  const radius = shape === 'square'
    ? `${Math.round(px * 0.26)}px`
    : '50%';

  const base = {
    width:       px,
    height:      px,
    borderRadius: radius,
    flexShrink:  0,
    overflow:    'hidden',
    ...style,
  };

  if (src) {
    return (
      <div
        className={`avatar ${className}`}
        style={{
          ...base,
          border: `1.5px solid color-mix(in srgb, ${color} 35%, transparent)`,
        }}
        aria-hidden="true"
        {...rest}
      >
        <img
          src={src}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`avatar ${className}`}
      style={{
        ...base,
        background:      `color-mix(in srgb, ${color} 15%, white)`,
        border:          `1.5px solid color-mix(in srgb, ${color} 35%, transparent)`,
        color,
        fontSize,
        letterSpacing: '0.04em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-hidden="true"
      {...rest}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
