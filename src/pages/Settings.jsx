import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Toggle } from '../components/ui/Toggle';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useAppContext } from '../context/useAppContext';
import { Sun, Moon, Lock, Target, IndianRupee, Loader2, X, Plus } from 'lucide-react';
import { CATEGORIES, CATEGORY_COLORS } from '../utils/helpers';

// ─── Password Change Section ────────────────────────────────────────────────
const PasswordSection = () => {
  const { changePassword } = useAppContext();
  const [form,    setForm]    = useState({ current: '', newPass: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPass.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (form.newPass !== form.confirm) { setError('New passwords do not match'); return; }
    setLoading(true);
    const result = await changePassword(form.current, form.newPass);
    setLoading(false);
    if (result.success) {
      setForm({ current: '', newPass: '', confirm: '' });
    } else {
      setError(result.error || 'Failed to change password');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Current Password" icon={Lock} type="password"
          value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })}
          placeholder="••••••••" required
        />
        <Input
          label="New Password" icon={Lock} type="password"
          value={form.newPass} onChange={(e) => setForm({ ...form, newPass: e.target.value })}
          placeholder="••••••••" minLength={8} required
        />
        <Input
          label="Confirm New Password" icon={Lock} type="password"
          value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          placeholder="••••••••" required
        />
      </div>
      <Button type="submit" variant="secondary" disabled={loading} className="gap-2">
        {loading ? <><Loader2 size={15} className="animate-spin" /> Changing…</> : 'Change Password'}
      </Button>
    </form>
  );
};

// ─── Budget Goals Section ───────────────────────────────────────────────────
const BudgetSection = () => {
  const { budgets, updateBudgets, isAdmin, activeGroupId, currentMonth } = useAppContext();

  // rows = [{ cat, amt }] — only categories that have a budget
  const [rows,   setRows]   = useState(() =>
    Object.entries(budgets).filter(([, v]) => v > 0).map(([cat, amt]) => ({ cat, amt: String(amt) }))
  );
  const [addCat, setAddCat] = useState('');
  const [addAmt, setAddAmt] = useState('');
  const [saving, setSaving] = useState(false);

  // Re-init rows only when the active group or month changes (not on background budget re-fetches),
  // so in-progress edits are not wiped by background data syncs.
  const budgetKey    = `${activeGroupId}-${currentMonth}`;
  const budgetKeyRef = React.useRef(budgetKey);
  React.useEffect(() => {
    if (budgetKeyRef.current !== budgetKey) {
      budgetKeyRef.current = budgetKey;
      setRows(Object.entries(budgets).filter(([, v]) => v > 0).map(([cat, amt]) => ({ cat, amt: String(amt) })));
    }
  }, [budgetKey, budgets]);

  const usedCats   = new Set(rows.map((r) => r.cat));
  const availCats  = CATEGORIES.filter((c) => !usedCats.has(c));

  const removeRow  = (cat) => setRows((prev) => prev.filter((r) => r.cat !== cat));
  const updateAmt  = (cat, val) => setRows((prev) => prev.map((r) => r.cat === cat ? { ...r, amt: val } : r));

  const handleAdd  = () => {
    if (!addCat || !addAmt || parseFloat(addAmt) <= 0) return;
    setRows((prev) => [...prev, { cat: addCat, amt: addAmt }]);
    setAddCat(''); setAddAmt('');
  };

  const handleSave = async () => {
    setSaving(true);
    // Send full CATEGORIES payload — 0 for absent ones (backend deletes those)
    const payload = {};
    CATEGORIES.forEach((c) => {
      const found = rows.find((r) => r.cat === c);
      payload[c] = found ? (parseFloat(found.amt) || 0) : 0;
    });
    await updateBudgets(payload, currentMonth);
    setSaving(false);
  };

  if (!activeGroupId) return <p className="text-sm text-slate-400">No active group found. Try refreshing the page.</p>;
  if (!isAdmin)       return <p className="text-sm text-slate-400">Only admins and owners can manage budget goals.</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Monthly spending limits for <span className="font-semibold text-slate-700 dark:text-slate-300">{currentMonth}</span>. Categories without a limit are uncapped.
      </p>

      {/* Existing budget rows */}
      {rows.length > 0 ? (
        <div className="space-y-2.5">
          {rows.map(({ cat, amt }) => (
            <div key={cat} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-24 sm:w-36 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#6366F1' }} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{cat}</span>
              </div>
              <Input
                icon={IndianRupee} type="number" min="0" step="10"
                value={amt}
                onChange={(e) => updateAmt(cat, e.target.value)}
                className="flex-1"
              />
              <button
                onClick={() => removeRow(cat)}
                aria-label={`Remove ${cat} budget`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0"
                title="Remove budget"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 py-2">No budgets set for this month.</p>
      )}

      {/* Add new budget row */}
      {availCats.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
          <select
            value={addCat}
            onChange={(e) => setAddCat(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select category…</option>
            {availCats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Input
            icon={IndianRupee} type="number" min="0" step="10"
            placeholder="Amount"
            value={addAmt}
            onChange={(e) => setAddAmt(e.target.value)}
            className="w-full sm:w-32"
          />
          <Button variant="glass" onClick={handleAdd} className="gap-1.5 shrink-0">
            <Plus size={14} /> Add
          </Button>
        </div>
      )}

      <Button variant="primary" onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Budget Goals'}
      </Button>
    </div>
  );
};

// ─── Main Settings Page ─────────────────────────────────────────────────────
export const Settings = () => {
  const { theme, toggleTheme, user, updateUser, deleteAccount, showToast } = useAppContext();

  const [notifications, setNotifications] = useState(user?.notifications ?? true);
  const [weeklyReport,  setWeeklyReport]  = useState(user?.weekly_report  ?? false);
  const [isSaving,      setIsSaving]      = useState(false);
  const [confirmState,  setConfirmState]  = useState(null);

  const [formData, setFormData] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const ok = await updateUser({ ...formData, notifications, weeklyReport });
    if (!ok) showToast('Failed to save. Try again.', 'error');
    setIsSaving(false);
  };

  const handleDeleteAccount = () => {
    setConfirmState({
      title: 'Delete your account?',
      message: 'All your data — groups, transactions, budgets — will be permanently deleted. This cannot be undone.',
      confirmLabel: 'Delete Account',
      danger: true,
      onConfirm: async () => {
        const ok = await deleteAccount();
        if (!ok) showToast('Failed to delete account', 'error');
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-up">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your account and preferences.</p>
      </header>

      {/* Profile */}
      <Card glass>
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white text-xl">Profile Information</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <Button variant="primary" onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
            {isSaving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card glass>
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white text-xl">Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordSection />
        </CardContent>
      </Card>

      {/* Budget Goals */}
      <Card glass>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target size={18} className="text-primary" />
            <CardTitle className="text-slate-900 dark:text-white text-xl">Budget Goals</CardTitle>
          </div>
          <CardDescription>Set monthly spending limits per category.</CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetSection />
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card glass>
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white text-xl">Preferences</CardTitle>
          <CardDescription>Customize your experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                {theme === 'dark' ? <Moon size={17} className="text-primary" /> : <Sun size={17} className="text-primary" />}
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-semibold text-sm">Appearance</p>
                <p className="text-xs text-slate-400">Currently {theme} mode</p>
              </div>
            </div>
            <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
          </div>

          <div className="border-t border-slate-200/60 dark:border-white/[0.06] pt-6 flex items-center justify-between opacity-50">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-slate-900 dark:text-white font-semibold text-sm">Push Notifications</p>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">Coming soon</span>
              </div>
              <p className="text-xs text-slate-400">Alerts when expenses hit thresholds.</p>
            </div>
            <Toggle checked={notifications} onChange={setNotifications} disabled />
          </div>

          <div className="border-t border-slate-200/60 dark:border-white/[0.06] pt-6 flex items-center justify-between opacity-50">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-slate-900 dark:text-white font-semibold text-sm">Weekly Report</p>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">Coming soon</span>
              </div>
              <p className="text-xs text-slate-400">Weekly email summary of spending.</p>
            </div>
            <Toggle checked={weeklyReport} onChange={setWeeklyReport} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card glass className="border-red-200/40 dark:border-red-500/15">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-red-500 dark:text-red-400 font-semibold text-sm">Delete Account</p>
            <p className="text-xs text-slate-400 mt-0.5">Permanently delete your account and all data. Cannot be undone.</p>
          </div>
          <Button
            variant="ghost"
            onClick={handleDeleteAccount}
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0"
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
};
