const downloadBlob = (blob, filename) => {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (transactions, filename = 'monetrex_transactions') => {
  if (!transactions?.length) return;

  const headers = ['Title', 'Amount', 'Type', 'Category', 'Member', 'Date', 'Note'];
  const rows    = transactions.map((t) => [
    `"${(t.title  || '').replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.amount > 0 ? 'Income' : 'Expense',
    t.category    || '',
    `"${(t.memberName || t.member_name || 'Unknown').replace(/"/g, '""')}"`,
    t.date        || '',
    `"${(t.note   || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  );
};

export const exportToJSON = (transactions, filename = 'monetrex_transactions') => {
  if (!transactions?.length) return;

  const clean = transactions.map(({ title, amount, category, date, note, memberName, member_name }) => ({
    title,
    amount,
    type:     amount > 0 ? 'Income' : 'Expense',
    category,
    member:   memberName || member_name || 'Unknown',
    date,
    note:     note || '',
  }));

  downloadBlob(
    new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' }),
    `${filename}_${new Date().toISOString().split('T')[0]}.json`
  );
};
