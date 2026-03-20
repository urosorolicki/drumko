const RSD_EUR_RATE = 117;

const FOOD_COSTS = {
  RSD: { adult: 3000, child: 1500 },
  EUR: { adult: 25, child: 12 },
};

const DEFAULT_CONSUMPTION_L_PER_100KM = 7;
const DEFAULT_FUEL_PRICES = {
  RSD: 200,
  EUR: 1.6,
};

/**
 * Estimate fuel cost for a given distance.
 * @param {number} distanceKm - Trip distance in kilometres
 * @param {number} [consumptionLPer100km=7] - Fuel consumption in litres per 100 km
 * @param {number} [fuelPricePerLiter=200] - Fuel price per litre (defaults to RSD)
 * @returns {number} Estimated fuel cost in the same currency as the fuel price
 */
export function estimateFuelCost(
  distanceKm,
  consumptionLPer100km = DEFAULT_CONSUMPTION_L_PER_100KM,
  fuelPricePerLiter = DEFAULT_FUEL_PRICES.RSD
) {
  if (distanceKm <= 0) return 0;

  const litresNeeded = (distanceKm / 100) * consumptionLPer100km;
  return Math.round(litresNeeded * fuelPricePerLiter * 100) / 100;
}

/**
 * Estimate daily food cost for a group.
 * @param {number} [adults=2] - Number of adults
 * @param {number} [children=0] - Number of children
 * @param {'RSD'|'EUR'} [currency='RSD'] - Currency for the estimate
 * @returns {number} Estimated daily food cost
 */
export function estimateDailyFoodCost(adults = 2, children = 0, currency = 'RSD') {
  const rates = FOOD_COSTS[currency] || FOOD_COSTS.RSD;
  return adults * rates.adult + children * rates.child;
}

/**
 * Calculate the number of days between two dates (inclusive).
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {number} Number of days (minimum 1)
 */
export function calculateTripDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Strip time component for a pure date diff
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const diffMs = endDay - startDay;
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return Math.max(days, 1);
}

/**
 * Calculate the number of nights (days - 1).
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {number} Number of nights (minimum 0)
 */
export function calculateNights(startDate, endDate) {
  const days = calculateTripDays(startDate, endDate);
  return Math.max(days - 1, 0);
}

/**
 * Format a monetary amount with the appropriate currency symbol.
 * @param {number} amount
 * @param {'RSD'|'EUR'} [currency='RSD']
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'RSD') {
  if (amount == null || isNaN(amount)) return '—';

  const rounded = Math.round(amount * 100) / 100;

  switch (currency) {
    case 'EUR':
      return `\u20AC${rounded.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'RSD':
    default:
      return `${rounded.toLocaleString('sr-RS', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} RSD`;
  }
}

/**
 * Rough currency conversion between RSD and EUR (rate ~117 RSD per EUR).
 * @param {number} amount
 * @param {'RSD'|'EUR'} from - Source currency
 * @param {'RSD'|'EUR'} to - Target currency
 * @returns {number} Converted amount (rounded to 2 decimals)
 */
export function convertCurrency(amount, from, to) {
  if (from === to) return amount;

  if (from === 'RSD' && to === 'EUR') {
    return Math.round((amount / RSD_EUR_RATE) * 100) / 100;
  }

  if (from === 'EUR' && to === 'RSD') {
    return Math.round(amount * RSD_EUR_RATE * 100) / 100;
  }

  // Unknown currency pair — return the original amount
  return amount;
}

/**
 * Produce a budget summary from a budget object.
 *
 * The budget object is expected to have:
 *   - totalBudget {number}
 *   - expenses {Array<{ amount: number, category: string }>}
 *
 * @param {{ totalBudget: number, expenses: Array<{ amount: number, category: string }> }} budget
 * @returns {{ totalBudget: number, totalSpent: number, remaining: number, categoryTotals: Record<string, number> }}
 */
export function getBudgetSummary(budget) {
  if (!budget) {
    return {
      totalBudget: 0,
      totalSpent: 0,
      remaining: 0,
      categoryTotals: {},
    };
  }

  const totalBudget = budget.total || budget.totalBudget || 0;
  const expenses = budget.expenses || [];

  const categoryTotals = {};
  let totalSpent = 0;

  for (const expense of expenses) {
    const amount = Number(expense.amount) || 0;
    const category = expense.category || 'other';

    totalSpent += amount;
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  }

  totalSpent = Math.round(totalSpent * 100) / 100;

  return {
    totalBudget,
    totalSpent,
    remaining: Math.round((totalBudget - totalSpent) * 100) / 100,
    categoryTotals,
  };
}
