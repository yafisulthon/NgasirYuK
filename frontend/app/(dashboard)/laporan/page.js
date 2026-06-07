'use client';
import { useState, useEffect } from 'react';
import { BarChart2, FileText, TrendingUp, ShoppingCart, Archive } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { formatRupiah, formatDate } from '@/lib/utils';

const TABS = [
  { id: 'penjualan', label: 'Penjualan', icon: TrendingUp },
  { id: 'pembelian', label: 'Pembelian', icon: ShoppingCart },
  { id: 'persediaan', label: 'Persediaan', icon: Archive },
  { id: 'top-products', label: 'Produk Terlaris', icon: BarChart2 },
];

const PERIODS = [
  { value: 'harian', label: 'Hari Ini' },
  { value: 'mingguan', label: 'Minggu Ini' },
  { value: 'bulanan', label: 'Bulan Ini' },
  { value: 'tahunan', label: 'Tahun Ini' },
];

export default function LaporanPage() {
  const toast = useToast();
  const [tab, setTab] = useState('penjualan');
  const [period, setPeriod] = useState('bulanan');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'penjualan') res = await api.get('/reports/sales', { params: { period } });
      else if (tab === 'pembelian') res = await api.get('/reports/purchases', { params: { period } });
      else if (tab === 'persediaan') res = await api.get('/reports/inventory');
      else if (tab === 'top-products') res = await api.get('/reports/top-products', { params: { period } });
      setData(res.data);
    } catch { toast.error('Gagal memuat laporan.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [tab, period]);

  const downloadPdf = () => {
    const urls = {
      penjualan: `/api/reports/sales/pdf?period=${period}`,
      pembelian: `/api/reports/purchases/pdf?period=${period}`,
      persediaan: `/api/reports/inventory/pdf`,
    };
    if (urls[tab]) window.open(urls[tab], '_blank');
    else toast.info('PDF untuk laporan ini belum tersedia.');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan</h1>
          <p className="page-subtitle">Analisis data penjualan, pembelian, dan persediaan</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab !== 'top-products' && (
            <button className="btn btn-secondary" onClick={downloadPdf} id="btn-download-pdf">
              <FileText size={14} /> Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {TABS.map((t) => (
          <button key={t.id} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            style={{ gap: 6 }} onClick={() => setTab(t.id)} id={`tab-laporan-${t.id}`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* Period filter (not for persediaan) */}
      {tab !== 'persediaan' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {PERIODS.map((p) => (
            <button key={p.value} className={`btn btn-sm ${period === p.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPeriod(p.value)} id={`period-${p.value}`}>
              {p.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading-overlay"><div className="loading-spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <>
          {/* Penjualan */}
          {tab === 'penjualan' && data && (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div className="card" style={{ flex: 1 }}>
                  <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: 4 }}>Total Penjualan</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{formatRupiah(data.grand_total)}</div>
                </div>
                <div className="card" style={{ flex: 1 }}>
                  <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: 4 }}>Total Transaksi</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{data.total_transactions}</div>
                </div>
                <div className="card" style={{ flex: 1 }}>
                  <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: 4 }}>Periode</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{data.period}</div>
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>#</th><th>No. Transaksi</th><th>Tanggal</th><th>Kasir</th><th>Total</th></tr></thead>
                  <tbody>
                    {data.sales?.length === 0 ? (
                      <tr><td colSpan={5}><div className="table-empty"><TrendingUp className="table-empty-icon" size={40} /><p>Tidak ada data</p></div></td></tr>
                    ) : data.sales?.map((s, i) => (
                      <tr key={s.id}>
                        <td className="text-muted">{i + 1}</td>
                        <td><code style={{ fontSize: '0.78rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>{s.transaction_number}</code></td>
                        <td>{formatDate(s.date)}</td>
                        <td>{s.kasir}</td>
                        <td><strong>{formatRupiah(s.total)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pembelian */}
          {tab === 'pembelian' && data && (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div className="card" style={{ flex: 1 }}>
                  <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: 4 }}>Total Pembelian</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{formatRupiah(data.grand_total)}</div>
                </div>
                <div className="card" style={{ flex: 1 }}>
                  <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: 4 }}>Jumlah PO</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{data.total_purchases}</div>
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>#</th><th>No. Pembelian</th><th>Tanggal</th><th>Supplier</th><th>Total</th></tr></thead>
                  <tbody>
                    {data.purchases?.length === 0 ? (
                      <tr><td colSpan={5}><div className="table-empty"><ShoppingCart className="table-empty-icon" size={40} /><p>Tidak ada data</p></div></td></tr>
                    ) : data.purchases?.map((p, i) => (
                      <tr key={p.id}>
                        <td className="text-muted">{i + 1}</td>
                        <td><code style={{ fontSize: '0.78rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>{p.purchase_number}</code></td>
                        <td>{formatDate(p.date)}</td>
                        <td>{p.supplier_name}</td>
                        <td><strong>{formatRupiah(p.total)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Persediaan */}
          {tab === 'persediaan' && data && (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>#</th><th>Kode</th><th>Nama Barang</th><th>Kategori</th><th>Sat.</th><th>Stok</th><th>Min</th><th>Status</th></tr></thead>
                <tbody>
                  {data.products?.map((p, i) => (
                    <tr key={p.id}>
                      <td className="text-muted">{i + 1}</td>
                      <td><code style={{ fontSize: '0.78rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>{p.code}</code></td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.category}</td>
                      <td><span className="badge badge-dark">{p.unit}</span></td>
                      <td><strong>{p.stock}</strong></td>
                      <td>{p.minimum_stock}</td>
                      <td>
                        <span className={`badge ${p.status === 'habis' ? 'badge-danger' : p.status === 'menipis' ? 'badge-warning' : 'badge-success'}`}>
                          {p.status === 'habis' ? 'Habis' : p.status === 'menipis' ? 'Menipis' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Top Products */}
          {tab === 'top-products' && data && (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Rank</th><th>Nama Barang</th><th>Satuan</th><th>Qty Terjual</th><th>Total Omset</th></tr></thead>
                <tbody>
                  {data.products?.length === 0 ? (
                    <tr><td colSpan={5}><div className="table-empty"><BarChart2 className="table-empty-icon" size={40} /><p>Belum ada data penjualan</p></div></td></tr>
                  ) : data.products?.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: p.rank <= 3 ? 'var(--accent)' : 'var(--accent-light)',
                          color: p.rank <= 3 ? 'var(--bg-primary)' : 'var(--text-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.75rem',
                        }}>{p.rank}</div>
                      </td>
                      <td><strong>{p.name}</strong></td>
                      <td><span className="badge badge-dark">{p.unit}</span></td>
                      <td><strong>{p.total_qty}</strong></td>
                      <td><strong>{formatRupiah(p.total_revenue)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
