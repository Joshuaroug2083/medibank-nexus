/**
 * ICS (iCalendar) file generator for MediBank Nexus appointments.
 * Generated .ics files work with Google Calendar, Apple Calendar, Outlook.
 * Each event includes a 30-minute alarm so the device notifies the user.
 */

function pad(n) { return String(n).padStart(2, '0'); }

/** Format a JS Date to ICS timestamp: YYYYMMDDTHHMMSSZ */
function toICSDate(date) {
  const d = new Date(date);
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/** Escape special characters in ICS text values */
function escapeICS(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate a full VCALENDAR string from an array of appointment objects.
 *
 * Each appointment should have:
 *   id, title, scheduled_at, duration_minutes (default 30),
 *   notes, patient_name, doctor_name, status
 */
export function generateICS(appointments = [], calendarName = 'MediBank Nexus Appointments') {
  const now = toICSDate(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MediBank Nexus//Hospital Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    'X-WR-TIMEZONE:Africa/Lagos',
    'X-WR-CALDESC:Appointments from MediBank Nexus hospital management system',
  ];

  for (const apt of appointments) {
    const start    = new Date(apt.scheduled_at ?? apt.date);
    const duration = apt.duration_minutes ?? 30;
    const end      = new Date(start.getTime() + duration * 60_000);

    const summary = apt.title ??
      (apt.patient_name ? `Appointment — ${apt.patient_name}` : 'Medical Appointment');

    const descParts = [];
    if (apt.patient_name)  descParts.push(`Patient: ${apt.patient_name}`);
    if (apt.doctor_name)   descParts.push(`Doctor: ${apt.doctor_name}`);
    if (apt.notes)         descParts.push(`Notes: ${apt.notes}`);
    if (apt.status)        descParts.push(`Status: ${apt.status}`);
    const description = descParts.join('\\n');

    const statusMap = {
      confirmed: 'CONFIRMED',
      pending:   'TENTATIVE',
      cancelled: 'CANCELLED',
    };

    lines.push(
      'BEGIN:VEVENT',
      `UID:nexus-apt-${apt.id ?? Math.random().toString(36).slice(2)}@medibank-nexus`,
      `DTSTAMP:${now}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:${escapeICS(summary)}`,
      `DESCRIPTION:${description}`,
      `STATUS:${statusMap[apt.status] ?? 'TENTATIVE'}`,
      'TRANSP:OPAQUE',
      /* 30-minute device alarm */
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Appointment in 30 minutes — MediBank Nexus',
      'END:VALARM',
      /* 1-hour alarm for buffer */
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Appointment in 1 hour — MediBank Nexus',
      'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  /* ICS spec requires CRLF line endings */
  return lines.join('\r\n');
}

/**
 * Trigger a browser download of an .ics file.
 */
export function downloadICS(appointments, filename = 'medibank-appointments.ics') {
  const content = generateICS(appointments);
  const blob    = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a single-event ICS for one appointment (for email attachments or instant download).
 */
export function downloadSingleAppointmentICS(appointment) {
  const date = new Date(appointment.scheduled_at ?? appointment.date);
  const filename = `appointment-${date.toISOString().slice(0, 10)}.ics`;
  downloadICS([appointment], filename);
}
