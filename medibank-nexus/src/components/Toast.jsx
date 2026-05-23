/**
 * Toast Notification System
 *
 * Usage:
 *   // 1. Wrap your app (already done in App.jsx via ToastProvider)
 *   // 2. Call the hook anywhere inside:
 *
 *   import { useToast } from '../components/Toast';
 *   const toast = useToast();
 *
 *   toast.success('Patient registered!');
 *   toast.error('Connection failed', 'Network Error');
 *   toast.warning('Low stock alert');
 *   toast.info('Appointment reminder sent');
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  IcCheckCircle, IcXCircle, IcWarning, IcInfo, IcX,
} from './Icons';

/* ── Context ── */
const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

/* ── Config ── */
const ICONS = {
  success: <IcCheckCircle width={16} height={16} style={{ color: 'var(--success)' }} />,
  error:   <IcXCircle     width={16} height={16} style={{ color: 'var(--danger)'  }} />,
  warning: <IcWarning     width={16} height={16} style={{ color: 'var(--warning)' }} />,
  info:    <IcInfo        width={16} height={16} style={{ color: 'var(--primary)' }} />,
};

const DURATION = { success: 3800, error: 5000, warning: 4500, info: 3500 };

/* ── Single toast ── */
function ToastItem({ id, type = 'info', title, message, onDismiss }) {
  const [exiting, setExiting] = useState(false);

  /* auto-dismiss */
  useEffect(() => {
    const t = setTimeout(() => dismiss(), DURATION[type] ?? 4000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 280);
  };

  return (
    <div
      className={`toast toast-${type}${exiting ? ' toast-exit' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-icon">{ICONS[type]}</div>
      <div style={{ flex: 1 }}>
        {title   && <div className="toast-title">{title}</div>}
        {message && <div className="toast-body">{message}</div>}
      </div>
      <button
        className="toast-close"
        onClick={dismiss}
        aria-label="Dismiss notification"
      >
        <IcX width={14} height={14} />
      </button>
    </div>
  );
}

/* ── Provider — wrap App.jsx with this ── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((type, message, title) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message, title }]);
    return id;
  }, []);

  /* Convenience methods */
  const api = {
    success: (msg, title) => push('success', msg, title),
    error:   (msg, title) => push('error',   msg, title),
    warning: (msg, title) => push('warning', msg, title),
    info:    (msg, title) => push('info',    msg, title),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}

      {/* Stack — fixed bottom-right */}
      <div className="toast-stack" aria-label="Notifications">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
