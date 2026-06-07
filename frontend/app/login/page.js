'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import api from '@/lib/api';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('Username dan password wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.access_token, res.data.user);
      toast.success(`Selamat datang, ${res.data.user.name}!`);
      router.replace('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login gagal. Periksa username & password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Left panel - branding */}
      <div style={styles.left}>
        <div style={styles.brandContent}>
          <div style={styles.logoWrap}>
            <ShoppingBag size={36} color="white" />
          </div>
          <h1 style={styles.brandName}>NgasirYuK</h1>
          <p style={styles.brandDesc}>
            Sistem Informasi Kasir dan Manajemen Persediaan Toko Material Bangunan
          </p>
          <div style={styles.featureList}>
            {['Manajemen stok real-time', 'Transaksi cepat & akurat', 'Laporan otomatis & lengkap', 'Multi role user'].map((f) => (
              <div key={f} style={styles.featureItem}>
                <div style={styles.featureDot} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div style={styles.right}>
        <div style={styles.formBox}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={styles.formTitle}>Masuk ke Sistem</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Masukkan kredensial Anda untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username <span className="required">*</span>
              </label>
              <div className="input-group">
                <User className="input-group-icon" size={15} />
                <input
                  id="username"
                  className="form-control"
                  type="text"
                  placeholder="Masukkan username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <div className="input-group">
                <Lock className="input-group-icon" size={15} />
                <input
                  id="password"
                  className="form-control"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--text-muted)',
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full btn-lg"
              id="login-submit-btn"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? (
                <><span className="loading-spinner" style={{ width: 16, height: 16 }} /> Memproses...</>
              ) : 'Masuk'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Default Login:</div>
            <div>Owner: <strong>owner</strong> / <strong>owner123</strong></div>
            <div>Admin: <strong>admin</strong> / <strong>admin123</strong></div>
            <div>Kasir: <strong>kasir</strong> / <strong>kasir123</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg-primary)',
  },
  left: {
    flex: 1,
    background: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
  },
  brandContent: {
    maxWidth: 400,
  },
  logoWrap: {
    width: 64,
    height: 64,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  brandName: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: 'white',
    letterSpacing: '-0.03em',
    marginBottom: 12,
  },
  brandDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.9rem',
    lineHeight: 1.6,
    marginBottom: 32,
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.85rem',
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.5)',
    flexShrink: 0,
  },
  right: {
    width: 480,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    background: 'var(--bg-primary)',
  },
  formBox: {
    width: '100%',
    maxWidth: 380,
  },
  formTitle: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: 6,
  },
};
