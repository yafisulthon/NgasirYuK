'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Truck } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import Modal, { ConfirmModal } from '@/components/ui/Modal';

const EMPTY = { name: '', address: '', phone: '', email: '' };

export default function SupplierPage() {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers', { params: { search: search || undefined } });
      setSuppliers(res.data);
    } catch { toast.error('Gagal memuat supplier.'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (s) => { setForm({ name: s.name, address: s.address || '', phone: s.phone || '', email: s.email || '' }); setModal({ open: true, mode: 'edit', data: s }); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nama supplier wajib diisi.'); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') { await api.post('/suppliers', form); toast.success('Supplier ditambahkan!'); }
      else { await api.put(`/suppliers/${modal.data.id}`, form); toast.success('Supplier diperbarui!'); }
      setModal({ open: false });
      fetch();
    } catch (err) { toast.error(err.response?.data?.detail || 'Gagal menyimpan.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/suppliers/${confirmDelete.id}`);
      toast.success('Supplier dihapus.');
      setConfirmDelete(null); fetch();
    } catch (err) { toast.error(err.response?.data?.detail || 'Gagal menghapus.'); }
    finally { setDeleting(false); }
  };

  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Supplier</h1>
          <p className="page-subtitle">Kelola data supplier barang</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="btn-tambah-supplier">
          <Plus size={15} /> Tambah Supplier
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="input-group table-search">
            <Search className="input-group-icon" size={14} />
            <input className="form-control" placeholder="Cari supplier..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <table>
          <thead>
            <tr><th>#</th><th>Nama Supplier</th><th>Telepon</th><th>Email</th><th>Alamat</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center" style={{ padding: 32 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={6}><div className="table-empty"><Truck className="table-empty-icon" size={40} /><p>Belum ada supplier</p></div></td></tr>
            ) : suppliers.map((s, i) => (
              <tr key={s.id}>
                <td className="text-muted">{i + 1}</td>
                <td><strong>{s.name}</strong></td>
                <td>{s.phone || <span className="text-muted">-</span>}</td>
                <td>{s.email || <span className="text-muted">-</span>}</td>
                <td className="text-secondary" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address || '-'}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(s)} id={`btn-edit-sup-${s.id}`}><Edit2 size={14} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDelete(s)} id={`btn-del-sup-${s.id}`}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'add' ? 'Tambah Supplier' : 'Edit Supplier'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal({ open: false })} disabled={saving}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="btn-save-supplier">
              {saving && <span className="loading-spinner" style={{ width: 14, height: 14 }} />} Simpan
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nama Supplier <span className="required">*</span></label>
          <input className="form-control" placeholder="cth: PT Semen Gresik" value={form.name} onChange={f('name')} />
        </div>
        <div className="form-group">
          <label className="form-label">Nomor Telepon</label>
          <input className="form-control" placeholder="cth: 031-1234567" value={form.phone} onChange={f('phone')} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" placeholder="cth: supplier@email.com" value={form.email} onChange={f('email')} />
        </div>
        <div className="form-group mb-0">
          <label className="form-label">Alamat</label>
          <textarea className="form-control" rows={2} placeholder="Alamat lengkap supplier" value={form.address} onChange={f('address')} />
        </div>
      </Modal>

      <ConfirmModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} loading={deleting}
        title="Hapus Supplier" message={`Hapus supplier "${confirmDelete?.name}"?`} />
    </>
  );
}
