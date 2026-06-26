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

export const computeInsights = (transactions, budgets = {}, budgetTypes = {}) => {
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

  // Budget health — only flexible budgets count toward health score
  const flexibleBudgetEntries = Object.entries(budgets)
    .filter(([cat]) => (budgetTypes[cat] || 'flexible') !== 'fixed');
  const totalBudget = flexibleBudgetEntries.reduce((s, [, v]) => s + (parseFloat(v) || 0), 0);
  if (totalBudget > 0) {
    const flexibleCats = new Set(flexibleBudgetEntries.map(([cat]) => cat));
    const flexibleSpend = thisMonthTxns
      .filter((t) => t.amount < 0 && flexibleCats.has(t.category))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const pct = (flexibleSpend / totalBudget) * 100;
    insights.push({
      type: pct > 90 ? 'warning' : pct > 70 ? 'neutral' : 'positive',
      title: `${pct.toFixed(0)}% of budget used`,
      desc: `₹${Math.max(0, totalBudget - flexibleSpend).toFixed(0)} remaining`,
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

export const CATEGORIES = [
  'Food',
  'Dining Out',
  'Rent',
  'Housing',
  'Transport',
  'Fuel',
  'Bills & Utilities',
  'Subscriptions',
  'Investments',
  'Health',
  'Shopping',
  'Entertainment',
  'Education',
  'Travel',
  'Impulse Buying',
  'Others',
  'General',
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investments',
  'Rental',
  'Interest',
  'Gift',
  'Refund',
  'Other Income',
];

export const CATEGORY_COLORS = {
  'Food':             '#10B981',
  'Dining Out':       '#F43F5E',
  'Rent':             '#EF4444',
  'Housing':          '#8B5CF6',
  'Transport':        '#3B82F6',
  'Fuel':             '#64748B',
  'Bills & Utilities':'#F97316',
  'Subscriptions':    '#7C3AED',
  'Investments':      '#059669',
  'Health':           '#06B6D4',
  'Shopping':         '#D97706',
  'Entertainment':    '#F59E0B',
  'Education':        '#2563EB',
  'Travel':           '#0EA5E9',
  'Impulse Buying':   '#DC2626',
  'Others':           '#94A3B8',
  'General':          '#6366F1',
  // Income categories
  'Income':           '#4F46E5',
  'Salary':           '#10B981',
  'Freelance':        '#06B6D4',
  'Business':         '#8B5CF6',
  'Rental':           '#F97316',
  'Interest':         '#059669',
  'Gift':             '#EC4899',
  'Refund':           '#14B8A6',
  'Other Income':     '#94A3B8',
};

export const CATEGORY_EMOJI = {
  'Food':             '🍔',
  'Dining Out':       '🍽️',
  'Rent':             '🏘️',
  'Housing':          '🏠',
  'Transport':        '🚗',
  'Fuel':             '⛽',
  'Bills & Utilities':'💡',
  'Subscriptions':    '📱',
  'Investments':      '📈',
  'Health':           '🏥',
  'Shopping':         '🛍️',
  'Entertainment':    '🎬',
  'Education':        '📚',
  'Travel':           '✈️',
  'Impulse Buying':   '🛒',
  'Others':           '📂',
  'General':          '📦',
  // Income categories
  'Income':           '💰',
  'Salary':           '💼',
  'Freelance':        '💻',
  'Business':         '🏢',
  'Rental':           '🏠',
  'Interest':         '🏦',
  'Gift':             '🎁',
  'Refund':           '↩️',
  'Other Income':     '💰',
};

export function formatRupee(v) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}

export const mergeCategories = (customCats = [], type = 'expense') => {
  const base   = type === 'income' ? INCOME_CATEGORIES : CATEGORIES;
  const colors = { ...CATEGORY_COLORS };
  const emojis = { ...CATEGORY_EMOJI };

  const customNames = customCats
    .filter((c) => c.type === type || c.type === 'both')
    .map((c) => {
      colors[c.name] = c.color;
      emojis[c.name] = c.emoji;
      return c.name;
    });

  return { list: [...base, ...customNames], colors, emojis };
};

// ─── New analytics compute functions ────────────────────────────────────────

export function computeSpendingHeatmap(transactions) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const totals = Array(7).fill(0);
  const counts = Array(7).fill(0);
  transactions.filter((t) => t.amount < 0).forEach((t) => {
    const d = new Date(t.date + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      const dow = d.getDay();
      totals[dow] += Math.abs(t.amount);
      counts[dow]++;
    }
  });
  return days.map((name, i) => ({
    name,
    avg: counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0,
    total: Math.round(totals[i]),
    count: counts[i],
  }));
}

export function computeYearOverYear(transactions) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const lastYear = thisYear - 1;
  const months = [];
  for (let m = 0; m < 12; m++) {
    const label = new Date(thisYear, m).toLocaleString('en-US', { month: 'short' });
    const key   = String(m + 1).padStart(2, '0');
    months.push({ label, key, current: 0, previous: 0 });
  }
  transactions.filter((t) => t.amount < 0).forEach((t) => {
    const d = new Date(t.date + 'T00:00:00');
    if (isNaN(d.getTime())) return;
    const year  = d.getFullYear();
    const mIdx  = d.getMonth();
    const amt   = Math.abs(t.amount);
    if (year === thisYear)  months[mIdx].current  += amt;
    else if (year === lastYear) months[mIdx].previous += amt;
  });
  return months.map(({ label, current, previous }) => ({
    name: label,
    [thisYear]:  Math.round(current),
    [lastYear]:  Math.round(previous),
  }));
}

export function computeMemberBreakdown(transactions, members) {
  const totals = {};
  transactions.filter((t) => t.amount < 0).forEach((t) => {
    const member = members.find((m) => m.id === t.member_id);
    const name = member?.user_name || member?.name || 'Unknown';
    totals[name] = (totals[name] || 0) + Math.abs(t.amount);
  });
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value: Math.round(value) }));
}

export function computeRecurringVsDiscretionary(transactions) {
  let recurring = 0;
  let discretionary = 0;
  transactions.filter((t) => t.amount < 0).forEach((t) => {
    if (t.is_recurring) recurring += Math.abs(t.amount);
    else discretionary += Math.abs(t.amount);
  });
  return [
    { name: 'Recurring',     value: Math.round(recurring),     fill: '#7C3AED' },
    { name: 'Discretionary', value: Math.round(discretionary), fill: '#10B981' },
  ];
}

export function computeCategoryMonthlyData(transactions, months = 6) {
  const now = new Date();
  const keys = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      name: d.toLocaleString('en-US', { month: 'short' }),
    });
  }

  const monthKeySet = new Set(keys.map((k) => k.key));

  // Single pass: bucket expenses by month+category
  const bucket = {};
  const totals = {};
  transactions.forEach((t) => {
    if (t.amount >= 0) return;
    const monthKey = t.date?.slice(0, 7);
    if (!monthKeySet.has(monthKey)) return;
    const amt = Math.abs(t.amount);
    totals[t.category] = (totals[t.category] || 0) + amt;
    if (!bucket[monthKey]) bucket[monthKey] = {};
    bucket[monthKey][t.category] = (bucket[monthKey][t.category] || 0) + amt;
  });

  const topCats = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([cat]) => cat);

  return keys.map(({ key, name }) => {
    const row = { name, key };
    topCats.forEach((cat) => {
      row[cat] = bucket[key]?.[cat] || 0;
    });
    return row;
  });
}
