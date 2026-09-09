import { Goal, GoalCategoryType } from '@/types';

export function getGoalCategoryType(goal: Goal): GoalCategoryType {
  if (goal.category_type) return goal.category_type;

  const text = (goal.name || '').toLowerCase();

  if (
    text.includes('cash in hand') ||
    text.includes('wallet') ||
    text.includes('petty cash') ||
    text.includes('bank account') ||
    text.includes('checking')
  ) {
    return 'cash';
  }

  if (
    text.includes('travel') ||
    text.includes('trip') ||
    text.includes('vacation') ||
    text.includes('flight') ||
    text.includes('tour') ||
    text.includes('goa') ||
    text.includes('holiday') ||
    text.includes('europe') ||
    text.includes('japan')
  ) {
    return 'travel';
  }

  if (
    text.includes('invest') ||
    text.includes('stock') ||
    text.includes('mutual') ||
    text.includes('sip') ||
    text.includes('gold') ||
    text.includes('crypto') ||
    text.includes('nifty') ||
    text.includes('equity') ||
    text.includes('shares') ||
    text.includes('fd') ||
    text.includes('ppf') ||
    text.includes('epf') ||
    text.includes('groww') ||
    text.includes('zerodha')
  ) {
    return 'investment';
  }

  if (
    text.includes('emergency') ||
    text.includes('reserve') ||
    text.includes('contingency') ||
    text.includes('safety') ||
    text.includes('liquid') ||
    text.includes('medical')
  ) {
    return 'emergency';
  }

  if (
    text.includes('iphone') ||
    text.includes('car') ||
    text.includes('bike') ||
    text.includes('laptop') ||
    text.includes('macbook') ||
    text.includes('gadget') ||
    text.includes('buy') ||
    text.includes('purchase')
  ) {
    return 'purchase';
  }

  return 'other';
}

export function getCategoryBadge(type: GoalCategoryType): {
  label: string;
  icon: string;
  accentColor: string;
  badgeBg: string;
  borderBg: string;
} {
  switch (type) {
    case 'cash':
      return {
        label: 'Liquid Cash',
        icon: '💵',
        accentColor: 'text-sky-700 dark:text-sky-400',
        badgeBg: 'bg-sky-50 text-sky-900 dark:bg-sky-950/60 dark:text-sky-300',
        borderBg: 'border-sky-200 dark:border-sky-900',
      };
    case 'investment':
      return {
        label: 'Investment',
        icon: '📈',
        accentColor: 'text-emerald-700 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300',
        borderBg: 'border-emerald-200 dark:border-emerald-900',
      };
    case 'emergency':
      return {
        label: 'Emergency Fund',
        icon: '🛡️',
        accentColor: 'text-blue-700 dark:text-blue-400',
        badgeBg: 'bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300',
        borderBg: 'border-blue-200 dark:border-blue-900',
      };
    case 'travel':
      return {
        label: 'Travel Savings',
        icon: '✈️',
        accentColor: 'text-cyan-700 dark:text-cyan-400',
        badgeBg: 'bg-cyan-50 text-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300',
        borderBg: 'border-cyan-200 dark:border-cyan-900',
      };
    case 'purchase':
      return {
        label: 'Dream Purchase',
        icon: '🎯',
        accentColor: 'text-amber-700 dark:text-amber-400',
        badgeBg: 'bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
        borderBg: 'border-amber-200 dark:border-amber-900',
      };
    default:
      return {
        label: 'Savings Vault',
        icon: '🪙',
        accentColor: 'text-slate-700 dark:text-slate-300',
        badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
        borderBg: 'border-slate-200 dark:border-slate-700',
      };
  }
}

export interface SavingsPortfolioMetrics {
  totalSavedAndInvested: number;
  totalCash: number;
  totalInvested: number;
  totalEmergency: number;
  totalTravel: number;
  totalPurchases: number;
  totalOther: number;
  investmentCount: number;
  emergencyCount: number;
  travelCount: number;
  totalVaultsCount: number;
  emergencyRunwayMonths: number;
  investmentPercentage: number;
  emergencyPercentage: number;
  travelPercentage: number;
  otherPercentage: number;
}

export function computeSavingsPortfolio(
  goals: Goal[],
  monthlyBurnRate: number = 0
): SavingsPortfolioMetrics {
  let totalSavedAndInvested = 0;
  let totalCash = 0;
  let totalInvested = 0;
  let totalEmergency = 0;
  let totalTravel = 0;
  let totalPurchases = 0;
  let totalOther = 0;

  let investmentCount = 0;
  let emergencyCount = 0;
  let travelCount = 0;

  goals.forEach((goal) => {
    const amount = Number(goal.current_amount) || 0;
    const type = getGoalCategoryType(goal);
    totalSavedAndInvested += amount;

    switch (type) {
      case 'cash':
        totalCash += amount;
        break;
      case 'investment':
        totalInvested += amount;
        investmentCount += 1;
        break;
      case 'emergency':
        totalEmergency += amount;
        emergencyCount += 1;
        break;
      case 'travel':
        totalTravel += amount;
        travelCount += 1;
        break;
      case 'purchase':
        totalPurchases += amount;
        break;
      default:
        totalOther += amount;
        break;
    }
  });

  const total = totalSavedAndInvested > 0 ? totalSavedAndInvested : 1;
  const emergencyRunwayMonths =
    monthlyBurnRate > 0 && totalEmergency > 0
      ? Number((totalEmergency / monthlyBurnRate).toFixed(1))
      : 0;

  return {
    totalSavedAndInvested,
    totalCash,
    totalInvested,
    totalEmergency,
    totalTravel,
    totalPurchases,
    totalOther,
    investmentCount,
    emergencyCount,
    travelCount,
    totalVaultsCount: goals.length,
    emergencyRunwayMonths,
    investmentPercentage: totalSavedAndInvested > 0 ? (totalInvested / total) * 100 : 0,
    emergencyPercentage: totalSavedAndInvested > 0 ? (totalEmergency / total) * 100 : 0,
    travelPercentage: totalSavedAndInvested > 0 ? (totalTravel / total) * 100 : 0,
    otherPercentage:
      totalSavedAndInvested > 0 ? ((totalPurchases + totalOther + totalCash) / total) * 100 : 0,
  };
}

export interface UnifiedCashSavingsInvestBreakdown {
  // Cash
  liquidCash: number; // Free cash left from salary after deducting both savings/investments and expenses + cash in hand
  operationalCashSurplus: number; // max(0, income - totalSpent - totalMonthlyCommitted)
  cashVaults: number;
  cashPercentage: number;

  // Monthly deductions from salary
  monthlyCommittedSavings: number; // Monthly emergency, travel, and goal contributions
  monthlyCommittedInvestments: number; // Monthly SIPs, mutual funds contributions
  totalMonthlyCommitted: number; // monthlyCommittedSavings + monthlyCommittedInvestments
  disposableLivingIncome: number; // max(0, income - totalMonthlyCommitted)

  // Savings
  totalSavings: number;
  emergencyFunds: number;
  emergencyRunwayMonths: number;
  travelSavings: number;
  goalPurchases: number;
  otherSavings: number;
  savingsPercentage: number;

  // Investments
  totalInvestments: number;
  totalMonthlySIP: number;
  investmentCount: number;
  investmentsPercentage: number;

  // Total Net Wealth
  totalNetWealth: number;
}

/**
 * Calculates complete unified breakdown of Cash, Savings, and Investments,
 * with monthly savings & investments deducted directly from monthly salary.
 */
export function computeCashSavingsInvestmentBreakdown({
  goals,
  income = 0,
  totalSpent = 0,
  monthlyBurnRate = 0,
}: {
  goals: Goal[];
  income?: number;
  totalSpent?: number;
  monthlyBurnRate?: number;
}): UnifiedCashSavingsInvestBreakdown {
  const portfolio = computeSavingsPortfolio(goals, monthlyBurnRate);

  // 1. Calculate monthly committed contributions from salary towards savings & investments
  let monthlyCommittedSavings = 0;
  let monthlyCommittedInvestments = 0;

  goals.forEach((g) => {
    if (g.status !== 'paused') {
      const monthly = Number(g.monthly_contribution) || 0;
      const type = getGoalCategoryType(g);
      if (type === 'investment') {
        monthlyCommittedInvestments += monthly;
      } else if (type !== 'cash') {
        monthlyCommittedSavings += monthly;
      }
    }
  });

  const totalMonthlyCommitted = monthlyCommittedSavings + monthlyCommittedInvestments;

  // 2. Net operational cash left from monthly salary AFTER minus savings & investments and expenses:
  // Salary - (Savings + Investments) - Expenses = Free Liquid Cash Surplus
  const operationalCashSurplus = Math.max(0, income - totalSpent - totalMonthlyCommitted);
  const cashVaults = portfolio.totalCash;
  const liquidCash = operationalCashSurplus + cashVaults;
  const disposableLivingIncome = Math.max(0, income - totalMonthlyCommitted);

  // 3. Dedicated savings = cumulative saved in emergency + travel + purchases + other
  const totalSavings =
    portfolio.totalEmergency +
    portfolio.totalTravel +
    portfolio.totalPurchases +
    portfolio.totalOther;

  // 4. Investments = cumulative invested in mutual funds, stocks, gold
  const totalInvestments = portfolio.totalInvested;

  // Total Net Wealth = Liquid Cash + Cumulative Savings + Cumulative Investments
  const totalNetWealth = liquidCash + totalSavings + totalInvestments;
  const divisor = totalNetWealth > 0 ? totalNetWealth : 1;

  const cashPercentage = totalNetWealth > 0 ? (liquidCash / divisor) * 100 : 0;
  const savingsPercentage = totalNetWealth > 0 ? (totalSavings / divisor) * 100 : 0;
  const investmentsPercentage = totalNetWealth > 0 ? (totalInvestments / divisor) * 100 : 0;

  return {
    liquidCash,
    operationalCashSurplus,
    cashVaults,
    cashPercentage,

    monthlyCommittedSavings,
    monthlyCommittedInvestments,
    totalMonthlyCommitted,
    disposableLivingIncome,

    totalSavings,
    emergencyFunds: portfolio.totalEmergency,
    emergencyRunwayMonths: portfolio.emergencyRunwayMonths,
    travelSavings: portfolio.totalTravel,
    goalPurchases: portfolio.totalPurchases,
    otherSavings: portfolio.totalOther,
    savingsPercentage,

    totalInvestments,
    totalMonthlySIP: monthlyCommittedInvestments,
    investmentCount: portfolio.investmentCount,
    investmentsPercentage,

    totalNetWealth,
  };
}
