import Decimal from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

export function toDecimal(value: number | string | Decimal) {
  return new Decimal(value || 0);
}

export function money(value: number | string | Decimal) {
  return toDecimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function moneyNumber(value: number | string | Decimal) {
  return money(value).toNumber();
}

export function moneyString(value: number | string | Decimal) {
  return money(value).toFixed(2);
}
