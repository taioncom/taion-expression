---
sidebar_position: 3
---

# Control Flow

The expression language provides two forms of conditional expressions.

## Ternary Expression

The standard ternary operator works like JavaScript:

```
condition ? valueIfTrue : valueIfFalse
```

Examples:

```
score >= 90 ? "A" : "B"
age >= 18 ? "Adult" : "Minor"
x > 0 ? x : -x
```

Ternary expressions can be nested:

```
score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "F"
```

## If-Then-Else Expression

A more readable alternative for conditionals:

```
if (condition) then expression1 else expression2
```

The parentheses around the condition are optional (`if age >= 18 then ...` also works). Both branches must be provided.

Examples:

```
if (user.age >= 18) then "Adult" else "Minor"
```

If-then-else expressions can be nested for complex logic:

```
if (order.total > 100) then
  if (user.isPremium) then
    order.total * 0.85
  else
    order.total * 0.9
else
  order.total
```

## Truthiness

The condition in both forms uses JavaScript truthiness. `false`, `null`, `0`, `NaN` and `""` are falsy; everything else is truthy, including empty arrays and objects:

```
name ? "has name" : "no name"   // "" and null give "no name"
items ? "has items" : "empty"   // [] is truthy, so this gives "has items"

// Check arrays by length instead
length(items) > 0 ? "has items" : "empty"
```

The two branches may return values of different types.
