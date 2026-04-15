import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Toggle } from '../components/ui/Toggle';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAppContext } from '../context/useAppContext';
import { Sun, Moon, Lock, Target, IndianRupee, Loader2 } from 'lucide-react';
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
    if (form.newPass.length < 6) { setError('New password must be at least 6 characters'); return; }
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Current Password" icon={Lock} type="password"
          value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })}
          placeholder="••••••••" required
        />
        <Input
          label="New Password" icon={Lock} type="password"
          value={form.newPass} onChange={(e) => setForm({ ...form, newPass: e.target.value })}
          placeholder="••••••••" minLength={6} required
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
  const { budgets, updateBudgets, isAdmin, activeGroupId } = useAppContext();
  const [localBudgets, setLocalBudgets] = useState(() => {
    const init = {};
    CATEGORIES.forEach((c) => { init[c] = budgets[c] ? String(budgets[c]) : ''; });
    return init;
  });
  const [saving, setSaving] = useState(false);

  // Sync if budgets change externally
  React.useEffect(() => {
    const init = {};
    CATEGORIES.forEach((c) => { init[c] = budgets[c] ? String(budgets[c]) : ''; });
    setLocalBudgets(init);
  }, [budgets]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {};
    CATEGORIES.forEach((c) => {
      const v = parseFloat(localBudgets[c]);
      payload[c] = isNaN(v) ? 0 : v;
    });
    await updateBudgets(payload);
    setSaving(false);
  };

  if (!activeGroupId) {
    return <p className="text-sm text-slate-400">No active group found. Try refreshing the page.</p>;
  }
  if (!isAdmin) {
    return <p className="text-sm text-slate-400">Only admins and owners can manage budget goals.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Set monthly spending limits per category. Leave blank for no limit.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[cat] }}
              />
              {cat}
            </label>
            <Input
              icon={IndianRupee}
              type="number"
              min="0"
              step="10"
              placeholder="No limit"
              value={localBudgets[cat]}
              onChange={(e) => setLocalBudgets((b) => ({ ...b, [cat]: e.target.value }))}
            />
          </div>
        ))}
      </div>
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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account? All your data will be lost and this cannot be undone.'
    );
    if (!confirmed) return;
    const ok = await deleteAccount();
    if (!ok) showToast('Failed to delete account', 'error');
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

          <div className="border-t border-slate-200/60 dark:border-white/[0.06] pt-6 flex items-center justify-between">
            <div>
              <p className="text-slate-900 dark:text-white font-semibold text-sm">Push Notifications</p>
              <p className="text-xs text-slate-400">Alerts when expenses hit thresholds.</p>
            </div>
            <Toggle checked={notifications} onChange={setNotifications} />
          </div>

          <div className="border-t border-slate-200/60 dark:border-white/[0.06] pt-6 flex items-center justify-between">
            <div>
              <p className="text-slate-900 dark:text-white font-semibold text-sm">Weekly Report</p>
              <p className="text-xs text-slate-400">Weekly email summary of spending.</p>
            </div>
            <Toggle checked={weeklyReport} onChange={setWeeklyReport} />
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
    </div>
  );
};
