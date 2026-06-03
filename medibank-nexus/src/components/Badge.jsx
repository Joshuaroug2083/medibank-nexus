/**
 * Badge
 *
 * Usage:
 *   <Badge>Default</Badge>
 *   <Badge variant="success">Dispensed</Badge>
 *   <Badge variant="danger" dot>Urgent</Badge>
 *   <Badge variant="warning" icon={<IcWarning/>}>Low Stock</Badge>
 */

export default function Badge({
  children,
  /**
   * 'primary' | 'teal' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'dark'
   */
  variant = 'neutral',
  /** Small pulsing dot before text */
  dot = false,
  /** Icon element */
  icon,
  className = '',
  style,
  ...rest
}) {
  const variantClass = {
    primary: 'badge-primary',
    teal:    'badge-teal',
    success: 'badge-success',
    warning: 'badge-warning',
    danger:  'badge-danger',
    info:    'badge-info',
    neutral: 'badge-neutral',
    dark:    'badge-dark',
  }[variant] ?? 'badge-neutral';

  return (
    <span
      className={`badge ${variantClass} ${className}`}
      style={style}
      {...rest}
    >
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
