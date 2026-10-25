/**
 * Display prices and plan limits, shared by the landing page, the membership
 * page and the legal copy. The amounts actually charged live in Stripe (see
 * the price-ID env vars in src/server/stripe.ts); keep these in sync with them.
 */
export const PRICING = {
  currencySymbol: "€",
  proMonthly: 8,
  proYearly: 72,
  boost: 4,
  boostDays: 7,
  boostLong: 7,
  boostLongDays: 14,
  freeProjects: 2,
} as const;

/** The Boost lengths people can buy (the 14-day one needs its own Stripe price). */
export const BOOST_OPTIONS = [
  { days: PRICING.boostDays, price: PRICING.boost, blurb: "About a week at the top" },
  { days: PRICING.boostLongDays, price: PRICING.boostLong, blurb: "Two weeks at the top" },
] as const;

export type BoostDays = (typeof BOOST_OPTIONS)[number]["days"];

export const isBoostDays = (value: unknown): value is BoostDays => BOOST_OPTIONS.some((option) => option.days === value);

/** Yearly price expressed per month, e.g. 6 for €72/year. */
export const PRO_YEARLY_PER_MONTH = PRICING.proYearly / 12;

/** What yearly billing saves versus twelve monthly payments, e.g. 24. */
export const PRO_YEARLY_SAVINGS = PRICING.proMonthly * 12 - PRICING.proYearly;

/** Whole-number percentage saved by billing yearly, e.g. 25. */
export const PRO_YEARLY_SAVINGS_PERCENT = Math.round((PRO_YEARLY_SAVINGS / (PRICING.proMonthly * 12)) * 100);

export const formatPrice = (amount: number) => `${PRICING.currencySymbol}${amount}`;
