/**
 * Toggle — on/off switch
 *
 * Usage:
 *   const [on, setOn] = useState(true);
 *   <Toggle value={on} onChange={setOn} label="SMS Reminders" />
 *   <Toggle value={on} onChange={setOn} label="WhatsApp" description="Send to registered number" />
 */

export default function Toggle({
  value     = false,
  onChange,
  label,
  description,
  disabled  = false,
  id,
  className = '',
}) {
  const toggleId = id ?? `toggle-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div
      className={`flex items-center justify-between ${className}`}
      style={{ gap: 12 }}
    >
      {(label || description) && (
        <div style={{ flex: 1 }}>
          {label && (
            <label
              htmlFor={toggleId}
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-700)',
                display: 'block',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {label}
            </label>
          )}
          {description && (
            <div style={{ fontSize: '0.74rem', color: 'var(--text-400)', marginTop: 2 }}>
              {description}
            </div>
          )}
        </div>
      )}

      <button
        id={toggleId}
        role="switch"
        aria-checked={value}
        className={`toggle${value ? ' on' : ''}`}
        onClick={() => !disabled && onChange?.(!value)}
        disabled={disabled}
        style={{ opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <div className="toggle-knob" />
      </button>
    </div>
  );
}
