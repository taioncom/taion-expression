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

## Comparison Operators

| Operator | Description            | Example    | Result  |
|----------|----------------------|------------|---------|
| `==`, `=` | Strict equal         | `3 == 3`   | `true`  |
| `!=`     | Strict not equal      | `3 != 4`   | `true`  |
| `>`      | Greater than          | `5 > 3`    | `true`  |
| `<`      | Less than             | `3 < 5`    | `true`  |
| `>=`     | Greater than or equal | `5 >= 5`   | `true`  |
| `<=`     | Less than or equal    | `3 <= 5`   | `true`  |

Comparison operators return boolean values. Equality uses strict comparison (`===` semantics) -- no type coercion is performed.

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
| 2         | `^`                  | Exponentiation                 |
| 3         | `+` `-` `!`/`not` (unary) | Unary operators           |
| 4         | `*` `/` `%`          | Multiplication, division, modulo |
| 5         | `+` `-`              | Addition, subtraction          |
| 6         | `<` `<=` `>` `>=` `==`/`=` `!=` | Comparison         |
| 7         | `&&`/`and`           | Logical AND                    |
| 8         | `\|\|`/`or`          | Logical OR                     |

Use parentheses to override precedence:

```
(2 + 3) * 4    // 20, not 14
```
