/**
 * Modal
 *
 * Usage:
 *   <Modal open={isOpen} onClose={() => setOpen(false)} title="Confirm Action">
 *     <p>Are you sure?</p>
 *     <div className="modal-footer">
 *       <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
 *       <Button variant="danger"  onClick={handleConfirm}>Delete</Button>
 *     </div>
 *   </Modal>
 */

import { useEffect, useRef } from 'react';
import { IcX } from './Icons';

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 520,
  /** 'sm' | 'md' | 'lg' | 'xl' — overrides maxWidth if set */
  size,
  /** Hide the X close button */
  hideClose = false,
  /** Prevent closing on backdrop click */
  persistent = false,
}) {
  const overlayRef = useRef(null);
  const firstFocusRef = useRef(null);

  /* width from size shorthand */
  const widthMap = { sm: 380, md: 520, lg: 680, xl: 860 };
  const width = size ? widthMap[size] : maxWidth;

  /* lock body scroll */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  /* focus first focusable element */
  useEffect(() => {
    if (!open) return;
    const el = overlayRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
  }, [open]);

  /* Escape key */
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (e.key === 'Escape' && !persistent) onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, persistent, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onClick={!persistent ? onClose : undefined}
    >
      <div
        className="modal"
        style={{ maxWidth: width }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="modal-header">
            {title && (
              <h3 id="modal-title" className="modal-title">{title}</h3>
            )}
            {!hideClose && (
              <button
                className="btn btn-ghost btn-icon"
                onClick={onClose}
                aria-label="Close modal"
                style={{ marginLeft: 'auto', flexShrink: 0 }}
              >
                <IcX width={16} height={16} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
