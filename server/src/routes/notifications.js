import { Router } from 'express';
import pool from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT n.*, i.title AS item_title, i.price AS item_price
     FROM notifications n
     JOIN items i ON i.id = n.item_id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC`,
    [req.user.sub]
  );
  res.json(rows);
});

router.patch('/:id/read', async (req, res) => {
  const [r] = await pool.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.sub]
  );
  if (!r.affectedRows) return res.status(404).json({ error: 'Notification not found' });
  res.json({ ok: true });
});

router.post('/read-all', async (_req, res) => {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.sub]);
  res.json({ ok: true });
});

export default router;
