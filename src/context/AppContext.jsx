import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { computeMonthlyData } from '../utils/helpers';

const API = 'http://localhost:3001/api';
const TOKEN_KEY = 'monetrex_token';
const GROUP_KEY  = 'monetrex_active_group';

const AppContext = createContext(null);

// ─── API client ─────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem(TOKEN_KEY);

const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return res;
};

// ─── Provider ───────────────────────────────────────────────────────────────
export const AppProvider = ({ children }) => {
  const [user,          setUser]          = useState(null);
  const [theme,         setTheme]         = useState(() => localStorage.getItem('theme') || 'dark');
  const [transactions,  setTransactions]  = useState([]);
  const [family,        setFamily]        = useState([]);   // all memberships across all groups
  const [groups,        setGroups]        = useState([]);
  const [budgets,       setBudgets]       = useState({});   // { category: amount } for activeGroup
  const [activeGroupId, setActiveGroupId] = useState(() => localStorage.getItem(GROUP_KEY) || null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [toast,         setToast]         = useState(null);
  const [authReady,     setAuthReady]     = useState(false);

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Theme ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // ── Persist active group ─────────────────────────────────────────────────
  useEffect(() => {
    if (activeGroupId) localStorage.setItem(GROUP_KEY, activeGroupId);
    else               localStorage.removeItem(GROUP_KEY);
  }, [activeGroupId]);

  // ── Derived state ────────────────────────────────────────────────────────
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

  const userGroups = useMemo(
    () => groups.filter((g) => family.some((m) => m.group_id === g.id)),
    [groups, family]
  );

  const visibleTransactions = useMemo(() => {
    if (!user || !activeGroupId) return [];
    const groupTxns = transactions.filter((t) => t.group_id === activeGroupId);
    if (isAdmin) return groupTxns;
    return groupTxns.filter((t) => t.member_id === currentMembership?.id);
  }, [transactions, user, activeGroupId, isAdmin, currentMembership]);

  const activeBudgets = useMemo(
    () => budgets[activeGroupId] || {},
    [budgets, activeGroupId]
  );

  const monthlyData = useMemo(
    () => computeMonthlyData(visibleTransactions),
    [visibleTransactions]
  );

  // ── Auto-set valid active group ──────────────────────────────────────────
  useEffect(() => {
    if (userGroups.length > 0) {
      const isValid = userGroups.some((g) => g.id === activeGroupId);
      if (!activeGroupId || !isValid) setActiveGroupId(userGroups[0].id);
    } else if (!isLoading) {
      setActiveGroupId(null);
    }
  }, [userGroups, activeGroupId, isLoading]);

  // ── Initial auth check ───────────────────────────────────────────────────
  useEffect(() => {
    const validateToken = async () => {
      const token = getToken();
      if (!token) { setAuthReady(true); setIsLoading(false); return; }
      try {
        const res = await apiFetch('/me');
        if (res.ok) {
          const { user: u } = await res.json();
          setUser(u);
        } else {
          // Token invalid / expired
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        // Network error — don't log out, just wait
      } finally {
        setAuthReady(true);
      }
    };
    validateToken();
  }, []);

  // ── Fetch all app data ───────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!getToken()) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const res = await apiFetch('/data');
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
        }
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      setGroups(data.groups || []);
      setFamily(data.memberships || []);
      setTransactions(data.transactions || []);

      // Convert budgets array → nested map: { groupId: { category: amount } }
      const budgetMap = {};
      (data.budgets || []).forEach((b) => {
        if (!budgetMap[b.group_id]) budgetMap[b.group_id] = {};
        budgetMap[b.group_id][b.category] = b.amount;
      });
      setBudgets(budgetMap);
    } catch (e) {
      console.error('fetchData error:', e);
      showToast('Failed to load data. Is the server running?', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (authReady && user) fetchData();
    else if (authReady && !user) setIsLoading(false);
  }, [authReady, user, fetchData]);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Login failed' };
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name}!`);
      return { success: true };
    } catch {
      return { success: false, error: 'Cannot connect to server. Make sure the backend is running.' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Signup failed' };
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      showToast(`Welcome to Monetrex, ${data.user.name}!`);
      return { success: true };
    } catch {
      return { success: false, error: 'Cannot connect to server. Make sure the backend is running.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(GROUP_KEY);
    setUser(null);
    setTransactions([]);
    setFamily([]);
    setGroups([]);
    setBudgets({});
    setActiveGroupId(null);
    showToast('Logged out successfully', 'info');
  };

  const updateUser = async (updates) => {
    try {
      const res = await apiFetch('/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Update failed', 'error'); return false; }
      setUser(data.user);
      showToast('Profile updated!');
      return true;
    } catch {
      showToast('Failed to update profile', 'error');
      return false;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await apiFetch('/me/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      showToast('Password changed successfully!');
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const deleteAccount = async () => {
    try {
      const res = await apiFetch('/me', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Failed to delete account', 'error');
        return false;
      }
      logout();
      return true;
    } catch {
      showToast('Failed to delete account', 'error');
      return false;
    }
  };

  // ── Transactions ─────────────────────────────────────────────────────────
  const addTransaction = async (transaction) => {
    if (!activeGroupId) { showToast('No active group selected', 'error'); return; }
    try {
      const res = await apiFetch(`/groups/${activeGroupId}/transactions`, {
        method: 'POST',
        body: JSON.stringify({ ...transaction, groupId: activeGroupId }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to add transaction', 'error'); return; }
      setTransactions((prev) => [data.transaction, ...prev]);
      showToast('Transaction added!');
    } catch {
      showToast('Failed to add transaction', 'error');
    }
  };

  const updateTransaction = async (id, updates) => {
    try {
      const res = await apiFetch(`/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to update transaction', 'error'); return; }
      setTransactions((prev) => prev.map((t) => (t.id === id ? data.transaction : t)));
      showToast('Transaction updated!');
    } catch {
      showToast('Failed to update transaction', 'error');
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const res = await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Failed to delete', 'error');
        return;
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      showToast('Transaction deleted', 'info');
    } catch {
      showToast('Failed to delete transaction', 'error');
    }
  };

  // ── Family / Groups ───────────────────────────────────────────────────────
  const addFamilyMember = async (member) => {
    if (!activeGroupId) return;
    try {
      const res = await apiFetch(`/groups/${activeGroupId}/members`, {
        method: 'POST',
        body: JSON.stringify({
          name:       member.name,
          email:      member.email,
          role:       member.role || 'Member',
          spendLimit: member.limit || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to add member', 'error'); return; }
      setFamily((prev) => [...prev, data.membership]);
      showToast(`${member.name} has been added!`);
    } catch {
      showToast('Failed to add member', 'error');
    }
  };

  const createGroup = async (name) => {
    try {
      const res = await apiFetch('/groups', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to create group', 'error'); return; }
      setGroups((prev) => [...prev, data.group]);
      setFamily((prev) => [...prev, data.membership]);
      setActiveGroupId(data.group.id);
      showToast(`"${name}" group created!`);
    } catch {
      showToast('Failed to create group', 'error');
    }
  };

  const switchGroup = (id) => {
    setActiveGroupId(id);
    const g = groups.find((g) => g.id === id);
    if (g) showToast(`Switched to ${g.name}`);
  };

  const removeFamilyMember = async (memberId) => {
    if (!activeGroupId) return;
    try {
      const res = await apiFetch(`/groups/${activeGroupId}/members/${memberId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to remove member', 'error'); return false; }
      setFamily((prev) => prev.filter((m) => m.id !== memberId));
      showToast('Member removed', 'info');
      return true;
    } catch {
      showToast('Failed to remove member', 'error');
      return false;
    }
  };

  const leaveGroup = async (groupId) => {
    try {
      const res = await apiFetch(`/groups/${groupId}/leave`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to leave group', 'error'); return false; }
      // If owner deleted the group, wipe all related state; otherwise just remove own membership
      if (data.deleted) {
        setFamily((prev) => prev.filter((m) => m.group_id !== groupId));
        setTransactions((prev) => prev.filter((t) => t.group_id !== groupId));
        setBudgets((prev) => { const n = { ...prev }; delete n[groupId]; return n; });
      } else {
        setFamily((prev) => prev.filter((m) => !(m.group_id === groupId && m.user_id === user?.id)));
      }
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      showToast(data.deleted ? 'Group deleted' : 'You have left the group', 'info');
      return true;
    } catch {
      showToast('Failed to leave group', 'error');
      return false;
    }
  };

  // ── Budgets ───────────────────────────────────────────────────────────────
  const updateBudgets = async (budgetMap) => {
    if (!activeGroupId) return false;
    try {
      const res = await apiFetch(`/groups/${activeGroupId}/budgets`, {
        method: 'PUT',
        body: JSON.stringify({ budgets: budgetMap }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to save budgets', 'error'); return false; }
      // Convert array back to map
      const newMap = {};
      (data.budgets || []).forEach((b) => { newMap[b.category] = b.amount; });
      setBudgets((prev) => ({ ...prev, [activeGroupId]: newMap }));
      showToast('Budgets saved!');
      return true;
    } catch {
      showToast('Failed to save budgets', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      // Auth state
      user, authReady,
      login, signup, logout, updateUser, changePassword, deleteAccount,

      // Theme
      theme, toggleTheme,

      // Role
      isAdmin, roleInGroup, currentMembership,

      // Groups
      groups: userGroups, activeGroupId, setActiveGroupId: switchGroup, createGroup,

      // Family (members of active group)
      family: activeGroupMembers, addFamilyMember, removeFamilyMember, leaveGroup,

      // Transactions
      transactions:    visibleTransactions,
      allTransactions: transactions,
      addTransaction:  (t) => addTransaction({ ...t, groupId: activeGroupId }),
      updateTransaction, deleteTransaction,

      // Budgets
      budgets: activeBudgets, updateBudgets,

      // Chart data
      monthlyData,

      // Loading / Toast
      isLoading, toast, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Re-export AppContext so hook can live in a dedicated file
export { AppContext };
