export function formatCurrency(n, currency = 'USD') {
  if (n == null || isNaN(n)) return '-'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
  } catch (_) {
    return `$${Number(n).toFixed(2)}`
  }
}

