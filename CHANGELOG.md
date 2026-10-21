# Changelog

## 2.1.1

### Added

- `timeZone` option (an IANA zone, for example `'Europe/Helsinki'`): an exact time (a `Date`, or an ISO date-time string with `Z` or an offset, such as `'2026-09-30T22:00:00.000Z'`) compared with a date alone (`'2026-10-01'`) compares by calendar day in that zone, so `createdAt >= '2026-10-01'` means on or after October 1 there and `createdAt <= '2026-10-19'` includes the whole 19th. Without it a date alone is UTC midnight. An unknown zone fails compilation with `INVALID_TIME_ZONE`

### Fixed

- A `Date` compared with an ISO 8601 date string compares by time, in both semantics and also with `==` / `!=`. Before, `<`/`<=`/`>`/`>=` were always false in the default semantics and compared the date's long text form (`"Thu Oct 15 2026 ..."`) in the spreadsheet semantics, so `createdAt > '2026-10-20'` could be true for October 15; `==` was always false
- Spreadsheet semantics: a `Date` against text that is neither a date nor a number is unordered (comparisons are false) instead of comparing the date's long text form

## 2.1.0

### Added

- `caseInsensitiveNames` option: keywords (`AND`, `NULL`, `IF ... THEN ... ELSE`) match in any letter case, and a called name with no exact match calls the custom or built-in function differing only in case (`CONCAT` calls `concat`). A non-lowercase `IF`/`AND`/`OR` in operand position directly before `(` is a function call. Identifiers stay case-sensitive
- `semantics: 'spreadsheet'` option: null propagates through arithmetic, division and modulo by zero give null, numeric strings act as numbers in arithmetic, comparison and equality, `+` concatenates only with a non-numeric operand, comparisons with null are false and `==`/`!=` are null-aware
- `strictFunctions` option: a call to an unknown function name fails at compile time with `UNKNOWN_FUNCTION`, also in branches that are never evaluated
- `analyzeExpression()`: parse and validate without evaluating; returns the AST, the context paths read and the functions called
- Documented and tested identifiers starting with `$` (`$CURRENT_USER`, `$record.status`)

All new behaviour is opt-in; without the new options expressions evaluate exactly as in 2.0.0.

## 2.0.0

### Added

- `maxExpressionLength` option (default 10000 characters, `0` disables) -- fails with `MAX_EXPRESSION_LENGTH_EXCEEDED`
- Deeply nested expressions return a `MAX_NESTING_EXCEEDED` failure instead of throwing a `RangeError`
- Strings produced by expressions are capped at 1,000,000 characters: `+` fails with `MAX_STRING_LENGTH_EXCEEDED`, `repeat`/`join`/`concat` return `""`, `padLeft`/`padRight` return the input unchanged
- Regex functions reject patterns with nested quantifiers (e.g. `(a+)+`) or backreferences to guard against ReDoS
- Test workflow for GitHub Actions

### Changed

- `maxComplexity` limits the number of AST nodes at compile time instead of counting evaluated nodes; repeated arrow function bodies no longer count, runtime work is bounded by `maxLoopIterations` and `timeout`
- Disabled features (arrays, template strings, arrow functions) and invalid `allowedProperties`/`deniedProperties` patterns fail at compile time with `errorType: "CompilationError"`
- Property policy: denied patterns also apply to top-level context variables and to bracket access by full path (`user["password"]` matches `user.password`); the allowlist applies to values read out, exempting intermediate path segments and built-in/custom function names; an empty allowlist allows everything
- Custom functions override built-in functions with the same name, as documented
- `<`, `<=`, `>`, `>=` compare two strings alphabetically instead of converting them to numbers
- `^` is right-associative and binds tighter than unary minus, following math convention: `2 ^ 3 ^ 2` is 512 (was 64) and `-2 ^ 2` is -4 (was 4)
- Long operator chains and long string literals are parsed iteratively

### Fixed

- The `null` literal evaluated to the string `"null"`
- Token values and error columns included leading whitespace (`Unexpected token ' /'`)
- `user["secret"]` bypassed path-specific `deniedProperties`, and top-level identifiers ignored the property policy
- Identifiers and function names resolved through the prototype chain (`constructor`, `__proto__`, `toString`)
- `groupBy`, `fromEntries`, `pick` and `omit` mishandled keys such as `constructor` and `__proto__`

### Removed

- Unused Babel, `cross-env` and legacy `.eslintrc.json` configuration

## 1.2.0

### Added

- Natural-language operator aliases for simpler expressions:
  - `=` as alias for `==` (equality)
  - `and` as alias for `&&` (logical AND)
  - `or` as alias for `||` (logical OR)
  - `not` as alias for `!` (logical NOT)
- Aliases are always enabled

## 1.1.0

### Added

#### Math Functions (19 new)

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

#### Array Functions (13 new)

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
