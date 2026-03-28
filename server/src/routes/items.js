import { Router } from 'express';
import pool from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { descendantIds, buildCategoryMaps } from '../lib/categoryTree.js';
import { alertMatchesItem } from '../lib/alertMatching.js';

const router = Router();

router.get('/', async (req, res) => {
  const categoryId = req.query.category_id ? Number(req.query.category_id) : null;
  const status = req.query.status || 'active';
  const [allCats] = await pool.query('SELECT id, parent_id FROM categories');
  const { children } = buildCategoryMaps(allCats);

  let catFilter = null;
  if (categoryId) {
    catFilter = descendantIds(children, categoryId);
  }

  let sql = `
    SELECT i.id, i.seller_id, i.category_id, i.title, i.description, i.price, i.status, i.created_at,
           u.display_name AS seller_name, c.name AS category_name
    FROM items i
    JOIN users u ON u.id = i.seller_id
    JOIN categories c ON c.id = i.category_id
    WHERE i.status = ?
  `;
  const params = [status];
  if (catFilter?.length) {
    sql += ` AND i.category_id IN (${catFilter.map(() => '?').join(',')})`;
    params.push(...catFilter);
  }
  sql += ' ORDER BY i.created_at DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

router.get('/:id/comments', async (req, res, next) => {
  const itemId = Number(req.params.id);
  if (!Number.isFinite(itemId)) {
    return res.status(400).json({ error: 'Invalid item id' });
  }
  try {
    const [items] = await pool.query('SELECT id FROM items WHERE id = ?', [itemId]);
    if (!items.length) return res.status(404).json({ error: 'Item not found' });
    const [rows] = await pool.query(
      `SELECT c.id, c.item_id, c.user_id, c.body, c.created_at,
              u.display_name AS author_name, i.seller_id
       FROM item_comments c
       JOIN users u ON u.id = c.user_id
       JOIN items i ON i.id = c.item_id
       WHERE c.item_id = ?
       ORDER BY c.created_at ASC`,
      [itemId]
    );
    const out = rows.map((r) => ({
      id: r.id,
      item_id: r.item_id,
      user_id: r.user_id,
      body: r.body,
      created_at: r.created_at,
      author_name: r.author_name,
      is_seller: Number(r.user_id) === Number(r.seller_id),
    }));
    res.json(out);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/comments', authRequired, async (req, res, next) => {
  const itemId = Number(req.params.id);
  if (!Number.isFinite(itemId)) {
    return res.status(400).json({ error: 'Invalid item id' });
  }
  const text = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
  if (!text) return res.status(400).json({ error: 'Comment or question text is required' });
  if (text.length > 2000) {
    return res.status(400).json({ error: 'Text is too long (max 2000 characters)' });
  }

  try {
    const [items] = await pool.query('SELECT id, status, seller_id FROM items WHERE id = ?', [itemId]);
    if (!items.length) return res.status(404).json({ error: 'Item not found' });
    const item = items[0];
    if (item.status === 'withdrawn') {
      return res.status(400).json({ error: 'This listing is withdrawn; new questions are closed.' });
    }

    const userId = req.user.sub;
    const [ins] = await pool.query(
      'INSERT INTO item_comments (item_id, user_id, body) VALUES (?, ?, ?)',
      [itemId, userId, text]
    );
    const [rows] = await pool.query(
      `SELECT c.id, c.item_id, c.user_id, c.body, c.created_at, u.display_name AS author_name, i.seller_id
       FROM item_comments c
       JOIN users u ON u.id = c.user_id
       JOIN items i ON i.id = c.item_id
       WHERE c.id = ?`,
      [ins.insertId]
    );
    const row = rows[0];
    res.status(201).json({
      id: row.id,
      item_id: row.item_id,
      user_id: row.user_id,
      body: row.body,
      created_at: row.created_at,
      author_name: row.author_name,
      is_seller: Number(row.user_id) === Number(row.seller_id),
    });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT i.*, u.display_name AS seller_name, c.name AS category_name
     FROM items i
     JOIN users u ON u.id = i.seller_id
     JOIN categories c ON c.id = i.category_id
     WHERE i.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Item not found' });
  res.json(rows[0]);
});

router.post('/', authRequired, async (req, res) => {
  const { category_id, title, description, price } = req.body || {};
  if (!category_id || !title || price == null) {
    return res.status(400).json({ error: 'category_id, title, and price are required' });
  }
  const seller_id = req.user.sub;
  const [r] = await pool.query(
    `INSERT INTO items (seller_id, category_id, title, description, price, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [seller_id, category_id, title.trim(), description?.trim() || null, price]
  );
  const itemId = r.insertId;
  const [items] = await pool.query('SELECT * FROM items WHERE id = ?', [itemId]);
  const item = items[0];

  await notifyMatchingAlerts(item);

  res.status(201).json(item);
});

router.patch('/:id', authRequired, async (req, res, next) => {
  const id = req.params.id;
  const itemDetailSql = `SELECT i.*, u.display_name AS seller_name, c.name AS category_name
     FROM items i
     JOIN users u ON u.id = i.seller_id
     JOIN categories c ON c.id = i.category_id
     WHERE i.id = ?`;
  try {
    const [existing] = await pool.query('SELECT * FROM items WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Item not found' });
    if (Number(existing[0].seller_id) !== Number(req.user.sub)) {
      return res.status(403).json({ error: 'Only the seller can update this listing' });
    }
    if (req.body?.status === 'withdrawn' && existing[0].status !== 'active') {
      return res.status(400).json({ error: 'Only active listings can be withdrawn' });
    }
    const allowed = ['title', 'description', 'price', 'status', 'category_id'];
    const updates = [];
    const vals = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        updates.push(`${k} = ?`);
        vals.push(req.body[k]);
      }
    }
    if (!updates.length) {
      const [rows] = await pool.query(itemDetailSql, [id]);
      return res.json(rows[0]);
    }
    vals.push(id);
    await pool.query(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`, vals);
    const [rows] = await pool.query(itemDetailSql, [id]);
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/buy', authRequired, async (req, res, next) => {
  const itemId = Number(req.params.id);
  if (!Number.isFinite(itemId)) {
    return res.status(400).json({ error: 'Invalid item id' });
  }
  const buyerId = req.user.sub;

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [rows] = await conn.query(
      'SELECT id, seller_id, status FROM items WHERE id = ? FOR UPDATE',
      [itemId]
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Item not found' });
    }
    const row = rows[0];
    if (Number(row.seller_id) === Number(buyerId)) {
      await conn.rollback();
      return res.status(400).json({ error: 'You cannot buy your own listing' });
    }
    if (row.status !== 'active') {
      await conn.rollback();
      return res.status(400).json({ error: 'This listing is no longer available' });
    }
    await conn.query("UPDATE items SET status = 'sold', buyer_id = ? WHERE id = ?", [buyerId, itemId]);
    await conn.commit();
  } catch (e) {
    if (conn) {
      try {
        await conn.rollback();
      } catch {
        /* ignore */
      }
    }
    const sqlMsg = String(e.sqlMessage || e.message || '');
    if (e.code === 'ER_BAD_FIELD_ERROR' && sqlMsg.includes('buyer_id')) {
      return res.status(503).json({
        error:
          'Database is missing the buyer_id column on items. Run the SQL in server/db/migrate_add_buyer_id.sql against your marketplace database, then try again.',
      });
    }
    return next(e);
  } finally {
    if (conn) conn.release();
  }

  try {
    const [full] = await pool.query(
      `SELECT i.*, u.display_name AS seller_name, c.name AS category_name
       FROM items i
       JOIN users u ON u.id = i.seller_id
       JOIN categories c ON c.id = i.category_id
       WHERE i.id = ?`,
      [itemId]
    );
    if (!full.length) return res.status(404).json({ error: 'Item not found' });
    res.json(full[0]);
  } catch (e) {
    next(e);
  }
});

async function notifyMatchingAlerts(item) {
  if (item.status !== 'active') return;

  const [catRows] = await pool.query('SELECT id, parent_id, name FROM categories');
  const [alerts] = await pool.query(
    `SELECT id, user_id, category_id, min_price, max_price, keyword, is_active
     FROM alerts WHERE is_active = 1`
  );

  const message = `New listing: "${item.title}" — $${Number(item.price).toFixed(2)}`;

  for (const alert of alerts) {
    if (alert.user_id === item.seller_id) continue;
    if (!alertMatchesItem(alert, item, catRows)) continue;

    await pool.query(
      `INSERT INTO notifications (user_id, item_id, alert_id, message) VALUES (?, ?, ?, ?)`,
      [alert.user_id, item.id, alert.id, message]
    );
  }
}

export default router;
