import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

/**
 * Drop-in replacement for window.confirm.
 *
 * Usage:
 *   const [confirmState, setConfirmState] = useState(null);
 *   // to open:  setConfirmState({ title, message, onConfirm })
 *   // in JSX:   <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
 */
export const ConfirmModal = ({ state, onClose }) => {
  if (!state) return null;
  const { title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = true, onConfirm } = state;

  const handleConfirm = () => {
    onClose();
    onConfirm();
  };

  return (
    <Modal isOpen={!!state} onClose={onClose} title=" ">
      <div className="space-y-5 -mt-2">
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${danger ? 'bg-red-500/10' : 'bg-primary/10'}`}>
            <AlertTriangle size={26} className={danger ? 'text-red-400' : 'text-primary'} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
            {message && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{message}</p>}
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            variant={danger ? 'ghost' : 'primary'}
            className={danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200/50 dark:border-red-500/20' : ''}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
