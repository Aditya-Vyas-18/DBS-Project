import { useEffect, useState, useMemo } from 'react';
import { api } from '../api.js';
import './PageHero.css';
import './NotificationsPage.css';

function flattenForSelect(nodes, depth = 0) {
  const out = [];
  for (const n of nodes || []) {
    out.push({ id: n.id, label: `${'— '.repeat(depth)}${n.name}` });
    out.push(...flattenForSelect(n.children, depth + 1));
  }
  return out;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [tree, setTree] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const options = useMemo(() => flattenForSelect(tree), [tree]);

  async function refresh() {
    const list = await api('/api/alerts');
    setAlerts(list);
  }

  useEffect(() => {
    Promise.all([api('/api/categories'), api('/api/alerts')])
      .then(([c, a]) => {
        setTree(c.tree);
        setAlerts(a);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function addAlert(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/api/alerts', {
        method: 'POST',
        body: {
          category_id: Number(categoryId),
          min_price: minPrice === '' ? null : Number(minPrice),
          max_price: maxPrice === '' ? null : Number(maxPrice),
          keyword: keyword || null,
        },
      });
      setCategoryId('');
      setMinPrice('');
      setMaxPrice('');
      setKeyword('');
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggle(a, on) {
    try {
      await api(`/api/alerts/${a.id}`, { method: 'PATCH', body: { is_active: on ? 1 : 0 } });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this alert?')) return;
    try {
      await api(`/api/alerts/${id}`, { method: 'DELETE' });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="container muted">Loading…</div>;

  return (
    <div className="container">
      <h1 className="page-title">My alerts</h1>
      <p className="page-sub muted">
        Register interest in a category and optional constraints. You are notified when a matching item is listed (not
        shown publicly).
      </p>

      <form className="card" style={{ maxWidth: 520, marginBottom: '2rem' }} onSubmit={addAlert}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>New alert</h2>
        <div className="field">
          <label htmlFor="acat">Watch category (includes subcategories)</label>
          <select id="acat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="minp">Min price (optional)</label>
          <input id="minp" type="number" min="0" step="0.01" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="maxp">Max price (optional)</label>
          <input id="maxp" type="number" min="0" step="0.01" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="kw">Keyword in title/description (optional)</label>
          <input id="kw" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. gaming" />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Save alert
        </button>
      </form>

      <h2 style={{ fontSize: '1.15rem' }}>Saved alerts</h2>
      {!alerts.length && <p className="muted">No alerts yet.</p>}
      <ul className="alert-list">
        {alerts.map((a) => (
          <li key={a.id} className="card alert-row">
            <div>
              <strong>{a.category_name}</strong>
              <span className="muted" style={{ marginLeft: '0.5rem' }}>
                {a.min_price != null && `≥ $${Number(a.min_price).toFixed(2)} `}
                {a.max_price != null && `≤ $${Number(a.max_price).toFixed(2)} `}
                {a.keyword && `· “${a.keyword}”`}
              </span>
              <div className="muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {a.is_active ? 'Active' : 'Paused'}
              </div>
            </div>
            <div className="alert-actions">
              <button type="button" className="btn btn-ghost" onClick={() => toggle(a, !a.is_active)}>
                {a.is_active ? 'Pause' : 'Resume'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => remove(a.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
