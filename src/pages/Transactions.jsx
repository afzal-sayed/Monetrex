import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Search, Download, Trash2, Edit2, Plus, FileSpreadsheet,
  FileJson, ArrowUpDown, ArrowUp, ArrowDown, Repeat,
} from 'lucide-react';
import { useAppContext } from '../context/useAppContext';
import { AddExpenseModal } from '../components/features/AddExpenseModal';
import { exportToCSV, exportToJSON } from '../utils/export';
import { formatDate, CATEGORY_COLORS } from '../utils/helpers';

const SortIcon = ({ field, sortBy, dir }) => {
  if (sortBy !== field) return <ArrowUpDown size={13} className="text-slate-400" />;
  return dir === 'asc'
    ? <ArrowUp size={13} className="text-primary" />
    : <ArrowDown size={13} className="text-primary" />;
};

export const Transactions = () => {
  const { transactions, family, isLoading, deleteTransaction, showToast, isAdmin } = useAppContext();

  const [searchTerm,    setSearchTerm]    = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [memberFilter,   setMemberFilter]   = useState('All');
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [showExport,     setShowExport]     = useState(false);
  const [editingTxn,     setEditingTxn]     = useState(null);
  const [sortBy,         setSortBy]         = useState('date');
  const [sortDir,        setSortDir]        = useState('desc');
  const [page,           setPage]           = useState(1);
  const PER_PAGE = 20;

  const exportRef = useRef(null);

  // Close export dropdown on outside click
  useEffect(() => {
    if (!showExport) return;
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExport]);

  // Reset page on filter change (deferred to avoid setState-in-render warning)
  const prevFilters = React.useRef({ searchTerm, categoryFilter, memberFilter, sortBy, sortDir });
  React.useLayoutEffect(() => {
    const prev = prevFilters.current;
    if (
      prev.searchTerm !== searchTerm || prev.categoryFilter !== categoryFilter ||
      prev.memberFilter !== memberFilter || prev.sortBy !== sortBy || prev.sortDir !== sortDir
    ) {
      prevFilters.current = { searchTerm, categoryFilter, memberFilter, sortBy, sortDir };
      setPage(1);
    }
  }, [searchTerm, categoryFilter, memberFilter, sortBy, sortDir]);

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
        const matchSearch = t.title.toLowerCase().includes(term) || t.note?.toLowerCase().includes(term);
        const matchCat    = categoryFilter === 'All' || t.category === categoryFilter;
        const matchMem    = memberFilter   === 'All' || t.member_id === memberFilter;
        return matchSearch && matchCat && matchMem;
      })
      .sort((a, b) => {
        let va = a[sortBy], vb = b[sortBy];
        if (sortBy === 'amount') { va = Math.abs(a.amount); vb = Math.abs(b.amount); }
        if (sortBy === 'date')   { va = a.date || ''; vb = b.date || ''; }
        if (va < vb) return sortDir === 'asc' ? -1 :  1;
        if (va > vb) return sortDir === 'asc' ?  1 : -1;
        return 0;
      });
  }, [transactions, searchTerm, categoryFilter, memberFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const netTotal = filtered.reduce((s, t) => s + t.amount, 0);

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
    if (window.confirm(`Delete "${txn.title}"? This cannot be undone.`)) {
      deleteTransaction(txn.id);
    }
  };

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
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">View and manage all financial activity</p>
        </div>
        <div className="flex gap-2.5">
          <div className="relative" ref={exportRef}>
            <Button variant="glass" className="gap-2" onClick={() => setShowExport((v) => !v)}>
              <Download size={15} /> Export
            </Button>
            {showExport && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200/60 dark:border-white/10 shadow-2xl z-50 animate-fade-up overflow-hidden">
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
            <Plus size={15} /> New
          </Button>
        </div>
      </header>

      <Card glass>
        {/* Filters */}
        <div className="p-4 border-b border-slate-200/60 dark:border-white/[0.06] space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                icon={Search}
                placeholder="Search by title or note…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
          </div>
          {/* Category chips */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'text-white shadow-md'
                    : 'bg-slate-100 dark:bg-white/[0.07] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.12]'
                }`}
                style={categoryFilter === cat && cat !== 'All'
                  ? { backgroundColor: CATEGORY_COLORS[cat] || '#4F46E5' }
                  : categoryFilter === cat ? { backgroundColor: '#4F46E5' }
                  : {}
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-white/[0.06] text-[11px] text-slate-400 uppercase tracking-wider">
                  {[
                    { key: 'title',  label: 'Transaction' },
                    { key: 'category', label: 'Category'  },
                    { key: 'date',   label: 'Date'         },
                    { key: 'member', label: 'Member', noSort: true },
                    { key: 'amount', label: 'Amount', right: true  },
                  ].map(({ key, label, noSort, right }) => (
                    <th
                      key={key}
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
                        : 'No transactions yet. Click "+ New" to add one.'}
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
                              {txn.amount > 0 ? '💰' : { Food: '🍔', Transport: '🚗', Housing: '🏠', Entertainment: '🎬', General: '📦' }[txn.category] || '💳'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white text-sm">{txn.title}</p>
                              {txn.note && <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{txn.note}</p>}
                            </div>
                            {txn.is_recurring === 1 && (
                              <Repeat size={12} className="text-primary shrink-0" title="Recurring" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all mr-1"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(txn)}
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

          {/* Footer: count + net + pagination */}
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
    </div>
  );
};
