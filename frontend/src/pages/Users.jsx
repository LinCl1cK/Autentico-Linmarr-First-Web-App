import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, {
  clearSession,
  getApiErrorMessage,
  getStoredUser,
} from '../api/client';
import AppShell from '../components/AppShell';
import { formatDate, getInitials, isAdmin } from '../utils/userDisplay';
import styles from './Users.module.css';

function Users() {
  const navigate = useNavigate();
  const profile = getStoredUser();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const { data } = await apiClient.get('/dashboard/users');
        if (!cancelled) setUsers(data || []);
      } catch (err) {
        if (cancelled) return;

        if (err.response?.status === 401) {
          clearSession();
          navigate('/login', { replace: true });
          return;
        }

        if (err.response?.status === 403) {
          navigate('/dashboard', { replace: true });
          return;
        }

        setError(getApiErrorMessage(err, 'Unable to load the user directory.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === 'ALL' || user.role?.toUpperCase() === roleFilter;
      const matchesQuery =
        !q ||
        user.fullName?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [users, query, roleFilter]);

  const adminCount = users.filter((user) => isAdmin(user.role)).length;

  return (
    <AppShell profile={profile}>
      <p className={styles.eyebrow}>Administration</p>
      <div className={styles.headingRow}>
        <div>
          <h1 className={styles.heading}>Users</h1>
          <p className={styles.lede}>
            Everyone registered in your UserHub community.
          </p>
        </div>
        <span className={styles.countChip}>All users {users.length}</span>
      </div>

      <div className={styles.toolbar}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or email"
        />
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          aria-label="All roles"
        >
          <option value="ALL">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className={styles.muted}>Loading users…</p>
      ) : (
        <section className={styles.tableCard}>
          <div className={styles.table} role="table">
            <div className={`${styles.row} ${styles.head}`} role="row">
              <span role="columnheader">Full name</span>
              <span role="columnheader">Email</span>
              <span role="columnheader">Role</span>
              <span role="columnheader">Member since</span>
            </div>
            {visible.map((user) => (
              <div className={styles.row} role="row" key={user.id}>
                <span className={styles.person} role="cell">
                  <span className={styles.avatar}>{getInitials(user.fullName)}</span>
                  <span>
                    {user.fullName}
                    {user.id === profile?.id ? (
                      <em className={styles.you}> (you)</em>
                    ) : null}
                  </span>
                </span>
                <span role="cell">{user.email}</span>
                <span role="cell">
                  <span className={isAdmin(user.role) ? styles.roleAdmin : styles.roleUser}>
                    {user.role}
                  </span>
                </span>
                <span className={styles.date} role="cell">
                  {formatDate(user.createdAt)}
                </span>
              </div>
            ))}
            {visible.length === 0 && (
              <p className={styles.empty}>No users match your search.</p>
            )}
          </div>
          <p className={styles.footerMeta}>
            Showing {visible.length} of {users.length} users · {adminCount}{' '}
            administrators · {users.length - adminCount} users
          </p>
        </section>
      )}

      <p className={styles.note}>
        Only administrators can view the user directory.
      </p>
    </AppShell>
  );
}

export default Users;
