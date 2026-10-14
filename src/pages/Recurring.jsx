import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Repeat } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { AddExpenseModal } from '../components/features/AddExpenseModal';
import { EditRuleModal } from '../components/features/EditRuleModal';
import { useAppContext } from '../context/useAppContext';
import { FREQUENCY_LABELS } from '../utils/recurring';
import { formatDate } from '../utils/helpers';

const fmt = (n) => Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export const Recurring = () => {
  const { recurringRules, updateRecurringRule, deleteRecurringRule, fetchData, family, isLoading } = useAppContext();
  const [showAdd,      setShowAdd]      = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const memberName = (id) => {
    const m = family.find((f) => f.id === id);
    return m ? (m.user_name || m.name) : '';
  };

  const handleToggle = async (rule) => {
    const ok = await updateRecurringRule(rule.id, { isActive: !rule.is_active });
    if (ok) fetchData();
  };

  const askDelete = (rule) => setConfirmState({
    title:        'Delete recurring rule?',
    message:      `"${rule.title}" will stop creating transactions. Transactions already created are kept.`,
    confirmLabel: 'Delete',
    onConfirm:    () => deleteRecurringRule(rule.id),
  });

  return (
    <div className="space-y-5 animate-fade-up">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Recurring</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Set it once — transactions are added automatically</p>
        </div>
        <Button variant="primary" className="gap-2 shrink-0" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add rule
        </Button>
      </header>

      {!isLoading && recurringRules.length === 0 && (
        <Card glass>
          <CardContent className="p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Repeat size={24} className="text-primary" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-semibold">No recurring rules yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Add rent, subscriptions or salary once and stop re-entering them.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {recurringRules.map((rule) => (
          <Card key={rule.id} glass>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{rule.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {FREQUENCY_LABELS[rule.frequency]} · {rule.category}
                  {memberName(rule.member_id) && ` · ${memberName(rule.member_id)}`}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {rule.is_active ? `Next: ${formatDate(rule.next_due)}` : 'Paused'}
                  {rule.end_date && ` · ends ${formatDate(rule.end_date)}`}
                </p>
              </div>
              <p className={`font-bold shrink-0 ${rule.amount < 0 ? 'text-red-500' : 'text-secondary'}`}>
                {rule.amount < 0 ? '−' : '+'}₹{fmt(rule.amount)}
              </p>
              <Toggle checked={Boolean(rule.is_active)} onChange={() => handleToggle(rule)} aria-label={`Toggle ${rule.title}`} />
              <button type="button" aria-label={`Edit ${rule.title}`} onClick={() => setEditing(rule)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all">
                <Pencil size={15} />
              </button>
              <button type="button" aria-label={`Delete ${rule.title}`} onClick={() => askDelete(rule)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                <Trash2 size={15} />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddExpenseModal isOpen={showAdd} onClose={() => setShowAdd(false)} ruleMode />
      <EditRuleModal rule={editing} onClose={() => setEditing(null)} />
      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
};
