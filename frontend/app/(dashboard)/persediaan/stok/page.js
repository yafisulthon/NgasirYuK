'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, Archive } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { formatRupiah, getStockStatusBadge } from '@/lib/utils';

export default function StokPage() {
  const toast = useToast();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLow, setFilterLow] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/stock', {
        params: { search: search || undefined, low_stock: filterLow || undefined }
      });
      setStock(res.data);
    } catch { toast.error('Gagal memuat data stok.'); }
    finally { setLoading(false); }
  }, [search, filterLow]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stok Barang</h1>
          <p className="page-subtitle">Pantau stok semua barang secara real-time</p>
        </div>
        <button
          className={`btn ${filterLow ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterLow(!filterLow)}
          id="btn-filter-low-stock"
        >
          {filterLow ? 'Semua Stok' : '⚠️ Stok Menipis'}
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="input-group table-search">
            <Search className="input-group-icon" size={14} />
            <input className="form-control" placeholder="Cari barang..." value={search} onChange={(e) => setSearch(e.target.value)} id="stok-search" />
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Kode</th><th>Nama Barang</th><th>Kategori</th><th>Satuan</th><th>Stok</th><th>Min Stok</th><th>Status</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center" style={{ padding: 32 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : stock.length === 0 ? (
              <tr><td colSpan={7}><div className="table-empty"><Archive className="table-empty-icon" size={40} /><p>Tidak ada data stok</p></div></td></tr>
            ) : stock.map((p) => {
              const { label, variant } = getStockStatusBadge(p.stock, p.minimum_stock);
              return (
                <tr key={p.id}>
                  <td><code style={{ fontSize: '0.78rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>{p.code}</code></td>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.category || <span className="text-muted">-</span>}</td>
                  <td><span className="badge badge-dark">{p.unit}</span></td>
                  <td>
                    <strong style={{ color: p.stock === 0 ? 'var(--danger)' : p.stock <= p.minimum_stock ? 'var(--warning)' : 'inherit' }}>
                      {p.stock}
                    </strong>
                  </td>
                  <td>{p.minimum_stock}</td>
                  <td><span className={`badge ${variant}`}>{label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
