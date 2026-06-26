export const PASSWORD_RULES = [
  { key: 'length',  label: 'At least 8 characters',        test: (p) => p.length >= 8 },
  { key: 'upper',   label: 'One uppercase letter (A–Z)',    test: (p) => /[A-Z]/.test(p) },
  { key: 'number',  label: 'One number (0–9)',              test: (p) => /[0-9]/.test(p) },
  { key: 'special', label: 'One special character (!@#…)',  test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const validatePassword = (password) => {
  const failing = PASSWORD_RULES.find(r => !r.test(password));
  return failing ? failing.label : null;
};
