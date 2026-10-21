---
sidebar_position: 5
---

# Spreadsheet-style Expressions

Expressions written by business users often look like spreadsheet formulas: `IF(total > 100, 'big', 'small')`, `LEN(notes) <= 500`, `price * qty` where `price` arrives from the database as the string `"19.90"`. Three opt-in options make the evaluator accept and evaluate them the way such users expect, and `analyzeExpression` lets you check an expression before you store it. All of them are off by default; without them the language behaves exactly as described in the [language reference](../language-reference/operators.md).

```javascript
import { evaluateExpression } from '@taioncom/taion-expression';

const options = {
  caseInsensitiveNames: true,
  semantics: 'spreadsheet',
  strictFunctions: true,
};

evaluateExpression('CONCAT(name, " (", qty * price, ")")', { name: 'Bolt', qty: '3', price: '0.5' }, options);
// { success: true, result: 'Bolt (1.5)' }
```

## caseInsensitiveNames

With `caseInsensitiveNames: true`:

- **Keywords** match in any letter case: `TRUE`, `False`, `NULL`, `IF ... THEN ... ELSE`, `AND`, `Or`, `NOT`.
- **Function names** that have no exact custom or built-in match call the function whose name differs only in case: `CONCAT` calls `concat`, `TOUPPERCASE` calls `toUpperCase`. An exact match always wins, and a custom function wins over a built-in one.
- **Identifiers** (context variables) stay case-sensitive: `Name` does not read `name`. Functions passed in the context are matched exactly too.

A non-lowercase `IF`, `AND` or `OR` written where an operand is expected and directly followed by `(` is a function call, as in spreadsheets: `IF(a, b, c)`, `AND(x, y)`. Register those functions with `customFunctions` (there are no built-ins of these names). After an operand, `AND` / `OR` remain operators: `a AND (b OR c)`. Lowercase `if`, `and` and `or` are always keywords.

```javascript
const options = {
  caseInsensitiveNames: true,
  customFunctions: { IF: (test, a, b) => (test ? a : b) },
};

evaluateExpression('IF(qty > 10, "bulk", "single")', { qty: 12 }, options); // 'bulk'
evaluateExpression('a AND NOT b', { a: true, b: false }, options); // true
evaluateExpression('If qty > 10 Then 1 Else 0', { qty: 1 }, options); // 0
```

A custom `IF` receives evaluated arguments, so both branches are evaluated; use `if ... then ... else` when a branch must not run.

## semantics: 'spreadsheet'

`semantics` is `'javascript'` by default. With `'spreadsheet'`, the operators follow these rules:

| Rule | Example | Result |
|------|---------|--------|
| null propagates through arithmetic (`+ - * / % ^`, unary `-` and `+`) | `missing + 1` | `null` |
| Division and modulo by zero give null | `10 / 0` | `null` |
| Numeric strings act as numbers | `'100' + 1` | `101` |
| Booleans count as 1 and 0 | `true + 1` | `2` |
| `+` concatenates only when an operand is not numeric | `'a' + 1` | `'a1'` |
| | `'5' + '5'` | `10` |
| Comparisons are numeric when both sides are numeric | `'10' < '9'` | `false` |
| ...otherwise they compare text (ISO dates compare correctly) | `'2026-01-02' > '2026-01-01'` | `true` |
| A comparison with null is false | `missing > -1` | `false` |
| `==` / `!=` compare numbers by value, other values as text | `'100' == 100` | `true` |
| `==` / `!=` are null-aware | `missing == null` | `true` |
| | `'' == null` | `false` |

"Numeric" means a number, boolean, date or a string that converts to a finite number; the empty string is not numeric. Logical operators (`&&`, `||`, `!`), conditionals and functions behave as in the default semantics, and the 1,000,000-character string cap still applies to `+`.

Compare with the default semantics:

| Expression | `'javascript'` | `'spreadsheet'` |
|------------|----------------|-----------------|
| `n + 1` (n is null) | `1` | `null` |
| `10 / 0` | `Infinity` | `null` |
| `s + 1` (s is `'5'`) | `'51'` | `6` |
| `s == 100` (s is `'100'`) | `false` | `true` |
| `n > -1` (n is null) | `true` | `false` |

## strictFunctions

With `strictFunctions: true`, compilation fails with `errorType: 'CompilationError'` and `errorCode: 'UNKNOWN_FUNCTION'` when the expression calls a name that is not a custom or built-in function, even in a branch that is never evaluated. Without it, such a call evaluates to `null` only when reached.

```javascript
compileExpression('if ok then 1 else ROUDN(x)', { strictFunctions: true });
// { success: false, errorType: 'CompilationError', errorCode: 'UNKNOWN_FUNCTION', ... }
```

Names are resolved as at evaluation time, so with `caseInsensitiveNames` a case variant of a known function is accepted. Parameters of an enclosing arrow function may be called. Functions passed in the context are refused (they are not known at compile time), and method calls on objects (`obj.method()`) are not checked.

## analyzeExpression

`analyzeExpression(expression, options?)` parses and validates an expression exactly as `compileExpression` does (length, complexity, feature flags, `strictFunctions`) without evaluating it, and returns what it references:

```javascript
import { analyzeExpression } from '@taioncom/taion-expression';

analyzeExpression('round(order.total * rate) > limits[0]');
// {
//   success: true,
//   ast: { type: 'BinaryExpression', ... },
//   identifiers: ['order.total', 'rate', 'limits.0'],
//   functions: ['round'],
// }
```

- `identifiers` lists each context path once, in source order. A member chain is one path (`order.total`), a literal index is part of it (`limits.0`), and a computed index ends it (`items[i].price` gives `items` and `i`).
- `functions` lists the called names as written (`round` and `Round` are listed separately).
- Arrow parameters are not context references and are left out.
- On failure the result is the same failure object `compileExpression` returns.

Use it to validate an expression when it is saved, or to find the expressions that use a field before renaming it.

## Identifiers starting with $

Identifiers may start with `$`, which is convenient for context variables set by the host application rather than by the data: `ownerId = $CURRENT_USER`, `$record.status`. A lone `$` is still a tokenization error, and `${...}` inside template strings is interpolation as before.
