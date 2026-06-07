/**
 * Format angka ke Rupiah Indonesia
 * @param {number|string} amount
 * @returns {string} "Rp 65.000"
 */
export function formatRupiah(amount) {
  if (amount === null || amount === undefined) return 'Rp 0';
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

/**
 * Format tanggal ke format Indonesia
 * @param {string|Date} dateStr
 * @returns {string} "7 Juni 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format tanggal + waktu
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text
 */
export function truncate(str, length = 30) {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
}

/**
 * Get badge variant for stock status
 */
export function getStockStatusBadge(stock, minimumStock) {
  if (stock === 0) return { label: 'Habis', variant: 'badge-danger' };
  if (stock <= minimumStock) return { label: 'Menipis', variant: 'badge-warning' };
  return { label: 'Normal', variant: 'badge-success' };
}

/**
 * Get role badge
 */
export function getRoleBadge(role) {
  const map = {
    owner: { label: 'Owner', variant: 'badge-dark' },
    admin: { label: 'Admin', variant: 'badge-info' },
    kasir: { label: 'Kasir', variant: 'badge-success' },
  };
  return map[role] || { label: role, variant: 'badge-dark' };
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/**
 * Check if user has access to a feature
 */
export function hasAccess(userRole, requiredRoles) {
  return requiredRoles.includes(userRole);
}
