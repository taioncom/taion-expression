/**
 * Math operations and constants
 */
export const mathFunctions: Record<
  string,
  (...args: readonly unknown[]) => unknown
> = {
  /** Returns the minimum of the given values */
  min: (...args: readonly unknown[]): number => {
    return Math.min(...args.map(Number));
  },

  /** Returns the maximum of the given values */
  max: (...args: readonly unknown[]): number => {
    return Math.max(...args.map(Number));
  },

  /** Rounds a number to the specified number of decimal places */
  round: (num: unknown, decimals?: unknown): number => {
    const n = Number(num);
    const d =
      decimals !== undefined && decimals !== null ? Number(decimals) : 0;
    if (d === 0) return Math.round(n);
    const factor = Math.pow(10, d);
    return Math.round(n * factor) / factor;
  },

  /** Returns the largest integer less than or equal to the number */
  floor: (num: unknown): number => {
    return Math.floor(Number(num));
  },

  /** Returns the smallest integer greater than or equal to the number */
  ceil: (num: unknown): number => {
    return Math.ceil(Number(num));
  },

  /** Returns the absolute value of a number */
  abs: (num: unknown): number => {
    return Math.abs(Number(num));
  },

  /** Returns base raised to the power of exp */
  pow: (base: unknown, exp: unknown): number => {
    return Math.pow(Number(base), Number(exp));
  },

  /** Returns the square root of a number */
  sqrt: (num: unknown): number => {
    return Math.sqrt(Number(num));
  },

  /** Returns the natural logarithm (base e) of a number */
  log: (num: unknown): number => {
    return Math.log(Number(num));
  },

  /** Returns the base-10 logarithm of a number */
  log10: (num: unknown): number => {
    return Math.log10(Number(num));
  },

  /** Returns the base-2 logarithm of a number */
  log2: (num: unknown): number => {
    return Math.log2(Number(num));
  },

  /** Returns the sign of a number: -1, 0, or 1 */
  sign: (num: unknown): number => {
    return Math.sign(Number(num));
  },

  /** Truncates the decimal part of a number (toward zero) */
  trunc: (num: unknown): number => {
    return Math.trunc(Number(num));
  },

  /** Returns the remainder of a / b */
  mod: (a: unknown, b: unknown): number => {
    return Number(a) % Number(b);
  },

  /** Constrains a value to the range [min, max] */
  clamp: (value: unknown, lo: unknown, hi: unknown): number => {
    const v = Number(value);
    const mn = Number(lo);
    const mx = Number(hi);
    return Math.min(Math.max(v, mn), mx);
  },

  /** Linear interpolation between a and b by factor t (0..1) */
  lerp: (a: unknown, b: unknown, t: unknown): number => {
    const na = Number(a);
    const nb = Number(b);
    const nt = Number(t);
    return na + (nb - na) * nt;
  },

  /** Returns the mathematical constant Pi */
  pi: (): number => Math.PI,

  /** Returns Euler's number e */
  e: (): number => Math.E,
};
