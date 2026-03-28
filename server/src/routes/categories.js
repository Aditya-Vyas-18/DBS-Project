import { Router } from 'express';
import pool from '../db.js';
import { rowsToTree } from '../lib/categoryTree.js';

const router = Router();

router.get('/', async (_req, res) => {
  const [rows] = await pool.query('SELECT id, parent_id, name FROM categories ORDER BY id');
  res.json({ tree: rowsToTree(rows), flat: rows });
});

export default router;
