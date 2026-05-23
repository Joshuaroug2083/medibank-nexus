/**
 * EmptyState
 *
 * Usage:
 *   <EmptyState
 *     icon={<IcCalendar />}
 *     title="No appointments yet"
 *     description="Book a patient's first appointment to get started."
 *     action={<Button variant="primary">Book Appointment</Button>}
 *   />
 */

export default function EmptyState({
  /** Icon element (use an IcXxx from Icons.jsx) */
  icon,
  title       = 'Nothing here yet',
  description,
  /** Optional CTA below description */
  action,
  className   = '',
  style,
}) {
  return (
    <div className={`empty-state ${className}`} style={style}>
      {icon && (
        <div className="empty-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="empty-title">{title}</div>
      {description && (
        <div className="empty-description">{description}</div>
      )}
      {action && (
        <div style={{ marginTop: 18 }}>{action}</div>
      )}
    </div>
  );
}
