'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, Activity } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

export default function OpnamePage() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [opnameItems, setOpnameItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    api.get('/inventory/stock').then((res) => {
      setProducts(res.data);
      setOpnameItems(res.data.map((p) => ({ product_id: p.id, name: p.name, unit: p.unit, system_stock: p.stock, actual_stock: p.stock, note: '' })));
      setLoading(false);
    }).catch(() => { toast.error('Gagal memuat stok.'); setLoading(false); });
  }, []);

  const updateItem = (productId, field, value) => {
    setOpnameItems(opnameItems.map((i) => i.product_id === productId ? { ...i, [field]: value } : i));
  };

  const changedItems = opnameItems.filter((i) => parseInt(i.actual_stock) !== i.system_stock);

  const handleSave = async () => {
    if (changedItems.length === 0) { toast.warning('Tidak ada perubahan stok untuk disimpan.'); return; }
    setSaving(true);
    try {
      const res = await api.post('/inventory/opname', changedItems.map((i) => ({
        product_id: i.product_id,
        actual_stock: parseInt(i.actual_stock),
        note: i.note || undefined,
      })));
      setResults(res.data.results);
      toast.success(`Stock opname berhasil! ${changedItems.length} produk disesuaikan.`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan opname.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loading-overlay"><div className="loading-spinner" style={{ width: 32, height: 32 }} /></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Opname</h1>
          <p className="page-subtitle">Sesuaikan stok sistem dengan stok fisik di gudang</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {changedItems.length > 0 && (
            <span className="badge badge-warning">{changedItems.length} item berubah</span>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || changedItems.length === 0} id="btn-save-opname">
            {saving ? <span className="loading-spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
            Simpan Opname
          </button>
        </div>
      </div>

      {results && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--success)' }}>
          <h3 className="card-title" style={{ marginBottom: 12 }}>✅ Hasil Opname Terakhir</h3>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Produk</th><th>Stok Lama</th><th>Stok Baru</th><th>Selisih</th></tr></thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.product_id}>
                    <td><strong>{r.product_name}</strong></td>
                    <td>{r.old_stock}</td>
                    <td><strong>{r.new_stock}</strong></td>
                    <td>
                      <span className={`badge ${r.diff > 0 ? 'badge-success' : r.diff < 0 ? 'badge-danger' : 'badge-dark'}`}>
                        {r.diff > 0 ? '+' : ''}{r.diff}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nama Barang</th>
              <th>Satuan</th>
              <th>Stok Sistem</th>
              <th>Stok Fisik (Input)</th>
              <th>Selisih</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {opnameItems.map((item) => {
              const diff = parseInt(item.actual_stock || 0) - item.system_stock;
              const changed = diff !== 0;
              return (
                <tr key={item.product_id} style={{ background: changed ? 'var(--warning-light)' : 'inherit' }}>
                  <td><strong>{item.name}</strong></td>
                  <td><span className="badge badge-dark">{item.unit}</span></td>
                  <td>{item.system_stock}</td>
                  <td>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={item.actual_stock}
                      onChange={(e) => updateItem(item.product_id, 'actual_stock', e.target.value)}
                      style={{ width: 90, borderColor: changed ? 'var(--warning)' : undefined }}
                    />
                  </td>
                  <td>
                    {changed ? (
                      <span className={`badge ${diff > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    ) : <span className="text-muted">0</span>}
                  </td>
                  <td>
                    <input
                      className="form-control"
                      placeholder="Catatan opsional..."
                      value={item.note}
                      onChange={(e) => updateItem(item.product_id, 'note', e.target.value)}
                      style={{ width: 180 }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
