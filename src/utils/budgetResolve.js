// groupBudgets is { 'YYYY-MM' | 'default': { category: value } }; key is the source month, or null if none applies.
export const resolveMonthBudget = (groupBudgets, month) => {
  const all = groupBudgets || {};
  const hasData = (k) => all[k] && Object.keys(all[k]).length > 0;
  const earlier = Object.keys(all)
    .filter((k) => k !== 'default' && k <= month && hasData(k))
    .sort()
    .pop();
  const key = earlier || (hasData('default') ? 'default' : null);
  return { key, data: key ? all[key] : {} };
};
