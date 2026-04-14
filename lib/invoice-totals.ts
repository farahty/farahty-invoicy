import type { DiscountType } from "@/db/schema";

/**
 * Single source of truth for invoice totals.
 * Order: subtotal → discount → tax → total.
 *
 * The helper clamps the discount to [0, subtotal] defensively so a
 * legacy row (e.g. a fixed discount greater than the current subtotal
 * after items were removed) never produces a negative total. Callers
 * that accept user input should still run `validateDiscount` to reject
 * bad input up front.
 */
export function calculateInvoiceTotals(input: {
  items: { quantity: number; rate: number }[];
  taxRate: number;
  discountType: DiscountType;
  discountValue: number;
}) {
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );

  const rawDiscount =
    input.discountType === "percent"
      ? subtotal * (input.discountValue / 100)
      : input.discountValue;
  const discountAmount = Math.max(0, Math.min(rawDiscount, subtotal));

  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = discountedSubtotal * (input.taxRate / 100);
  const total = discountedSubtotal + taxAmount;

  return { subtotal, discountAmount, taxAmount, total };
}

/**
 * Returns the translation key suffix under `invoices.errors` if the
 * discount is invalid relative to `subtotal`, or `null` if it passes.
 */
export function validateDiscount(
  discountType: DiscountType,
  discountValue: number,
  subtotal: number
): string | null {
  if (discountValue < 0) return "discountNegative";
  if (discountType === "percent" && discountValue > 100)
    return "discountPercentOver100";
  if (discountType === "fixed" && discountValue > subtotal)
    return "discountExceedsSubtotal";
  return null;
}
