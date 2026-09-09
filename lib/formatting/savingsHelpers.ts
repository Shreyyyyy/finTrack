import { Goal, GoalCategoryType } from '@/types';

export function getGoalCategoryType(goal: Goal): GoalCategoryType {
  if (goal.category_type) return goal.category_type;

  const text = (goal.name || '').toLowerCase();
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
    case 'investment':
      return {
        label: 'Investment',
        icon: '📈',
        accentColor: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
        borderBg: 'border-blue-200 dark:border-blue-900',
      };
    case 'emergency':
      return {
        label: 'Emergency Fund',
        icon: '🛡️',
        accentColor: 'text-emerald-700 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        borderBg: 'border-emerald-200 dark:border-emerald-900',
      };
    case 'travel':
      return {
        label: 'Travel Savings',
        icon: '✈️',
        accentColor: 'text-sky-700 dark:text-sky-400',
        badgeBg: 'bg-sky-50 text-sky-900 dark:bg-sky-950/60 dark:text-sky-300',
        borderBg: 'border-sky-200 dark:border-sky-900',
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
      totalSavedAndInvested > 0 ? ((totalPurchases + totalOther) / total) * 100 : 0,
  };
}
