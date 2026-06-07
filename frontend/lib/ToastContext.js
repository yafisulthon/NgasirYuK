'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', title = null, duration = 3500) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, title) => addToast(msg, 'success', title || 'Berhasil'),
    error: (msg, title) => addToast(msg, 'error', title || 'Error'),
    warning: (msg, title) => addToast(msg, 'warning', title || 'Peringatan'),
    info: (msg, title) => addToast(msg, 'info', title || 'Info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-icon">{ICONS[t.type]}</span>
            <div className="toast-content">
              {t.title && <div className="toast-title">{t.title}</div>}
              <div className="toast-message">{t.message}</div>
            </div>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => removeToast(t.id)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
