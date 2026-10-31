export function getInitials(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'UH';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function firstName(fullName = '') {
  return fullName.trim().split(/\s+/).filter(Boolean)[0] || 'there';
}

export function roleLabel(role = '') {
  return role.toUpperCase() === 'ADMIN' ? 'Administrator' : 'User';
}

export function isAdmin(role = '') {
  return role.toUpperCase() === 'ADMIN';
}

// Formats an ISO date-time from the API as e.g. "Oct 12, 2026"
export function formatDate(value) {
  if (!value) return '—';

  // Handles ISO strings, and the [y, m, d, ...] array form some Jackson configs emit
  const date = Array.isArray(value)
    ? new Date(value[0], value[1] - 1, value[2])
    : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
