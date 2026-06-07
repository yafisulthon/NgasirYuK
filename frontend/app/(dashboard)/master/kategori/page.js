'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Tag } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';

export default function KategoriPage() {
  const toast = useToast();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories', { params: { search: search || undefined } });
      setCats(res.data);
    } catch { toast.error('Gagal memuat kategori.'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setForm({ name: '', description: '' }); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (c) => { setForm({ name: c.name, description: c.description || '' }); setModal({ open: true, mode: 'edit', data: c }); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nama kategori wajib diisi.'); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await api.post('/categories', form);
        toast.success('Kategori berhasil ditambahkan!');
      } else {
        await api.put(`/categories/${modal.data.id}`, form);
        toast.success('Kategori berhasil diperbarui!');
      }
      setModal({ open: false });
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan kategori.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/categories/${confirmDelete.id}`);
      toast.success('Kategori dihapus.');
      setConfirmDelete(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menghapus kategori.');
    } finally { setDeleting(false); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kategori Barang</h1>
          <p className="page-subtitle">Kelola kategori barang toko</p>
        </div>
        <button className="btn btn-primary" id="btn-tambah-kategori" onClick={openAdd}>
          <Plus size={15} /> Tambah Kategori
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="input-group table-search">
            <Search className="input-group-icon" size={14} />
            <input className="form-control" placeholder="Cari kategori..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Nama Kategori</th>
              <th>Deskripsi</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center" style={{ padding: 32 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : cats.length === 0 ? (
              <tr><td colSpan={5}><div className="table-empty"><Tag className="table-empty-icon" size={40} /><p>Belum ada kategori</p></div></td></tr>
            ) : cats.map((c, i) => (
              <tr key={c.id}>
                <td className="text-muted">{i + 1}</td>
                <td><strong>{c.name}</strong></td>
                <td className="text-secondary">{c.description || '-'}</td>
                <td className="text-secondary">{formatDate(c.created_at)}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)} id={`btn-edit-kat-${c.id}`}><Edit2 size={14} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDelete(c)} id={`btn-del-kat-${c.id}`}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'add' ? 'Tambah Kategori' : 'Edit Kategori'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal({ open: false })} disabled={saving}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="btn-save-kategori">
              {saving && <span className="loading-spinner" style={{ width: 14, height: 14 }} />} Simpan
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nama Kategori <span className="required">*</span></label>
          <input className="form-control" placeholder="cth: Semen" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-group mb-0">
          <label className="form-label">Deskripsi</label>
          <textarea className="form-control" rows={3} placeholder="Deskripsi singkat kategori..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </Modal>

      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} loading={deleting}
        title="Hapus Kategori" message={`Hapus kategori "${confirmDelete?.name}"? Pastikan tidak ada barang yang menggunakan kategori ini.`} />
    </>
  );
}
