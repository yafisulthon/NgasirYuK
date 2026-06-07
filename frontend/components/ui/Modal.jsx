'use client';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = '', footer }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size ? `modal-${size}` : ''}`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">{footer}</div>
        )}
      </div>
    </div>
  );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Hapus', loading = false }) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Konfirmasi'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="loading-spinner" style={{ width: 14, height: 14 }} /> : null}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {message || 'Apakah Anda yakin ingin melanjutkan tindakan ini?'}
      </p>
    </Modal>
  );
}
