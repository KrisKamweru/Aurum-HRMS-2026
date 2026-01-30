import { v } from "convex/values";
import { query, QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// --- Types ---

export interface TaxBracket {
  min: number;
  max: number | null; // null represents infinity
  rate?: number;
  fixedAmount?: number;
}

export interface DeductionResult {
  name: string;
  code: string;
  amount: number;
  type: string;
  isEmployerContribution: boolean;
}

export interface TaxCalculationResult {
  deductions: DeductionResult[];
  totalEmployeeDeductions: number;
  totalEmployerDeductions: number;
  taxableIncome: number;
  netPay: number;
}

// --- Queries ---

export const getActiveRules = query({
  args: { regionCode: v.string() },
  handler: async (ctx, args) => {
    return await fetchActiveRules(ctx, args.regionCode);
  },
});

export const getTaxRegion = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("tax_regions")
            .withIndex("by_code", (q) => q.eq("code", args.code))
            .first();
    }
});

// --- Internal Helpers (can be used by payroll.ts) ---

export async function fetchActiveRules(ctx: QueryCtx, regionCode: string) {
  return await ctx.db
    .query("tax_rules")
    .withIndex("by_region_active", (q) =>
      q.eq("regionCode", regionCode).eq("isActive", true)
    )
    .collect();
}

/**
 * Main calculation logic.
 * Assumes rules are sorted by 'order' to ensure correct dependency chain (e.g. Pension before PAYE).
 */
export function calculateTaxDeductions(
  grossSalary: number,
  basicSalary: number,
  initialTaxableIncome: number,
  rules: Doc<"tax_rules">[],
  personalRelief: number = 0
): TaxCalculationResult {
  let currentTaxableBase = initialTaxableIncome;

  const deductions: DeductionResult[] = [];

  // Sort rules just in case they aren't
  const sortedRules = [...rules].sort((a, b) => a.order - b.order);

  for (const rule of sortedRules) {
    let basisAmount = 0;

    // Determine basis
    if (rule.appliesTo === "gross") basisAmount = grossSalary;
    else if (rule.appliesTo === "basic") basisAmount = basicSalary;
    else if (rule.appliesTo === "taxable") basisAmount = currentTaxableBase;

    let amount = 0;

    switch (rule.type) {
      case "progressive_bracket":
        amount = calculateProgressiveBracket(basisAmount, rule.brackets as TaxBracket[]);
        break;
      case "percentage":
        amount = calculatePercentage(basisAmount, rule.rate || 0);
        break;
      case "tiered_fixed":
        amount = calculateTieredFixed(basisAmount, rule.brackets as TaxBracket[]);
        break;
      case "capped_percentage":
        amount = calculateCappedPercentage(basisAmount, rule.rate || 0, rule.cap || 0);
        break;
    }

    // Special handling for PAYE personal relief
    if (rule.code === "PAYE" && personalRelief > 0) {
        amount = Math.max(0, amount - personalRelief);
    }

    // Add to list
    deductions.push({
      name: rule.name,
      code: rule.code,
      amount: amount,
      type: rule.code === "PAYE" ? "tax" : "statutory",
      isEmployerContribution: !!rule.isEmployerContribution,
    });

    // If this is an employee deduction that is tax-deductible (like NSSF), reduce currentTaxableBase
    // For now, we'll assume specific codes are deductible or add a flag to schema later.
    // In Kenya, NSSF is deductible.
    // Let's hardcode for the MVP based on standard patterns or add a 'isTaxDeductible' field.
    // Given the prompt didn't ask for 'isTaxDeductible' field, I will infer it or just handle standard Kenya logic:
    // NSSF (Tier 1/2) is deductible.
    if (["NSSF_T1", "NSSF_T2", "NSSF"].includes(rule.code) && !rule.isEmployerContribution) {
        currentTaxableBase -= amount;
    }
  }

  const totalEmployeeDeductions = deductions
    .filter(d => !d.isEmployerContribution)
    .reduce((sum, d) => sum + d.amount, 0);

  const totalEmployerDeductions = deductions
    .filter(d => d.isEmployerContribution)
    .reduce((sum, d) => sum + d.amount, 0);

  return {
    deductions,
    totalEmployeeDeductions,
    totalEmployerDeductions,
    taxableIncome: currentTaxableBase,
    netPay: grossSalary - totalEmployeeDeductions
  };
}

// --- Calculation Implementations ---

function calculatePercentage(amount: number, rate: number): number {
  return amount * rate;
}

function calculateCappedPercentage(amount: number, rate: number, cap: number): number {
  const calculated = amount * rate;
  return cap > 0 ? Math.min(calculated, cap) : calculated;
}

function calculateTieredFixed(amount: number, brackets: TaxBracket[]): number {
  // Find the bracket that contains the amount
  const bracket = brackets.find(b =>
    amount >= b.min && (b.max === null || amount <= b.max)
  );
  return bracket ? (bracket.fixedAmount || 0) : 0;
}

function calculateProgressiveBracket(amount: number, brackets: TaxBracket[]): number {
  let remaining = amount;
  let totalTax = 0;

  // Sort brackets by min just to be safe
  const sortedBrackets = [...brackets].sort((a, b) => a.min - b.min);

  for (const bracket of sortedBrackets) {
    if (remaining <= 0) break;

    const rangeMax = bracket.max === null ? Infinity : bracket.max;
    // The width of this bracket.
    // Careful: brackets are usually defined as "0-24000", "24001-32333".
    // So width is (max - min) + 1 ? Or just standard tax bracket logic.
    // Let's look at the prompt's bracket definition:
    // 0 - 24,000: 10%
    // 24,001 - 32,333: 25%
    // This implies distinct bands.
    // Tax is usually calculated on the portion of income IN that band.

    // Amount taxable in this band:
    // The intersection of [0, amount] and [min, max]

    const bandBottom = bracket.min;
    // Effective top is min(amount, max)
    const effectiveTop = Math.min(amount, rangeMax);

    if (effectiveTop >= bandBottom) {
       // However, typical bracket definitions (like the prompt) are absolute tiers.
       // 0-24000.
       // 24001-32333.
       // If I have 30,000 income:
       // First 24,000 taxed at 10%.
       // Remaining (30,000 - 24,000) taxed at 25%.

       // Note: The prompt says "24,001". This means the previous ended at 24,000.
       // My logic needs to handle the "previous limit".

       // Standard algorithm:
       // Iterate through sorted brackets.
       // Calculate taxable amount in this bracket.

       // We can treat the bracket as "Next X amount is taxed at Y%".
       // Or "Amount between A and B is taxed at Y%".

       // For "0 - 24,000": Width is 24,000.
       // For "24,001 - 32,333": Width is 32,333 - 24,000 = 8,333.

       // Let's use the explicit min/max from config.
       // But we need to be careful about overlaps or gaps.
       // Assuming clean data:
       // Amount taxable in this bracket = Math.min(amount, max) - (min - 1) ??
       // No, simpler:
       // For 24,001 - 32,333.
       // If income is 30,000.
       // Taxable in this band is 30,000 - 24,000 (previous max).

       // Alternative approach: Cumulative calculation.
       // But let's stick to band width.

       const previousMax = bracket.min > 0 ? bracket.min - 1 : 0; // Approximating previous boundary
       // Actually, let's just use the band width if we can infer it, or pure logic:
       // Taxable amount in this band = Math.max(0, Math.min(amount, rangeMax) - (bracket.min > 0 ? bracket.min - 1 : 0));

       // Let's verify with 24,001.
       // bracket min = 24001.
       // rangeMax = 32333.
       // amount = 30000.
       // Math.min(30000, 32333) = 30000.
       // bracket.min - 1 = 24000.
       // 30000 - 24000 = 6000. Correct.

       // What about first bracket 0 - 24000?
       // min=0.
       // amount = 30000.
       // min(30000, 24000) = 24000.
       // min-1 = -1? No.
       // Let's refine the "previous max" logic.
       // If min is 0, start is 0.
       // If min is 24001, start is 24000?
       // The prompt brackets are inclusive integers.

       // Let's assume the "start of taxable range" for the bracket is `bracket.min`.
       // BUT, standard tax tables work on "first 24000", "next 8333".
       // If the DB stores "0-24000", the amount taxable is up to 24000.
       // If the DB stores "24001-32333", the amount taxable starts counting AFTER 24000.

       // So:
       const lowerBound = bracket.min === 0 ? 0 : bracket.min - 1;
       const upperBound = bracket.max === null ? Infinity : bracket.max;

       const taxableInThisBand = Math.max(0, Math.min(amount, upperBound) - lowerBound);

       if (taxableInThisBand > 0) {
         totalTax += taxableInThisBand * (bracket.rate || 0);
       }
    }
  }

  return totalTax;
}
