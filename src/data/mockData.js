export const MOCK_USER = {
  name: "Alex",
  email: "alex@monetrex.io",
  avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d"
};

export const SUMMARY_STATS = [
  { id: 1, title: 'Total Balance', amount: '$24,562.00', trend: '+2.5%', type: 'neutral' },
  { id: 2, title: 'Monthly Income', amount: '$8,240.00', trend: '+12%', type: 'positive' },
  { id: 3, title: 'Total Expenses', amount: '$3,120.00', trend: '-4.1%', type: 'positive' },
];

export const MONTHLY_SPENDING = [
  { name: 'Jan', amount: 2400 },
  { name: 'Feb', amount: 1398 },
  { name: 'Mar', amount: 4800 },
  { name: 'Apr', amount: 3908 },
  { name: 'May', amount: 4800 },
  { name: 'Jun', amount: 3800 },
];

export const CATEGORY_SPENDING = [
  { name: 'Housing', value: 1500, color: '#4F46E5' },
  { name: 'Food', value: 800, color: '#10B981' },
  { name: 'Transport', value: 400, color: '#3B82F6' },
  { name: 'Entertainment', value: 300, color: '#8B5CF6' },
];

export const RECENT_TRANSACTIONS = [
  { id: '1', title: 'Apple Store', category: 'Electronics', amount: -1299.00, date: 'Today, 2:45 PM', icon: 'Laptop' },
  { id: '2', title: 'Whole Foods', category: 'Groceries', amount: -142.50, date: 'Yesterday, 10:20 AM', icon: 'ShoppingBag' },
  { id: '3', title: 'TechCorp Salary', category: 'Income', amount: 4120.00, date: 'Mar 15, 2026', icon: 'Wallet' },
  { id: '4', title: 'Uber', category: 'Transport', amount: -24.00, date: 'Mar 14, 2026', icon: 'Car' },
];
