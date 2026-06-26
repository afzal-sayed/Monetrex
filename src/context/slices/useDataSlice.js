import { useState, useEffect, useCallback } from 'react';
import { apiFetch, GROUP_KEY } from '../../utils/api';

export const useDataSlice = ({ showToast }) => {
  const [transactions,  setTransactions]  = useState([]);
  const [family,        setFamily]        = useState([]);
  const [groups,        setGroups]        = useState([]);
  const [budgets,       setBudgets]       = useState({});
  const [budgetTypes,   setBudgetTypes]   = useState({});
  const [activeGroupId,     setActiveGroupId]     = useState(() => localStorage.getItem(GROUP_KEY) || null);
  const [customCategories,  setCustomCategories]  = useState([]);

  // ── Persist active group ──────────────────────────────────────────────────
  useEffect(() => {
    if (activeGroupId) localStorage.setItem(GROUP_KEY, activeGroupId);
    else               localStorage.removeItem(GROUP_KEY);
  }, [activeGroupId]);

  const clearAll = useCallback(() => {
    setTransactions([]);
    setFamily([]);
    setGroups([]);
    setBudgets({});
    setBudgetTypes({});
    setActiveGroupId(null);
    setCustomCategories([]);
  }, []);

  // ── Transactions ──────────────────────────────────────────────────────────
  const addTransaction = async (transaction) => {
    if (!activeGroupId) { showToast('No active group selected', 'error'); return; }
    try {
      const res  = await apiFetch(`/groups/${activeGroupId}/transactions`, {
        method: 'POST',
        body:   JSON.stringify({ ...transaction, groupId: activeGroupId }),
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
      const res  = await apiFetch(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
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

  const deleteTransactions = useCallback(async (ids) => {
    try {
      const res = await apiFetch('/transactions/bulk', { method: 'DELETE', body: JSON.stringify({ ids }) });
      if (!res.ok) { showToast('Failed to delete transactions', 'error'); return; }
      setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)));
    } catch {
      showToast('Failed to delete transactions', 'error');
    }
  }, [showToast]);

  // ── Groups ────────────────────────────────────────────────────────────────
  const createGroup = async (name) => {
    try {
      const res  = await apiFetch('/groups', { method: 'POST', body: JSON.stringify({ name }) });
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
    const g = groups.find((gr) => gr.id === id);
    if (g) showToast(`Switched to ${g.name}`);
  };

  const renameGroup = async (groupId, name) => {
    try {
      const res  = await apiFetch(`/groups/${groupId}`, { method: 'PATCH', body: JSON.stringify({ name }) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to rename group', 'error'); return false; }
      setGroups((prev) => prev.map((g) => (g.id === groupId ? data.group : g)));
      showToast(`Renamed to "${name}"`);
      return true;
    } catch {
      showToast('Failed to rename group', 'error');
      return false;
    }
  };

  // userId is passed from AppProvider (comes from auth slice) to filter membership on leave
  const leaveGroup = async (groupId, userId) => {
    try {
      const res  = await apiFetch(`/groups/${groupId}/leave`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to leave group', 'error'); return false; }
      if (data.deleted) {
        setFamily((prev)       => prev.filter((m) => m.group_id !== groupId));
        setTransactions((prev) => prev.filter((t) => t.group_id !== groupId));
        setBudgets((prev)      => { const n = { ...prev }; delete n[groupId]; return n; });
      } else {
        setFamily((prev) => prev.filter((m) => !(m.group_id === groupId && m.user_id === userId)));
      }
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      showToast(data.deleted ? 'Group deleted' : 'You have left the group', 'info');
      return true;
    } catch {
      showToast('Failed to leave group', 'error');
      return false;
    }
  };

  // ── Family ────────────────────────────────────────────────────────────────
  const addFamilyMember = async (member) => {
    if (!activeGroupId) return;
    try {
      const res  = await apiFetch(`/groups/${activeGroupId}/members`, {
        method: 'POST',
        body:   JSON.stringify({
          name:       member.name,
          email:      member.email,
          role:       member.role  || 'Member',
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

  const removeFamilyMember = async (memberId) => {
    if (!activeGroupId) return false;
    try {
      const res  = await apiFetch(`/groups/${activeGroupId}/members/${memberId}`, { method: 'DELETE' });
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

  // ── Budgets ───────────────────────────────────────────────────────────────
  const updateBudgets = async (budgetMap, month = 'default', budgetTypesMap = {}) => {
    if (!activeGroupId) return false;
    try {
      const res  = await apiFetch(`/groups/${activeGroupId}/budgets`, {
        method: 'PUT',
        body:   JSON.stringify({ budgets: budgetMap, month, budgetTypes: budgetTypesMap }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to save budgets', 'error'); return false; }
      const newMap = {};
      const newTypesMap = {};
      (data.budgets || []).forEach((b) => {
        newMap[b.category] = b.amount;
        newTypesMap[b.category] = b.budget_type || 'flexible';
      });
      setBudgets((prev) => ({
        ...prev,
        [activeGroupId]: { ...(prev[activeGroupId] || {}), [month]: newMap },
      }));
      setBudgetTypes((prev) => ({
        ...prev,
        [activeGroupId]: { ...(prev[activeGroupId] || {}), [month]: newTypesMap },
      }));
      showToast('Budgets saved!');
      return true;
    } catch {
      showToast('Failed to save budgets', 'error');
      return false;
    }
  };

  const addCustomCategory = async (name, type = 'expense') => {
    try {
      const res  = await apiFetch('/me/categories', { method: 'POST', body: JSON.stringify({ name, type }) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to add category', 'error'); return null; }
      setCustomCategories((prev) => [...prev, data.category]);
      showToast(`"${name}" category added!`);
      return data.category;
    } catch {
      showToast('Failed to add category', 'error');
      return null;
    }
  };

  const deleteCustomCategory = async (id, name) => {
    try {
      const res = await apiFetch(`/me/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); showToast(d.error || 'Failed to delete category', 'error'); return false; }
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
      showToast(`"${name}" category removed`, 'info');
      return true;
    } catch {
      showToast('Failed to delete category', 'error');
      return false;
    }
  };

  return {
    // raw state + setters (used by AppProvider for fetchData + derived state)
    transactions, setTransactions,
    family,       setFamily,
    groups,       setGroups,
    budgets,      setBudgets,
    budgetTypes,  setBudgetTypes,
    activeGroupId, setActiveGroupId,
    customCategories, setCustomCategories,
    clearAll,
    // public CRUD
    addTransaction, updateTransaction, deleteTransaction, deleteTransactions,
    createGroup, switchGroup, renameGroup, leaveGroup,
    addFamilyMember, removeFamilyMember,
    updateBudgets,
    addCustomCategory, deleteCustomCategory,
  };
};
