import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient, {
  clearSession,
  getApiErrorMessage,
  getStoredUser,
  setSession,
  getToken,
  updateStoredUser,
} from '../api/client';
import AppShell from '../components/AppShell';
import { firstName, getInitials, isAdmin, roleLabel } from '../utils/userDisplay';
import styles from './Dashboard.module.css';

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(getStoredUser());
  const [totalUsers, setTotalUsers] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Profile modal state
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setError('');
      setLoading(true);

      try {
        const { data } = await apiClient.get('/dashboard');
        if (cancelled) return;

        setProfile(data.profile);
        setTotalUsers(data.totalUserCount);
        setSession(
          getToken(),
          data.profile,
          Boolean(localStorage.getItem('token'))
        );

        if (isAdmin(data.profile?.role)) {
          try {
            const usersRes = await apiClient.get('/dashboard/users');
            if (!cancelled) setMembers(usersRes.data || []);
          } catch {
            if (!cancelled) setMembers([]);
          }
        }
      } catch (err) {
        if (cancelled) return;

        if (err.response?.status === 401) {
          clearSession();
          navigate('/login', { replace: true });
          return;
        }

        setError(
          getApiErrorMessage(err, 'Unable to load your workspace. Please try again.')
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Close the modal with the Escape key (unless a save is in flight)
  useEffect(() => {
    if (!editing) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) setEditing(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editing, saving]);

  const admin = isAdmin(profile?.role);
  const stats = useMemo(() => {
    const adminCount = members.filter((user) => isAdmin(user.role)).length;
    const userCount = members.length - adminCount;
    return { adminCount, userCount };
  }, [members]);

  const openEditor = () => {
    setNameDraft(profile?.fullName || '');
    setFormError('');
    setNotice('');
    setEditing(true);
  };

  const closeEditor = () => {
    if (!saving) setEditing(false);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setFormError('Full name is required');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const { data } = await apiClient.put('/users/me', { fullName: trimmed });

      // Update the UI (and the header via AppShell) + the cached user, without touching the token
      setProfile(data);
      updateStoredUser(data);
      setMembers((prev) =>
        prev.map((member) => (member.id === data.id ? { ...member, ...data } : member))
      );
      setEditing(false);
      setNotice('Your profile has been updated.');
    } catch (err) {
      if (err.response?.status === 401) {
        clearSession();
        navigate('/login', { replace: true });
        return;
      }

      setFormError(
        getApiErrorMessage(err, 'Unable to update your profile. Please try again.')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell profile={profile}>
      <p className={styles.eyebrow}>Your workspace</p>
      <h1 className={styles.heading}>
        Welcome back, {firstName(profile?.fullName)}.
      </h1>
      <p className={styles.lede}>
        Your profile and community, all in one place.
      </p>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className={styles.notice} role="status">
          {notice}
        </div>
      )}

      {loading ? (
        <p className={styles.muted}>Loading your workspace…</p>
      ) : (
        <>
          <section className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <h2 className={styles.cardTitle}>Your profile</h2>
              {admin && <span className={styles.badge}>Admin</span>}
            </div>

            <div className={styles.identity}>
              <span className={styles.avatar}>{getInitials(profile?.fullName)}</span>
              <div>
                <p className={styles.name}>{profile?.fullName}</p>
                <p className={styles.email}>{profile?.email}</p>
              </div>
            </div>

            <dl className={styles.metrics}>
              <div>
                <dt>Total users</dt>
                <dd>{totalUsers ?? '—'}</dd>
                <p>Registered members in UserHub</p>
              </div>
              <div>
                <dt>Account status</dt>
                <dd>Active</dd>
                <p>Account active</p>
              </div>
              <div>
                <dt>Account role</dt>
                <dd>{roleLabel(profile?.role)}</dd>
                <p>{admin ? 'Administrator' : 'Standard member'}</p>
              </div>
            </dl>

            <button type="button" className={styles.edit} onClick={openEditor}>
              Edit Profile
            </button>
          </section>

          {admin && members.length > 0 && (
            <div className={styles.counts}>
              <article>
                <strong>{stats.adminCount}</strong>
                <span>Administrators</span>
              </article>
              <article>
                <strong>{stats.userCount}</strong>
                <span>Users</span>
              </article>
            </div>
          )}

          {admin && (
            <section className={styles.adminBanner}>
              <div>
                <h2>A clear view of your community</h2>
                <p>
                  You have admin access. View registered users and their account
                  details.
                </p>
              </div>
              <Link to="/users" className={styles.bannerLink}>
                View all users
              </Link>
            </section>
          )}

          <p className={styles.privacy}>
            Your personal information is only visible to you and administrators.
          </p>
        </>
      )}

      {editing && (
        <div className={styles.overlay} onClick={closeEditor}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="edit-profile-title" className={styles.modalTitle}>
              Edit profile
            </h2>
            <p className={styles.modalSubtitle}>Update the name shown on your account.</p>

            <form onSubmit={handleSaveProfile} noValidate>
              {formError && (
                <div className={styles.error} role="alert">
                  {formError}
                </div>
              )}

              <label className={styles.field}>
                <span className={styles.label}>Full name</span>
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(event) => {
                    setNameDraft(event.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="Enter your full name"
                  maxLength={100}
                  autoComplete="name"
                  autoFocus
                />
              </label>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={closeEditor}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default Dashboard;
