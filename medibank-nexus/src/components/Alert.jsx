/**
 * Alert — inline callout
 *
 * Usage:
 *   <Alert type="info">Patient data is NDPR-compliant.</Alert>
 *   <Alert type="danger" icon={<IcWarning/>}>
 *     Allergy alert: Patient is allergic to Penicillin.
 *   </Alert>
 *   <Alert type="success" title="Saved">Visit notes saved successfully.</Alert>
 */

import { IcInfo, IcCheckCircle, IcWarning, IcXCircle } from './Icons';

const DEFAULT_ICONS = {
  info:    <IcInfo        width={16} height={16} />,
  success: <IcCheckCircle width={16} height={16} />,
  warning: <IcWarning     width={16} height={16} />,
  danger:  <IcXCircle     width={16} height={16} />,
};

export default function Alert({
  /** 'info' | 'success' | 'warning' | 'danger' */
  type      = 'info',
  /** Override the default icon */
  icon,
  /** Bold title above the message */
  title,
  children,
  className = '',
  style,
  ...rest
}) {
  const resolvedIcon = icon ?? DEFAULT_ICONS[type];

  return (
    <div
      className={`alert alert-${type} ${className}`}
      role={type === 'danger' ? 'alert' : 'status'}
      aria-live={type === 'danger' ? 'assertive' : 'polite'}
      style={style}
      {...rest}
    >
      {resolvedIcon && (
        <span aria-hidden="true" style={{ flexShrink: 0 }}>
          {resolvedIcon}
        </span>
      )}
      <div>
        {title && (
          <div style={{ fontWeight: 700, marginBottom: children ? 2 : 0 }}>
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
