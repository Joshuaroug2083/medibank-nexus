/**
 * Card
 *
 * Usage:
 *   <Card>Plain content</Card>
 *   <Card title="Drug Inventory" action={<Button size="sm">View</Button>}>
 *     ...
 *   </Card>
 *   <Card lift>Hoverable card</Card>
 */

export default function Card({
  children,
  /** Card title shown in the header */
  title,
  /** Optional subtitle below title */
  subtitle,
  /** Element placed at right of header (e.g. a Button or Badge) */
  action,
  /** Footer element(s) — rendered in .card-footer */
  footer,
  /** Add hover lift animation */
  lift      = false,
  /** Add blue top-accent on hover */
  accent    = false,
  className = '',
  style,
  ...rest
}) {
  const classes = [
    'card',
    lift   ? 'card-lift'   : '',
    accent ? 'card-accent' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} style={style} {...rest}>
      {(title || action) && (
        <div className="card-header">
          {title && (
            <div>
              <div className="card-title">{title}</div>
              {subtitle && <div className="card-subtitle">{subtitle}</div>}
            </div>
          )}
          {action && <div style={{ marginLeft: 'auto', flexShrink: 0 }}>{action}</div>}
        </div>
      )}

      {children}

      {footer && (
        <div className="card-footer">{footer}</div>
      )}
    </div>
  );
}
