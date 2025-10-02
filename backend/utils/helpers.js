function percentChange(oldVal, newVal) {
  if (oldVal === 0 || oldVal == null || newVal == null) return 0;
  return ((newVal - oldVal) / Math.abs(oldVal)) * 100;
}

function sanitizePrice(input) {
  if (input == null) return null;
  if (typeof input === 'number') return input;
  const num = parseFloat(String(input).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

module.exports = { percentChange, sanitizePrice };

