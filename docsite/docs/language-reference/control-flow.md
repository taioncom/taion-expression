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

The parentheses around the condition are required. Both branches must be provided.

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

The condition in both forms must evaluate to a boolean. Non-boolean values are not automatically coerced -- use explicit comparisons:

```
// Use this
length(items) > 0 ? "has items" : "empty"

// Not this (will not work as expected)
items ? "has items" : "empty"
```
