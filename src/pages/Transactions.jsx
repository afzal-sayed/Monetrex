import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  Search, Download, Trash2, Edit2, Plus, FileSpreadsheet,
  FileJson, ArrowUpDown, ArrowUp, ArrowDown, Repeat, Filter, CalendarDays,
} from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { AddExpenseModal } from '../components/features/AddExpenseModal';
import { exportToCSV, exportToJSON } from '../utils/export';
import { formatDate, CATEGORY_COLORS, CATEGORY_EMOJI } from '../utils/helpers';

const SortIcon = ({ field, sortBy, dir }) => {
  if (sortBy !== field) return <ArrowUpDown size={13} className="text-slate-400" />;
  return dir === 'asc'
    ? <ArrowUp size={13} className="text-primary" />
    : <ArrowDown size={13} className="text-primary" />;
};

export const Transactions = () => {
  const { transactions, family, isLoading, deleteTransaction, showToast, isAdmin } = useAppContext();

  const [searchTerm,     setSearchTerm]     = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [memberFilter,   setMemberFilter]   = useState('All');
  const [recurringOnly,  setRecurringOnly]  = useState(false);
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [showExport,     setShowExport]     = useState(false);
  const [showFilters,    setShowFilters]    = useState(false);
  const [editingTxn,     setEditingTxn]     = useState(null);
  const [sortBy,         setSortBy]         = useState('date');
  const [sortDir,        setSortDir]        = useState('desc');
  const [page,           setPage]           = useState(1);
  const [confirmState,   setConfirmState]   = useState(null);
  const PER_PAGE = 20;

  const exportRef = useRef(null);

  useEffect(() => {
    if (!showExport) return;
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExport]);

  const prevFilters = React.useRef({ searchTerm, categoryFilter, memberFilter, recurringOnly, dateFrom, dateTo, sortBy, sortDir });
  React.useLayoutEffect(() => {
    const prev = prevFilters.current;
    if (
      prev.searchTerm !== searchTerm || prev.categoryFilter !== categoryFilter ||
      prev.memberFilter !== memberFilter || prev.recurringOnly !== recurringOnly ||
      prev.dateFrom !== dateFrom || prev.dateTo !== dateTo ||
      prev.sortBy !== sortBy || prev.sortDir !== sortDir
    ) {
      prevFilters.current = { searchTerm, categoryFilter, memberFilter, recurringOnly, dateFrom, dateTo, sortBy, sortDir };
      setPage(1);
    }
  }, [searchTerm, categoryFilter, memberFilter, recurringOnly, dateFrom, dateTo, sortBy, sortDir]);

  const categories = useMemo(
    () => ['All', ...new Set(transactions.map((t) => t.category))],
    [transactions]
  );

  const handleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return transactions
      .filter((t) => {
        const matchSearch    = t.title.toLowerCase().includes(term) || t.note?.toLowerCase().includes(term);
        const matchCat       = categoryFilter === 'All' || t.category === categoryFilter;
        const matchMem       = memberFilter   === 'All' || t.member_id === memberFilter;
        const matchRecurring = !recurringOnly || t.is_recurring === 1;
        const matchFrom      = !dateFrom || t.date >= dateFrom;
        const matchTo        = !dateTo   || t.date <= dateTo;
        return matchSearch && matchCat && matchMem && matchRecurring && matchFrom && matchTo;
      })
      .sort((a, b) => {
        let va = a[sortBy], vb = b[sortBy];
        if (sortBy === 'amount') { va = Math.abs(a.amount); vb = Math.abs(b.amount); }
        if (sortBy === 'date')   { va = a.date || ''; vb = b.date || ''; }
        if (va < vb) return sortDir === 'asc' ? -1 :  1;
        if (va > vb) return sortDir === 'asc' ?  1 : -1;
        return 0;
      });
  }, [transactions, searchTerm, categoryFilter, memberFilter, recurringOnly, dateFrom, dateTo, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const netTotal   = filtered.reduce((s, t) => s + t.amount, 0);

  const handleExport = (type) => {
    if (filtered.length === 0) { showToast('No transactions to export', 'error'); return; }
    const data = filtered.map((t) => ({
      ...t,
      memberName: family.find((f) => f.id === t.member_id)?.name || 'Unknown',
    }));
    if (type === 'csv') {
      exportToCSV(data);
      showToast(`Exported ${filtered.length} transactions as CSV`);
    } else {
      exportToJSON(data);
      showToast(`Exported ${filtered.length} transactions as JSON`);
    }
    setShowExport(false);
  };

  const openEdit = (txn) => { setEditingTxn(txn); setIsModalOpen(true); };
  const openNew  = ()    => { setEditingTxn(null); setIsModalOpen(true); };

  const handleDelete = (txn) => {
    setConfirmState({
      title: 'Delete transaction?',
      message: `"${txn.title}" will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => deleteTransaction(txn.id),
    });
  };

  const activeFilterCount =
    (categoryFilter !== 'All' ? 1 : 0) +
    (memberFilter   !== 'All' ? 1 : 0) +
    (recurringOnly           ? 1 : 0) +
    (dateFrom || dateTo      ? 1 : 0);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-1/4 skeleton" />
        <div className="h-12 skeleton" />
        {[1,2,3,4,5].map((i) => <div key={i} className="h-14 skeleton" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">View and manage all financial activity</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="relative" ref={exportRef}>
            <Button variant="glass" className="gap-2" onClick={() => setShowExport((v) => !v)}>
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </Button>
            {showExport && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/60 dark:border-white/10 shadow-2xl z-50 animate-fade-up overflow-hidden">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors"
                >
                  <FileSpreadsheet size={15} className="text-secondary" /> CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors border-t border-slate-100 dark:border-white/[0.05]"
                >
                  <FileJson size={15} className="text-primary" /> JSON
                </button>
              </div>
            )}
          </div>
          <Button variant="primary" className="gap-2" onClick={openNew}>
            <Plus size={15} /> <span className="hidden sm:inline">New</span><span className="sm:hidden">Add</span>
          </Button>
        </div>
      </header>

      <Card glass>
        {/* ── Filters ── */}
        <div className="p-4 border-b border-slate-200/60 dark:border-white/[0.06] space-y-3">
          {/* Search row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                icon={Search}
                placeholder="Search transactions…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Mobile: collapsible filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`lg:hidden relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-slate-50 dark:bg-white/[0.05] border-slate-200/50 dark:border-white/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Filter size={15} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop: always-visible filters / Mobile: collapsible */}
          <div className={`space-y-3 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Top row: member filter + date range */}
            <div className="flex flex-wrap gap-2 items-center">
              {isAdmin && family.length > 0 && (
                <select
                  value={memberFilter}
                  onChange={(e) => setMemberFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm font-medium bg-slate-50 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-white/10 outline-none focus:border-primary transition-colors"
                >
                  <option value="All">All Members</option>
                  {family.map((m) => (
                    <option key={m.id} value={m.id}>{m.user_name || m.name}</option>
                  ))}
                </select>
              )}
              {/* Date range */}
              <div className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-white/10 outline-none focus:border-primary transition-colors"
                  title="From date"
                />
                <span className="text-slate-400 text-xs">–</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-white/10 outline-none focus:border-primary transition-colors"
                  title="To date"
                />
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                    className="text-xs text-slate-400 hover:text-red-400 transition-colors px-1"
                    title="Clear dates"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category + Recurring chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    categoryFilter === cat
                      ? 'text-white shadow-md'
                      : 'bg-slate-100 dark:bg-white/[0.07] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.12]'
                  }`}
                  style={
                    categoryFilter === cat && cat !== 'All'
                      ? { backgroundColor: CATEGORY_COLORS[cat] || '#4F46E5' }
                      : categoryFilter === cat
                      ? { backgroundColor: '#4F46E5' }
                      : {}
                  }
                >
                  {cat}
                </button>
              ))}
              {/* Recurring chip */}
              <button
                onClick={() => setRecurringOnly((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  recurringOnly
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-100 dark:bg-white/[0.07] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.12]'
                }`}
              >
                <Repeat size={11} /> Recurring
              </button>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {/* ── Desktop Table (md+) ── */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-white/[0.06] text-xs text-slate-400 uppercase tracking-wider">
                  {[
                    { key: 'title',    label: 'Transaction' },
                    { key: 'category', label: 'Category'    },
                    { key: 'date',     label: 'Date'        },
                    { key: 'member',   label: 'Member', noSort: true },
                    { key: 'amount',   label: 'Amount', right: true  },
                  ].map(({ key, label, noSort, right }) => (
                    <th
                      key={key}
                      aria-sort={noSort ? undefined : sortBy === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`p-4 font-semibold ${noSort ? '' : 'cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 transition-colors'} ${right ? 'text-right' : ''}`}
                      onClick={() => !noSort && handleSort(key)}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {label}
                        {!noSort && <SortIcon field={key} sortBy={sortBy} dir={sortDir} />}
                      </span>
                    </th>
                  ))}
                  <th className="p-4 w-20" />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 text-sm">
                      {searchTerm || categoryFilter !== 'All' || memberFilter !== 'All'
                        ? 'No matching transactions found.'
                        : 'No transactions yet. Click "Add" to create one.'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((txn, i) => {
                    const member = family.find((f) => f.id === txn.member_id);
                    return (
                      <tr
                        key={txn.id}
                        className="border-b border-slate-100/50 dark:border-white/[0.04] hover:bg-slate-50/60 dark:hover:bg-white/[0.025] transition-colors group"
                        style={{ animationDelay: `${i * 20}ms` }}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                              style={{ backgroundColor: `${CATEGORY_COLORS[txn.category] || '#6366F1'}18` }}
                            >
                              {txn.amount > 0 ? '💰' : CATEGORY_EMOJI[txn.category] || '💳'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white text-sm truncate max-w-[180px]">{txn.title}</p>
                              {txn.note && <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{txn.note}</p>}
                            </div>
                            {txn.is_recurring === 1 && (
                              <Repeat size={12} className="text-primary shrink-0" title="Recurring" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[txn.category] || '#6366F1'}18`,
                              color: CATEGORY_COLORS[txn.category] || '#6366F1',
                            }}
                          >
                            {txn.category}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(txn.date)}
                        </td>
                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                          {member?.user_name || member?.name || '—'}
                        </td>
                        <td className={`p-4 text-sm font-bold text-right tabular-nums ${txn.amount > 0 ? 'text-secondary' : 'text-slate-900 dark:text-white'}`}>
                          {txn.amount > 0 ? '+' : '−'}₹{Math.abs(txn.amount).toFixed(2)}
                        </td>
                        <td className="p-4 opacity-0 group-hover:opacity-100 transition-opacity text-right">
                          <button
                            onClick={() => openEdit(txn)}
                            aria-label={`Edit transaction: ${txn.title}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all mr-1"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(txn)}
                            aria-label={`Delete transaction: ${txn.title}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Card List (< md) ── */}
          <div className="lg:hidden divide-y divide-slate-100/60 dark:divide-white/[0.04]">
            {paginated.length === 0 ? (
              <p className="p-10 text-center text-slate-400 text-sm">
                {searchTerm || categoryFilter !== 'All' || memberFilter !== 'All'
                  ? 'No matching transactions found.'
                  : 'No transactions yet. Tap "Add" to create one.'}
              </p>
            ) : (
              paginated.map((txn) => {
                const member = family.find((f) => f.id === txn.member_id);
                return (
                  <div key={txn.id} className="flex items-center gap-3 px-4 py-3.5">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: `${CATEGORY_COLORS[txn.category] || '#6366F1'}18` }}
                    >
                      {txn.amount > 0 ? '💰' : CATEGORY_EMOJI[txn.category] || '💳'}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{txn.title}</p>
                        {txn.is_recurring === 1 && <Repeat size={11} className="text-primary shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[txn.category] || '#6366F1'}18`,
                            color: CATEGORY_COLORS[txn.category] || '#6366F1',
                          }}
                        >
                          {txn.category}
                        </span>
                        <span className="text-[11px] text-slate-400">{formatDate(txn.date)}</span>
                        {member && (
                          <span className="text-[11px] text-slate-400 truncate">· {member.user_name || member.name}</span>
                        )}
                      </div>
                      {txn.note && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{txn.note}</p>
                      )}
                    </div>

                    {/* Amount + actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-sm font-bold tabular-nums ${txn.amount > 0 ? 'text-secondary' : 'text-slate-900 dark:text-white'}`}>
                        {txn.amount > 0 ? '+' : '−'}₹{Math.abs(txn.amount).toFixed(2)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(txn)}
                          aria-label={`Edit transaction: ${txn.title}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 active:bg-blue-50 dark:active:bg-blue-500/10 transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(txn)}
                          aria-label={`Delete transaction: ${txn.title}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 active:bg-red-50 dark:active:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Footer ── */}
          {filtered.length > 0 && (
            <div className="p-4 border-t border-slate-200/60 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</span>
                <span className={`text-sm font-bold tabular-nums ${netTotal >= 0 ? 'text-secondary' : 'text-red-400'}`}>
                  Net: {netTotal >= 0 ? '+' : '−'}₹{Math.abs(netTotal).toFixed(2)}
                </span>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-white/[0.12] transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-slate-400">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-white/[0.12] transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTxn(null); }}
        initialData={editingTxn}
      />
      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
};
