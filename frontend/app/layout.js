import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { ToastProvider } from '@/lib/ToastContext';

export const metadata = {
  title: 'NgasirYuK - Sistem Kasir & Manajemen Persediaan',
  description: 'Sistem Informasi Kasir dan Manajemen Persediaan Toko Material Bangunan',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
