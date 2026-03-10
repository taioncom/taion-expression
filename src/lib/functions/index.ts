import { arrayFunctions } from './array-functions.js';
import {
  arrayHigherOrderFunctions,
  contextPassingFunctions,
} from './array-higher-order.js';
import { dateFunctions } from './date-functions.js';
import { mathFunctions } from './math-functions.js';
import { objectFunctions } from './object-functions.js';
import { regexFunctions } from './regex-functions.js';
import { stringFunctions } from './string-functions.js';
import { trigFunctions } from './trig-functions.js';
import { typeFunctions } from './type-functions.js';
import { utilityFunctions } from './utility-functions.js';

/** All built-in functions combined */
export const builtInFunctions: Record<
  string,
  (...args: readonly unknown[]) => unknown
> = {
  ...stringFunctions,
  ...mathFunctions,
  ...trigFunctions,
  ...arrayFunctions,
  ...arrayHigherOrderFunctions,
  ...objectFunctions,
  ...typeFunctions,
  ...dateFunctions,
  ...regexFunctions,
  ...utilityFunctions,
};

export { contextPassingFunctions };
