import React, { useState } from 'react';
import { IndianRupee, FileText, Tag, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { RecurringFields } from './RecurringFields';
import { useAppContext } from '../../context/useAppContext';
import { mergeCategories } from '../../utils/helpers';

export const EditRuleModal = ({ rule, onClose }) => (
  rule ? <EditRuleForm key={rule.id} rule={rule} onClose={onClose} /> : null
);

const EditRuleForm = ({ rule, onClose }) => {
  const { updateRecurringRule, fetchData, customCategories } = useAppContext();
  const [form, setForm] = useState({
    title:     rule.title,
    amount:    String(Math.abs(rule.amount)),
    category:  rule.category,
    note:      rule.note || '',
    frequency: rule.frequency,
    endDate:   rule.end_date || '',
  });
  const [saving, setSaving] = useState(false);
  const isExpense = rule.amount < 0;

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const amountValue = parseFloat(form.amount);
  const canSave = form.title.trim() && amountValue > 0;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    const ok = await updateRecurringRule(rule.id, {
      title:     form.title.trim(),
      amount:    isExpense ? -amountValue : amountValue,
      category:  form.category,
      note:      form.note.trim(),
      frequency: form.frequency,
      endDate:   form.endDate || null,
    });
    if (ok) { await fetchData(); onClose(); }
    setSaving(false);
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Recurring Rule">
      <form onSubmit={handleSave} className="space-y-4">
        <Input label="Description" icon={FileText} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        <Input
          label="Amount" icon={IndianRupee} type="number" step="0.01" min="0.01"
          value={form.amount} onChange={(e) => set('amount', e.target.value)} required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
            <Tag size={14} /> Category
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
            {mergeCategories(customCategories, isExpense ? 'expense' : 'income').list.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => set('category', cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  form.category === cat
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.12]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <RecurringFields frequency={form.frequency} endDate={form.endDate} onChange={set} />
        <textarea
          rows={2}
          placeholder="Note (optional)"
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving || !canSave}>
            {saving ? <><Loader2 size={15} className="animate-spin mr-1.5" /> Saving…</> : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
