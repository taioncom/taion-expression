import { createCompilationError } from './types.js';

/**
 * Operators and coercions for `semantics: 'spreadsheet'`.
 *
 * - null/undefined propagate through arithmetic: any null operand gives null
 * - division and modulo by zero give null
 * - numeric strings ("100", "-3.5") act as numbers in arithmetic, comparison
 *   and equality; booleans count as 1 and 0
 * - `+` concatenates only when an operand is not numeric
 * - comparisons are numeric when both sides are numeric, else they compare
 *   the text (ISO dates compare correctly as text); a comparison with null is
 *   false
 * - `=` / `!=` with null are null-aware: `x = null` is true for null and
 *   undefined
 */

const isNullish = (value: unknown): boolean =>
  value === null || value === undefined;

/**
 * The numeric value of a number, numeric string, boolean or date; null for
 * anything else (including the empty string and non-finite numbers)
 */
export const toSpreadsheetNumber = (value: unknown): number | null => {
  if (isNullish(value) || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * Concatenate two strings, refusing results over the maximum length
 */
const concat = (left: string, right: string, maxLength: number): string => {
  if (left.length + right.length > maxLength) {
    throw createCompilationError(
      `String result exceeds the maximum length of ${maxLength} characters`,
      'MAX_STRING_LENGTH_EXCEEDED',
    );
  }
  return left + right;
};

/**
 * Apply an arithmetic operator (`+ - * / % ^`) with spreadsheet semantics
 */
const arithmetic = (
  operator: string,
  left: unknown,
  right: unknown,
  maxStringLength: number,
): unknown => {
  if (isNullish(left) || isNullish(right)) return null;
  const a = toSpreadsheetNumber(left);
  const b = toSpreadsheetNumber(right);

  if (operator === '+') {
    return a !== null && b !== null
      ? a + b
      : concat(String(left), String(right), maxStringLength);
  }
  if (a === null || b === null) return null;

  switch (operator) {
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b === 0 ? null : a / b;
    case '%':
      return b === 0 ? null : a % b;
    default: {
      const power = Math.pow(a, b);
      return Number.isFinite(power) ? power : null;
    }
  }
};

/**
 * Whether two values are equal with spreadsheet semantics
 */
const equals = (left: unknown, right: unknown): boolean => {
  if (isNullish(left) || isNullish(right)) {
    return isNullish(left) && isNullish(right);
  }
  const a = toSpreadsheetNumber(left);
  const b = toSpreadsheetNumber(right);
  return a !== null && b !== null ? a === b : String(left) === String(right);
};

/**
 * Apply an ordering comparison (`< <= > >=`) with spreadsheet semantics
 */
const compare = (operator: string, left: unknown, right: unknown): boolean => {
  if (isNullish(left) || isNullish(right)) return false;
  const a = toSpreadsheetNumber(left);
  const b = toSpreadsheetNumber(right);
  const [x, y] =
    a !== null && b !== null ? [a, b] : [String(left), String(right)];
  switch (operator) {
    case '>':
      return x > y;
    case '>=':
      return x >= y;
    case '<':
      return x < y;
    default:
      return x <= y;
  }
};

/**
 * Apply a non-logical binary operator with spreadsheet semantics
 */
export const spreadsheetBinary = (
  operator: string,
  left: unknown,
  right: unknown,
  maxStringLength: number,
): unknown => {
  switch (operator) {
    case '==':
      return equals(left, right);
    case '!=':
      return !equals(left, right);
    case '>':
    case '<':
    case '>=':
    case '<=':
      return compare(operator, left, right);
    case '+':
    case '-':
    case '*':
    case '/':
    case '%':
    case '^':
      return arithmetic(operator, left, right, maxStringLength);
    default:
      return null;
  }
};

/**
 * Apply a unary operator with spreadsheet semantics: `-` and `+` give null for
 * a non-numeric operand, `!` negates its truthiness
 */
export const spreadsheetUnary = (
  operator: string,
  argument: unknown,
): unknown => {
  if (operator === '!') return !argument;
  const n = toSpreadsheetNumber(argument);
  if (n === null) return null;
  return operator === '-' ? -n : n;
};
