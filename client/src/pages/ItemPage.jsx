import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import './PageHero.css';
import './ItemPage.css';

function formatCommentDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(iso);
  }
}

export default function ItemPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    api(`/api/items/${id}`)
      .then(setItem)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setCommentsLoading(true);
    setCommentsError('');
    api(`/api/items/${id}/comments`)
      .then((rows) => {
        if (!cancelled) setComments(rows);
      })
      .catch((e) => {
        if (!cancelled) setCommentsError(e.message);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) return <div className="container error-msg">{error}</div>;
  if (!item) return <div className="container muted">Loading…</div>;

  const isSeller = isAuthenticated && user && Number(user.id) === Number(item.seller_id);
  const isBuyer = isAuthenticated && user && Number(item.buyer_id) === Number(user.id);
  const canBuy =
    item.status === 'active' && isAuthenticated && user && !isSeller;
  const canComment =
    item.status === 'active' || item.status === 'sold';
  const commentsOpen = canComment;

  async function handleBuy() {
    setBuyError('');
    setBuying(true);
    try {
      const updated = await api(`/api/items/${id}/buy`, { method: 'POST' });
      setItem(updated);
    } catch (e) {
      setBuyError(e.message);
    } finally {
      setBuying(false);
    }
  }

  async function handleWithdraw() {
    if (
      !window.confirm(
        'Remove this listing from the marketplace? It will disappear from listings and buyers can no longer purchase it.'
      )
    ) {
      return;
    }
    setWithdrawError('');
    setWithdrawing(true);
    try {
      const updated = await api(`/api/items/${id}`, {
        method: 'PATCH',
        body: { status: 'withdrawn' },
      });
      setItem(updated);
    } catch (e) {
      setWithdrawError(e.message);
    } finally {
      setWithdrawing(false);
    }
  }

  async function handlePostComment(e) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    setCommentError('');
    setCommentSubmitting(true);
    try {
      const created = await api(`/api/items/${id}/comments`, {
        method: 'POST',
        body: { body: text },
      });
      setComments((prev) => [...prev, created]);
      setCommentText('');
    } catch (e) {
      setCommentError(e.message);
    } finally {
      setCommentSubmitting(false);
    }
  }

  return (
    <div className="container item-detail">
      <Link to="/listings" className="muted back-link">
        ← Back to listings
      </Link>
      <div className="card item-detail-card">
        <div className="item-detail-top">
          <span className="badge">{item.category_name}</span>
          <span className={`status status-${item.status}`}>{item.status}</span>
        </div>
        <h1 className="page-title" style={{ marginTop: '0.75rem' }}>
          {item.title}
        </h1>
        <p className="item-detail-price">${Number(item.price).toFixed(2)}</p>
        <p className="muted">Seller: {item.seller_name}</p>
        <div className="item-detail-actions">
          {item.status === 'active' && !isSeller && (
            <>
              {canBuy ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={buying}
                  onClick={handleBuy}
                >
                  {buying ? 'Processing…' : 'Buy now'}
                </button>
              ) : (
                <p className="muted item-buy-hint">
                  <Link to="/login">Log in</Link> to purchase this item.
                </p>
              )}
            </>
          )}
          {item.status === 'sold' && isBuyer && (
            <p className="item-purchased-note">You purchased this listing.</p>
          )}
          {item.status === 'active' && isSeller && (
            <>
              <p className="muted item-buy-hint">This is your listing.</p>
              <button
                type="button"
                className="btn btn-danger"
                disabled={withdrawing}
                onClick={handleWithdraw}
              >
                {withdrawing ? 'Removing…' : 'Remove listing'}
              </button>
            </>
          )}
        </div>
        {withdrawError && <p className="error-msg item-buy-error">{withdrawError}</p>}
        {buyError && <p className="error-msg item-buy-error">{buyError}</p>}
        {item.description && (
          <div className="item-description">
            <h3>Description</h3>
            <p>{item.description}</p>
          </div>
        )}
      </div>

      <section className="card item-comments-card" aria-labelledby="comments-heading">
        <h2 id="comments-heading" className="item-comments-title">
          Questions &amp; comments
        </h2>
        <p className="muted item-comments-intro">
          Ask the seller or leave a note. Anyone signed in can post; the seller can reply here too.
        </p>
        {!commentsOpen && (
          <p className="muted item-comments-closed">
            This listing is withdrawn — past messages are shown below; new posts are closed.
          </p>
        )}
        {commentsLoading && <p className="muted">Loading comments…</p>}
        {commentsError && <p className="error-msg">{commentsError}</p>}
        {!commentsLoading && !comments.length && !commentsError && (
          <p className="muted">No questions yet. Be the first to ask.</p>
        )}
        <ul className="item-comments-list">
          {comments.map((c) => (
            <li key={c.id} className="item-comment">
              <div className="item-comment-meta">
                <span className="item-comment-author">{c.author_name}</span>
                {c.is_seller && <span className="item-comment-badge">Seller</span>}
                <span className="item-comment-date muted">{formatCommentDate(c.created_at)}</span>
              </div>
              <p className="item-comment-body">{c.body}</p>
            </li>
          ))}
        </ul>
        {commentsOpen && (
          <>
            {isAuthenticated ? (
              <form className="item-comment-form" onSubmit={handlePostComment}>
                <div className="field" style={{ marginBottom: '0.75rem' }}>
                  <label htmlFor="comment-body">Your question or comment</label>
                  <textarea
                    id="comment-body"
                    rows={4}
                    maxLength={2000}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="e.g. Is this still available? Any scratches on the screen?"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={commentSubmitting || !commentText.trim()}
                >
                  {commentSubmitting ? 'Posting…' : 'Post'}
                </button>
                {commentError && <p className="error-msg item-buy-error">{commentError}</p>}
              </form>
            ) : (
              <p className="muted">
                <Link to="/login">Log in</Link> to ask a question or comment.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
