/**
 * Trigonometric functions
 */
export const trigFunctions: Record<
  string,
  (...args: readonly unknown[]) => unknown
> = {
  /** Returns the sine of a value in radians */
  sin: (rad: unknown): number => Math.sin(Number(rad)),

  /** Returns the cosine of a value in radians */
  cos: (rad: unknown): number => Math.cos(Number(rad)),

  /** Returns the tangent of a value in radians */
  tan: (rad: unknown): number => Math.tan(Number(rad)),

  /** Returns the arc sine (in radians) of a number */
  asin: (num: unknown): number => Math.asin(Number(num)),

  /** Returns the arc cosine (in radians) of a number */
  acos: (num: unknown): number => Math.acos(Number(num)),

  /** Returns the arc tangent (in radians) of a number */
  atan: (num: unknown): number => Math.atan(Number(num)),

  /** Returns the angle (in radians) from the X axis to the point (x, y) */
  atan2: (y: unknown, x: unknown): number => Math.atan2(Number(y), Number(x)),
};
