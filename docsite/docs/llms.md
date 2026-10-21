# @taioncom/taion-expression

A safe, sandboxed expression evaluation library for JavaScript/TypeScript. Evaluates user-provided expressions against a context object with configurable security limits.

## Install

```bash
npm install @taioncom/taion-expression
```

## Quick Start

```typescript
import { evaluateExpression, safeEvaluateExpression, compileExpression } from '@taioncom/taion-expression';

// One-shot evaluation (returns result object)
const result = evaluateExpression('price * 1.08', { price: 100 });
if (result.success) {
  console.log(result.result); // 108
} else {
  console.log(result.errorCode); // e.g. 'PARSE_ERROR'
}

// Safe evaluation (returns value or null on error)
const value = safeEvaluateExpression('price * 1.08', { price: 100 }); // 108

// Compile once, evaluate many times with different contexts
const compiled = compileExpression('price * (1 + tax)');
if (compiled.success) {
  compiled.result.evaluate({ price: 100, tax: 0.08 }); // 108
  compiled.result.evaluate({ price: 200, tax: 0.10 }); // 220
}
```

## Public API

| Function | Signature | Returns |
|----------|-----------|---------|
| `evaluateExpression` | `(expr, context?, options?) => EvaluateResult` | `{success: true, result}` or `{success: false, error, errorType, errorCode}` |
| `safeEvaluateExpression` | `(expr, context?, options?) => unknown` | Result value directly, or `null` on error |
| `compileExpression` | `(expr, options?) => CompileResult` | `{success: true, result: CompiledExpression}` or failure |
| `safeCompileExpression` | `(expr, options?) => CompiledExpression \| null` | Compiled expression or `null` on error |
| `getCompiledCode` | `(expr, options?) => string \| null` | Compiled code string or `null` on error |
| `analyzeExpression` | `(expr, options?) => AnalyzeResult` | `{success: true, ast, identifiers, functions}` or the compile failure; never evaluates |

`CompiledExpression` has: `evaluate(context) => unknown` (throws on runtime errors), `source: string`, `compiledCode: string`.

## Options

```typescript
type ExpressionOptions = {
  customFunctions?: Record<string, (...args: unknown[]) => unknown>;
  timeout?: number;              // Default: 1000 (ms)
  maxCallStackDepth?: number;    // Default: 50
  maxComplexity?: number;        // Default: 100 (max AST nodes, checked at compile time)
  maxLoopIterations?: number;    // Default: 10000
  maxExpressionLength?: number;  // Default: 10000 (max source chars, 0 disables)
  allowedProperties?: string[];  // Regex patterns; empty = allow all
  deniedProperties?: string[];   // Regex patterns
  allowPrototypeAccess?: boolean; // Default: false
  enableArrays?: boolean;        // Default: true
  enableTemplateStrings?: boolean; // Default: false
  enableArrowFunctions?: boolean;  // Default: false
  caseInsensitiveNames?: boolean;  // Default: false (keywords + function names in any case)
  semantics?: 'javascript' | 'spreadsheet'; // Default: 'javascript'
  strictFunctions?: boolean;       // Default: false (unknown function = compile error)
};
```

### Spreadsheet-style options (all opt-in)

- `caseInsensitiveNames: true`: keywords match in any case (`AND`, `NULL`, `IF ... THEN ... ELSE`); a called name with no exact custom/built-in match calls the case variant (`CONCAT` -> `concat`; exact match first, custom before built-in). Identifiers and context functions stay case-sensitive. A non-lowercase `IF`/`AND`/`OR` in operand position directly before `(` is a function call (`IF(a, b, c)`; register it via `customFunctions`); after an operand `AND (`/`OR (` stay operators.
- `semantics: 'spreadsheet'`: null propagates through arithmetic (`null + 1` -> `null`); `x / 0` and `x % 0` -> `null`; numeric strings and booleans act as numbers (`'100' + 1` -> `101`, `'100' == 100` -> `true`); `+` concatenates only with a non-numeric operand (`'a' + 1` -> `'a1'`, `'5' + '5'` -> `10`); comparisons numeric when both sides numeric, else text (`'10' < '9'` -> `false`); comparison with null -> `false`; `==`/`!=` null-aware (`missing == null` -> `true`, `'' == null` -> `false`). Logical operators, conditionals and functions unchanged.
- `strictFunctions: true`: compile fails with `UNKNOWN_FUNCTION` (`CompilationError`) for a call to a name that is not a custom or built-in function, even in an untaken branch. Arrow parameters may be called; context functions are refused; `obj.method()` is not checked.
- `analyzeExpression(expr, options?)`: same parse + validation as compile; `identifiers` = context paths once in source order (`user.address.city`, `items.0`, computed index ends the path), excluding arrow params and function names; `functions` = called names as written.
- Identifiers may start with `$` (`$CURRENT_USER`, `$record.status`); a lone `$` is a tokenize error.

## Expression Language

### Data Types

- **Numbers**: `42`, `3.14`, `-7`
- **Strings**: `'hello'`, `"world"`
- **Booleans**: `true`, `false`
- **Null**: `null`
- **Arrays**: `[1, 2, 3]` (requires `enableArrays`, on by default)
- **Template strings**: `` `Hello ${name}` `` (requires `enableTemplateStrings`; any backtick string is a template)

### Operators (by precedence, highest first)

| Precedence | Operators | Notes |
|-----------|-----------|-------|
| 1 | `()` | Grouping |
| 2 | `^` | Exponentiation, right-associative (`-2^2` = -4, `2^3^2` = 512) |
| 3 | `-x`, `+x`, `!x`/`not x` | Unary |
| 4 | `*`, `/`, `%` | Multiplicative |
| 5 | `+`, `-` | Additive; `+` also concatenates strings |
| 6 | `<`, `<=`, `>`, `>=` | Comparison |
| 7 | `==`/`=`, `!=` | Equality (strict) |
| 8 | `&&`/`and` | Logical AND (short-circuit) |
| 9 | `\|\|`/`or` | Logical OR (short-circuit) |

Additional: `? :` (ternary), `.` (member access), `[i]` (array index), `=>` (arrow function).

`<`, `<=`, `>`, `>=` compare two strings alphabetically; otherwise both sides are converted to numbers (dates compare by time). A `Date` vs a `Date` or an ISO 8601 date string compares by time in `<`/`<=`/`>`/`>=` and `==`/`!=` (`createdAt >= '2026-10-01'`); a date alone is UTC midnight, a date-time without offset local time.

### Control Flow

```
// Ternary
age >= 18 ? 'adult' : 'minor'

// If-then-else
if age >= 18 then 'adult' else 'minor'
```

### Property Access

```typescript
evaluateExpression('user.address.city', {
  user: { address: { city: 'Helsinki' } }
}); // 'Helsinki'

evaluateExpression('items[0]', {
  items: ['a', 'b', 'c']
}); // 'a'
```

Unresolved identifiers return `null` (never throws).

### Built-in Functions (~140 total)

**Math**: `min(...values)`, `max(...values)`, `round(n,decimals?)`, `floor(n)`, `ceil(n)`, `abs(n)`, `pow(base,exp)`, `sqrt(n)`, `log(n)`, `log10(n)`, `log2(n)`, `sign(n)`, `trunc(n)`, `mod(a,b)`, `clamp(v,min,max)`, `lerp(a,b,t)`, `pi()`, `e()`

**Trigonometry**: `sin(rad)`, `cos(rad)`, `tan(rad)`, `asin(n)`, `acos(n)`, `atan(n)`, `atan2(y,x)`

**String**: `length(s)`, `contains(s,sub)`, `startsWith(s,prefix)`, `endsWith(s,suffix)`, `toLowerCase(s)`, `toUpperCase(s)`, `substring(s,start,end?)`, `trim(s)`, `trimStart(s)`, `trimEnd(s)`, `replace(s,search,replacement)`, `split(s,separator)`, `indexOf(s,search)`, `lastIndexOf(s,search)`, `capitalize(s,allWords?)`, `padLeft(v,len,pad?)`, `padRight(v,len,pad?)`, `repeat(s,n)`, `charAt(s,index)`, `includes(strOrArr,search)`, `concat(...values)`

**Array**: `sum(arr)`, `avg(arr)`, `count(arr)`, `arrayContains(arr,val)`, `first(arr)`, `last(arr)`, `join(arr,sep)`, `sort(arr)`, `reverse(arr)`, `length(arr)`, `slice(arr,start,end?)`, `unique(arr)`, `compact(arr)`, `flat(arr,depth?)`, `range(start,end,step?)`, `chunk(arr,size)`, `zip(arr1,arr2)`

Limits: `repeat` n `<= 10000`, `split` keeps `<= 10000` pieces, `range` yields `<= 10000` elements; strings are capped at 1,000,000 chars (`repeat`/`join`/`concat` return `""`, `padLeft`/`padRight` return input, `+` fails with `MAX_STRING_LENGTH_EXCEEDED`). `count(x)` counts arrays only (`count("abc")` = 0). `isNumber(NaN)` is false.

**Statistics**: `median(arr)`, `stddev(arr)`, `variance(arr)`, `percentile(arr,p)`

**Array higher-order** (require `enableArrowFunctions`): `map(arr,fn)`, `filter(arr,fn)`, `find(arr,fn)`, `findIndex(arr,fn)`, `reduce(arr,fn,init?)`, `every(arr,fn)`, `some(arr,fn)`, `sortBy(arr,fn)`, `groupBy(arr,fn)`, `distinctBy(arr,fn)`, `minBy(arr,fn)`, `maxBy(arr,fn)`, `sumBy(arr,fn)`, `countBy(arr,fn)`

**Object**: `keys(obj)`, `values(obj)`, `entries(obj)`, `hasKey(obj,key)`, `merge(obj1,obj2)`, `pick(obj,...keys)`, `omit(obj,...keys)`, `fromEntries(entries)`

**Type checking**: `type(v)`, `isNull(v)`, `isUndefined(v)`, `isDefined(v)`, `isNumber(v)`, `isString(v)`, `isBoolean(v)`, `isObject(v)`, `isArray(v)`, `isDate(v)`, `isEmpty(v)`

**Conversion**: `toString(v)`, `toNumber(v)`, `toBoolean(v)`, `toInteger(v)`, `toDate(v)`, `toFixed(n,digits)`, `parseInt(s,radix?)`, `parseFloat(s)`

**Utility**: `coalesce(a,b,...)`, `ifElse(cond,then,else)`, `defaultTo(v,fallback)`, `jsonStringify(v)`, `jsonParse(s)`

**Random**: `random()`, `randomInt(min,max)`

**Regex**: `regexTest(s,pattern)`, `regexMatch(s,pattern)`, `regexReplace(s,pattern,replacement)`. Patterns over 200 chars, with nested quantifiers like `(a+)+` or backreferences are rejected, as are inputs over 100000 chars: result is `false` / `null` / input unchanged.

**Date**: `now()`, `date(y,m,d,h?,min?,s?,ms?)`, `parseDate(str)`, `toDate(v)`, `isDate(v)`, `year(d)`, `month(d)`, `day(d)`, `hour(d)`, `minute(d)`, `second(d)`, `dayOfWeek(d)`, `timestamp(d)`, `formatDate(d,pattern?)` (tokens: yyyy,yy,MM,dd,HH,mm,ss,SSS), `toISOString(d)`, `dateAdd(d,amount,unit)`, `dateDiff(d1,d2,unit)` (calendar-aware months/years; supports weeks), `startOfDay(d)`, `endOfDay(d)`, `startOfMonth(d)`, `endOfMonth(d)`, `dateBetween(d,start,end)`

### Custom Functions

```typescript
evaluateExpression('greet(name)', { name: 'World' }, {
  customFunctions: {
    greet: (name: unknown) => `Hello, ${name}!`
  }
});
// { success: true, result: 'Hello, World!' }
```

Custom functions override built-ins with the same name. Functions can also be passed in the context object.

### Arrow Functions

Require `enableArrowFunctions: true`.

```typescript
evaluateExpression(
  'filter(items, x => x > 2)',
  { items: [1, 2, 3, 4] },
  { enableArrowFunctions: true }
); // [3, 4]

// Multi-param
evaluateExpression(
  'reduce(items, (acc, x) => acc + x, 0)',
  { items: [1, 2, 3] },
  { enableArrowFunctions: true }
); // 6
```

## Security

### Property Access Control

```typescript
// Only allow specific properties (parent segments are allowed for traversal)
evaluateExpression('user.name', context, {
  allowedProperties: ['user\\.name']
});

// Block specific properties
evaluateExpression('data.value', context, {
  deniedProperties: ['password', 'secret']
});
```

Patterns are regex, auto-anchored with `^...$`. Checked against both full dotted path and leaf property name. Denied properties take precedence over allowed and apply to top-level identifiers, dot access, static bracket access (`user["password"]` has path `user.password`) and function names. The allowlist applies to values read out: intermediate segments are exempt for traversal, built-in/custom function names are exempt, context functions are not; arrow parameters are not checked. Not data redaction: `values`/`entries`/`jsonStringify` see whole objects.

### Prototype Pollution Prevention

`__proto__`, `constructor`, and `prototype` access is blocked by default. Only own properties (of the context and of objects) are accessible unless `allowPrototypeAccess: true`, so identifiers like `toString` or `constructor` resolve to `null`.

### Resource Limits

Compile time: `maxExpressionLength` (source chars), `maxComplexity` (AST nodes). Per evaluation: `timeout` (wall clock), `maxCallStackDepth` (nested calls), `maxLoopIterations` (iterations across all 16 higher-order array functions; `sortBy` counts 2x).

## Error Codes

| Code | When |
|------|------|
| `TOKENIZE_ERROR` | Invalid characters, unterminated strings |
| `PARSE_ERROR` | Syntax errors |
| `MAX_EXPRESSION_LENGTH_EXCEEDED` | Source longer than `maxExpressionLength` |
| `MAX_NESTING_EXCEEDED` | Expression nested too deeply to parse |
| `MAX_COMPLEXITY_EXCEEDED` | Too many AST nodes (compile time) |
| `ARRAY_FEATURE_DISABLED` | Array syntax used with `enableArrays: false` (compile time) |
| `TEMPLATE_STRINGS_DISABLED` | Template strings used with feature disabled (compile time) |
| `ARROW_FUNCTIONS_DISABLED` | Arrow functions used with feature disabled (compile time) |
| `INVALID_REGEX_PATTERN` | Invalid `allowedProperties`/`deniedProperties` pattern (compile time) |
| `EVALUATION_FAILED` | Unexpected runtime error |
| `EVALUATION_ERROR` | A non-`Error` value was thrown at runtime |
| `TIMEOUT_EXCEEDED` | Execution time exceeded |
| `MAX_CALL_STACK_EXCEEDED` | Function nesting too deep |
| `MAX_LOOP_ITERATIONS_EXCEEDED` | Array iteration limit hit |
| `MAX_STRING_LENGTH_EXCEEDED` | `+` produced a string over 1,000,000 chars |
| `PROPERTY_ACCESS_DENIED` | Blocked by property security policy |
| `FUNCTION_ACCESS_DENIED` | Function name blocked by security policy |
| `UNSUPPORTED_FUNCTION_CALL` | Dynamic function reference (e.g. calling a call result) |
| `UNKNOWN_FUNCTION` | Call to an unknown function name with `strictFunctions: true` (compile time) |

`errorType` is `TokenizationError`, `ParseError`, `CompilationError` (post-parse checks) or `EvaluationError`.

## CommonJS / ESM

```javascript
// ESM
import { evaluateExpression } from '@taioncom/taion-expression';

// CommonJS
const { evaluateExpression } = require('@taioncom/taion-expression');
```

## TypeScript Types

Key exported types: `ExpressionOptions`, `AnalyzeResult`, `AnalyzeSuccess`, `EvaluateResult`, `EvaluateSuccess`, `EvaluateFailure`, `CompileResult`, `CompileSuccess`, `CompileFailure`, `CompiledExpression`, `ExpressionNode`, `BinaryExpressionNode`, `CallExpressionNode`, `ConditionalExpressionNode`, `IdentifierNode`, `LiteralNode`, `MemberExpressionNode`, `UnaryExpressionNode`.

## Common Patterns

```typescript
// Conditional pricing
evaluateExpression('if quantity > 100 then price * 0.9 else price', {
  quantity: 150, price: 50
}); // 45

// Data transformation with arrays
evaluateExpression(
  'join(map(users, u => toUpperCase(u.name)), ", ")',
  { users: [{ name: 'alice' }, { name: 'bob' }] },
  { enableArrowFunctions: true }
); // 'ALICE, BOB'

// Safe nested access
evaluateExpression('user.profile.settings.theme', {
  user: { profile: null }
}); // null (no error)

// Restricted evaluation
evaluateExpression('input * 2', { input: 5 }, {
  maxComplexity: 10,
  timeout: 100,
  allowedProperties: ['input']
});
```
