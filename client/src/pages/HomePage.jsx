import { Link } from 'react-router-dom';
import './PageHero.css';

export default function HomePage() {
  return (
    <div className="container">
      <section className="hero">
        <p className="hero-eyebrow">Database-driven marketplace</p>
        <h1 className="hero-title">
          Buy and sell with <span className="gradient">hierarchical categories</span> and private alerts.
        </h1>
        <p className="hero-lead">
          List items under nested categories, or register demand quietly: set a category, optional price bounds, and
          keywords. When a matching listing goes live, subscribers are notified automatically—without exposing their
          intent on the public catalog.
        </p>
        <div className="hero-actions">
          <Link to="/listings" className="btn btn-primary">
            Browse listings
          </Link>
          <Link to="/register" className="btn">
            Create account
          </Link>
        </div>
      </section>

      <section className="features grid-3">
        <article className="card feature">
          <h3>Category tree</h3>
          <p className="muted">MySQL models parent/child relationships; the API exposes a nested tree for navigation and filters.</p>
        </article>
        <article className="card feature">
          <h3>Private demand</h3>
          <p className="muted">Alerts are stored per user with constraints. They are not shown as public “wanted” posts.</p>
        </article>
        <article className="card feature">
          <h3>Event-style notifications</h3>
          <p className="muted">Creating an active listing runs a match pass and inserts notification rows for every hit.</p>
        </article>
      </section>
    </div>
  );
}
