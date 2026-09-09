/**
 * Deterministic Wealth & Investment Financial Calculator
 * Supports SIP compound interest, horizon target projections, emergency runway calculations,
 * and linear goal target pacing.
 */

export interface SIPProjectionResult {
  months: number;
  totalInvested: number;
  estimatedMaturity: number;
  wealthGain: number;
  effectiveCAGR: number;
  formattedDuration: string;
}

/**
 * Calculates number of months between now and a future target deadline.
 * Supports "YYYY-MM-DD", "YYYY-MM", or Date objects.
 */
export function calculateMonthsRemaining(
  deadline: string | Date | null | undefined,
  fromDate: Date = new Date()
): number {
  if (!deadline) return 0;

  let target: Date;
  if (typeof deadline === 'string') {
    // If format is YYYY-MM, append -01
    const cleanStr = deadline.length === 7 ? `${deadline}-01` : deadline;
    target = new Date(cleanStr);
  } else {
    target = deadline;
  }

  if (isNaN(target.getTime())) return 0;

  const yearDiff = target.getFullYear() - fromDate.getFullYear();
  const monthDiff = target.getMonth() - fromDate.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff;

  return Math.max(1, totalMonths);
}

/**
 * Formats a duration in months into a human-friendly string (e.g., "10 yrs 3 mos" or "6 mos").
 */
export function formatMonthsDuration(months: number): string {
  if (months <= 0) return '0 mos';
  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  if (years === 0) return `${remMonths} mo${remMonths === 1 ? '' : 's'}`;
  if (remMonths === 0) return `${years} yr${years === 1 ? '' : 's'}`;
  return `${years} yr${years === 1 ? '' : 's'} ${remMonths} mo${remMonths === 1 ? '' : 's'}`;
}

/**
 * Calculates Future Value (Maturity Target) of an SIP with compounded monthly returns
 * Formula:
 * FV_SIP = P * [ ((1 + i)^n - 1) / i ] * (1 + i)
 * FV_Lump = PV * (1 + i)^n
 * Total = FV_SIP + FV_Lump
 */
export function calculateSIPFutureValue({
  monthlyInvestment,
  months,
  annualRatePct = 12,
  currentAmount = 0,
}: {
  monthlyInvestment: number;
  months: number;
  annualRatePct?: number;
  currentAmount?: number;
}): SIPProjectionResult {
  const P = Math.max(0, monthlyInvestment);
  const PV = Math.max(0, currentAmount);
  const n = Math.max(1, months);
  const rate = Math.max(0, annualRatePct);

  // Total principal capital contributed
  const totalInvested = Math.round(PV + P * n);

  if (rate === 0) {
    return {
      months: n,
      totalInvested,
      estimatedMaturity: totalInvested,
      wealthGain: 0,
      effectiveCAGR: 0,
      formattedDuration: formatMonthsDuration(n),
    };
  }

  // Monthly interest rate
  const i = rate / 100 / 12;

  // SIP Future Value Component
  const fvSIP = P > 0 ? P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i)) : 0;

  // Existing Balance Compounding Component
  const fvLump = PV > 0 ? PV * Math.pow(1 + i, n) : 0;

  const estimatedMaturity = Math.round(fvSIP + fvLump);
  const wealthGain = Math.max(0, estimatedMaturity - totalInvested);

  return {
    months: n,
    totalInvested,
    estimatedMaturity,
    wealthGain,
    effectiveCAGR: rate,
    formattedDuration: formatMonthsDuration(n),
  };
}

/**
 * Calculates Required Monthly SIP to reach a specified Target Corpus by deadline
 * Formula:
 * FV_remaining = Target - PV*(1 + i)^n
 * P = FV_remaining / [ ((1 + i)^n - 1) / i * (1 + i) ]
 */
export function calculateRequiredMonthlySIP({
  targetAmount,
  months,
  annualRatePct = 12,
  currentAmount = 0,
}: {
  targetAmount: number;
  months: number;
  annualRatePct?: number;
  currentAmount?: number;
}): number {
  const target = Math.max(0, targetAmount);
  const PV = Math.max(0, currentAmount);
  const n = Math.max(1, months);
  const rate = Math.max(0, annualRatePct);

  if (target <= 0) return 0;

  if (rate === 0) {
    const needed = Math.max(0, target - PV);
    return Math.ceil(needed / n);
  }

  const i = rate / 100 / 12;
  const fvLump = PV * Math.pow(1 + i, n);
  const fvRemaining = target - fvLump;

  if (fvRemaining <= 0) return 0; // Existing balance will compound to exceed target

  const factor = ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  return Math.ceil(fvRemaining / factor);
}

/**
 * Calculates Emergency Fund target based on monthly burn rate and desired runway months
 */
export function calculateEmergencyTarget({
  monthlyBurn,
  monthsRunway = 6,
}: {
  monthlyBurn: number;
  monthsRunway?: number;
}): number {
  return Math.max(0, Math.round(monthlyBurn * monthsRunway));
}

/**
 * Calculates current emergency runway coverage in months
 */
export function calculateEmergencyRunway({
  currentAmount,
  monthlyBurn,
}: {
  currentAmount: number;
  monthlyBurn: number;
}): number {
  if (monthlyBurn <= 0) return 0;
  return Math.round((currentAmount / monthlyBurn) * 10) / 10;
}

/**
 * Calculates required monthly contribution for linear goals (Travel, Purchases)
 */
export function calculateLinearRequiredMonthly({
  targetAmount,
  currentAmount = 0,
  months,
}: {
  targetAmount: number;
  currentAmount?: number;
  months: number;
}): number {
  const target = Math.max(0, targetAmount);
  const current = Math.max(0, currentAmount);
  const n = Math.max(1, months);
  const remaining = Math.max(0, target - current);
  return Math.ceil(remaining / n);
}
