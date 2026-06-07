'use client';
import { useEffect, useState } from 'react';
import {
  TrendingUp, ShoppingBag, Package, Truck,
  AlertTriangle, BarChart2,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  const stats = data?.stats || {};

  const lineData = {
    labels: data?.daily_sales?.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    }) || [],
    datasets: [{
      label: 'Penjualan',
      data: data?.daily_sales?.map((d) => d.total) || [],
      borderColor: 'var(--accent)',
      backgroundColor: 'rgba(10,10,10,0.05)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: 'var(--accent)',
    }],
  };

  const barData = {
    labels: data?.monthly_sales?.map((d) => {
      const [year, month] = d.month.split('-');
      return new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    }) || [],
    datasets: [{
      label: 'Penjualan',
      data: data?.monthly_sales?.map((d) => d.total) || [],
      backgroundColor: 'var(--accent)',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      callbacks: { label: (ctx) => ' ' + formatRupiah(ctx.raw) }
    }},
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: {
        font: { size: 11 },
        callback: (v) => formatRupiah(v),
      }},
    },
  };

  return (
    <>
      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon dark">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="stat-value">{formatRupiah(stats.sales_today)}</div>
            <div className="stat-label">Penjualan Hari Ini</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon dark">
            <ShoppingBag size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.transactions_today || 0}</div>
            <div className="stat-label">Transaksi Hari Ini</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon dark">
            <Package size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.total_products || 0}</div>
            <div className="stat-label">Total Barang</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon dark">
            <Truck size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.total_suppliers || 0}</div>
            <div className="stat-label">Total Supplier</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Penjualan 7 Hari Terakhir</h3>
          </div>
          <div className="chart-container">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Penjualan 6 Bulan Terakhir</h3>
          </div>
          <div className="chart-container">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        {/* Stok Menipis */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
              Stok Menipis
            </h3>
            <span className="badge badge-warning">{data?.low_stock?.length || 0}</span>
          </div>
          {!data?.low_stock?.length ? (
            <p className="text-muted" style={{ fontSize: '0.82rem' }}>Semua stok aman ✓</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Barang</th>
                    <th>Stok</th>
                    <th>Min</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.low_stock.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{p.category}</div>
                      </td>
                      <td><strong>{p.stock}</strong> {p.unit}</td>
                      <td>{p.minimum_stock}</td>
                      <td>
                        <span className={`badge ${p.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                          {p.stock === 0 ? 'Habis' : 'Menipis'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Produk Terlaris */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart2 size={16} />
              Produk Terlaris Bulan Ini
            </h3>
          </div>
          {!data?.top_products?.length ? (
            <p className="text-muted" style={{ fontSize: '0.82rem' }}>Belum ada data penjualan.</p>
          ) : (
            <div>
              {data.top_products.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: i < data.top_products.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--accent-light)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.75rem',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {p.total_qty} {p.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
