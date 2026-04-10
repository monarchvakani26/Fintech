// ============================================================
// Rakshak AI - Formatters
// Currency, date, percentage, and other formatters
// ============================================================

/**
 * Format currency in Indian Rupee format
 */
export function formatCurrency(amount, options = {}) {
  const { compact = false, showSymbol = true } = options;

  if (compact) {
    if (amount >= 10000000) return `${showSymbol ? '₹' : ''}${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `${showSymbol ? '₹' : ''}${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `${showSymbol ? '₹' : ''}${(amount / 1000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/**
 * Format a date to readable string
 */
export function formatDate(date, options = {}) {
  const d = new Date(date);
  const { relative = false, short = false } = options;

  if (relative) {
    const diff = Date.now() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
  }

  if (short) {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Shorten a hash for display
 */
export function shortHash(hash, chars = 12) {
  if (!hash) return 'N/A';
  return hash.substring(0, chars) + '...' + hash.substring(hash.length - 6);
}

/**
 * Get risk level label and color from score
 */
export function getRiskLevel(score) {
  if (score <= 30) return { label: 'LOW RISK', color: 'text-green-600', bgColor: 'bg-green-100', barColor: '#22c55e' };
  if (score <= 69) return { label: 'MEDIUM RISK', color: 'text-orange-600', bgColor: 'bg-orange-100', barColor: '#f97316' };
  return { label: 'HIGH RISK', color: 'text-red-600', bgColor: 'bg-red-100', barColor: '#ef4444' };
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 1) {
  return `${value >= 0 ? '+' : ''}${Number(value).toFixed(decimals)}%`;
}

/**
 * Truncate string
 */
export function truncate(str, maxLength = 30) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Get trust score info
 */
export function getTrustScoreInfo(score) {
  if (score >= 90) return { label: 'EXTREME SECURITY', color: '#22c55e', textColor: 'text-green-500' };
  if (score >= 70) return { label: 'HIGH SECURITY', color: '#86efac', textColor: 'text-green-400' };
  if (score >= 50) return { label: 'MODERATE SECURITY', color: '#facc15', textColor: 'text-yellow-500' };
  if (score >= 30) return { label: 'AT RISK', color: '#f97316', textColor: 'text-orange-500' };
  return { label: 'CRITICAL RISK', color: '#ef4444', textColor: 'text-red-500' };
}

/**
 * Format large Indian numbers with commas (Indian system)
 */
export function formatIndianNumber(num) {
  const str = Math.abs(num).toString();
  let result = '';
  let counter = 0;
  for (let i = str.length - 1; i >= 0; i--) {
    counter++;
    result = str[i] + result;
    if (counter === 3 && i !== 0) {
      result = ',' + result;
      counter = 0;
    } else if (counter === 2 && i !== 0 && str.length > 3) {
      // already past hundreds
    }
  }
  // Actually use Intl for proper Indian formatting
  return new Intl.NumberFormat('en-IN').format(num);
}
