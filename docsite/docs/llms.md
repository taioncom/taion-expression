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

`CompiledExpression` has: `evaluate(context) => unknown`, `source: string`, `compiledCode: string`.

## Options

```typescript
type ExpressionOptions = {
  customFunctions?: Record<string, (...args: unknown[]) => unknown>;
  timeout?: number;              // Default: 1000 (ms)
  maxCallStackDepth?: number;    // Default: 50
  maxComplexity?: number;        // Default: 100 (max AST nodes evaluated)
  maxLoopIterations?: number;    // Default: 10000
  allowedProperties?: string[];  // Regex patterns; empty = allow all
  deniedProperties?: string[];   // Regex patterns
  allowPrototypeAccess?: boolean; // Default: false
  enableArrays?: boolean;        // Default: true
  enableTemplateStrings?: boolean; // Default: false
  enableArrowFunctions?: boolean;  // Default: false
};
```

## Expression Language

### Data Types

- **Numbers**: `42`, `3.14`, `-7`
- **Strings**: `'hello'`, `"world"`
- **Booleans**: `true`, `false`
- **Null**: `null`
- **Arrays**: `[1, 2, 3]` (requires `enableArrays`, on by default)
- **Template strings**: `` `Hello ${name}` `` (requires `enableTemplateStrings`)

### Operators (by precedence, highest first)

| Precedence | Operators | Notes |
|-----------|-----------|-------|
| 1 | `()` | Grouping |
| 2 | `^` | Exponentiation |
| 3 | `-x`, `+x`, `!x` | Unary |
| 4 | `*`, `/`, `%` | Multiplicative |
| 5 | `+`, `-` | Additive; `+` also concatenates strings |
| 6 | `<`, `<=`, `>`, `>=`, `==`, `!=` | Comparison/equality (strict) |
| 7 | `&&` | Logical AND (short-circuit) |
| 8 | `\|\|` | Logical OR (short-circuit) |

Additional: `? :` (ternary), `.` (member access), `[i]` (array index), `=>` (arrow function).

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

**String**: `length(s)`, `contains(s,sub)`, `startsWith(s,prefix)`, `endsWith(s,suffix)`, `toLowerCase(s)`, `toUpperCase(s)`, `substring(s,start,end)`, `trim(s)`, `trimStart(s)`, `trimEnd(s)`, `replace(s,search,replacement)`, `split(s,separator)`, `indexOf(s,search)`, `lastIndexOf(s,search)`, `capitalize(s,allWords?)`, `padLeft(v,len,pad?)`, `padRight(v,len,pad?)`, `repeat(s,n)`, `charAt(s,index)`, `includes(strOrArr,search)`, `concat(...values)`

**Array**: `sum(arr)`, `avg(arr)`, `count(arr)`, `arrayContains(arr,val)`, `first(arr)`, `last(arr)`, `join(arr,sep)`, `sort(arr)`, `reverse(arr)`, `length(arr)`, `slice(arr,start,end?)`, `unique(arr)`, `compact(arr)`, `flat(arr,depth?)`, `range(start,end,step?)`, `chunk(arr,size)`, `zip(arr1,arr2)`

**Statistics**: `median(arr)`, `stddev(arr)`, `variance(arr)`, `percentile(arr,p)`

**Array higher-order** (require `enableArrowFunctions`): `map(arr,fn)`, `filter(arr,fn)`, `find(arr,fn)`, `findIndex(arr,fn)`, `reduce(arr,fn,init?)`, `every(arr,fn)`, `some(arr,fn)`, `sortBy(arr,fn)`, `groupBy(arr,fn)`, `distinctBy(arr,fn)`, `minBy(arr,fn)`, `maxBy(arr,fn)`, `sumBy(arr,fn)`, `countBy(arr,fn)`

**Object**: `keys(obj)`, `values(obj)`, `entries(obj)`, `hasKey(obj,key)`, `merge(obj1,obj2)`, `pick(obj,...keys)`, `omit(obj,...keys)`, `fromEntries(entries)`

**Type checking**: `type(v)`, `isNull(v)`, `isUndefined(v)`, `isDefined(v)`, `isNumber(v)`, `isString(v)`, `isBoolean(v)`, `isObject(v)`, `isArray(v)`, `isDate(v)`, `isEmpty(v)`

**Conversion**: `toString(v)`, `toNumber(v)`, `toBoolean(v)`, `toInteger(v)`, `toDate(v)`, `toFixed(n,digits)`, `parseInt(s,radix?)`, `parseFloat(s)`

**Utility**: `coalesce(a,b,...)`, `ifElse(cond,then,else)`, `defaultTo(v,fallback)`, `jsonStringify(v)`, `jsonParse(s)`

**Random**: `random()`, `randomInt(min,max)`

**Regex**: `regexTest(s,pattern)`, `regexMatch(s,pattern)`, `regexReplace(s,pattern,replacement)`

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
// Only allow specific properties
evaluateExpression('user.name', context, {
  allowedProperties: ['user', 'user\\.name']
});

// Block specific properties
evaluateExpression('data.value', context, {
  deniedProperties: ['password', 'secret']
});
```

Patterns are regex, auto-anchored with `^...$`. Checked against both full dotted path and leaf property name. Denied properties take precedence over allowed.

### Prototype Pollution Prevention

`__proto__`, `constructor`, and `prototype` access is blocked by default. Only own properties are accessible unless `allowPrototypeAccess: true`.

### Resource Limits

All enforced per evaluation: `timeout` (wall clock), `maxComplexity` (AST nodes), `maxCallStackDepth` (nested calls), `maxLoopIterations` (array HOF iterations).

## Error Codes

| Code | When |
|------|------|
| `TOKENIZE_ERROR` | Invalid characters, unterminated strings |
| `PARSE_ERROR` | Syntax errors |
| `EVALUATION_ERROR` | Runtime errors |
| `TIMEOUT_EXCEEDED` | Execution time exceeded |
| `MAX_COMPLEXITY_EXCEEDED` | Too many AST nodes evaluated |
| `MAX_CALL_STACK_EXCEEDED` | Function nesting too deep |
| `MAX_LOOP_ITERATIONS_EXCEEDED` | Array iteration limit hit |
| `PROPERTY_ACCESS_DENIED` | Blocked by property security policy |
| `ARRAY_FEATURE_DISABLED` | Array syntax used with `enableArrays: false` |
| `TEMPLATE_STRINGS_DISABLED` | Template strings used with feature disabled |
| `ARROW_FUNCTIONS_DISABLED` | Arrow functions used with feature disabled |

## CommonJS / ESM

```javascript
// ESM
import { evaluateExpression } from '@taioncom/taion-expression';

// CommonJS
const { evaluateExpression } = require('@taioncom/taion-expression');
```

## TypeScript Types

Key exported types: `ExpressionOptions`, `EvaluateResult`, `EvaluateSuccess`, `EvaluateFailure`, `CompileResult`, `CompileSuccess`, `CompileFailure`, `CompiledExpression`, `ExpressionNode`, `BinaryExpressionNode`, `CallExpressionNode`, `ConditionalExpressionNode`, `IdentifierNode`, `LiteralNode`, `MemberExpressionNode`, `UnaryExpressionNode`.

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
