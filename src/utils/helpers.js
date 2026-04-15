// ─── Date helpers ───────────────────────────────────────────────────────────

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const getMonthKey = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  if (isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const MONTH_LABELS = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

// ─── Chart data computation ─────────────────────────────────────────────────

export const computeMonthlyData = (transactions, monthsBack = 6) => {
  const months = {};

  transactions.forEach((t) => {
    const key = getMonthKey(t.date);
    if (!key) return;
    const [, month] = key.split('-');
    if (!months[key]) months[key] = { name: MONTH_LABELS[month], key, expenses: 0, income: 0 };
    if (t.amount < 0) months[key].expenses += Math.abs(t.amount);
    else months[key].income += t.amount;
  });

  // Ensure current + recent months always appear (even if empty)
  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const month = String(d.getMonth() + 1).padStart(2, '0');
    if (!months[key]) months[key] = { name: MONTH_LABELS[month], key, expenses: 0, income: 0 };
  }

  return Object.values(months)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-monthsBack);
};

// ─── Spending insights ──────────────────────────────────────────────────────

export const computeInsights = (transactions, budgets = {}) => {
  const insights = [];
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const thisMonthTxns = transactions.filter((t) => getMonthKey(t.date) === thisMonthKey);
  const lastMonthTxns = transactions.filter((t) => getMonthKey(t.date) === lastMonthKey);

  const thisSpend = thisMonthTxns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const lastSpend = lastMonthTxns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const thisIncome = thisMonthTxns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  // Month-over-month change
  if (lastSpend > 0) {
    const pct = ((thisSpend - lastSpend) / lastSpend * 100);
    const isHigher = pct > 0;
    insights.push({
      type: isHigher ? 'warning' : 'positive',
      title: `${Math.abs(pct).toFixed(0)}% ${isHigher ? 'more' : 'less'} spending`,
      desc: `vs ${prevDate.toLocaleString('en-US', { month: 'long' })}`,
      icon: isHigher ? 'TrendingUp' : 'TrendingDown',
    });
  }

  // Top category
  const cats = {};
  thisMonthTxns.filter((t) => t.amount < 0).forEach((t) => {
    cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount);
  });
  const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    insights.push({
      type: 'info',
      title: `Top: ${topCat[0]}`,
      desc: `₹${topCat[1].toFixed(0)} this month`,
      icon: 'Tag',
    });
  }

  // Budget health
  const totalBudget = Object.values(budgets).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  if (totalBudget > 0) {
    const pct = (thisSpend / totalBudget) * 100;
    insights.push({
      type: pct > 90 ? 'warning' : pct > 70 ? 'neutral' : 'positive',
      title: `${pct.toFixed(0)}% of budget used`,
      desc: `₹${Math.max(0, totalBudget - thisSpend).toFixed(0)} remaining`,
      icon: 'Target',
    });
  }

  // Savings rate this month
  if (thisIncome > 0) {
    const savingsRate = ((thisIncome - thisSpend) / thisIncome * 100);
    insights.push({
      type: savingsRate >= 20 ? 'positive' : savingsRate >= 0 ? 'neutral' : 'warning',
      title: `${Math.max(0, savingsRate).toFixed(0)}% savings rate`,
      desc: `₹${Math.max(0, thisIncome - thisSpend).toFixed(0)} saved`,
      icon: 'PiggyBank',
    });
  }

  return insights;
};

// ─── Category helpers ───────────────────────────────────────────────────────

export const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'General'];

export const CATEGORY_COLORS = {
  Food:          '#10B981',
  Transport:     '#3B82F6',
  Housing:       '#8B5CF6',
  Entertainment: '#F59E0B',
  Income:        '#4F46E5',
  General:       '#6366F1',
};

export const CATEGORY_EMOJI = {
  Food:          '🍔',
  Transport:     '🚗',
  Housing:       '🏠',
  Entertainment: '🎬',
  Income:        '💰',
  General:       '📦',
};
