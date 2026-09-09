/**
 * Formatting utilities for Indian financial standards and locale conventions.
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format number into Indian Rupee currency (e.g. ₹1,25,000)
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

  return formatted;
}

/**
 * Format number in Indian numbering system without currency symbol (e.g. 1,25,000)
 */
export function formatIndianNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage with 1 decimal place (e.g. 65.7%)
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(1)}%`;
}

/**
 * Format a YYYY-MM-DD string into Indian date format (e.g. "9 September 2026")
 */
export function formatDateIndian(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format a date into relative representation ("Today", "Yesterday", or "9 Sep 2026")
 */
export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '';
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) {
    return 'Today';
  }
  if (dateStr === yesterdayStr) {
    return 'Yesterday';
  }

  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const shortMonth = MONTH_NAMES[date.getMonth()].slice(0, 3);
  return `${day} ${shortMonth}`;
}

/**
 * Return current month, year and monthName
 */
export function getCurrentMonthYear() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  return {
    month,
    year,
    monthName: MONTH_NAMES[month - 1],
  };
}

/**
 * Get days elapsed in a given month/year and total days in month
 */
export function getMonthDaysInfo(month: number, year: number) {
  const totalDays = new Date(year, month, 0).getDate();
  const now = new Date();
  
  let daysElapsed = totalDays;
  if (now.getFullYear() === year && now.getMonth() + 1 === month) {
    daysElapsed = Math.max(1, now.getDate());
  }
  
  return {
    daysElapsed,
    totalDays,
    daysRemaining: Math.max(0, totalDays - daysElapsed),
  };
}
