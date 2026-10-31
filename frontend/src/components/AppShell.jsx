import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import apiClient, { clearSession, getStoredUser } from '../api/client';
import { getInitials, isAdmin } from '../utils/userDisplay';
import styles from './AppShell.module.css';

function AppShell({ children, profile }) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const user = profile || getStoredUser();
  const name = user?.fullName || 'Account';
  const admin = isAdmin(user?.role);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      // Invalidate the token on the server first (the interceptor adds the Bearer header)
      await apiClient.post('/auth/logout');
    } catch {
      // If the token is already invalid or the server is unreachable,
      // we still want to end the local session below.
    } finally {
      clearSession();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/dashboard" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              UH
            </span>
            UserHub
          </Link>

          <nav className={styles.nav} aria-label="Main">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Dashboard
            </NavLink>
            {admin && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                }
              >
                Users
              </NavLink>
            )}
          </nav>

          <div className={styles.account}>
            <span className={styles.avatar} aria-hidden="true">
              {getInitials(name)}
            </span>
            <span className={styles.accountName}>{name}</span>
            <button
              type="button"
              className={styles.logout}
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? 'Logging out…' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <span>© 2026 UserHub. All rights reserved.</span>
        <nav className={styles.footerLinks}>
          <a href="#privacy">Privacy policy</a>
          <a href="#terms">Terms of service</a>
        </nav>
      </footer>
    </div>
  );
}

export default AppShell;
