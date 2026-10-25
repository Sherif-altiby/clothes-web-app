// src/shared/utils/price.ts
export const round2 = (n: number) => Math.round(n * 100) / 100;

export const FREE_SHIPPING_THRESHOLD = 100;
export const SHIPPING_FEE = 9.99;

export const getShippingCost = (subtotal: number) =>
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

export const getUnitPrice = (p: { baseSalary: number; profit: number; discount: number | null }) =>
    round2(Math.max(round2(p.baseSalary + p.profit), 0) * (1 - (p.discount ?? 0) / 100));