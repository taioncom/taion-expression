# Changelog

## 1.1.0

### Added

#### Math Functions (18 new)

- `pow(base, exp)`, `sqrt(num)`, `log(num)`, `log10(num)`, `log2(num)` -- exponentiation and logarithms
- `sign(num)`, `trunc(num)`, `mod(a, b)` -- sign, truncation, remainder
- `clamp(value, min, max)`, `lerp(a, b, t)` -- range constraining and interpolation
- `pi()`, `e()` -- mathematical constants
- `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2` -- trigonometric functions

#### String Functions (7 new)

- `trimStart(str)`, `trimEnd(str)` -- directional whitespace trimming
- `lastIndexOf(str, search)` -- find last occurrence
- `repeat(str, n)` -- repeat a string
- `charAt(str, index)` -- character at position
- `includes(strOrArray, search)` -- check if string or array contains a value
- `concat(...values)` -- null-safe string concatenation

#### Array Functions (14 new)

- `first(array)`, `last(array)` -- quick element access
- `unique(array)`, `compact(array)` -- deduplication and null removal
- `flat(array, depth?)` -- flatten nested arrays
- `range(start, end, step?)` -- generate number sequences
- `chunk(array, size)`, `zip(arr1, arr2)` -- reshape arrays
- `count(array)` -- element count
- `median(array)`, `stddev(array)`, `variance(array)`, `percentile(array, p)` -- statistical functions

#### Higher-Order Array Functions (8 new, require `enableArrowFunctions`)

- `findIndex(array, fn)` -- index of first match
- `sortBy(array, fn)`, `groupBy(array, fn)`, `distinctBy(array, fn)` -- sort, group, deduplicate by key
- `minBy(array, fn)`, `maxBy(array, fn)`, `sumBy(array, fn)`, `countBy(array, fn)` -- aggregate by key

#### Object Functions (6 new)

- `entries(obj)` -- key-value pairs as arrays
- `hasKey(obj, key)` -- check property existence
- `merge(obj1, obj2)` -- shallow merge
- `pick(obj, ...keys)`, `omit(obj, ...keys)` -- select or exclude properties
- `fromEntries(entries)` -- create object from pairs

#### Conversion Functions (6 new)

- `toBoolean(value)`, `toInteger(value)`, `toDate(value)` -- type coercion
- `toFixed(num, digits)` -- format number to fixed decimals
- `parseInt(str, radix?)`, `parseFloat(str)` -- parse numbers from strings

#### Utility Functions (4 new)

- `ifElse(cond, then, else)` -- inline conditional
- `defaultTo(value, fallback)` -- fallback for null/undefined/NaN
- `jsonStringify(value)`, `jsonParse(str)` -- JSON serialization

### Changed

- Split `built-in-functions.ts` into modular files under `src/lib/functions/` for maintainability
- Context-passing function list in the evaluator is now data-driven instead of hardcoded

## 1.0.0

Initial release.
