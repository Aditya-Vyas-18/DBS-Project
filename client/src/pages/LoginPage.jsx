import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import './PageHero.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
      login(data);
      navigate('/listings');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">Log in</h1>
      <p className="page-sub muted">
        Demo: <code>alice@demo.local</code> / <code>bob@demo.local</code> — password <code>demo123</code>
      </p>
      <form className="card" style={{ maxWidth: 400 }} onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Log in
        </button>
        <p className="muted" style={{ marginTop: '1rem' }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
