// src/shared/utils/price.ts
export const round2 = (n: number) => Math.round(n * 100) / 100;

// `discount` is treated as a fixed amount, matching your cart service.
// If it's a percentage, use: (baseSalary + profit) * (1 - (discount ?? 0) / 100)
export const getUnitPrice = (p: { baseSalary: number; profit: number; discount: number | null }) =>
    round2(Math.max(p.baseSalary + p.profit - (p.discount ?? 0), 0));