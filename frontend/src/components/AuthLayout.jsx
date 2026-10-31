import { Link } from 'react-router-dom';
import styles from './AuthLayout.module.css';

function AuthLayout({ children }) {
  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <Link to="/login" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            UH
          </span>
          UserHub
        </Link>
        <p className={styles.tagline}>Simple. Secure. Connected.</p>
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

export default AuthLayout;
