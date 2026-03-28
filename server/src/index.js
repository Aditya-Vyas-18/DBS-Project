import './loadEnv.js';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import itemsRoutes from './routes/items.js';
import alertsRoutes from './routes/alerts.js';
import notificationsRoutes from './routes/notifications.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/notifications', notificationsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Marketplace API http://localhost:${PORT}`);
});
