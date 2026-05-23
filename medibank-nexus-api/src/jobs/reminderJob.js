/**
 * Appointment Reminder Job
 * Runs on a schedule (via setInterval or external cron) to send
 * in-app notifications for appointments happening in the next 24h / 1h.
 *
 * Usage: imported once at startup in index.js via startReminderJob()
 *
 * No BullMQ/Redis required — uses DB polling with scheduled_jobs table
 * as a fallback queue, so it works even without Redis.
 */
import db from '../db.js';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes

async function sendAppointmentReminders() {
  try {
    const now     = new Date();
    const in24h   = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1h    = new Date(now.getTime() +  1 * 60 * 60 * 1000);
    const window1 = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23h ahead (24h window start)

    /* Find appointments in the next 1-24 hours not yet reminded */
    const appointments = await db('appointments as a')
      .join('patients as p',    'a.patient_id', 'p.id')
      .join('users as d',       'a.doctor_id',  'd.id')
      .leftJoin('notifications as n', function() {
        this.on('n.user_id',     'p.user_id')
            .andOn(db.raw("n.meta->>'appointment_id' = a.id::text"))
            .andOnIn('n.meta->>\'reminder_type\'', ['24h', '1h']);
      })
      .where('a.status', 'confirmed')
      .where('a.scheduled_at', '>=', now)
      .where('a.scheduled_at', '<=', in24h)
      .whereNull('n.id') // not yet notified
      .select(
        'a.id as appt_id', 'a.scheduled_at', 'a.hospital_id',
        'p.id as patient_id', 'p.name as patient_name', 'p.user_id as patient_user_id',
        'd.id as doctor_id',  'd.name as doctor_name',
      )
      .limit(100);

    for (const appt of appointments) {
      const apptTime   = new Date(appt.scheduled_at);
      const msUntil    = apptTime - now;
      const hoursUntil = msUntil / (1000 * 60 * 60);

      let reminderType = null;
      if (hoursUntil <= 1.5)  reminderType = '1h';
      else if (hoursUntil <= 24) reminderType = '24h';
      if (!reminderType) continue;

      const timeStr = apptTime.toLocaleString('en-NG', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos',
      });

      /* Notify patient (if linked to a user account) */
      if (appt.patient_user_id) {
        await db('notifications').insert({
          hospital_id: appt.hospital_id,
          user_id:     appt.patient_user_id,
          title:       reminderType === '1h' ? 'Appointment in 1 hour' : 'Appointment tomorrow',
          body:        `You have an appointment with ${appt.doctor_name} on ${timeStr}.`,
          type:        'appointment',
          action_url:  'appointments',
          meta:        JSON.stringify({ appointment_id: appt.appt_id, reminder_type: reminderType }),
        }).onConflict().ignore();
      }

      /* Notify doctor */
      await db('notifications').insert({
        hospital_id: appt.hospital_id,
        user_id:     appt.doctor_id,
        title:       reminderType === '1h' ? 'Patient appointment in 1 hour' : 'Patient appointment tomorrow',
        body:        `${appt.patient_name} has an appointment with you on ${timeStr}.`,
        type:        'appointment',
        action_url:  'appointments',
        meta:        JSON.stringify({ appointment_id: appt.appt_id, reminder_type: reminderType }),
      }).onConflict().ignore();
    }

    if (appointments.length > 0) {
      console.log(`[ReminderJob] Sent ${appointments.length} appointment reminder(s)`);
    }
  } catch (err) {
    console.error('[ReminderJob] Error:', err.message);
  }
}

export function startReminderJob() {
  console.log('[ReminderJob] Started — checking every 5 minutes');
  sendAppointmentReminders(); // run immediately on startup
  setInterval(sendAppointmentReminders, CHECK_INTERVAL_MS);
}
