import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient, { getApiErrorMessage } from '../api/client';
import AuthLayout from '../components/AuthLayout';
import styles from './authForms.module.css';

const INITIAL_FORM = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const NAME_REGEX = /^(?!.*\.\.)(?!.*\s\s)(?!.*'')(?!.*--)(?!.*\.[^\s])[a-zA-Z\s.ñÑ'-]+$/;

const checkPasswordRules = (pwd) => ({
  hasMinLength: pwd.length >= 8,
  hasUpper: /[A-Z]/.test(pwd),
  hasLower: /[a-z]/.test(pwd),
  hasNumber: /\d/.test(pwd),
  hasSpecial: /[@$!%*?&]/.test(pwd),
});

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);  

  const pwdRules = checkPasswordRules(form.password);
  const isPasswordStrong = Object.values(pwdRules).every(Boolean);

  const missingRules = [];
      if (!pwdRules.hasMinLength) missingRules.push('At least 8 characters');
      if (!pwdRules.hasUpper) missingRules.push('Uppercase letter');
      if (!pwdRules.hasLower) missingRules.push('Lowercase letter');
      if (!pwdRules.hasNumber) missingRules.push('Number');
      if (!pwdRules.hasSpecial) missingRules.push('Special character');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!NAME_REGEX.test(form.fullName.trim())) {
      setError('Full name can only contain letters, spaces, hyphens, dots, and apostrophes.');
      return;
    }

    if (!isPasswordStrong) {
      setError('Please ensure your password meets all strength requirements.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/auth/register', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      navigate('/login', { replace: true, state: { registered: true } });
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Registration failed. Please check your details and try again.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <AuthLayout>
      <section className={styles.card}>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>
          A simpler way to manage your profile. Get started with UserHub.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <label className={styles.field} style={{ position: 'relative' }}>
            <span className={styles.label}>Full name</span>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                required
                style={{ paddingRight: '2.5rem' }} 
              />
              
              {/* Real-time Name Validation Indicator */}
              <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                {form.fullName.length > 0 && (
                  NAME_REGEX.test(form.fullName) ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  )
                )}
              </div>
            </div>
          </label>

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

          <label className={styles.field} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={styles.label}>Password</span>
              
              <span 
                onMouseEnter={() => setShowTooltip(true)} 
                onMouseLeave={() => setShowTooltip(false)}
                style={{ cursor: 'help', color: '#6b7280', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Requirements
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                autoComplete="new-password"
                required
                style={{ paddingRight: '2.5rem' }} 
              />
              
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                )}
              </button>
            </div>

            {showTooltip && (
              <div style={{
                position: 'absolute', top: '100%', right: '0', zIndex: 10, marginTop: '4px',
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px',
                padding: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '0.8rem', minWidth: '220px', color: '#374151'
              }}>
                {missingRules.length > 0 ? (
                  <>
                    <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Password must include:</p>
                    <ul style={{ margin: 0, paddingLeft: '16px', color: '#ef4444' }}>
                      {missingRules.map((rule, idx) => <li key={idx} style={{ marginBottom: '4px' }}>{rule}</li>)}
                    </ul>
                  </>
                ) : (
                  <span style={{ color: '#16a34a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    All requirements met!
                  </span>
                )}
              </div>
            )}
          </label>

          <label className={styles.field} style={{ position: 'relative' }}>
            <span className={styles.label}>Confirm Password</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
                style={{ paddingRight: '4.5rem' }} 
              />
              
              <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                
                {form.confirmPassword.length > 0 && (
                  form.password === form.confirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  )
                )}

                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0, display: 'flex' }}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  )}
                </button>
              </div>
            </div>
          </label>

          <button type="submit" className={styles.submit} disabled={isSubmitting}>
            {isSubmitting ? 'Registering…' : 'Register'}
          </button>
        </form>

        <p className={styles.switchAuth}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>

        <p className={styles.legal}>
          By registering, you agree to our{' '}
          <a href="#terms">Terms of service</a> and{' '}
          <a href="#privacy">Privacy policy</a>.
        </p>
      </section>
    </AuthLayout>
  );
}

export default Register;
