'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, X, CreditCard, FileText, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import Modal from '@/components/ui/Modal';
import { formatRupiah, formatDate } from '@/lib/utils';

export default function PenjualanPage() {
  const toast = useToast();
  const [tab, setTab] = useState('kasir'); // 'kasir' | 'riwayat'
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // Kasir state
  const [cart, setCart] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [payment, setPayment] = useState('');
  const [saving, setSaving] = useState(false);
  const [successModal, setSuccessModal] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  const fetchSales = useCallback(async () => {
    setLoadingSales(true);
    try {
      const res = await api.get('/sales', { params: { limit: 100 } });
      setSales(res.data);
    } catch { toast.error('Gagal memuat riwayat penjualan.'); }
    finally { setLoadingSales(false); }
  }, []);

  useEffect(() => {
    if (tab === 'riwayat') fetchSales();
  }, [tab, fetchSales]);

  // Product search
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

  const addToCart = (product) => {
    const existing = cart.find((i) => i.product_id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) { toast.warning(`Stok ${product.name} hanya ${product.stock}`); return; }
      setCart(cart.map((i) => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      if (product.stock < 1) { toast.warning('Stok barang habis!'); return; }
      setCart([...cart, { product_id: product.id, product, qty: 1, price: product.selling_price }]);
    }
    setProductSearch('');
    setProductResults([]);
  };

  const removeFromCart = (productId) => setCart(cart.filter((i) => i.product_id !== productId));
  const updateQty = (productId, qty) => {
    const item = cart.find((i) => i.product_id === productId);
    if (!item) return;
    if (qty > item.product.stock) { toast.warning(`Stok hanya ${item.product.stock}`); return; }
    if (qty < 1) { removeFromCart(productId); return; }
    setCart(cart.map((i) => i.product_id === productId ? { ...i, qty } : i));
  };

  const total = cart.reduce((sum, i) => sum + (i.qty * parseFloat(i.price)), 0);
  const paymentNum = parseFloat(payment) || 0;
  const kembalian = paymentNum - total;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Keranjang kosong!'); return; }
    if (paymentNum < total) { toast.error('Jumlah bayar kurang dari total!'); return; }
    setSaving(true);
    try {
      const res = await api.post('/sales', {
        date: today,
        payment: paymentNum,
        details: cart.map((i) => ({
          product_id: i.product_id,
          qty: i.qty,
          price: parseFloat(i.price),
        })),
      });
      setSuccessModal(res.data);
      setCart([]);
      setPayment('');
      toast.success('Transaksi berhasil!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Transaksi gagal.');
    } finally { setSaving(false); }
  };

  const openPdf = (id) => window.open(`/api/sales/${id}/pdf`, '_blank');

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Penjualan</h1>
          <p className="page-subtitle">Transaksi kasir & riwayat penjualan</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${tab === 'kasir' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('kasir')}>
            <CreditCard size={14} /> Kasir
          </button>
          <button className={`btn ${tab === 'riwayat' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('riwayat')}>
            Riwayat
          </button>
        </div>
      </div>

      {tab === 'kasir' ? (
        <div className="kasir-layout">
          {/* Left: Product Search */}
          <div className="kasir-panel">
            <div className="kasir-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={16} />
                Cari Barang
              </div>
            </div>
            <div style={{ padding: '16px 16px 0' }}>
              <div className="input-group" style={{ position: 'relative' }}>
                <Search className="input-group-icon" size={14} />
                <input
                  className="form-control"
                  placeholder="Ketik nama atau kode barang..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  autoComplete="off"
                  id="kasir-search-input"
                />
              </div>
              {productResults.length > 0 && (
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', marginTop: 4,
                  maxHeight: 240, overflowY: 'auto', boxShadow: 'var(--shadow-lg)',
                }}>
                  {productResults.map((p) => (
                    <button key={p.id} onClick={() => addToCart(p)} style={{
                      width: '100%', padding: '12px 14px', textAlign: 'left',
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between',
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--text-primary)', transition: 'background 0.15s',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{p.code} • {formatRupiah(p.selling_price)}</div>
                      </div>
                      <span className={`badge ${p.stock > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {p.stock} {p.unit}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="kasir-cart" style={{ padding: 16 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                  <ShoppingBag size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p>Keranjang kosong</p>
                  <p style={{ fontSize: '0.78rem' }}>Cari barang di atas</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product_id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.product.name}</div>
                      <div className="cart-item-price">{formatRupiah(item.price)} / {item.product.unit}</div>
                    </div>
                    <div className="cart-item-qty">
                      <button className="qty-btn" onClick={() => updateQty(item.product_id, item.qty - 1)}>−</button>
                      <span className="qty-value">{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.product_id, item.qty + 1)}>+</button>
                    </div>
                    <div className="cart-item-subtotal">{formatRupiah(item.qty * parseFloat(item.price))}</div>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeFromCart(item.product_id)}
                      style={{ color: 'var(--danger)' }}><X size={14} /></button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Summary & Payment */}
          <div className="kasir-panel">
            <div className="kasir-panel-header">Ringkasan Transaksi</div>
            <div className="kasir-cart" style={{ padding: 16 }}>
              {cart.map((item) => (
                <div key={item.product_id} className="summary-row">
                  <span className="text-secondary">{item.product.name} ×{item.qty}</span>
                  <span>{formatRupiah(item.qty * parseFloat(item.price))}</span>
                </div>
              ))}
            </div>
            <div className="kasir-summary">
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatRupiah(total)}</span>
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Jumlah Bayar (Rp)</label>
                <input
                  className="form-control"
                  type="number"
                  min={total}
                  step="1000"
                  placeholder="0"
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  id="kasir-payment-input"
                  style={{ fontSize: '1.1rem', fontWeight: 700 }}
                />
              </div>
              {paymentNum > 0 && (
                <div className={`summary-row kembalian ${kembalian < 0 ? 'text-danger' : ''}`}>
                  <span>Kembalian</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700 }}>{formatRupiah(kembalian)}</span>
                </div>
              )}
              <button
                className="btn btn-primary w-full btn-lg"
                style={{ marginTop: 16, justifyContent: 'center' }}
                onClick={handleCheckout}
                disabled={saving || cart.length === 0 || paymentNum < total}
                id="btn-bayar"
              >
                {saving ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : <CreditCard size={16} />}
                {saving ? 'Memproses...' : 'Bayar & Simpan'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Riwayat Tab */
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>No. Transaksi</th><th>Tanggal</th><th>Total</th><th>Bayar</th><th>Kembali</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {loadingSales ? (
                <tr><td colSpan={6} className="text-center" style={{ padding: 32 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={6}><div className="table-empty"><CreditCard className="table-empty-icon" size={40} /><p>Belum ada transaksi</p></div></td></tr>
              ) : sales.map((s) => (
                <tr key={s.id}>
                  <td><code style={{ fontSize: '0.78rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>{s.transaction_number}</code></td>
                  <td>{formatDate(s.date)}</td>
                  <td><strong>{formatRupiah(s.total)}</strong></td>
                  <td>{formatRupiah(s.payment)}</td>
                  <td>{formatRupiah(s.change_amount)}</td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Cetak Struk" onClick={() => openPdf(s.id)} id={`btn-pdf-sale-${s.id}`}>
                      <FileText size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <Modal isOpen={!!successModal} onClose={() => setSuccessModal(null)} title="Transaksi Berhasil! 🎉"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setSuccessModal(null)}>Tutup</button>
              <button className="btn btn-primary" onClick={() => { openPdf(successModal.id); setSuccessModal(null); }}>
                <FileText size={14} /> Cetak Struk
              </button>
            </>
          }
        >
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              No. {successModal.transaction_number}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px', marginBottom: 8 }}>
              <span>Total</span><strong>{formatRupiah(successModal.total)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px', marginBottom: 8 }}>
              <span>Bayar</span><strong>{formatRupiah(successModal.payment)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--success)' }}>
              <span>Kembalian</span><strong>{formatRupiah(successModal.change_amount)}</strong>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
