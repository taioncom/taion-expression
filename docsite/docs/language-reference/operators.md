---
sidebar_position: 2
---

# Operators

## Arithmetic Operators

| Operator | Description    | Example   | Result |
|----------|---------------|-----------|--------|
| `+`      | Addition       | `2 + 3`   | `5`    |
| `-`      | Subtraction    | `7 - 4`   | `3`    |
| `*`      | Multiplication | `3 * 5`   | `15`   |
| `/`      | Division       | `10 / 3`  | `3.33` |
| `%`      | Modulo         | `10 % 3`  | `1`    |
| `^`      | Exponentiation | `2 ^ 10`  | `1024` |
| `-`      | Unary negation | `-5`      | `-5`   |
| `+`      | Unary plus     | `+5`      | `5`    |

The `+` operator also concatenates strings: `"Hello" + " World"` produces `"Hello World"`.

The `semantics: 'spreadsheet'` option changes how operators treat null, zero divisors and numeric strings; see [Spreadsheet-style Expressions](../guides/spreadsheet-style.md#semantics-spreadsheet).

## Comparison Operators

| Operator | Description            | Example    | Result  |
|----------|----------------------|------------|---------|
| `==`, `=` | Strict equal         | `3 == 3`   | `true`  |
| `!=`     | Strict not equal      | `3 != 4`   | `true`  |
| `>`      | Greater than          | `5 > 3`    | `true`  |
| `<`      | Less than             | `3 < 5`    | `true`  |
| `>=`     | Greater than or equal | `5 >= 5`   | `true`  |
| `<=`     | Less than or equal    | `3 <= 5`   | `true`  |

Comparison operators return boolean values. Equality uses strict comparison (`===` semantics) -- no type coercion is performed. Two dates are equal when they represent the same time.

A `Date` compared with another `Date` or with an ISO 8601 date string (`'2026-10-15'`, `'2026-10-15T12:00:00Z'`) compares by time, with `==`/`!=` too: `createdAt >= '2026-10-01'`. A date alone is UTC midnight; a date-time without an offset is local time. A string that is not an ISO date is not converted.

`>`, `<`, `>=` and `<=` compare two strings alphabetically (`"apple" < "banana"` is `true`); in all other cases both sides are converted to numbers, so dates compare by time.

## Logical Operators

| Operator | Description | Example          | Result  |
|----------|------------|------------------|---------|
| `&&`, `and` | Logical AND | `true && false`  | `false` |
| `\|\|`, `or` | Logical OR  | `true \|\| false` | `true`  |
| `!`, `not`   | Logical NOT | `!true`          | `false` |

`&&` and `||` use short-circuit evaluation and return the deciding operand value (not coerced to boolean). For example, `name || "anonymous"` returns `name` if truthy, otherwise `"anonymous"`.

## Operator Precedence

Operators are evaluated in this order (highest precedence first):

| Precedence | Operators            | Description                    |
|-----------|----------------------|--------------------------------|
| 1         | `()`                 | Parentheses (grouping)         |
| 2         | `^`                  | Exponentiation (right-associative) |
| 3         | `+` `-` `!`/`not` (unary) | Unary operators           |
| 4         | `*` `/` `%`          | Multiplication, division, modulo |
| 5         | `+` `-`              | Addition, subtraction          |
| 6         | `<` `<=` `>` `>=`    | Comparison                     |
| 7         | `==`/`=` `!=`        | Equality                       |
| 8         | `&&`/`and`           | Logical AND                    |
| 9         | `\|\|`/`or`          | Logical OR                     |

`^` binds tighter than unary minus and groups from the right, following math convention:

```
-2 ^ 2      // -4
2 ^ 3 ^ 2   // 512, same as 2 ^ (3 ^ 2)
2 ^ -1      // 0.5
```

Equality is below comparison, so `a < b == c < d` compares the two comparison results.

Use parentheses to override precedence:

```
(2 + 3) * 4    // 20, not 14
```
