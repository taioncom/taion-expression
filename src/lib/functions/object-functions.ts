/**
 * Object operations
 */
export const objectFunctions: Record<
  string,
  (...args: readonly unknown[]) => unknown
> = {
  /** Returns an array of the object's own enumerable property names */
  keys: (obj: unknown): readonly string[] => {
    if (typeof obj !== 'object' || obj === null) return [];
    return Object.keys(obj);
  },

  /** Returns an array of the object's own enumerable property values */
  values: (obj: unknown): readonly unknown[] => {
    if (typeof obj !== 'object' || obj === null) return [];
    return Object.values(obj);
  },

  /** Returns an array of [key, value] pairs */
  entries: (obj: unknown): readonly unknown[] => {
    if (typeof obj !== 'object' || obj === null) return [];
    return Object.entries(obj);
  },

  /** Returns true if the object has the specified own property */
  hasKey: (obj: unknown, key: unknown): boolean => {
    if (typeof obj !== 'object' || obj === null) return false;
    return Object.prototype.hasOwnProperty.call(obj, String(key));
  },

  /** Shallow merges two objects, with obj2 properties overriding obj1 */
  merge: (obj1: unknown, obj2: unknown): Record<string, unknown> => {
    const a =
      typeof obj1 === 'object' && obj1 !== null
        ? (obj1 as Record<string, unknown>)
        : {};
    const b =
      typeof obj2 === 'object' && obj2 !== null
        ? (obj2 as Record<string, unknown>)
        : {};
    return { ...a, ...b };
  },

  /** Returns a new object with only the specified keys */
  pick: (
    obj: unknown,
    ...keys: readonly unknown[]
  ): Record<string, unknown> => {
    if (typeof obj !== 'object' || obj === null) return {};
    const source = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const k of keys) {
      const key = String(k);
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        result[key] = source[key];
      }
    }
    return result;
  },

  /** Returns a new object without the specified keys */
  omit: (
    obj: unknown,
    ...keys: readonly unknown[]
  ): Record<string, unknown> => {
    if (typeof obj !== 'object' || obj === null) return {};
    const source = obj as Record<string, unknown>;
    const keysToOmit = new Set(keys.map(String));
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(source)) {
      if (!keysToOmit.has(key)) {
        result[key] = source[key];
      }
    }
    return result;
  },

  /** Creates an object from an array of [key, value] pairs */
  fromEntries: (entries: unknown): Record<string, unknown> => {
    if (!Array.isArray(entries)) return {};
    const result: Record<string, unknown> = {};
    for (const entry of entries) {
      if (Array.isArray(entry) && entry.length >= 2) {
        result[String(entry[0])] = entry[1];
      }
    }
    return result;
  },
};
