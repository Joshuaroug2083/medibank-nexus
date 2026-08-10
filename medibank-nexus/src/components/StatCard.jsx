/**
 * StatCard — KPI metric card
 *
 * Usage:
 *   <StatCard
 *     icon={<IcPeople />}
 *     label="Total Patients"
 *     value="5,486"
 *     change="+24.3%"
 *     trend="up"
 *     color="var(--primary)"
 *     delay={0}
 *   />
 */

import { IcArrowUp, IcArrowDown } from './Icons';

export default function StatCard({
  /** Icon element */
  icon,
  /** Metric label */
  label,
  /** Formatted value string */
  value,
  /** Change string e.g. "+12.4%" */
  change,
  /** 'up' | 'down' | null */
  trend,
  /** CSS colour for value, icon bg, and accent bar */
  color   = 'var(--primary)',
  /** Stagger animation delay in ms */
  delay   = 0,
  onClick,
  className = '',
  style,
  /** Loading state */
  loading = false,
}) {
  return (
    <div
      className={`stat-card${onClick ? ' cursor-pointer' : ''} ${className}${loading ? ' loading' : ''}`}
      style={{ '--stat-accent': color, animationDelay: `${delay}ms`, ...style }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Icon row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 13 }}>
        {icon && (
          <div
            className="stat-icon"
            style={{ background: `color-mix(in srgb, ${color} 12%, white)` }}
            aria-hidden="true"
          >
            <span style={{ color }}>{icon}</span>
          </div>
        )}

        {loading ? (
          <div className="skeleton" style={{ width: 48, height: 16, borderRadius: 'var(--radius-sm)' }} />
        ) : (
          change && trend && (
            <div className={`stat-change ${trend}`} aria-label={`${trend === 'up' ? 'Increased' : 'Decreased'} by ${change}`}>
              {trend === 'up'
                ? <IcArrowUp  width={12} height={12} />
                : <IcArrowDown width={12} height={12} />
              }
              {change}
            </div>
          )
        )}
      </div>

      {/* Value */}
      <div className="stat-value" style={{ color }}>
        {loading ? (
          <div className="skeleton" style={{ width: '55%', height: 32, margin: '2px 0 6px', borderRadius: 'var(--radius-md)' }} />
        ) : (
          value
        )}
      </div>

      {/* Label */}
      <div className="stat-label">
        {loading ? (
          <div className="skeleton" style={{ width: '40%', height: 12, borderRadius: 'var(--radius-xs)' }} />
        ) : (
          label
        )}
      </div>
    </div>
  );
}
