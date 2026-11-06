import { definitionOf } from './custom-functions.js';
import { arrayFunctions } from './functions/array-functions.js';
import { arrayHigherOrderFunctions } from './functions/array-higher-order.js';
import { dateFunctions } from './functions/date-functions.js';
import { mathFunctions } from './functions/math-functions.js';
import { objectFunctions } from './functions/object-functions.js';
import { regexFunctions } from './functions/regex-functions.js';
import { stringFunctions } from './functions/string-functions.js';
import { trigFunctions } from './functions/trig-functions.js';
import { typeFunctions } from './functions/type-functions.js';
import { utilityFunctions } from './functions/utility-functions.js';
import { ExpressionOptions, ParamSpec } from './types.js';

/**
 * A function an expression can call, as listed by `describeFunctions`
 */
export type FunctionDescription = {
  readonly name: string;
  readonly source: 'builtin' | 'custom';
  readonly category?: string;
  readonly description?: string;
  readonly params?: readonly ParamSpec[];
  readonly returns?: string;
};

/** Built-in function groups and their category names */
const BUILTIN_GROUPS: readonly (readonly [string, object])[] = [
  ['string', stringFunctions],
  ['math', mathFunctions],
  ['trigonometry', trigFunctions],
  ['array', arrayFunctions],
  ['higher-order', arrayHigherOrderFunctions],
  ['object', objectFunctions],
  ['type', typeFunctions],
  ['date', dateFunctions],
  ['regex', regexFunctions],
  ['utility', utilityFunctions],
];

/**
 * The functions expressions can call with these options: the built-ins (by
 * category; higher-order ones only with enableArrowFunctions) and the custom
 * functions with what their definitions declare. A custom function replaces
 * a built-in of the same name.
 */
export const describeFunctions = (
  options: ExpressionOptions = {},
): readonly FunctionDescription[] => {
  const custom = options.customFunctions ?? {};
  const customNames = new Set(Object.keys(custom));
  const builtins = BUILTIN_GROUPS.filter(
    ([category]) =>
      category !== 'higher-order' || options.enableArrowFunctions === true,
  ).reduce<readonly FunctionDescription[]>(
    (all, [category, group]) => [
      ...all,
      ...Object.keys(group)
        .filter((name) => !customNames.has(name))
        .map(
          (name): FunctionDescription => ({
            name,
            source: 'builtin',
            category,
          }),
        ),
    ],
    [],
  );
  const customs = Object.entries(custom).map(
    ([name, entry]): FunctionDescription => {
      const def = definitionOf(entry);
      return {
        name,
        source: 'custom',
        category: def.category,
        description: def.description,
        params: def.params,
        returns: def.returns,
      };
    },
  );
  return [...builtins, ...customs];
};
