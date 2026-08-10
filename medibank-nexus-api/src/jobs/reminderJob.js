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
import { decrypt } from '../security/encryption.js';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes

async function sendAppointmentReminders() {
  try {
    const now     = new Date();
    const in24h   = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    /* Find appointments in the next 1-24 hours */
    const appointments = await db('appointments as a')
      .join('patients as p',    'a.patient_id', 'p.id')
      .join('users as d',       'a.doctor_id',  'd.id')
      .where('a.status', 'confirmed')
      .where('a.scheduled_at', '>=', now)
      .where('a.scheduled_at', '<=', in24h)
      .select(
        'a.id as appt_id', 'a.scheduled_at', 'a.hospital_id',
        'p.id as patient_id', 'p.first_name as patient_first_name', 'p.last_name as patient_last_name', 'p.email as patient_email',
        'd.id as doctor_id',  'd.name as doctor_name',
      )
      .limit(100);

    if (appointments.length === 0) return;

    // Fetch all patient users in the hospital to match decrypted emails
    const hospitalId = appointments[0].hospital_id;
    const patientUsers = await db('users')
      .where({ hospital_id: hospitalId, role: 'patient' })
      .select('id', 'email');

    const userMap = {};
    for (const u of patientUsers) {
      if (u.email) {
        userMap[u.email.toLowerCase()] = u.id;
      }
    }

    // Query existing notifications for these appointments to prevent duplicates
    const apptIds = appointments.map(a => String(a.appt_id));
    const existingNotifications = await db('notifications')
      .whereRaw("meta->>'appointment_id' = any(?)", [apptIds])
      .select('user_id', 'meta');

    const sentSet = new Set();
    for (const n of existingNotifications) {
      const meta = typeof n.meta === 'string' ? JSON.parse(n.meta) : n.meta;
      if (meta && meta.appointment_id) {
        sentSet.add(`${n.user_id}:${meta.appointment_id}:${meta.reminder_type}`);
      }
    }

    let sentCount = 0;

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

      const patientName = `${decrypt(appt.patient_first_name)} ${decrypt(appt.patient_last_name)}`;
      const patientEmail = decrypt(appt.patient_email);
      const patientUserId = patientEmail ? userMap[patientEmail.toLowerCase()] : null;

      /* Notify patient (if linked to a user account) */
      if (patientUserId) {
        const key = `${patientUserId}:${appt.appt_id}:${reminderType}`;
        if (!sentSet.has(key)) {
          await db('notifications').insert({
            hospital_id: appt.hospital_id,
            user_id:     patientUserId,
            title:       reminderType === '1h' ? 'Appointment in 1 hour' : 'Appointment tomorrow',
            body:        `You have an appointment with ${appt.doctor_name} on ${timeStr}.`,
            type:        'appointment',
            action_url:  'appointments',
            meta:        JSON.stringify({ appointment_id: appt.appt_id, reminder_type: reminderType }),
          }).onConflict().ignore();
          sentCount++;
        }
      }

      /* Notify doctor */
      const docKey = `${appt.doctor_id}:${appt.appt_id}:${reminderType}`;
      if (!sentSet.has(docKey)) {
        await db('notifications').insert({
          hospital_id: appt.hospital_id,
          user_id:     appt.doctor_id,
          title:       reminderType === '1h' ? 'Patient appointment in 1 hour' : 'Patient appointment tomorrow',
          body:        `${patientName} has an appointment with you on ${timeStr}.`,
          type:        'appointment',
          action_url:  'appointments',
          meta:        JSON.stringify({ appointment_id: appt.appt_id, reminder_type: reminderType }),
        }).onConflict().ignore();
        sentCount++;
      }
    }

    if (sentCount > 0) {
      console.log(`[ReminderJob] Sent ${sentCount} appointment reminder notification(s)`);
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
