import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
  UserPlus, Plus, Users, User, Mail, ArrowUpRight,
  ArrowDownRight, ChevronRight, Crown, Shield, LogOut, UserMinus, Pencil,
} from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { CATEGORY_COLORS, formatDate } from '../utils/helpers';

const roleIcon = (role) => {
  if (role === 'Owner') return <Crown size={12} className="text-amber-400" />;
  if (role === 'Admin') return <Shield size={12} className="text-primary" />;
  return null;
};

const roleBadge = (role) =>
  role === 'Owner'
    ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400'
    : role === 'Admin'
    ? 'bg-primary/10 text-primary'
    : 'bg-slate-100 dark:bg-white/[0.07] text-slate-500 dark:text-slate-400';

export const Family = () => {
  const {
    family, addFamilyMember, removeFamilyMember, leaveGroup, renameGroup,
    transactions, isLoading, groups, activeGroupId, setActiveGroupId,
    createGroup, isAdmin, user, currentMembership,
  } = useAppContext();

  const [showInvite,       setShowInvite]       = useState(false);
  const [showCreateGroup,  setShowCreateGroup]  = useState(false);
  const [showRename,       setShowRename]       = useState(false);
  const [renameValue,      setRenameValue]      = useState('');
  const [renaming,         setRenaming]         = useState(false);
  const [selectedMember,   setSelectedMember]   = useState(null);
  const [inviteForm,       setInviteForm]       = useState({ name: '', email: '', role: 'Member', limit: '' });
  const [newGroupName,     setNewGroupName]     = useState('');
  const [inviteError,      setInviteError]      = useState('');

  const displayName = (m) => m.user_name || m.name;

  // Can the current user remove this member?
  const canRemove = (member) => {
    if (!isAdmin) return false;
    if (member.role === 'Owner') return false;
    if (member.user_id === user?.id) return false; // can't remove yourself via this button
    if (currentMembership?.role === 'Admin' && member.role === 'Admin') return false;
    return true;
  };

  const isOwner = currentMembership?.role === 'Owner';

  // Compute per-member financial stats
  const memberStats = useMemo(() => {
    const stats = {};
    family.forEach((m) => {
      const txns   = transactions.filter((t) => t.member_id === m.id);
      const spent  = txns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      const income = txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const cats   = {};
      txns.filter((t) => t.amount < 0).forEach((t) => {
        cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount);
      });
      stats[m.id] = {
        spent, income,
        balance:    income - spent,
        txns,
        categories: Object.entries(cats).sort((a, b) => b[1] - a[1]),
        txnCount:   txns.length,
      };
    });
    return stats;
  }, [family, transactions]);

  const handleInvite = (e) => {
    e.preventDefault();
    setInviteError('');
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      setInviteError('Name and email are required');
      return;
    }
    addFamilyMember({
      name:  inviteForm.name.trim(),
      email: inviteForm.email.trim(),
      role:  inviteForm.role,
      limit: inviteForm.limit ? parseFloat(inviteForm.limit) : null,
    });
    setInviteForm({ name: '', email: '', role: 'Member', limit: '' });
    setInviteError('');
    setShowInvite(false);
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    createGroup(newGroupName.trim());
    setNewGroupName('');
    setShowCreateGroup(false);
  };

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Remove ${displayName(member)} from this group? Their transactions will remain.`)) return;
    const ok = await removeFamilyMember(member.id);
    if (ok) setSelectedMember(null);
  };

  const openRename = () => {
    const current = groups.find((g) => g.id === activeGroupId);
    setRenameValue(current?.name || '');
    setShowRename(true);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!renameValue.trim()) return;
    setRenaming(true);
    const ok = await renameGroup(activeGroupId, renameValue.trim());
    setRenaming(false);
    if (ok) setShowRename(false);
  };

  const handleLeaveGroup = async () => {
    const groupName = groups.find((g) => g.id === activeGroupId)?.name || 'this group';
    const msg = isOwner
      ? `Delete "${groupName}"? This will permanently delete the group, all its members, transactions, and budgets. This cannot be undone.`
      : `Leave "${groupName}"? You will lose access to all shared transactions.`;
    if (!window.confirm(msg)) return;
    await leaveGroup(activeGroupId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-1/3 skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-56 skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Family</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage groups and track member spending.</p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          {activeGroupId && (
            <Button variant="ghost" className="gap-2 text-red-400 hover:bg-red-500/10" onClick={handleLeaveGroup}>
              <LogOut size={15} /> {isOwner ? 'Delete Group' : 'Leave Group'}
            </Button>
          )}
          <Button variant="glass" className="gap-2" onClick={() => setShowCreateGroup(true)}>
            <Plus size={16} /> New Group
          </Button>
          {isAdmin && (
            <Button variant="primary" className="gap-2" onClick={() => setShowInvite(true)}>
              <UserPlus size={16} /> Invite
            </Button>
          )}
        </div>
      </header>

      {/* Group selector */}
      {groups.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white/50 dark:bg-white/[0.04] p-1.5 rounded-2xl border border-slate-200/60 dark:border-white/[0.07] backdrop-blur-xl">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">Group:</span>
            <div className="flex gap-1 flex-wrap">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setActiveGroupId(g.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeGroupId === g.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.07]'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
          {/* Rename button — only admins/owners of the active group */}
          {isAdmin && activeGroupId && (
            <button
              onClick={openRename}
              title="Rename group"
              className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 border border-slate-200/60 dark:border-white/[0.07] bg-white/50 dark:bg-white/[0.04] backdrop-blur-xl transition-all"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && (
        <Card glass className="py-20 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
            <Users size={36} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create your first group</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm">
            Create a family to manage expenses together with your household or team.
          </p>
          <Button variant="primary" className="h-11 px-8 mt-2" onClick={() => setShowCreateGroup(true)}>
            Create My First Group
          </Button>
        </Card>
      )}

      {/* Member cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {family.map((member) => {
          const stats    = memberStats[member.id] || { spent: 0, income: 0, categories: [], txnCount: 0 };
          const progress = member.spend_limit ? Math.min((stats.spent / member.spend_limit) * 100, 100) : 0;

          return (
            <Card
              key={member.id}
              glass interactive
              className="cursor-pointer neon-hover"
              onClick={() => setSelectedMember(member)}
            >
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold border-2 ${
                      member.role === 'Owner'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-100 dark:bg-white/[0.07] border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300'
                    }`}>
                      {displayName(member)?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{displayName(member)}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${roleBadge(member.role)}`}>
                        {roleIcon(member.role)} {member.role}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div className="rounded-xl bg-slate-50 dark:bg-white/[0.04] p-2.5 border border-slate-100 dark:border-white/[0.05]">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Spent</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">₹{stats.spent.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-white/[0.04] p-2.5 border border-slate-100 dark:border-white/[0.05]">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Income</p>
                    <p className="text-base font-bold text-secondary mt-0.5">₹{stats.income.toLocaleString()}</p>
                  </div>
                </div>

                {/* Budget progress */}
                {member.spend_limit && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span className="text-slate-400">₹{stats.spent.toFixed(0)} / ₹{member.spend_limit}</span>
                      <span className={`font-bold ${progress > 80 ? 'text-red-400' : 'text-secondary'}`}>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/70 dark:bg-white/[0.07] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${progress > 80 ? 'bg-red-500' : 'bg-secondary'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Category tags */}
                {stats.categories.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {stats.categories.slice(0, 3).map(([cat]) => (
                      <span
                        key={cat}
                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium"
                        style={{ backgroundColor: `${CATEGORY_COLORS[cat] || '#6366F1'}18`, color: CATEGORY_COLORS[cat] || '#6366F1' }}
                      >
                        {cat}
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-400 px-1">{stats.txnCount} txns</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Member detail modal */}
      <Modal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title={selectedMember ? `${displayName(selectedMember)}'s Activity` : ''}
      >
        {selectedMember && (() => {
          const stats = memberStats[selectedMember.id] || { spent: 0, income: 0, balance: 0, txns: [], categories: [] };
          return (
            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Spent',   value: `₹${stats.spent.toLocaleString()}`,   cls: 'text-red-400'  },
                  { label: 'Income',  value: `₹${stats.income.toLocaleString()}`,  cls: 'text-secondary' },
                  { label: 'Balance', value: `₹${Math.abs(stats.balance).toLocaleString()}`, cls: stats.balance >= 0 ? 'text-secondary' : 'text-red-400' },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-100 dark:border-white/[0.07]">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</p>
                    <p className={`text-lg font-bold mt-0.5 ${s.cls}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {stats.categories.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">By Category</h4>
                  <div className="space-y-2">
                    {stats.categories.map(([cat, amt]) => {
                      const pct = stats.spent > 0 ? (amt / stats.spent) * 100 : 0;
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#6366F1' }} />
                          <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">{cat}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">₹{amt.toFixed(2)}</span>
                          <span className="text-xs text-slate-400 w-9 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Recent Transactions</h4>
                {stats.txns.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No transactions yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {stats.txns.slice(0, 10).map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${txn.amount > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-slate-100 dark:bg-white/[0.07]'}`}>
                            {txn.amount > 0
                              ? <ArrowUpRight size={13} className="text-secondary" />
                              : <ArrowDownRight size={13} className="text-slate-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{txn.title}</p>
                            <p className="text-[11px] text-slate-400">{txn.category} · {formatDate(txn.date)}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold tabular-nums ${txn.amount > 0 ? 'text-secondary' : 'text-slate-900 dark:text-white'}`}>
                          {txn.amount > 0 ? '+' : '−'}₹{Math.abs(txn.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remove member action */}
              {canRemove(selectedMember) && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-red-400 hover:bg-red-500/10 justify-center"
                    onClick={() => handleRemoveMember(selectedMember)}
                  >
                    <UserMinus size={15} /> Remove from Group
                  </Button>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Invite Modal */}
      <Modal isOpen={showInvite} onClose={() => { setShowInvite(false); setInviteError(''); }} title="Invite Member">
        <form onSubmit={handleInvite} className="space-y-4">
          {inviteError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{inviteError}</div>
          )}
          <p className="text-xs text-slate-400">
            Add them by name and email. If they sign up with the same email, they'll be linked automatically.
          </p>
          <Input label="Name" icon={User}  placeholder="Jane Doe" required value={inviteForm.name}  onChange={(e) => setInviteForm({ ...inviteForm, name:  e.target.value })} />
          <Input label="Email" icon={Mail} type="email" placeholder="jane@example.com" required value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 block mb-1.5">Role</label>
            <select
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Member">Member — can add their own transactions</option>
              <option value="Admin">Admin — can see all transactions &amp; invite others</option>
            </select>
          </div>
          <Input label="Monthly Spend Limit (₹)" type="number" placeholder="Leave blank for no limit" value={inviteForm.limit} onChange={(e) => setInviteForm({ ...inviteForm, limit: e.target.value })} />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add Member</Button>
          </div>
        </form>
      </Modal>

      {/* Rename Group Modal */}
      <Modal isOpen={showRename} onClose={() => setShowRename(false)} title="Rename Group">
        <form onSubmit={handleRename} className="space-y-4">
          <Input
            label="New Group Name"
            icon={Pencil}
            placeholder="e.g. The Smith Family"
            required
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setShowRename(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={renaming || !renameValue.trim()}>
              {renaming ? 'Saving…' : 'Rename'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Group Modal */}
      <Modal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} title="Create New Group">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <Input label="Group Name" icon={Users} placeholder="The Smith Family" required value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
          <p className="text-xs text-slate-400">You will automatically become the Owner of this group.</p>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setShowCreateGroup(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Group</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
