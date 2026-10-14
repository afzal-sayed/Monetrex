export const FREQUENCY_OPTIONS = [
  { value: 'weekly',   label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly',  label: 'Monthly' },
  { value: 'yearly',   label: 'Yearly' },
];

export const FREQUENCY_LABELS = Object.fromEntries(FREQUENCY_OPTIONS.map((o) => [o.value, o.label]));
