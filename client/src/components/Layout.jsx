import { NavLink, Link, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext.jsx';
import FluidBackground from './FluidBackground.jsx';
import './Layout.css';

const springEase = [0.22, 1, 0.36, 1];

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();

  const pageTransition = reduceMotion
    ? {
        initial: { opacity: 1, y: 0, scale: 1 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 14, scale: 0.992 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10, scale: 0.996 },
        transition: { duration: 0.38, ease: springEase },
      };

  return (
    <div className="layout">
      <FluidBackground />
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            <span className="logo-mark" aria-hidden />
            Nexus Market
          </Link>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Home
            </NavLink>
            <NavLink to="/listings" className={({ isActive }) => (isActive ? 'active' : '')}>
              Listings
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/sell">Sell</NavLink>
                <NavLink to="/alerts">My alerts</NavLink>
                <NavLink to="/notifications">Notifications</NavLink>
              </>
            )}
          </nav>
          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <span className="user-pill">{user?.display_name}</span>
                <button type="button" className="btn btn-ghost" onClick={logout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname + location.search}
            className="page-transition"
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
            transition={pageTransition.transition}
            style={{ willChange: reduceMotion ? undefined : 'opacity, transform' }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="footer">
        <div className="container muted">
          Electronic Marketplace — hierarchical categories & private demand alerts. Demo stack: React · Express · MySQL.
        </div>
      </footer>
    </div>
  );
}
