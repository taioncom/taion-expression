# Taion Expression

A safe, sandboxed expression language for parsing and evaluating user-provided expressions. Parses expressions into an Abstract Syntax Tree (AST) that is securely interpreted with a given context.

## Install

```bash
npm install @taioncom/taion-expression
```

## Purpose

This library provides a controlled environment for evaluating expressions written by external users for purposes such as:

- Filtering data
- Defining workflow logic
- Creating dynamic rules
- Conditional processing

Since expressions can be written by external users, the language is designed to be safe, predictable, and limited in scope to prevent security issues.

## Language Specification

### Data Types

- **Number**: Integer and floating-point numbers (e.g., `42`, `3.14`)
- **String**: Text enclosed in single or double quotes (e.g., `"hello"`, `'world'`). Backtick strings (`` `template` ``) are template literals and require `enableTemplateStrings: true`
- **Boolean**: `true` or `false`
- **Null**: `null`
- **Array**: Ordered collection of values (e.g., `[1, 2, 3]`)
- **Date**: Date/time values created via built-in functions (e.g., `now()`, `date(2024, 3, 15)`)

### Variables

Variables are referenced by name and resolved from the context object provided during evaluation:

```
user.name
items.length
settings.enabled
```

### Operators

#### Arithmetic Operators

- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`
- Division: `/`
- Modulo: `%`
- Exponentiation: `^`
- Unary negation: `-` (e.g., `-5`)

#### Comparison Operators

- Equal: `==` or `=` (strict equality)
- Not equal: `!=` (strict inequality)
- Greater than: `>`
- Less than: `<`
- Greater than or equal: `>=`
- Less than or equal: `<=`

`<`, `<=`, `>`, `>=` compare two strings alphabetically; otherwise both sides are converted to numbers.

A `Date` compared with another `Date` or with an ISO 8601 date string (`'2026-10-15'`, `'2026-10-15T12:00:00Z'`) compares by time, with `==`/`!=` too: `createdAt >= '2026-10-01'`. A date alone is UTC midnight; a date-time without an offset is local time. With the `timeZone` option (an IANA zone such as `'Europe/Helsinki'`), a `Date` against a date alone compares by calendar day in that zone: `createdAt >= '2026-10-01'` is "on or after October 1 there" and `createdAt <= '2026-10-19'` includes the whole 19th; an unknown zone fails compilation with `INVALID_TIME_ZONE`.

#### Logical Operators

- AND: `&&` or `and`
- OR: `||` or `or`
- NOT: `!` or `not`

#### String Operators

- Concatenation: `+` (e.g., `"Hello" + " " + "World"`)
- Template literals: `` `Hello, ${name}!` `` (with `enableTemplateStrings` option)

#### Array Operators

- Indexing: `array[index]` (with `enableArrays` option)

#### Arrow Functions

When the `enableArrowFunctions` option is enabled, you can use arrow functions (lambdas):

- Single parameter without parentheses: `x => x * 2`
- Multiple parameters: `(x, y) => x + y`
- No parameters: `() => 42`

### Operator Precedence

Operators are evaluated in the following order (from highest to lowest precedence):

1. Parentheses `()`
2. Exponentiation `^` (right-associative: `-2 ^ 2` is -4, `2 ^ 3 ^ 2` is 512)
3. Unary operators `+`, `-`, `!`/`not`
4. Multiplication, division, modulo `*`, `/`, `%`
5. Addition, subtraction `+`, `-`
6. Comparison operators `<`, `<=`, `>`, `>=`
7. Equality operators `==`/`=`, `!=`
8. Logical AND `&&`/`and`
9. Logical OR `||`/`or`

### Control Flow

#### Conditional (Ternary) Expression

```
condition ? trueExpression : falseExpression
```

#### If-Then-Else Expression

The if-then-else expression allows for conditional logic:

```
if (condition) then expression1 else expression2
```

- `condition` uses JavaScript truthiness: `false`, `null`, `0`, `NaN` and `""` are falsy, everything else is truthy
- `expression1` is evaluated if the condition is truthy
- `expression2` is evaluated otherwise
- The branches may return values of different types

Example:

```
if (user.age >= 18) then "Adult" else "Minor"
```

### Template Strings

With the `enableTemplateStrings` option, you can use template literals with string interpolation:

```
`Hello, ${name}! You are ${age} years old.`
```

This allows for more readable string construction with embedded expressions.

### Arrays

With the `enableArrays` option, you can create and manipulate arrays:

```
// Array literal
[1, 2, 3, 4, 5]

// Array with expressions
[a, b + c, func()]

// Array indexing
items[0]
matrix[row][col]
```

### Functions

Functions must be pre-registered in the evaluation context to be available for use. This ensures only safe, allowed functions can be called.

Function calls use the following syntax:

```
functionName(argument1, argument2, ...)
```

#### Built-in Functions

The language includes several safe built-in functions:

##### String Functions

- `length(str)`, `contains(str, sub)`, `startsWith(str, prefix)`, `endsWith(str, suffix)`
- `toLowerCase(str)`, `toUpperCase(str)`, `substring(str, start, end?)`, `trim(str)`, `trimStart(str)`, `trimEnd(str)`
- `replace(str, search, replacement)` (replaces all occurrences), `split(str, separator)`, `indexOf(str, search)`, `lastIndexOf(str, search)`
- `capitalize(str, allWords?)`, `padLeft(value, len, pad?)`, `padRight(value, len, pad?)`
- `repeat(str, n)`, `charAt(str, index)`, `includes(strOrArray, search)`, `concat(...values)`

##### Math Functions

- **Basic**: `min(...values)`, `max(...values)` (variadic), `round(num, decimals?)`, `floor(num)`, `ceil(num)`, `abs(num)`
- **Advanced**: `pow(base, exp)`, `sqrt(num)`, `log(num)`, `log10(num)`, `log2(num)`, `sign(num)`, `trunc(num)`, `mod(a, b)`
- **Interpolation**: `clamp(value, min, max)`, `lerp(a, b, t)`
- **Constants**: `pi()`, `e()`

##### Trigonometric Functions

- `sin(rad)`, `cos(rad)`, `tan(rad)`, `asin(num)`, `acos(num)`, `atan(num)`, `atan2(y, x)`

##### Array Functions

- **Basic**: `length(array)`, `sum(array)`, `avg(array)`, `arrayContains(array, value)`, `count(array)`
- **Access**: `first(array)`, `last(array)`, `slice(array, start, end?)`
- **Transform**: `join(array, separator)`, `sort(array)`, `reverse(array)`, `unique(array)`, `compact(array)`, `flat(array, depth?)`
- **Generate**: `range(start, end, step?)`
- **Reshape**: `chunk(array, size)`, `zip(arr1, arr2)`

##### Statistical Functions

- `median(array)`, `stddev(array)`, `variance(array)`, `percentile(array, p)`

##### Higher-Order Array Functions (require `enableArrowFunctions`)

- **Iterate**: `map(array, fn)`, `filter(array, fn)`, `find(array, fn)`, `findIndex(array, fn)`, `reduce(array, fn, initial?)`, `every(array, fn)`, `some(array, fn)`
- **Sort/Group**: `sortBy(array, fn)`, `groupBy(array, fn)`, `distinctBy(array, fn)`
- **Aggregate**: `minBy(array, fn)`, `maxBy(array, fn)`, `sumBy(array, fn)`, `countBy(array, fn)`

##### Object Functions

- `keys(object)`, `values(object)`, `entries(object)`
- `hasKey(object, key)`, `merge(obj1, obj2)`, `pick(object, ...keys)`, `omit(object, ...keys)`, `fromEntries(entries)`

##### Type Checking

- `type(value)`: Returns `'number'`, `'string'`, `'boolean'`, `'array'`, `'object'`, `'date'`, `'null'`, or another `typeof` result such as `'undefined'`
- `isNull(value)`, `isUndefined(value)`, `isDefined(value)`, `isNumber(value)`, `isString(value)`
- `isBoolean(value)`, `isObject(value)`, `isArray(value)`, `isDate(value)`, `isEmpty(value)`

##### Conversion

- `toString(value)`, `toNumber(value)`, `toBoolean(value)`, `toInteger(value)`, `toDate(value)`
- `toFixed(num, digits)`, `parseInt(str, radix?)`, `parseFloat(str)`

##### Utility

- `coalesce(...values)`: Returns the first non-null/undefined value
- `ifElse(condition, thenValue, elseValue)`: Inline conditional
- `defaultTo(value, fallback)`: Returns fallback if value is null/undefined/NaN
- `jsonStringify(value)`, `jsonParse(str)`

##### Random

- `random()`, `randomInt(min, max)`

##### Regex

- `regexTest(str, pattern)`, `regexMatch(str, pattern)`, `regexReplace(str, pattern, replacement)`
- Patterns longer than 200 characters or containing nested quantifiers (e.g. `(a+)+`) or backreferences are rejected (result `false` / `null` / input unchanged), as are inputs over 100000 characters. This is a ReDoS heuristic, not a guarantee.

##### Date Functions

- **Creation**: `now()`, `date(y, m, d, h?, min?, s?, ms?)` (month 1-based), `parseDate(str)`, `toDate(value)`
- **Extraction**: `year(date)`, `month(date)` (1-12), `day(date)`, `hour(date)`, `minute(date)`, `second(date)`, `dayOfWeek(date)` (0=Sun), `timestamp(date)`
- **Formatting**: `formatDate(date, pattern?)` (tokens: `yyyy`, `yy`, `MM`, `dd`, `HH`, `mm`, `ss`, `SSS`), `toISOString(date)`
- **Arithmetic**: `dateAdd(date, amount, unit)`, `dateDiff(d1, d2, unit)` (units: years, months, weeks, days, hours, minutes, seconds, milliseconds; months/years use calendar-aware calculation)
- **Utilities**: `startOfDay(date)`, `endOfDay(date)`, `startOfMonth(date)`, `endOfMonth(date)`, `dateBetween(date, start, end)`

#### Custom Functions

Custom functions can be registered during initialization:

```javascript
import { evaluateExpression } from '@taioncom/taion-expression';

const options = {
  customFunctions: {
    greet: (name) => `Hello, ${name}!`,
    calculateTax: (amount, rate) => amount * (rate / 100),
  },
};

const result = evaluateExpression('greet(name)', { name: 'John' }, options);
console.log(result.result); // "Hello, John!"
```

## Security Features

The expression evaluator includes several security features to ensure safe evaluation:

### Property Access Control

Control which properties can be accessed through allowlists and denylists:

```javascript
// Only allow these properties to be accessed
const options = {
  allowedProperties: ['name', 'age', 'score'],
};

// Deny access to these properties
const options = {
  deniedProperties: ['password', 'secretKey', 'token'],
};
```

Denied patterns apply to context variables, dot and bracket access, and function names. The allowlist applies to values read out of the context; path segments used only to reach a child, and built-in/custom function names, are exempt. An empty allowlist allows everything. This is access control, not data redaction: functions like `values` or `jsonStringify` see whole objects the expression can reference.

### Timeout Control

Prevent infinite loops and expensive calculations by setting a maximum execution time:

```javascript
const options = { timeout: 1000 }; // 1 second timeout
const result = evaluateExpression('complexExpression', context, options);
```

### Prototype Access Prevention

By default, the evaluator prevents access to object prototypes to avoid prototype pollution:

```javascript
// Only enable if absolutely needed and you trust the input
const options = { allowPrototypeAccess: false }; // Default
```

### Call Stack Depth Limiting

Prevent stack overflow attacks by limiting call stack depth:

```javascript
const options = { maxCallStackDepth: 50 }; // Default
```

### Expression Complexity Limiting

Limit the size of expressions to prevent resource exhaustion. `maxComplexity` is the maximum number of AST nodes and `maxExpressionLength` the maximum source length; both are checked at compile time:

```javascript
const options = { maxComplexity: 100, maxExpressionLength: 10000 }; // Defaults
```

Strings produced by expressions are capped at 1,000,000 characters.

### Loop Iteration Limiting

Prevent infinite loops by limiting the number of iterations:

```javascript
const options = { maxLoopIterations: 10000 }; // Default
```

### Feature Toggle

Enable or disable specific features based on your needs:

```javascript
// Enable template string support
const options = { enableTemplateStrings: true };

// Enable array literals and indexing
const options = { enableArrays: true };

// Enable arrow functions
const options = { enableArrowFunctions: true };
```

### Spreadsheet-style Expressions

Opt-in options for expressions written by business users (see the [Spreadsheet-style Expressions guide](https://taioncom.github.io/taion-expression/docs/guides/spreadsheet-style)):

```javascript
const options = {
  // Keywords and function names in any case: AND, NULL, CONCAT(...)
  caseInsensitiveNames: true,
  // null propagates, x / 0 is null, numeric strings act as numbers
  semantics: 'spreadsheet',
  // Unknown function names fail at compile time (UNKNOWN_FUNCTION)
  strictFunctions: true,
};
```

`analyzeExpression(expression, options)` validates an expression without evaluating it and returns its AST, the context paths it reads (`identifiers`) and the functions it calls (`functions`). Identifiers may start with `$` (`$CURRENT_USER`).

## Usage

### Basic Example

```javascript
import { evaluateExpression } from '@taioncom/taion-expression';

// Simple arithmetic
const result = evaluateExpression('2 + 3 * 4');
console.log(result.result); // 14

// With context
const context = {
  user: {
    name: 'John',
    age: 25,
  },
};

const ageCheck = evaluateExpression(
  'user.age >= 18 ? "Adult" : "Minor"',
  context,
);
console.log(ageCheck.result); // "Adult"
```

### Template Strings Example

```javascript
import { evaluateExpression } from '@taioncom/taion-expression';

const context = { name: 'John', age: 30 };
const options = { enableTemplateStrings: true };

const greeting = evaluateExpression(
  '`Hello, ${name}! You are ${age} years old.`',
  context,
  options,
);
console.log(greeting.result); // "Hello, John! You are 30 years old."
```

### Array Example

```javascript
import { evaluateExpression } from '@taioncom/taion-expression';

const context = {
  items: ['apple', 'banana', 'cherry'],
  index: 1,
  numbers: [1, 2, 3, 4, 5],
};
const options = { enableArrays: true };

// Basic array indexing
const item = evaluateExpression('items[index]', context, options);
console.log(item.result); // "banana"

// Array literals
const newArray = evaluateExpression('[1, 2, 3, 4, 5]', {}, options);
console.log(newArray.result); // [1, 2, 3, 4, 5]

// Using array functions for operations
const joined = evaluateExpression('join(items, ", ")', context, options);
console.log(joined.result); // "apple, banana, cherry"

const isSorted = evaluateExpression('sort(numbers)', context, options);
console.log(isSorted.result); // [1, 2, 3, 4, 5]

const reversed = evaluateExpression('reverse(numbers)', context, options);
console.log(reversed.result); // [5, 4, 3, 2, 1]

// Using pre-defined helper functions
const sumArray = evaluateExpression('sum(numbers)', context, options);
console.log(sumArray.result); // 15

const avgValue = evaluateExpression('avg(numbers)', context, options);
console.log(avgValue.result); // 3

// Using arrow functions (requires enableArrowFunctions option)
const arrowOptions = {
  enableArrays: true,
  enableArrowFunctions: true,
};

// Use arrow functions directly in expressions
// When enableArrowFunctions option is true
const doubledNumbers = evaluateExpression(
  'map(numbers, x => x * 2)',
  context,
  arrowOptions,
);
console.log(doubledNumbers.result); // [2, 4, 6, 8, 10]

const evenNumbers = evaluateExpression(
  'filter(numbers, x => x % 2 == 0)',
  context,
  arrowOptions,
);
console.log(evenNumbers.result); // [2, 4]

// Arrow functions work with multiple parameters too
const sum = evaluateExpression(
  'reduce(numbers, (acc, x) => acc + x, 0)',
  context,
  arrowOptions,
);
console.log(sum.result); // 15

// And with empty parameter lists
const constant = evaluateExpression(
  'execute(() => 42)',
  { execute: (fn) => fn() },
  arrowOptions,
);
console.log(constant.result); // 42
```

### Complex Example

```javascript
import { evaluateExpression } from '@taioncom/taion-expression';

const expression = `
  if (order.total > 100) then
    if (user.isPremium) then
      order.total * 0.85 // 15% discount for premium users on orders over $100
    else
      order.total * 0.9  // 10% discount for regular users on orders over $100
  else
    order.total
`;

const context = {
  order: {
    total: 120,
  },
  user: {
    isPremium: true,
  },
};

const result = evaluateExpression(expression, context);
console.log(result.result); // 102 (120 * 0.85)
```

## Error Handling

When parsing or evaluating expressions, the library provides detailed error messages to help troubleshoot issues:

```javascript
import {
  evaluateExpression,
  safeEvaluateExpression,
} from '@taioncom/taion-expression';

// Using the standard evaluator with error handling
const result = evaluateExpression('1 + / 2');
if (!result.success) {
  console.error(result.error.message); // "Unexpected token '/' at line 1, column 5"
}

// Using the safe evaluator which returns null on error
const safeResult = safeEvaluateExpression('1 + / 2');
console.log(safeResult); // null
```

## Limitations

This expression language is intentionally limited in functionality to ensure safety and predictability. It is not intended to be a full-featured programming language.

- No side effects: Expressions cannot modify the context or environment
- No loops: To prevent infinite loops, the language does not include loop constructs
- Limited recursion: Function calls are limited in depth to prevent stack overflow
- Sandboxed execution: Expressions run in a sandboxed environment
- No dynamic code execution: No `eval()` or similar functions are allowed

## License

MIT

## Trademark Notice

"Taion" is a registered trademark of Taion Oy. The MIT license grants rights to the source code only and does not grant permission to use the "Taion" name, logo, or trademarks. You may not use the "Taion" name in forks, derivative products, services, or marketing materials in any way that implies endorsement by or affiliation with Taion Oy without prior written permission.
