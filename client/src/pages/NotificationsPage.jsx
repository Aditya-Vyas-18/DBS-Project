import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import './PageHero.css';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api('/api/notifications');
      setRows(data);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    await api(`/api/notifications/${id}/read`, { method: 'PATCH', body: {} });
    await load();
  }

  async function markAll() {
    await api('/api/notifications/read-all', { method: 'POST', body: {} });
    await load();
  }

  const unread = rows.filter((n) => !n.is_read).length;

  return (
    <div className="container">
      <div className="notif-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub muted">Matches from your private category alerts.</p>
        </div>
        {unread > 0 && (
          <button type="button" className="btn" onClick={markAll}>
            Mark all read
          </button>
        )}
      </div>

      {error && <p className="error-msg">{error}</p>}
      {!rows.length && <p className="muted">No notifications yet. Create alerts and wait for new listings.</p>}
      <ul className="notif-list">
        {rows.map((n) => (
          <li key={n.id} className={`card notif-item ${n.is_read ? '' : 'unread'}`}>
            <div>
              {!n.is_read && <span className="badge badge-unread">New</span>}
              <p className="notif-msg">{n.message}</p>
              <p className="muted notif-meta">
                {n.item_title} · ${Number(n.item_price).toFixed(2)} ·{' '}
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
            <div className="notif-actions">
              <Link to={`/items/${n.item_id}`} className="btn btn-ghost">
                View item
              </Link>
              {!n.is_read && (
                <button type="button" className="btn" onClick={() => markRead(n.id)}>
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
