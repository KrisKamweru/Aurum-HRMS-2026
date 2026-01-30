import { mutation } from "./_generated/server";

export const seedKenyaTaxRules = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Create Tax Region
    const regionCode = "KE";

    // Check if region exists
    const existingRegion = await ctx.db
        .query("tax_regions")
        .withIndex("by_code", q => q.eq("code", regionCode))
        .first();

    if (!existingRegion) {
        await ctx.db.insert("tax_regions", {
            code: regionCode,
            name: "Kenya",
            currency: "KES",
            isActive: true,
            personalRelief: 2400, // KES 2,400 per month
            updatedAt: new Date().toISOString()
        });
    } else {
        // Update personal relief if needed, but for now just skip or patch
        await ctx.db.patch(existingRegion._id, {
            personalRelief: 2400,
            updatedAt: new Date().toISOString()
        });
    }

    // 2. Define Rules
    const rules = [
        // --- NSSF (Pension) ---
        // Tier 1: 6% of up to 7,000
        {
            regionCode,
            name: "NSSF Tier I",
            code: "NSSF_T1",
            type: "capped_percentage",
            rate: 0.06,
            cap: 420, // 6% of 7000
            appliesTo: "gross", // Deducted from gross to determine taxable?
                                // Actually usually calculated on gross pensionable pay.
            isEmployeeContribution: true,
            isEmployerContribution: false,
            isActive: true,
            order: 10, // First
            effectiveFrom: "2024-02-01",
        },
        // Employer NSSF T1
        {
            regionCode,
            name: "NSSF Tier I (Employer)",
            code: "NSSF_T1_ER",
            type: "capped_percentage",
            rate: 0.06,
            cap: 420,
            appliesTo: "gross",
            isEmployeeContribution: false,
            isEmployerContribution: true,
            isActive: true,
            order: 11,
            effectiveFrom: "2024-02-01",
        },
        // Tier 2: 6% of next 29,000 (total pensionable 36,000)
        // This is tricky with simple "capped_percentage" if we just apply to gross.
        // NSSF structure is:
        // Lower Limit (Tier 1): 6% of min(earnings, 7000)
        // Upper Limit (Tier 2): 6% of (min(earnings, 36000) - 7000)
        // The prompt asked for specific implementation:
        // "Tier I: 6% of first KES 7,000" -> Capped % (rate 0.06, cap 420) works if applied to gross.
        // "Tier II: 6% of next KES 29,000 (max KES 1,740)" -> This is hard with simple types unless we have a "bracket" or "remainder" type.
        // Or we use "progressive_bracket" for NSSF too?
        // Let's use 'progressive_bracket' for NSSF combined or separate?
        // The prompt specified "Tier I" and "Tier II" separate rules.
        // Let's model Tier 2 as a bracket-based calculation or capped percentage of (Gross - 7000)?
        // Current engine supports: progressive_bracket, percentage, tiered_fixed, capped_percentage.

        // If we use progressive_bracket for NSSF Total:
        // 0-7000: 6%
        // 7001-36000: 6%
        // 36001+: 0%
        // This would calculate the TOTAL NSSF.
        // But we want to separate Tier 1 and Tier 2?
        // Let's implement Tier 1 as capped_percentage.
        // Tier 2: We might need a new type or be creative.
        // If we use 'progressive_bracket':
        // 0-7000: 0% (Covered by Tier 1)
        // 7001-36000: 6%
        // This works for Tier 2 specifically.

        {
            regionCode,
            name: "NSSF Tier II",
            code: "NSSF_T2",
            type: "progressive_bracket",
            brackets: [
                { min: 0, max: 7000, rate: 0 },
                { min: 7001, max: 36000, rate: 0.06 },
                // Above 36000 is 0% for Tier 2
            ],
            appliesTo: "gross",
            isEmployeeContribution: true,
            isEmployerContribution: false,
            isActive: true,
            order: 12,
            effectiveFrom: "2024-02-01",
        },
        {
            regionCode,
            name: "NSSF Tier II (Employer)",
            code: "NSSF_T2_ER",
            type: "progressive_bracket",
            brackets: [
                { min: 0, max: 7000, rate: 0 },
                { min: 7001, max: 36000, rate: 0.06 },
            ],
            appliesTo: "gross",
            isEmployeeContribution: false,
            isEmployerContribution: true,
            isActive: true,
            order: 13,
            effectiveFrom: "2024-02-01",
        },

        // --- Housing Levy ---
        // 1.5% of Gross
        {
            regionCode,
            name: "Housing Levy",
            code: "HOUSING_LEVY",
            type: "percentage",
            rate: 0.015,
            appliesTo: "gross",
            isEmployeeContribution: true,
            isEmployerContribution: false,
            isActive: true,
            order: 20,
            effectiveFrom: "2024-01-01",
        },
        {
            regionCode,
            name: "Housing Levy (Employer)",
            code: "HOUSING_LEVY_ER",
            type: "percentage",
            rate: 0.015,
            appliesTo: "gross",
            isEmployeeContribution: false,
            isEmployerContribution: true,
            isActive: true,
            order: 21,
            effectiveFrom: "2024-01-01",
        },

        // --- PAYE ---
        // Calculated on Taxable Income (Gross - NSSF - maybe Housing Levy depending on court rulings, but usually just Pension is deductible in KE)
        // Currently Housing Levy is NOT tax deductible in Kenya as of 2024 (subject to change, but safe assumption).
        // NSSF IS tax deductible.
        // My engine assumes 'appliesTo: taxable' uses the running total reduced by deductible items.
        // In tax_calculator.ts, I hardcoded NSSF as deductible.
        {
            regionCode,
            name: "PAYE",
            code: "PAYE",
            type: "progressive_bracket",
            brackets: [
                { min: 0, max: 24000, rate: 0.10 },
                { min: 24001, max: 32333, rate: 0.25 },
                { min: 32334, max: 500000, rate: 0.30 },
                { min: 500001, max: 800000, rate: 0.325 },
                { min: 800001, max: null, rate: 0.35 },
            ],
            appliesTo: "taxable",
            isEmployeeContribution: true,
            isEmployerContribution: false,
            isActive: true,
            order: 30, // Must be after NSSF
            effectiveFrom: "2024-01-01",
        },

        // --- SHIF / NHIF ---
        // 2.75% of Gross (New SHIF) or Old NHIF bands?
        // Prompt says "NHIF/SHIF (2024 bands)" and lists the fixed bands.
        // So we use the tiered_fixed model.
        {
            regionCode,
            name: "NHIF",
            code: "NHIF",
            type: "tiered_fixed",
            brackets: [
                { min: 0, max: 5999, fixedAmount: 150 },
                { min: 6000, max: 7999, fixedAmount: 300 },
                { min: 8000, max: 11999, fixedAmount: 400 },
                { min: 12000, max: 14999, fixedAmount: 500 },
                { min: 15000, max: 19999, fixedAmount: 600 },
                { min: 20000, max: 24999, fixedAmount: 750 },
                { min: 25000, max: 29999, fixedAmount: 850 },
                { min: 30000, max: 34999, fixedAmount: 900 },
                { min: 35000, max: 39999, fixedAmount: 950 },
                { min: 40000, max: 44999, fixedAmount: 1000 },
                { min: 45000, max: 49999, fixedAmount: 1100 },
                { min: 50000, max: 59999, fixedAmount: 1200 },
                { min: 60000, max: 69999, fixedAmount: 1300 },
                { min: 70000, max: 79999, fixedAmount: 1400 },
                { min: 80000, max: 89999, fixedAmount: 1500 },
                { min: 90000, max: 99999, fixedAmount: 1600 },
                { min: 100000, max: null, fixedAmount: 1700 },
            ],
            appliesTo: "gross",
            isEmployeeContribution: true,
            isEmployerContribution: false,
            isActive: true,
            order: 40,
            effectiveFrom: "2024-01-01",
        }
    ];

    // 3. Clear existing rules for this region to avoid duplicates if re-seeding
    const existingRules = await ctx.db
        .query("tax_rules")
        .withIndex("by_region", q => q.eq("regionCode", regionCode))
        .collect();

    for (const rule of existingRules) {
        await ctx.db.delete(rule._id);
    }

    // 4. Insert Rules
    for (const rule of rules) {
        await ctx.db.insert("tax_rules", rule as any);
    }

    return { success: true, message: "Kenyan tax rules seeded successfully" };
  }
});
