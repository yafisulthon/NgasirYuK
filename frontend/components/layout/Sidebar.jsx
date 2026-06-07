'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Tag, Truck, ShoppingCart,
  CreditCard, Archive, BarChart2, Users, Activity,
  Settings, ShoppingBag, LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getInitials } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'admin', 'kasir'] },
  { section: 'Master Data' },
  { label: 'Barang', href: '/master/barang', icon: Package, roles: ['owner', 'admin'] },
  { label: 'Kategori', href: '/master/kategori', icon: Tag, roles: ['owner', 'admin'] },
  { label: 'Supplier', href: '/master/supplier', icon: Truck, roles: ['owner', 'admin'] },
  { section: 'Transaksi' },
  { label: 'Pembelian', href: '/transaksi/pembelian', icon: ShoppingCart, roles: ['owner', 'admin'] },
  { label: 'Penjualan', href: '/transaksi/penjualan', icon: CreditCard, roles: ['owner', 'admin', 'kasir'] },
  { section: 'Persediaan' },
  { label: 'Stok Barang', href: '/persediaan/stok', icon: Archive, roles: ['owner', 'admin', 'kasir'] },
  { label: 'Stock Opname', href: '/persediaan/opname', icon: Activity, roles: ['owner', 'admin'] },
  { section: 'Laporan' },
  { label: 'Laporan', href: '/laporan', icon: BarChart2, roles: ['owner', 'admin'] },
  { section: 'Sistem' },
  { label: 'Pengguna', href: '/pengguna', icon: Users, roles: ['owner'] },
  { label: 'Activity Log', href: '/activity-log', icon: Activity, roles: ['owner'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShoppingBag size={18} />
        </div>
        <span className="sidebar-logo-text">NgasirYuK</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} className="sidebar-section-label">
                {item.section}
              </div>
            );
          }
          // Check role access
          if (user && item.roles && !item.roles.includes(user.role)) return null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <item.icon className="sidebar-item-icon" size={17} />
              <span className="sidebar-item-text">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="sidebar-bottom">
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {getInitials(user.name)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={logout}
              title="Logout"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
