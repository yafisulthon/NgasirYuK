'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { formatRupiah, getStockStatusBadge } from '@/lib/utils';

const EMPTY_FORM = {
  code: '', name: '', category_id: '', supplier_id: '',
  unit: 'pcs', purchase_price: '', selling_price: '',
  stock: 0, minimum_stock: 0,
};

export default function BarangPage() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        api.get('/products', { params: { search: search || undefined, category_id: filterCat || undefined, limit: 100 } }),
        api.get('/categories'),
        api.get('/suppliers'),
      ]);
      setProducts(pRes.data);
      setCategories(cRes.data);
      setSuppliers(sRes.data);
    } catch (err) {
      toast.error('Gagal memuat data barang.');
    } finally {
      setLoading(false);
    }
  }, [search, filterCat]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (p) => {
    setForm({
      code: p.code, name: p.name,
      category_id: p.category_id || '', supplier_id: p.supplier_id || '',
      unit: p.unit, purchase_price: p.purchase_price, selling_price: p.selling_price,
      stock: p.stock, minimum_stock: p.minimum_stock,
    });
    setModal({ open: true, mode: 'edit', data: p });
  };

  const handleSave = async () => {
    if (!form.code || !form.name || !form.unit || form.selling_price === '') {
      toast.error('Kode, nama, satuan, dan harga jual wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
        purchase_price: parseFloat(form.purchase_price) || 0,
        selling_price: parseFloat(form.selling_price) || 0,
        stock: parseInt(form.stock) || 0,
        minimum_stock: parseInt(form.minimum_stock) || 0,
      };
      if (modal.mode === 'add') {
        await api.post('/products', payload);
        toast.success('Barang berhasil ditambahkan!');
      } else {
        const { stock, ...editPayload } = payload;
        await api.put(`/products/${modal.data.id}`, editPayload);
        toast.success('Barang berhasil diperbarui!');
      }
      setModal({ open: false, mode: 'add', data: null });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan data barang.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/products/${confirmDelete.id}`);
      toast.success('Barang berhasil dihapus!');
      setConfirmDelete(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menghapus barang.');
    } finally {
      setDeleting(false);
    }
  };

  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Master Barang</h1>
          <p className="page-subtitle">Kelola data barang toko</p>
        </div>
        <button className="btn btn-primary" id="btn-tambah-barang" onClick={openAdd}>
          <Plus size={15} /> Tambah Barang
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="input-group table-search">
              <Search className="input-group-icon" size={14} />
              <input
                className="form-control"
                placeholder="Cari nama atau kode barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="barang-search"
              />
            </div>
            <select
              className="form-control"
              style={{ width: 180 }}
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={fetchAll} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>Satuan</th>
                <th>Harga Beli</th>
                <th>Harga Jual</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center" style={{ padding: 32 }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={9}>
                  <div className="table-empty">
                    <Package className="table-empty-icon" size={40} />
                    <p>Belum ada data barang</p>
                  </div>
                </td></tr>
              ) : products.map((p) => {
                const { label, variant } = getStockStatusBadge(p.stock, p.minimum_stock);
                return (
                  <tr key={p.id}>
                    <td><code style={{ fontSize: '0.78rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>{p.code}</code></td>
                    <td><div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.supplier && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{p.supplier.name}</div>}
                    </td>
                    <td>{p.category?.name || <span className="text-muted">-</span>}</td>
                    <td><span className="badge badge-dark">{p.unit}</span></td>
                    <td>{formatRupiah(p.purchase_price)}</td>
                    <td><strong>{formatRupiah(p.selling_price)}</strong></td>
                    <td><strong>{p.stock}</strong></td>
                    <td><span className={`badge ${variant}`}>{label}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(p)} id={`btn-edit-barang-${p.id}`}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Hapus" onClick={() => setConfirmDelete(p)}
                          style={{ color: 'var(--danger)' }} id={`btn-hapus-barang-${p.id}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'add', data: null })}
        title={modal.mode === 'add' ? 'Tambah Barang' : 'Edit Barang'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'add', data: null })} disabled={saving}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="btn-save-barang">
              {saving ? <span className="loading-spinner" style={{ width: 14, height: 14 }} /> : null}
              {modal.mode === 'add' ? 'Simpan' : 'Perbarui'}
            </button>
          </>
        }
      >
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Kode Barang <span className="required">*</span></label>
            <input className="form-control" placeholder="cth: SMN-001" value={form.code} onChange={f('code')} />
          </div>
          <div className="form-group">
            <label className="form-label">Satuan <span className="required">*</span></label>
            <select className="form-control" value={form.unit} onChange={f('unit')}>
              <option value="pcs">pcs</option>
              <option value="sak">sak</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Nama Barang <span className="required">*</span></label>
          <input className="form-control" placeholder="Nama barang lengkap" value={form.name} onChange={f('name')} />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select className="form-control" value={form.category_id} onChange={f('category_id')}>
              <option value="">-- Pilih Kategori --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <select className="form-control" value={form.supplier_id} onChange={f('supplier_id')}>
              <option value="">-- Pilih Supplier --</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Harga Beli (Rp)</label>
            <input className="form-control" type="number" min="0" placeholder="0" value={form.purchase_price} onChange={f('purchase_price')} />
          </div>
          <div className="form-group">
            <label className="form-label">Harga Jual (Rp) <span className="required">*</span></label>
            <input className="form-control" type="number" min="0" placeholder="0" value={form.selling_price} onChange={f('selling_price')} />
          </div>
        </div>
        <div className="grid-2">
          {modal.mode === 'add' && (
            <div className="form-group">
              <label className="form-label">Stok Awal</label>
              <input className="form-control" type="number" min="0" value={form.stock} onChange={f('stock')} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Minimum Stok</label>
            <input className="form-control" type="number" min="0" value={form.minimum_stock} onChange={f('minimum_stock')} />
            <span className="form-hint">Notifikasi stok menipis di bawah angka ini</span>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Barang"
        message={`Yakin ingin menghapus barang "${confirmDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </>
  );
}
