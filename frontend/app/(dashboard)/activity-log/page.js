'use client';
import { useState, useEffect, useCallback } from 'react';
import { Activity } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { formatDateTime } from '@/lib/utils';

const ACTION_LABELS = {
  login: 'Login',
  logout: 'Logout',
  tambah_barang: 'Tambah Barang',
  edit_barang: 'Edit Barang',
  hapus_barang: 'Hapus Barang',
  tambah_kategori: 'Tambah Kategori',
  edit_kategori: 'Edit Kategori',
  hapus_kategori: 'Hapus Kategori',
  tambah_supplier: 'Tambah Supplier',
  edit_supplier: 'Edit Supplier',
  hapus_supplier: 'Hapus Supplier',
  pembelian: 'Pembelian',
  penjualan: 'Penjualan',
  stock_opname: 'Stock Opname',
  tambah_user: 'Tambah User',
  edit_user: 'Edit User',
  aktifkan_user: 'Aktifkan User',
  nonaktifkan_user: 'Nonaktifkan User',
};

const ACTION_BADGE = {
  login: 'badge-success',
  logout: 'badge-dark',
  penjualan: 'badge-info',
  pembelian: 'badge-info',
  hapus_barang: 'badge-danger',
  hapus_kategori: 'badge-danger',
  hapus_supplier: 'badge-danger',
  nonaktifkan_user: 'badge-warning',
};

export default function ActivityLogPage() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity-logs', { params: { limit: 200 } });
      setLogs(res.data);
    } catch { toast.error('Gagal memuat activity log.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">Audit trail seluruh aktivitas sistem</p>
        </div>
        <span className="badge badge-dark">{logs.length} aktivitas</span>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr><th>Waktu</th><th>User</th><th>Aktivitas</th><th>Detail</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center" style={{ padding: 32 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4}><div className="table-empty"><Activity className="table-empty-icon" size={40} /><p>Belum ada aktivitas</p></div></td></tr>
            ) : logs.map((log) => (
              <tr key={log.id}>
                <td className="text-secondary" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                  {formatDateTime(log.created_at)}
                </td>
                <td>
                  <span className="badge badge-dark" style={{ fontSize: '0.72rem' }}>
                    #{log.user_id || '?'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${ACTION_BADGE[log.action] || 'badge-dark'}`}>
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                </td>
                <td className="text-secondary" style={{ fontSize: '0.82rem' }}>
                  {log.description || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
