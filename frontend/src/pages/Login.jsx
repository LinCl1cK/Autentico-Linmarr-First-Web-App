import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient, { getApiErrorMessage, setSession } from '../api/client';
import AuthLayout from '../components/AuthLayout';
import styles from './authForms.module.css';

const INITIAL_FORM = {
  email: '',
  password: '',
  rememberMe: true,
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registered = Boolean(location.state?.registered);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await apiClient.post('/auth/login', {
        email: form.email.trim(),
        password: form.password,
      });

      setSession(data.token, data.user, form.rememberMe);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Unable to log in. Check your email and password.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <section className={styles.card}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>
          Log in to your UserHub account to continue.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {registered && !error && (
            <div className={styles.success} role="status">
              Account created. You can now log in.
            </div>
          )}

          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <div className={styles.row}>
            <label className={styles.remember}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleChange}
              />
              Remember me
            </label>
            <a href="#forgot">Forgot password?</a>
          </div>

          <button type="submit" className={styles.submit} disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className={styles.switchAuth}>
          New to UserHub? <Link to="/register">Create an account</Link>
        </p>

        <p className={styles.secureNote}>Your account, securely connected.</p>
      </section>
    </AuthLayout>
  );
}

export default Login;
