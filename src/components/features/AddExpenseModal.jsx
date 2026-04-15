import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { useAppContext } from '../../context/useAppContext';
import { IndianRupee, Tag, FileText, Loader2, Users, CalendarDays, StickyNote, RefreshCw } from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'General'];

const today = () => new Date().toISOString().split('T')[0];

const emptyForm = (family) => ({
  title:       '',
  amount:      '',
  category:    'General',
  memberId:    family.length > 0 ? family[0].id : '',
  note:        '',
  date:        today(),
  isRecurring: false,
});

export const AddExpenseModal = ({ isOpen, onClose, initialData = null }) => {
  const { addTransaction, updateTransaction, family } = useAppContext();
  const [form,    setForm]    = useState(() => emptyForm(family));
  const [type,    setType]    = useState('expense');
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  // Populate form when editing
  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setForm({
        title:       initialData.title       || '',
        amount:      String(Math.abs(initialData.amount) || ''),
        category:    initialData.category    || 'General',
        memberId:    initialData.member_id   || (family[0]?.id ?? ''),
        note:        initialData.note        || '',
        date:        initialData.date        || today(),
        isRecurring: Boolean(initialData.is_recurring),
      });
      setType(initialData.amount < 0 ? 'expense' : 'income');
    } else {
      setForm(emptyForm(family));
      setType('expense');
    }
    setErrors({});
  }, [isOpen, initialData, family]);

  const validate = () => {
    const e = {};
    if (!form.title.trim())         e.title  = 'Description is required';
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.memberId && family.length > 0) e.memberId = 'Assign to a member';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const numericAmount = type === 'expense'
      ? -Math.abs(parseFloat(form.amount))
      :  Math.abs(parseFloat(form.amount));

    const payload = {
      title:       form.title.trim(),
      amount:      numericAmount,
      category:    type === 'income' ? 'Income' : form.category,
      memberId:    form.memberId || (family[0]?.id ?? ''),
      note:        form.note.trim(),
      date:        form.date,
      isRecurring: form.isRecurring,
    };

    try {
      if (initialData) {
        await updateTransaction(initialData.id, payload);
      } else {
        await addTransaction(payload);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const title = initialData ? 'Edit Transaction' : type === 'expense' ? 'Add Expense' : 'Add Income';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Type toggle */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.07]">
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === t
                  ? t === 'expense'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'bg-secondary text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              onClick={() => setType(t)}
            >
              {t === 'expense' ? '− Expense' : '+ Income'}
            </button>
          ))}
        </div>

        {/* Description */}
        <Input
          label="Description" icon={FileText}
          placeholder="Coffee, Groceries, Salary…"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
          required
        />

        {/* Amount + Date row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount" icon={IndianRupee}
            type="number" step="0.01" min="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            error={errors.amount}
            required
          />
          <Input
            label="Date" icon={CalendarDays}
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            max={today()}
          />
        </div>

        {/* Category (expenses only) */}
        {type === 'expense' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
              <Tag size={14} /> Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    form.category === cat
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.12]'
                  }`}
                  onClick={() => set('category', cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Member selector */}
        {family.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
              <Users size={14} /> Assign to
            </label>
            <div className="flex flex-wrap gap-2">
              {family.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    form.memberId === m.id
                      ? 'bg-accent-purple text-white shadow-md shadow-purple-500/25'
                      : 'bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.12]'
                  }`}
                  onClick={() => set('memberId', m.id)}
                >
                  {m.user_name || m.name}
                </button>
              ))}
            </div>
            {errors.memberId && <p className="text-xs text-red-400 ml-1">{errors.memberId}</p>}
          </div>
        )}

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
            <StickyNote size={14} /> Note <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Add a note…"
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 resize-none transition-all"
          />
        </div>

        {/* Recurring toggle */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <RefreshCw size={14} />
            <span>Recurring transaction</span>
          </div>
          <Toggle checked={form.isRecurring} onChange={(v) => set('isRecurring', v)} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading
              ? <><Loader2 size={15} className="animate-spin mr-1.5" /> Saving…</>
              : initialData ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
