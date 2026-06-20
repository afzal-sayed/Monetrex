import React, { createContext, useEffect, useCallback, useMemo } from 'react';
import { computeMonthlyData } from '../utils/helpers';
import { apiFetch, fetchCsrfToken, GROUP_KEY, TOKEN_KEY } from '../utils/api';
import { useUISlice }   from './slices/useUISlice';
import { useAuthSlice } from './slices/useAuthSlice';
import { useDataSlice } from './slices/useDataSlice';

// Exported so useAppContext.js can read it without importing the whole provider
// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const ui   = useUISlice();
  const auth = useAuthSlice({ showToast: ui.showToast, setIsLoading: ui.setIsLoading });
  const data = useDataSlice({ showToast: ui.showToast });

  // Pre-fetch CSRF token on mount so the first mutation has it ready
  useEffect(() => { fetchCsrfToken(); }, []);

  const { showToast, setIsLoading, theme, toggleTheme, toasts, isLoading } = ui;
  const { user, setUser, authReady, login, signup, updateUser, changePassword } = auth;
  const {
    transactions, setTransactions, family, setFamily,
    groups, setGroups, budgets, setBudgets,
    activeGroupId, setActiveGroupId, clearAll,
    customCategories, setCustomCategories,
    addTransaction, updateTransaction, deleteTransaction, deleteTransactions,
    createGroup, switchGroup, renameGroup, leaveGroup: leaveGroupRaw,
    addFamilyMember, removeFamilyMember, updateBudgets,
    addCustomCategory, deleteCustomCategory,
  } = data;

  // ── Fetch all app data ────────────────────────────────────────────────────
  const fetchData = useCallback(async (months = 12) => {
    setIsLoading(true);
    try {
      const param = months >= 999 ? '' : `?months=${months}`;
      const res = await apiFetch(`/data${param}`);
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem(GROUP_KEY);
          setUser(null);
          clearAll();
          return;
        }
        return;
      }
      const d = await res.json();
      setGroups(d.groups || []);
      setFamily(d.memberships || []);
      setTransactions(d.transactions || []);

      const budgetMap = {};
      (d.budgets || []).forEach((b) => {
        if (!budgetMap[b.group_id]) budgetMap[b.group_id] = {};
        const mKey = b.month || 'default';
        if (!budgetMap[b.group_id][mKey]) budgetMap[b.group_id][mKey] = {};
        budgetMap[b.group_id][mKey][b.category] = b.amount;
      });
      setBudgets(budgetMap);
      setCustomCategories(d.customCategories || []);
    } catch (e) {
      if (import.meta.env.DEV) console.error('fetchData error:', e);
      showToast('Failed to load data. Is the server running?', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, setIsLoading, setUser, setGroups, setFamily, setTransactions, setBudgets, setCustomCategories, clearAll]);

  useEffect(() => {
    if (authReady && user) fetchData();
    else if (authReady && !user) setIsLoading(false);
  }, [authReady, user, fetchData, setIsLoading]);

  // ── Auto-set valid active group ──────────────────────────────────────────
  const userGroups = useMemo(
    () => groups.filter((g) => family.some((m) => m.group_id === g.id)),
    [groups, family]
  );

  useEffect(() => {
    if (userGroups.length > 0) {
      const isValid = userGroups.some((g) => g.id === activeGroupId);
      if (!activeGroupId || !isValid) setActiveGroupId(userGroups[0].id);
    } else if (!isLoading) {
      setActiveGroupId(null);
    }
  }, [userGroups, activeGroupId, isLoading, setActiveGroupId]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const activeGroupMembers = useMemo(
    () => family.filter((m) => m.group_id === activeGroupId),
    [family, activeGroupId]
  );

  const currentMembership = useMemo(() => {
    if (!user || !activeGroupId) return null;
    return activeGroupMembers.find(
      (m) => m.user_id === user.id || m.email === user.email
    );
  }, [user, activeGroupId, activeGroupMembers]);

  const isAdmin     = currentMembership?.role === 'Owner' || currentMembership?.role === 'Admin';
  const roleInGroup = currentMembership?.role || 'None';

  const visibleTransactions = useMemo(() => {
    if (!user || !activeGroupId) return [];
    const groupTxns = transactions.filter((t) => t.group_id === activeGroupId);
    if (isAdmin) return groupTxns;
    return groupTxns.filter((t) => t.member_id === currentMembership?.id);
  }, [transactions, user, activeGroupId, isAdmin, currentMembership]);

  // Budgets: current month → fallback to 'default'
  const currentMonth = new Date().toISOString().slice(0, 7);
  const activeBudgets = useMemo(() => {
    const groupBudgets = budgets[activeGroupId] || {};
    return groupBudgets[currentMonth] || groupBudgets['default'] || {};
  }, [budgets, activeGroupId, currentMonth]);

  const monthlyData = useMemo(
    () => computeMonthlyData(visibleTransactions),
    [visibleTransactions]
  );

  // ── Cross-cutting auth actions ─────────────────────────────────────────
  const logout = useCallback(async () => {
    // Ask the server to revoke the JTI and clear the HttpOnly cookie
    try { await apiFetch('/auth/logout', { method: 'POST' }); } catch { /* ignore network errors */ }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(GROUP_KEY);
    setUser(null);
    clearAll();
    showToast('Logged out successfully', 'info');
  }, [setUser, clearAll, showToast]);

  const deleteAccount = useCallback(async () => {
    try {
      const res = await apiFetch('/me', { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error || 'Failed to delete account', 'error');
        return false;
      }
      await logout();
      return true;
    } catch {
      showToast('Failed to delete account', 'error');
      return false;
    }
  }, [logout, showToast]);

  const leaveGroup = useCallback(
    (groupId) => leaveGroupRaw(groupId, user?.id),
    [leaveGroupRaw, user?.id]
  );

  return (
    <AppContext.Provider value={{
      // Auth
      user, authReady, login, signup, logout, updateUser, changePassword, deleteAccount,

      // Theme
      theme, toggleTheme,

      // Role
      isAdmin, roleInGroup, currentMembership,

      // Groups
      groups: userGroups, activeGroupId,
      setActiveGroupId: switchGroup, createGroup, renameGroup,

      // Family
      family: activeGroupMembers, addFamilyMember, removeFamilyMember, leaveGroup,

      // Transactions
      transactions:      visibleTransactions,
      allTransactions:   transactions,
      addTransaction:    (t) => addTransaction({ ...t, groupId: activeGroupId }),
      updateTransaction, deleteTransaction, deleteTransactions,

      // Budgets
      budgets: activeBudgets, updateBudgets,
      budgetsRaw: budgets,
      currentMonth,

      // Chart data
      monthlyData,

      // Custom categories
      customCategories, addCustomCategory, deleteCustomCategory,

      // Loading / Toast
      isLoading, toasts, showToast,
      fetchData,
    }}>
      {children}
    </AppContext.Provider>
  );
};
