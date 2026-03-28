import { Router } from 'express';
import pool from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.*, c.name AS category_name
     FROM alerts a
     JOIN categories c ON c.id = a.category_id
     WHERE a.user_id = ?
     ORDER BY a.created_at DESC`,
    [req.user.sub]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { category_id, min_price, max_price, keyword } = req.body || {};
  if (!category_id) {
    return res.status(400).json({ error: 'category_id is required' });
  }
  const [r] = await pool.query(
    `INSERT INTO alerts (user_id, category_id, min_price, max_price, keyword)
     VALUES (?, ?, ?, ?, ?)`,
    [
      req.user.sub,
      category_id,
      min_price != null && min_price !== '' ? min_price : null,
      max_price != null && max_price !== '' ? max_price : null,
      keyword?.trim() || null,
    ]
  );
  const [rows] = await pool.query(
    `SELECT a.*, c.name AS category_name FROM alerts a
     JOIN categories c ON c.id = a.category_id WHERE a.id = ?`,
    [r.insertId]
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id', async (req, res) => {
  const id = req.params.id;
  const [mine] = await pool.query('SELECT * FROM alerts WHERE id = ? AND user_id = ?', [id, req.user.sub]);
  if (!mine.length) return res.status(404).json({ error: 'Alert not found' });

  const fields = ['min_price', 'max_price', 'keyword', 'is_active', 'category_id'];
  const updates = [];
  const vals = [];
  for (const k of fields) {
    if (req.body[k] !== undefined) {
      updates.push(`${k} = ?`);
      if (k === 'keyword') vals.push(req.body[k]?.trim() || null);
      else if (k === 'min_price' || k === 'max_price') {
        const v = req.body[k];
        vals.push(v === '' || v == null ? null : v);
      } else vals.push(req.body[k]);
    }
  }
  if (!updates.length) {
    const [rows] = await pool.query(
      `SELECT a.*, c.name AS category_name FROM alerts a
       JOIN categories c ON c.id = a.category_id WHERE a.id = ?`,
      [id]
    );
    return res.json(rows[0]);
  }
  vals.push(id, req.user.sub);
  await pool.query(`UPDATE alerts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, vals);
  const [rows] = await pool.query(
    `SELECT a.*, c.name AS category_name FROM alerts a
     JOIN categories c ON c.id = a.category_id WHERE a.id = ?`,
    [id]
  );
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const [r] = await pool.query('DELETE FROM alerts WHERE id = ? AND user_id = ?', [req.params.id, req.user.sub]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Alert not found' });
  res.status(204).send();
});

export default router;
