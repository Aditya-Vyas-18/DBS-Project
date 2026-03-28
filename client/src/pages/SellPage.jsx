import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function SellPage() {
  const navigate = useNavigate();
  const [tree, setTree] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/api/categories').then((d) => setTree(d.tree));
  }, []);

  const options = useMemo(() => flattenForSelect(tree), [tree]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const item = await api('/api/items', {
        method: 'POST',
        body: {
          title,
          description,
          price: Number(price),
          category_id: Number(categoryId),
        },
      });
      navigate(`/items/${item.id}`);
    } catch (err) {
      setError(err.message || 'Could not create listing');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">List an item</h1>
      <p className="page-sub muted">New active listings trigger alert matching for other users.</p>

      <form className="card" style={{ maxWidth: 520 }} onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="cat">Category</label>
          <select id="cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="price">Price (USD)</label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="desc">Description</label>
          <textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Publishing…' : 'Publish listing'}
        </button>
      </form>
    </div>
  );
}
