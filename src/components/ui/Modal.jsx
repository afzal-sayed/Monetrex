import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export const Modal = ({ isOpen, onClose, title, children, className }) => {
  const panelRef   = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      triggerRef.current?.focus();
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Close on Escape key + focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return; }

      if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(panelRef.current.querySelectorAll(FOCUSABLE));
        if (focusable.length === 0) { e.preventDefault(); return; }
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Move focus into modal on open
    const raf = requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelectorAll(FOCUSABLE);
      if (focusable?.length) focusable[0].focus();
    });
    return () => { window.removeEventListener('keydown', handleKeyDown); cancelAnimationFrame(raf); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const titleId = `modal-title-${title?.replace(/\s+/g, '-').toLowerCase()}`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm animate-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="overflow-hidden rounded-2xl w-full max-w-lg animate-modal-in">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            "relative w-full flex flex-col max-h-[calc(100dvh-2rem)] glass-panel bg-white/95 dark:bg-slate-900/95 p-6 shadow-2xl border border-slate-200/60 dark:border-white/10",
            className
          )}
        >
          <div className="flex items-center justify-between mb-5 shrink-0">
            <h3 id={titleId} className="text-xl font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          <div className="overflow-y-auto min-h-0">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};
