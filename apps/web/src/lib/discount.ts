import type { EventDiscount } from '@repo/types';

/**
 * Discount calculation result with breakdown
 */
export interface DiscountCalculation {
  /** Original base price before any discounts */
  basePrice: number;
  /** Student discount percentage applied (0-100) */
  studentDiscountPercentage: number;
  /** Event discount percentage applied (0-100) */
  eventDiscountPercentage: number;
  /** Amount saved from student discount */
  studentDiscountAmount: number;
  /** Amount saved from event discount */
  eventDiscountAmount: number;
  /** Total amount saved */
  totalDiscountAmount: number;
  /** Final price after all discounts */
  finalPrice: number;
}

/**
 * User object with optional student verification for eligibility check
 */
export interface UserWithVerification {
  id: string;
  studentVerification?: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  } | null;
}

/**
 * Calculate the final price after applying student and event discounts.
 *
 * Formula: finalPrice = basePrice × (1 - studentDiscount/100) × (1 - eventDiscount/100)
 *
 * @param basePrice - The original price of the product
 * @param studentDiscountPercentage - Student discount percentage (0-100), or null/undefined if not applicable
 * @param eventDiscountPercentage - Event discount percentage (0-100), or null/undefined if not applicable
 * @returns Final price after applying all discounts, rounded to 2 decimal places
 */
export function calculateFinalPrice(
  basePrice: number,
  studentDiscountPercentage: number | null | undefined,
  eventDiscountPercentage: number | null | undefined
): number {
  const studentDiscount = studentDiscountPercentage ?? 0;
  const eventDiscount = eventDiscountPercentage ?? 0;

  // Apply discounts: multiply by (1 - discount/100) for each applicable discount
  const afterStudentDiscount = basePrice * (1 - studentDiscount / 100);
  const finalPrice = afterStudentDiscount * (1 - eventDiscount / 100);

  // Round to 2 decimal places for currency
  return Math.round(finalPrice * 100) / 100;
}

/**
 * Calculate detailed discount breakdown for display purposes.
 *
 * @param basePrice - The original price of the product
 * @param studentDiscountPercentage - Student discount percentage (0-100), or null/undefined if not applicable
 * @param eventDiscountPercentage - Event discount percentage (0-100), or null/undefined if not applicable
 * @returns Detailed breakdown of all discounts applied
 */
export function calculateDiscountBreakdown(
  basePrice: number,
  studentDiscountPercentage: number | null | undefined,
  eventDiscountPercentage: number | null | undefined
): DiscountCalculation {
  const studentDiscount = studentDiscountPercentage ?? 0;
  const eventDiscount = eventDiscountPercentage ?? 0;

  // Calculate student discount amount on base price
  const studentDiscountAmount = Math.round((basePrice * studentDiscount / 100) * 100) / 100;
  const afterStudentDiscount = basePrice - studentDiscountAmount;

  // Calculate event discount amount on price after student discount
  const eventDiscountAmount = Math.round((afterStudentDiscount * eventDiscount / 100) * 100) / 100;
  const finalPrice = afterStudentDiscount - eventDiscountAmount;

  const totalDiscountAmount = Math.round((studentDiscountAmount + eventDiscountAmount) * 100) / 100;

  return {
    basePrice,
    studentDiscountPercentage: studentDiscount,
    eventDiscountPercentage: eventDiscount,
    studentDiscountAmount,
    eventDiscountAmount,
    totalDiscountAmount,
    finalPrice: Math.round(finalPrice * 100) / 100,
  };
}

/**
 * Get the highest percentage active event discount from a list of discounts.
 *
 * An event discount is considered active if:
 * - Its `active` flag is true
 * - The current date is between `startDate` and `endDate` (inclusive)
 *
 * When multiple active discounts exist, returns the one with the highest percentage.
 *
 * @param discounts - Array of event discounts to filter
 * @param referenceDate - Date to check against (defaults to current date)
 * @returns The active event discount with the highest percentage, or null if none are active
 */
export function getActiveEventDiscount(
  discounts: EventDiscount[],
  referenceDate: Date = new Date()
): EventDiscount | null {
  if (!discounts || discounts.length === 0) {
    return null;
  }

  const activeDiscounts = discounts.filter((discount) => {
    if (!discount.active) {
      return false;
    }

    const startDate = new Date(discount.startDate);
    const endDate = new Date(discount.endDate);

    // Check if reference date is within the discount period (inclusive)
    return referenceDate >= startDate && referenceDate <= endDate;
  });

  if (activeDiscounts.length === 0) {
    return null;
  }

  // Return the discount with the highest percentage
  return activeDiscounts.reduce((highest, current) =>
    current.percentage > highest.percentage ? current : highest
  );
}

/**
 * Get all currently active event discounts from a list.
 *
 * @param discounts - Array of event discounts to filter
 * @param referenceDate - Date to check against (defaults to current date)
 * @returns Array of active event discounts sorted by percentage (highest first)
 */
export function getActiveEventDiscounts(
  discounts: EventDiscount[],
  referenceDate: Date = new Date()
): EventDiscount[] {
  if (!discounts || discounts.length === 0) {
    return [];
  }

  return discounts
    .filter((discount) => {
      if (!discount.active) {
        return false;
      }

      const startDate = new Date(discount.startDate);
      const endDate = new Date(discount.endDate);

      return referenceDate >= startDate && referenceDate <= endDate;
    })
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Check if a user is eligible for student discounts.
 *
 * A user is eligible if they have an approved StudentVerification record.
 *
 * @param user - User object with optional student verification status
 * @returns True if the user is a verified student, false otherwise
 */
export function isStudentEligible(user: UserWithVerification | null | undefined): boolean {
  if (!user || !user.studentVerification) {
    return false;
  }

  return user.studentVerification.status === 'APPROVED';
}

/**
 * Format a discount percentage for display.
 *
 * @param percentage - Discount percentage (0-100)
 * @returns Formatted string like "10%" or "25.5%"
 */
export function formatDiscountPercentage(percentage: number): string {
  // Remove unnecessary decimal places (e.g., 10.00 -> 10, 10.50 -> 10.5)
  const formatted = percentage % 1 === 0
    ? percentage.toString()
    : percentage.toFixed(2).replace(/\.?0+$/, '');
  return `${formatted}%`;
}

/**
 * Check if a product has any discount available.
 *
 * @param studentDiscountPercentage - Product's student discount percentage
 * @param activeEventDiscount - Currently active event discount
 * @param isStudent - Whether the current user is a verified student
 * @returns True if any discount is applicable
 */
export function hasDiscount(
  studentDiscountPercentage: number | null | undefined,
  activeEventDiscount: EventDiscount | null,
  isStudent: boolean
): boolean {
  const hasStudentDiscount = isStudent && (studentDiscountPercentage ?? 0) > 0;
  const hasEventDiscount = activeEventDiscount !== null && activeEventDiscount.percentage > 0;

  return hasStudentDiscount || hasEventDiscount;
}
