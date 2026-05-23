import { useState }   from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useToast }    from '../../components/Toast';
import { IcCalendar, IcCheckCircle, IcClock } from '../../components/Icons';

const DAYS = [
  { key: 1, label: 'Mon' }, { key: 2, label: 'Tue' }, { key: 3, label: 'Wed' },
  { key: 4, label: 'Thu' }, { key: 5, label: 'Fri' }, { key: 6, label: 'Sat' },
  { key: 0, label: 'Sun' },
];

const SLOT_OPTIONS = [10, 15, 20, 30, 45, 60];

function TimeSelect({ label, value, onChange }) {
  /* Generate times in 30-min increments */
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const val = `${hh}:${mm}`;
      const ampm = h < 12 ? 'AM' : 'PM';
      const hr12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      options.push({ value: val, label: `${hr12}:${mm} ${ampm}` });
    }
  }
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="input-wrap">
        <div className="input-icon-left"><IcClock width={14} height={14} /></div>
        <select className="select" style={{ paddingLeft: 36 }} value={value} onChange={e => onChange(e.target.value)}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function TabDoctorSchedule() {
  const { settings, patch, save } = useSettings();
  const toast = useToast();

  const [form, setForm] = useState({ ...settings.schedule });
  const p = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleDay = (day) => {
    const days = form.workingDays.includes(day)
      ? form.workingDays.filter(d => d !== day)
      : [...form.workingDays, day];
    p('workingDays', days);
  };

  const handleSave = () => {
    patch('schedule', form);
    save();
    toast.success('Schedule preferences saved');
  };

  /* Visual slot count */
  const workMinutes  = (() => {
    const [sh, sm] = form.startTime.split(':').map(Number);
    const [eh, em] = form.endTime.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (form.lunchBreak) {
      const [lsh, lsm] = form.lunchStart.split(':').map(Number);
      const [leh, lem] = form.lunchEnd.split(':').map(Number);
      mins -= (leh * 60 + lem) - (lsh * 60 + lsm);
    }
    return Math.max(0, mins);
  })();
  const slotsPerDay = Math.floor(workMinutes / form.slotDuration);

  return (
    <div>
      <div className="settings-section-title">Working Days</div>
      <p className="settings-section-desc">Select the days you are available for appointments.</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {DAYS.map(d => {
          const active = form.workingDays.includes(d.key);
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => toggleDay(d.key)}
              style={{
                width: 52, height: 52, borderRadius: 'var(--radius-md)', fontSize: '.82rem', fontWeight: 700,
                border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                background: active ? 'var(--primary)' : 'var(--surface)',
                color: active ? 'white' : 'var(--text-400)',
                cursor: 'pointer', transition: 'all var(--t)',
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      <div className="settings-section-title">Working Hours</div>
      <p className="settings-section-desc">Your available consultation window each working day.</p>

      <div className="settings-grid-2" style={{ maxWidth: 480 }}>
        <TimeSelect label="Start Time" value={form.startTime} onChange={v => p('startTime', v)} />
        <TimeSelect label="End Time"   value={form.endTime}   onChange={v => p('endTime',   v)} />
      </div>

      {/* Slot duration */}
      <div className="settings-section-title">Appointment Slot Duration</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {SLOT_OPTIONS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => p('slotDuration', s)}
            style={{
              padding: '8px 18px', borderRadius: 'var(--radius-full)', fontSize: '.84rem',
              border: `2px solid ${form.slotDuration === s ? 'var(--primary)' : 'var(--border)'}`,
              background: form.slotDuration === s ? 'var(--primary)' : 'var(--surface)',
              color: form.slotDuration === s ? 'white' : 'var(--text-700)',
              fontWeight: form.slotDuration === s ? 700 : 400,
              cursor: 'pointer', transition: 'all var(--t)',
            }}
          >
            {s} min
          </button>
        ))}
      </div>

      {/* Lunch break */}
      <div className="settings-section-title">Lunch Break</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          role="switch"
          aria-checked={form.lunchBreak}
          onClick={() => p('lunchBreak', !form.lunchBreak)}
          style={{
            width: 44, height: 24, borderRadius: 9999, border: 'none', cursor: 'pointer',
            background: form.lunchBreak ? 'var(--primary)' : 'var(--border-dark)', position: 'relative', transition: 'background var(--t)',
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: form.lunchBreak ? 22 : 3,
            width: 18, height: 18, borderRadius: '50%', background: 'white',
            transition: 'left var(--t)',
          }} />
        </button>
        <span style={{ fontSize: '.87rem', fontWeight: 600, color: 'var(--text-700)' }}>
          Block lunch break from appointments
        </span>
      </div>

      {form.lunchBreak && (
        <div className="settings-grid-2" style={{ maxWidth: 480, marginBottom: 24 }}>
          <TimeSelect label="Lunch Start" value={form.lunchStart} onChange={v => p('lunchStart', v)} />
          <TimeSelect label="Lunch End"   value={form.lunchEnd}   onChange={v => p('lunchEnd',   v)} />
        </div>
      )}

      {/* Summary card */}
      <div style={{
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '14px 18px',
        maxWidth: 400, marginBottom: 24,
        display: 'flex', gap: 14, alignItems: 'center',
      }}>
        <div style={{ color: 'var(--primary)' }}><IcCalendar width={22} height={22} /></div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-900)' }}>
            {slotsPerDay} slots / day
          </div>
          <div style={{ fontSize: '.76rem', color: 'var(--text-400)', marginTop: 2 }}>
            {form.workingDays.length} working day{form.workingDays.length !== 1 ? 's' : ''} ·
            {' '}{form.slotDuration}-min slots · {workMinutes} available minutes/day
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <button className="btn btn-primary" onClick={handleSave}>
          <IcCheckCircle width={14} height={14} /> Save Schedule
        </button>
      </div>
    </div>
  );
}
