---
sidebar_position: 4
---

# Built-in Functions

The expression language includes a large set of built-in functions organized by category.

## String Functions

| Function      | Signature                           | Description                                                                                |
| ------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `length`      | `length(str)`                       | Returns the length of a string (also works on arrays)                                      |
| `contains`    | `contains(str, substring)`          | Returns `true` if `str` contains `substring`                                               |
| `startsWith`  | `startsWith(str, prefix)`           | Returns `true` if `str` starts with `prefix`                                               |
| `endsWith`    | `endsWith(str, suffix)`             | Returns `true` if `str` ends with `suffix`                                                 |
| `toLowerCase` | `toLowerCase(str)`                  | Converts to lowercase                                                                      |
| `toUpperCase` | `toUpperCase(str)`                  | Converts to uppercase                                                                      |
| `substring`   | `substring(str, start, end)`        | Extracts characters between `start` and `end` indices                                      |
| `trim`        | `trim(str)`                         | Removes leading and trailing whitespace                                                    |
| `trimStart`   | `trimStart(str)`                    | Removes leading whitespace                                                                 |
| `trimEnd`     | `trimEnd(str)`                      | Removes trailing whitespace                                                                |
| `replace`     | `replace(str, search, replacement)` | Replaces all occurrences of `search` with `replacement`                                    |
| `split`       | `split(str, separator)`             | Splits a string into an array by `separator`                                               |
| `indexOf`     | `indexOf(str, search)`              | Returns the index of `search` in `str`, or `-1` if not found                               |
| `lastIndexOf` | `lastIndexOf(str, search)`          | Returns the last index of `search` in `str`, or `-1` if not found                          |
| `capitalize`  | `capitalize(str, allWords?)`        | Capitalizes the first letter and lowercases the rest. Pass `true` to capitalize every word |
| `padLeft`     | `padLeft(value, len, pad?)`         | Pads the start of the string to `len` with `pad` (default: space)                          |
| `padRight`    | `padRight(value, len, pad?)`        | Pads the end of the string to `len` with `pad` (default: space)                            |
| `repeat`      | `repeat(str, n)`                    | Repeats a string `n` times. Returns empty string for invalid `n`.                          |
| `charAt`      | `charAt(str, index)`                | Returns the character at `index`, or empty string if out of bounds                         |
| `includes`    | `includes(strOrArray, search)`      | Returns `true` if the string or array includes `search`                                    |
| `concat`      | `concat(...values)`                 | Concatenates all arguments into a string. Null/undefined values become empty strings.      |

```
toUpperCase("hello")              // "HELLO"
contains("foobar", "bar")         // true
substring("hello world", 0, 5)   // "hello"
length("test")                    // 4
trim("  hello  ")                 // "hello"
trimStart("  hello  ")            // "hello  "
trimEnd("  hello  ")              // "  hello"
replace("foo bar foo", "foo", "baz") // "baz bar baz"
split("a,b,c", ",")              // ["a", "b", "c"]
indexOf("hello world", "world")  // 6
lastIndexOf("abcabc", "c")       // 5
capitalize("hello world")        // "Hello world"
capitalize("hello world", true)  // "Hello World"
padLeft("42", 5, "0")            // "00042"
padRight("hi", 5, ".")           // "hi..."
repeat("ab", 3)                  // "ababab"
charAt("hello", 1)               // "e"
includes("hello", "ell")         // true
includes([1, 2, 3], 2)           // true
concat("a", null, "b", 42)      // "ab42"
```

## Math Functions

| Function | Signature               | Description                                          |
| -------- | ----------------------- | ---------------------------------------------------- |
| `min`    | `min(a, b, ...)`        | Returns the smallest of the given numbers (variadic) |
| `max`    | `max(a, b, ...)`        | Returns the largest of the given numbers (variadic)  |
| `round`  | `round(num, decimals?)` | Rounds to `decimals` decimal places (default: 0)     |
| `floor`  | `floor(num)`            | Rounds down                                          |
| `ceil`   | `ceil(num)`             | Rounds up                                            |
| `abs`    | `abs(num)`              | Returns the absolute value                           |
| `pow`    | `pow(base, exp)`        | Returns `base` raised to the power of `exp`          |
| `sqrt`   | `sqrt(num)`             | Returns the square root                              |
| `log`    | `log(num)`              | Returns the natural logarithm (base e)               |
| `log10`  | `log10(num)`            | Returns the base-10 logarithm                        |
| `log2`   | `log2(num)`             | Returns the base-2 logarithm                         |
| `sign`   | `sign(num)`             | Returns `-1`, `0`, or `1` indicating the sign        |
| `trunc`  | `trunc(num)`            | Truncates the decimal part (toward zero)             |
| `mod`    | `mod(a, b)`             | Returns the remainder of `a / b`                     |
| `clamp`  | `clamp(value, min, max)`| Constrains `value` to the range `[min, max]`         |
| `lerp`   | `lerp(a, b, t)`         | Linear interpolation between `a` and `b` by factor `t` (0..1) |
| `pi`     | `pi()`                  | Returns the constant Pi (~3.14159)                   |
| `e`      | `e()`                   | Returns Euler's number (~2.71828)                    |

```
min(3, 7)        // 3
min(5, 2, 8, 1)  // 1
max(3, 7)        // 7
round(3.14, 1)   // 3.1
floor(3.9)       // 3
ceil(3.1)        // 4
abs(-5)          // 5
pow(2, 10)       // 1024
sqrt(144)        // 12
log(1)           // 0
log10(1000)      // 3
log2(8)          // 3
sign(-42)        // -1
sign(0)          // 0
trunc(4.9)       // 4
trunc(-4.9)      // -4
mod(10, 3)       // 1
clamp(150, 0, 100)  // 100
clamp(-5, 0, 100)   // 0
lerp(0, 10, 0.5)    // 5
pi()                 // 3.14159...
e()                  // 2.71828...
```

## Trigonometric Functions

| Function | Signature       | Description                                           |
| -------- | --------------- | ----------------------------------------------------- |
| `sin`    | `sin(rad)`      | Returns the sine of a value in radians                |
| `cos`    | `cos(rad)`      | Returns the cosine of a value in radians              |
| `tan`    | `tan(rad)`      | Returns the tangent of a value in radians             |
| `asin`   | `asin(num)`     | Returns the arc sine (in radians) of a number         |
| `acos`   | `acos(num)`     | Returns the arc cosine (in radians) of a number       |
| `atan`   | `atan(num)`     | Returns the arc tangent (in radians) of a number      |
| `atan2`  | `atan2(y, x)`   | Returns the angle (in radians) from the X axis to the point (x, y) |

```
sin(0)           // 0
cos(0)           // 1
tan(0)           // 0
asin(1)          // 1.5707... (pi/2)
acos(1)          // 0
atan(1)          // 0.7853... (pi/4)
atan2(1, 1)      // 0.7853... (pi/4)
```

## Array Functions

| Function        | Signature                     | Description                                              |
| --------------- | ----------------------------- | -------------------------------------------------------- |
| `length`        | `length(array)`               | Returns the number of elements                           |
| `sum`           | `sum(array)`                  | Sums all numeric elements                                |
| `avg`           | `avg(array)`                  | Returns the average of numeric elements                  |
| `count`         | `count(array)`                | Returns the number of elements (alias for `length`)      |
| `arrayContains` | `arrayContains(array, value)` | Returns `true` if the array includes `value`             |
| `first`         | `first(array)`                | Returns the first element, or `null` if empty            |
| `last`          | `last(array)`                 | Returns the last element, or `null` if empty             |
| `join`          | `join(array, separator)`      | Joins elements into a string                             |
| `sort`          | `sort(array)`                 | Returns a sorted copy                                    |
| `reverse`       | `reverse(array)`              | Returns a reversed copy                                  |
| `slice`         | `slice(array, start, end?)`   | Returns a shallow copy from `start` to `end` (exclusive) |
| `unique`        | `unique(array)`               | Returns a new array with duplicates removed              |
| `compact`       | `compact(array)`              | Removes `null`, `undefined`, and empty string values     |
| `flat`          | `flat(array, depth?)`         | Flattens nested arrays by `depth` levels (default: 1)    |
| `range`         | `range(start, end, step?)`    | Generates a number sequence from `start` to `end` (exclusive) |
| `chunk`         | `chunk(array, size)`          | Splits an array into chunks of `size`                    |
| `zip`           | `zip(arr1, arr2)`             | Pairs elements from two arrays                           |

```
sum([10, 20, 30])                // 60
avg([10, 20, 30])                // 20
count([1, 2, 3, 4])             // 4
first([10, 20, 30])             // 10
last([10, 20, 30])              // 30
arrayContains([1, 2, 3], 2)      // true
join(["a", "b", "c"], ", ")      // "a, b, c"
sort([3, 1, 2])                  // [1, 2, 3]
reverse([1, 2, 3])               // [3, 2, 1]
slice([1, 2, 3, 4, 5], 1, 3)    // [2, 3]
unique([1, 2, 2, 3, 3, 3])      // [1, 2, 3]
compact([1, null, 2, "", 3])     // [1, 2, 3]
flat([[1, 2], [3, 4]])           // [1, 2, 3, 4]
flat([1, [2, [3, [4]]]], 2)      // [1, 2, 3, [4]]
range(0, 5)                      // [0, 1, 2, 3, 4]
range(0, 10, 2)                  // [0, 2, 4, 6, 8]
range(5, 0)                      // [5, 4, 3, 2, 1]
chunk([1, 2, 3, 4, 5], 2)       // [[1, 2], [3, 4], [5]]
zip([1, 2, 3], ["a", "b", "c"]) // [[1, "a"], [2, "b"], [3, "c"]]
```

## Statistical Functions

| Function     | Signature                | Description                                                |
| ------------ | ------------------------ | ---------------------------------------------------------- |
| `median`     | `median(array)`          | Returns the middle value of a numeric array                |
| `stddev`     | `stddev(array)`          | Returns the standard deviation (population)                |
| `variance`   | `variance(array)`        | Returns the variance (population)                          |
| `percentile` | `percentile(array, p)`   | Returns the value at the `p`th percentile (0-100)          |

```
median([3, 1, 2])                // 2
median([1, 2, 3, 4])            // 2.5
stddev([2, 4, 4, 4, 5, 5, 7, 9]) // 2.0
variance([2, 4, 4, 4, 5, 5, 7, 9]) // 4.0
percentile([1, 2, 3, 4, 5], 50)  // 3
percentile([1, 2, 3, 4, 5], 90)  // 4.6
```

## Higher-Order Array Functions

These functions accept a callback. When using arrow function syntax, enable `enableArrowFunctions`.

### Iteration

| Function    | Signature                     | Description                                                    |
| ----------- | ----------------------------- | -------------------------------------------------------------- |
| `map`       | `map(array, fn)`              | Transforms each element                                        |
| `filter`    | `filter(array, fn)`           | Keeps elements where `fn` returns `true`                       |
| `find`      | `find(array, fn)`             | Returns the first element where `fn` returns `true`            |
| `findIndex` | `findIndex(array, fn)`        | Returns the index of the first element where `fn` returns `true`, or `-1` |
| `reduce`    | `reduce(array, fn, initial?)` | Reduces the array to a single value                            |
| `every`     | `every(array, fn)`            | Returns `true` if `fn` returns `true` for all elements         |
| `some`      | `some(array, fn)`             | Returns `true` if `fn` returns `true` for at least one element |

```
map(numbers, x => x * 2)                    // [2, 4, 6, 8, 10]
filter(numbers, x => x % 2 == 0)            // [2, 4]
find(users, u => u.name == "Alice")          // {name: "Alice", ...}
findIndex([10, 20, 30], x => x > 15)        // 1
reduce(numbers, (acc, x) => acc + x, 0)     // 15
every([2, 4, 6], x => x % 2 == 0)           // true
some([1, 2, 3], x => x > 2)                 // true
```

### Sorting and Grouping

| Function     | Signature               | Description                                              |
| ------------ | ----------------------- | -------------------------------------------------------- |
| `sortBy`     | `sortBy(array, fn)`     | Returns a sorted copy, ordered by `fn` return values     |
| `groupBy`    | `groupBy(array, fn)`    | Groups elements into an object keyed by `fn` return values |
| `distinctBy` | `distinctBy(array, fn)` | Returns unique elements, using `fn` to determine equality |

```
sortBy(users, u => u.age)
// [{name: "Bob", age: 17}, {name: "Alice", age: 25}, {name: "Carol", age: 30}]

groupBy(items, x => x.category)
// { "fruit": [...], "vegetable": [...] }

distinctBy(users, u => u.department)
// one user per department
```

### Aggregation

| Function  | Signature              | Description                                            |
| --------- | ---------------------- | ------------------------------------------------------ |
| `minBy`   | `minBy(array, fn)`     | Returns the element with the minimum `fn` return value |
| `maxBy`   | `maxBy(array, fn)`     | Returns the element with the maximum `fn` return value |
| `sumBy`   | `sumBy(array, fn)`     | Sums the `fn` return values across all elements        |
| `countBy` | `countBy(array, fn)`   | Counts elements where `fn` returns a truthy value      |

```
minBy(products, p => p.price)                // cheapest product
maxBy(products, p => p.price)                // most expensive product
sumBy(orders, o => o.total)                  // total revenue
countBy(users, u => u.active)                // number of active users
```

See [Arrow Functions](../guides/arrow-functions.md) for details on lambda syntax.

## Object Functions

| Function      | Signature                | Description                                            |
| ------------- | ------------------------ | ------------------------------------------------------ |
| `keys`        | `keys(obj)`              | Returns an array of property names                     |
| `values`      | `values(obj)`            | Returns an array of property values                    |
| `entries`     | `entries(obj)`           | Returns an array of `[key, value]` pairs               |
| `hasKey`      | `hasKey(obj, key)`       | Returns `true` if the object has the specified own property |
| `merge`       | `merge(obj1, obj2)`      | Shallow merges two objects (`obj2` overrides `obj1`)   |
| `pick`        | `pick(obj, ...keys)`     | Returns a new object with only the specified keys      |
| `omit`        | `omit(obj, ...keys)`     | Returns a new object without the specified keys        |
| `fromEntries` | `fromEntries(entries)`   | Creates an object from an array of `[key, value]` pairs |

```
keys(user)                       // ["name", "age"]
values(user)                     // ["Alice", 25]
entries(user)                    // [["name", "Alice"], ["age", 25]]
hasKey(user, "name")             // true
hasKey(user, "email")            // false
merge({a: 1}, {b: 2})           // {a: 1, b: 2}
merge({a: 1}, {a: 2})           // {a: 2}
pick(user, "name", "age")       // {name: "Alice", age: 25}
omit(user, "password")          // user without password field
fromEntries([["a", 1], ["b", 2]])  // {a: 1, b: 2}
```

## Type Checking Functions

| Function      | Signature            | Description                                                                                                  |
| ------------- | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `type`        | `type(value)`        | Returns the type as a string: `"number"`, `"string"`, `"boolean"`, `"array"`, `"object"`, `"date"`, `"null"` |
| `isNull`      | `isNull(value)`      | Returns `true` if the value is `null`                                                                        |
| `isUndefined` | `isUndefined(value)` | Returns `true` if the value is `undefined`                                                                   |
| `isDefined`   | `isDefined(value)`   | Returns `true` if the value is not `null` and not `undefined`                                                |
| `isNumber`    | `isNumber(value)`    | Returns `true` if the value is a number                                                                      |
| `isString`    | `isString(value)`    | Returns `true` if the value is a string                                                                      |
| `isBoolean`   | `isBoolean(value)`   | Returns `true` if the value is a boolean                                                                     |
| `isObject`    | `isObject(value)`    | Returns `true` if the value is a plain object (not array, not null, not Date)                                |
| `isArray`     | `isArray(value)`     | Returns `true` if the value is an array                                                                      |
| `isDate`      | `isDate(value)`      | Returns `true` if the value is a valid Date instance                                                         |
| `isEmpty`     | `isEmpty(value)`     | Returns `true` if the value is `null`, `undefined`, or an empty string `""`                                  |

```
type(42)           // "number"
type("hello")      // "string"
type([1, 2])       // "array"
type(null)         // "null"
isDefined(user)    // true if user is in the context
isArray(items)     // true if items is an array
```

## Conversion Functions

| Function     | Signature                | Description                                                                         |
| ------------ | ------------------------ | ----------------------------------------------------------------------------------- |
| `toString`   | `toString(value)`        | Converts a value to its string representation. Returns `""` for `null`/`undefined`. |
| `toNumber`   | `toNumber(value)`        | Parses a value as a number. Returns `null` for invalid input.                       |
| `toBoolean`  | `toBoolean(value)`       | Converts a value to boolean using JavaScript truthiness.                            |
| `toInteger`  | `toInteger(value)`       | Converts to an integer (truncates decimals). Returns `null` for invalid input.      |
| `toDate`     | `toDate(value)`          | Converts a Date, number (timestamp), or string to a Date. Returns `null` on invalid input. |
| `toFixed`    | `toFixed(num, digits)`   | Formats a number to `digits` decimal places. Returns a string.                      |
| `parseInt`   | `parseInt(str, radix?)`  | Parses an integer from a string with optional radix (default: 10). Returns `null` on invalid input. |
| `parseFloat` | `parseFloat(str)`        | Parses a floating-point number from a string. Returns `null` on invalid input.      |

```
toString(42)         // "42"
toString(true)       // "true"
toString(null)       // ""
toNumber("42")       // 42
toNumber("3.14")     // 3.14
toNumber("abc")      // null
toBoolean(1)         // true
toBoolean(0)         // false
toBoolean("")        // false
toInteger(3.9)       // 3
toInteger(-3.9)      // -3
toDate("2024-01-15") // Date object
toFixed(3.14159, 2)  // "3.14"
parseInt("ff", 16)   // 255
parseInt("42")       // 42
parseFloat("3.14")   // 3.14
```

## Utility Functions

| Function       | Signature                       | Description                                                  |
| -------------- | ------------------------------- | ------------------------------------------------------------ |
| `coalesce`     | `coalesce(a, b, ...)`           | Returns the first argument that is not `null` or `undefined` |
| `ifElse`       | `ifElse(cond, then, else)`      | Returns `then` if `cond` is truthy, otherwise `else`         |
| `defaultTo`    | `defaultTo(value, fallback)`    | Returns `fallback` if `value` is `null`, `undefined`, or `NaN` |
| `jsonStringify`| `jsonStringify(value)`          | Serializes a value to a JSON string                          |
| `jsonParse`    | `jsonParse(str)`                | Parses a JSON string into a value. Returns `null` on invalid input. |

```
coalesce(null, null, 42)        // 42
coalesce(user.name, "Guest")    // user.name if defined, otherwise "Guest"
ifElse(score > 90, "A", "B")   // "A" if score > 90
defaultTo(value, 0)             // value, or 0 if null/undefined/NaN
jsonStringify({a: 1})           // '{"a":1}'
jsonParse('{"a":1}')            // {a: 1}
```

## Random Functions

| Function    | Signature             | Description                                                                    |
| ----------- | --------------------- | ------------------------------------------------------------------------------ |
| `random`    | `random()`            | Returns a random floating-point number between 0 (inclusive) and 1 (exclusive) |
| `randomInt` | `randomInt(min, max)` | Returns a random integer between `min` and `max` (inclusive)                   |

```
random()           // 0.7392... (varies)
randomInt(1, 10)   // 7 (varies, always 1-10)
randomInt(0, 1)    // 0 or 1
```

## Regex Functions

| Function       | Signature                                 | Description                                              |
| -------------- | ----------------------------------------- | -------------------------------------------------------- |
| `regexTest`    | `regexTest(str, pattern)`                 | Returns `true` if `pattern` matches anywhere in `str`    |
| `regexMatch`   | `regexMatch(str, pattern)`                | Returns the first match of `pattern` in `str`, or `null` |
| `regexReplace` | `regexReplace(str, pattern, replacement)` | Replaces all matches of `pattern` with `replacement`     |

Patterns are standard regex strings. Invalid patterns return `false`/`null` instead of throwing.

```
regexTest("hello123", "\\d+")                     // true
regexTest("hello", "\\d+")                         // false
regexMatch("order-42-confirmed", "\\d+")           // "42"
regexReplace("hello 123 world 456", "\\d+", "NUM") // "hello NUM world NUM"
```

## Date Functions

Date objects can flow through the evaluation context. These functions create, inspect, format, and perform arithmetic on dates. All component functions use **local time**. Months are **1-based** (1 = January, 12 = December).

Input coercion: most date functions accept a `Date`, a `number` (timestamp in ms), or a `string` (ISO/date format). Invalid input returns `null`.

### Creation

| Function    | Signature                          | Description                                                                     |
| ----------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| `now`       | `now()`                            | Returns the current date/time                                                   |
| `date`      | `date(y, m, d, h?, min?, s?, ms?)` | Creates a date from components. Month is 1-12. Returns `null` on invalid input. |
| `parseDate` | `parseDate(str)`                   | Parses an ISO/date string. Returns `null` on invalid input.                     |
| `toDate`    | `toDate(value)`                    | Converts a Date, number, or string to a Date. Returns `null` on invalid input.  |

```
now()                           // current Date
date(2024, 3, 15)              // March 15, 2024
date(2024, 3, 15, 10, 30, 0)  // March 15, 2024 10:30:00
parseDate("2024-03-15")        // March 15, 2024
toDate(1710500000000)           // Date from timestamp
```

### Component Extraction

| Function    | Signature         | Description                           |
| ----------- | ----------------- | ------------------------------------- |
| `year`      | `year(date)`      | Full year (e.g. 2024)                 |
| `month`     | `month(date)`     | Month 1-12                            |
| `day`       | `day(date)`       | Day of month 1-31                     |
| `hour`      | `hour(date)`      | Hour 0-23                             |
| `minute`    | `minute(date)`    | Minute 0-59                           |
| `second`    | `second(date)`    | Second 0-59                           |
| `dayOfWeek` | `dayOfWeek(date)` | Day of week: 0 = Sunday, 6 = Saturday |
| `timestamp` | `timestamp(date)` | Milliseconds since Unix epoch         |

```
year("2024-03-15T00:00:00")    // 2024
month("2024-03-15T00:00:00")   // 3
day("2024-03-15T00:00:00")     // 15
dayOfWeek(date(2024, 3, 15))   // 5 (Friday)
timestamp(now())                // 1710500000000 (varies)
```

### Formatting

| Function      | Signature                    | Description                                                                                               |
| ------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| `formatDate`  | `formatDate(date, pattern?)` | Formats a date. Default pattern: `yyyy-MM-dd`. Tokens: `yyyy`, `yy`, `MM`, `dd`, `HH`, `mm`, `ss`, `SSS`. |
| `toISOString` | `toISOString(date)`          | Returns an ISO 8601 string (UTC)                                                                          |

```
formatDate(date(2024, 3, 15))                        // "2024-03-15"
formatDate(date(2024, 3, 15, 10, 30), "HH:mm dd/MM") // "10:30 15/03"
toISOString(date(2024, 3, 15))                        // "2024-03-15T00:00:00.000Z" (UTC)
```

### Arithmetic

| Function   | Signature                     | Description                                                                                                      |
| ---------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `dateAdd`  | `dateAdd(date, amount, unit)` | Adds an amount to a date. Negative values subtract. Clamps month/year overflow (Jan 31 + 1 month = Feb 28/29).   |
| `dateDiff` | `dateDiff(d1, d2, unit)`      | Difference between two dates. Positive if d1 > d2. Truncates partial units. Calendar-aware for months and years. |

Valid units: `years`, `months`, `weeks`, `days`, `hours`, `minutes`, `seconds`, `milliseconds` (singular forms also accepted).

```
dateAdd(date(2024, 1, 31), 1, "months")  // Feb 29, 2024 (clamped, leap year)
dateAdd(date(2024, 3, 15), -5, "days")   // March 10, 2024
dateAdd(date(2024, 3, 15), 2, "weeks")   // March 29, 2024
dateDiff(date(2024, 3, 15), date(2024, 3, 10), "days")  // 5
dateDiff(date(2024, 3, 10), date(2024, 3, 15), "days")  // -5
```

### Utilities

| Function       | Signature                       | Description                                                       |
| -------------- | ------------------------------- | ----------------------------------------------------------------- |
| `startOfDay`   | `startOfDay(date)`              | Truncates a date to midnight (00:00:00.000)                       |
| `endOfDay`     | `endOfDay(date)`                | Sets a date to end of day (23:59:59.999)                          |
| `startOfMonth` | `startOfMonth(date)`            | First day of month at midnight                                    |
| `endOfMonth`   | `endOfMonth(date)`              | Last day of month at 23:59:59.999                                 |
| `dateBetween`  | `dateBetween(date, start, end)` | Returns `true` if `date` is between `start` and `end` (inclusive) |

```
startOfDay(date(2024, 3, 15, 10, 30))    // March 15, 2024 00:00:00.000
endOfDay(date(2024, 3, 15))               // March 15, 2024 23:59:59.999
startOfMonth(date(2024, 3, 15))           // March 1, 2024 00:00:00.000
endOfMonth(date(2024, 3, 15))             // March 31, 2024 23:59:59.999
dateBetween(date(2024, 3, 15), date(2024, 3, 1), date(2024, 3, 31))  // true
```
