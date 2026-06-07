'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, UserCheck, UserX, Users } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { getRoleBadge, formatDate } from '@/lib/utils';

const EMPTY = { name: '', username: '', password: '', role: 'kasir' };

export default function PenggunaPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [toggleConfirm, setToggleConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch { toast.error('Gagal memuat data pengguna.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (u) => {
    setForm({ name: u.name, username: u.username, password: '', role: u.role });
    setModal({ open: true, mode: 'edit', data: u });
  };

  const handleSave = async () => {
    if (!form.name || !form.username || (modal.mode === 'add' && !form.password)) {
      toast.error('Nama, username, dan password wajib diisi.'); return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, username: form.username, role: form.role };
      if (form.password) payload.password = form.password;
      if (modal.mode === 'add') {
        await api.post('/users', { ...payload, password: form.password });
        toast.success('Pengguna berhasil ditambahkan!');
      } else {
        await api.put(`/users/${modal.data.id}`, payload);
        toast.success('Pengguna berhasil diperbarui!');
      }
      setModal({ open: false });
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan.');
    } finally { setSaving(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      await api.patch(`/users/${toggleConfirm.id}/toggle`);
      toast.success(`Pengguna ${toggleConfirm.is_active ? 'dinonaktifkan' : 'diaktifkan'}!`);
      setToggleConfirm(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengubah status.');
    } finally { setToggling(false); }
  };

  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Pengguna</h1>
          <p className="page-subtitle">Kelola akun pengguna sistem</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="btn-tambah-user">
          <Plus size={15} /> Tambah Pengguna
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr><th>#</th><th>Nama</th><th>Username</th><th>Role</th><th>Status</th><th>Dibuat</th><th>Aksi</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center" style={{ padding: 32 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : users.map((u, i) => {
              const { label, variant } = getRoleBadge(u.role);
              return (
                <tr key={u.id}>
                  <td className="text-muted">{i + 1}</td>
                  <td><strong>{u.name}</strong></td>
                  <td><code style={{ fontSize: '0.8rem' }}>{u.username}</code></td>
                  <td><span className={`badge ${variant}`}>{label}</span></td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="text-secondary">{formatDate(u.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(u)} title="Edit" id={`btn-edit-user-${u.id}`}>
                        <Edit2 size={14} />
                      </button>
                      {u.role !== 'owner' && (
                        <button className="btn btn-ghost btn-icon btn-sm"
                          style={{ color: u.is_active ? 'var(--warning)' : 'var(--success)' }}
                          onClick={() => setToggleConfirm(u)} title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          id={`btn-toggle-user-${u.id}`}>
                          {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })}
        title={modal.mode === 'add' ? 'Tambah Pengguna' : 'Edit Pengguna'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal({ open: false })} disabled={saving}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="btn-save-user">
              {saving && <span className="loading-spinner" style={{ width: 14, height: 14 }} />} Simpan
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nama Lengkap <span className="required">*</span></label>
          <input className="form-control" placeholder="cth: Admin Toko" value={form.name} onChange={f('name')} />
        </div>
        <div className="form-group">
          <label className="form-label">Username <span className="required">*</span></label>
          <input className="form-control" placeholder="cth: admin2" value={form.username} onChange={f('username')} />
        </div>
        <div className="form-group">
          <label className="form-label">Password {modal.mode === 'edit' && <span className="text-muted">(kosongkan jika tidak diubah)</span>}</label>
          <input className="form-control" type="password" placeholder={modal.mode === 'add' ? 'Password wajib diisi' : 'Password baru (opsional)'}
            value={form.password} onChange={f('password')} />
        </div>
        <div className="form-group mb-0">
          <label className="form-label">Role <span className="required">*</span></label>
          <select className="form-control" value={form.role} onChange={f('role')}>
            <option value="kasir">Kasir</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!toggleConfirm} onClose={() => setToggleConfirm(null)} onConfirm={handleToggle} loading={toggling}
        title={toggleConfirm?.is_active ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
        confirmLabel={toggleConfirm?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        message={`${toggleConfirm?.is_active ? 'Nonaktifkan' : 'Aktifkan'} pengguna "${toggleConfirm?.name}"?`}
      />
    </>
  );
}
