'use client';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { usePathname } from 'next/navigation';

// Map path to page title
const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/master/barang': 'Master Barang',
  '/master/kategori': 'Kategori Barang',
  '/master/supplier': 'Supplier',
  '/transaksi/pembelian': 'Pembelian Barang',
  '/transaksi/penjualan': 'Penjualan',
  '/persediaan/stok': 'Stok Barang',
  '/persediaan/opname': 'Stock Opname',
  '/laporan': 'Laporan',
  '/pengguna': 'Manajemen Pengguna',
  '/activity-log': 'Activity Log',
};

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] || 'NgasirYuK';

  return (
    <header className="navbar">
      <h1 className="navbar-title">{title}</h1>
      <div className="navbar-actions">
        <button
          className="toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch ke Light Mode' : 'Switch ke Dark Mode'}
          id="theme-toggle-btn"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
