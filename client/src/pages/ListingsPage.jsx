import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import './PageHero.css';

function flattenForSelect(nodes, depth = 0) {
  const out = [];
  for (const n of nodes || []) {
    out.push({ id: n.id, label: `${'— '.repeat(depth)}${n.name}` });
    out.push(...flattenForSelect(n.children, depth + 1));
  }
  return out;
}

export default function ListingsPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState({ tree: [], flat: [] });
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const catData = await api('/api/categories');
        if (!cancelled) setCategories(catData);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const q = categoryId ? `?category_id=${encodeURIComponent(categoryId)}` : '';
    api(`/api/items${q}`)
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setError('');
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const options = useMemo(() => flattenForSelect(categories.tree), [categories.tree]);

  return (
    <div className="container">
      <h1 className="page-title">Listings</h1>
      <p className="page-sub muted">Filter by category subtree. Child listings match parent category filters.</p>

      <div className="field" style={{ maxWidth: 360 }}>
        <label htmlFor="cat">Category filter</label>
        <select
          id="cat"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">All categories</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error-msg">{error}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="grid-items">
          {items.map((i) => (
            <Link key={i.id} to={`/items/${i.id}`} className="card item-card">
              <div className="item-price">${Number(i.price).toFixed(2)}</div>
              <h2 className="item-title">{i.title}</h2>
              <p className="muted item-meta">
                {i.category_name} · {i.seller_name}
              </p>
            </Link>
          ))}
        </div>
      )}
      {!loading && !items.length && <p className="muted">No listings match this filter.</p>}
    </div>
  );
}
