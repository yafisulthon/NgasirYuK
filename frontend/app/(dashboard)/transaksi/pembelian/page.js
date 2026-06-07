'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Search, FileText, ShoppingCart, X, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import Modal from '@/components/ui/Modal';
import { formatRupiah, formatDate } from '@/lib/utils';

export default function PembelianPage() {
  const toast = useToast();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ supplier_id: '', date: today });
  const [items, setItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        api.get('/purchases', { params: { limit: 100 } }),
        api.get('/suppliers'),
      ]);
      setPurchases(pRes.data);
      setSuppliers(sRes.data);
    } catch { toast.error('Gagal memuat data pembelian.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  // Product search for form
  useEffect(() => {
    if (productSearch.length < 2) { setProductResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/products/search', { params: { q: productSearch } });
        setProductResults(res.data);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const addItem = (product) => {
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      setItems(items.map((i) => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setItems([...items, { product_id: product.id, product, qty: 1, price: product.purchase_price || product.selling_price }]);
    }
    setProductSearch('');
    setProductResults([]);
  };

  const removeItem = (productId) => setItems(items.filter((i) => i.product_id !== productId));
  const updateItem = (productId, field, value) => {
    setItems(items.map((i) => i.product_id === productId ? { ...i, [field]: value } : i));
  };

  const total = items.reduce((sum, i) => sum + (i.qty * i.price), 0);

  const handleSave = async () => {
    if (!form.date) { toast.error('Tanggal pembelian wajib diisi.'); return; }
    if (items.length === 0) { toast.error('Minimal 1 item barang.'); return; }
    setSaving(true);
    try {
      await api.post('/purchases', {
        supplier_id: form.supplier_id || null,
        date: form.date,
        details: items.map((i) => ({
          product_id: i.product_id,
          qty: parseInt(i.qty),
          price: parseFloat(i.price),
        })),
      });
      toast.success('Pembelian berhasil disimpan! Stok telah diperbarui.');
      setModal(false);
      setItems([]);
      setForm({ supplier_id: '', date: today });
      fetchPurchases();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan pembelian.');
    } finally { setSaving(false); }
  };

  const openPdf = (id) => window.open(`/api/purchases/${id}/pdf`, '_blank');

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pembelian Barang</h1>
          <p className="page-subtitle">Catat pembelian barang dari supplier</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)} id="btn-tambah-pembelian">
          <Plus size={15} /> Buat Pembelian
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>No. Pembelian</th><th>Tanggal</th><th>Supplier</th><th>Total</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center" style={{ padding: 32 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : purchases.length === 0 ? (
              <tr><td colSpan={5}><div className="table-empty"><ShoppingCart className="table-empty-icon" size={40} /><p>Belum ada data pembelian</p></div></td></tr>
            ) : purchases.map((p) => (
              <tr key={p.id}>
                <td><code style={{ fontSize: '0.78rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>{p.purchase_number}</code></td>
                <td>{formatDate(p.date)}</td>
                <td>{p.supplier?.name || <span className="text-muted">-</span>}</td>
                <td><strong>{formatRupiah(p.total)}</strong></td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setDetailModal(p)}>Detail</button>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Cetak PDF" onClick={() => openPdf(p.id)} id={`btn-pdf-pb-${p.id}`}><FileText size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Pembelian Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Buat Pembelian Baru" size="xl"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(false)} disabled={saving}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="btn-save-pembelian">
              {saving && <span className="loading-spinner" style={{ width: 14, height: 14 }} />}
              Simpan & Update Stok
            </button>
          </>
        }
      >
        <div className="grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group mb-0">
            <label className="form-label">Tanggal <span className="required">*</span></label>
            <input className="form-control" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Supplier</label>
            <select className="form-control" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
              <option value="">-- Pilih Supplier --</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="divider" />

        {/* Product Search */}
        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label">Cari & Tambah Barang</label>
          <div className="input-group">
            <Search className="input-group-icon" size={14} />
            <input className="form-control" placeholder="Ketik nama atau kode barang..." value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)} autoComplete="off" />
          </div>
          {productResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
              maxHeight: 200, overflowY: 'auto',
            }}>
              {productResults.map((p) => (
                <button key={p.id} onClick={() => addItem(p)} style={{
                  width: '100%', padding: '10px 14px', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}>
                  <span><strong>{p.code}</strong> — {p.name}</span>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Stok: {p.stock} {p.unit}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items Table */}
        {items.length > 0 && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table>
              <thead>
                <tr><th>Barang</th><th>Qty</th><th>Harga Beli (Rp)</th><th>Subtotal</th><th></th></tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product_id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{item.product.unit}</div>
                    </td>
                    <td>
                      <input className="form-control" type="number" min="1" value={item.qty} style={{ width: 70 }}
                        onChange={(e) => updateItem(item.product_id, 'qty', parseInt(e.target.value) || 1)} />
                    </td>
                    <td>
                      <input className="form-control" type="number" min="0" value={item.price} style={{ width: 120 }}
                        onChange={(e) => updateItem(item.product_id, 'price', parseFloat(e.target.value) || 0)} />
                    </td>
                    <td><strong>{formatRupiah(item.qty * item.price)}</strong></td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }}
                        onClick={() => removeItem(item.product_id)}><X size={14} /></button>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>TOTAL</td>
                  <td colSpan={2}><strong style={{ fontSize: '1rem' }}>{formatRupiah(total)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Detail Modal */}
      {detailModal && (
        <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title={`Detail: ${detailModal.purchase_number}`} size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDetailModal(null)}>Tutup</button>
              <button className="btn btn-primary" onClick={() => openPdf(detailModal.id)}>
                <FileText size={14} /> Cetak PDF
              </button>
            </>
          }
        >
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div><span className="text-muted">Tanggal:</span> <strong>{formatDate(detailModal.date)}</strong></div>
            <div><span className="text-muted">Supplier:</span> <strong>{detailModal.supplier?.name || '-'}</strong></div>
          </div>
          <table>
            <thead><tr><th>Barang</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
            <tbody>
              {detailModal.details?.map((d) => (
                <tr key={d.id}>
                  <td>{d.product?.name || '-'}</td>
                  <td>{d.qty} {d.product?.unit}</td>
                  <td>{formatRupiah(d.price)}</td>
                  <td><strong>{formatRupiah(d.subtotal)}</strong></td>
                </tr>
              ))}
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>TOTAL</td>
                <td><strong style={{ fontSize: '1rem' }}>{formatRupiah(detailModal.total)}</strong></td>
              </tr>
            </tbody>
          </table>
        </Modal>
      )}
    </>
  );
}
