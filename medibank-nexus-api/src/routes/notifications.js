import { Router }  from 'express';
import db           from '../db.js';
import authenticate from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

/* ── GET /api/v1/notifications ──────────────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const { unread, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('notifications')
      .where({ hospital_id: req.hospitalId })
      .where(function() {
        /* User sees their own notifications + broadcast (user_id IS NULL) */
        this.where({ user_id: req.user.id }).orWhereNull('user_id');
      })
      .orderBy('created_at','desc');

    if (unread === 'true') query = query.where({ read: false });

    const [{ count }] = await query.clone().count('id as count');
    const notifications = await query.limit(limit).offset(offset);
    const unreadCount   = await db('notifications')
      .where({ hospital_id: req.hospitalId, read: false })
      .where(function() { this.where({ user_id: req.user.id }).orWhereNull('user_id'); })
      .count('id as n').first();

    return res.json({
      notifications,
      total:         parseInt(count),
      unreadCount:   parseInt(unreadCount.n),
      page:          +page,
      limit:         +limit,
    });
  } catch (err) {
    next(err);
  }
});

/* ── PUT /api/v1/notifications/:id/read ─────────────────────── */
router.put('/:id/read', async (req, res, next) => {
  try {
    await db('notifications')
      .where({ id: req.params.id, hospital_id: req.hospitalId })
      .update({ read: true });
    return res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

/* ── PUT /api/v1/notifications/read-all ─────────────────────── */
router.put('/read-all', async (req, res, next) => {
  try {
    await db('notifications')
      .where({ hospital_id: req.hospitalId })
      .where(function() { this.where({ user_id: req.user.id }).orWhereNull('user_id'); })
      .update({ read: true });
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

/* ── DELETE /api/v1/notifications/:id ───────────────────────── */
router.delete('/:id', async (req, res, next) => {
  try {
    await db('notifications').where({ id: req.params.id, hospital_id: req.hospitalId }).delete();
    return res.json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
