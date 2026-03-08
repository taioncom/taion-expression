---
sidebar_position: 1
---

# Data Types

The expression language supports six data types.

## Number

Integer and floating-point numbers.

```
42
3.14
-7
0.5
```

Numbers support all arithmetic operations. Division by zero returns `Infinity` or `-Infinity`.

## String

Text enclosed in single quotes, double quotes, or backticks.

```
"hello"
'world'
`template`
```

Backtick strings support interpolation when `enableTemplateStrings` is enabled -- see [Template Strings](../guides/template-strings.md).

Strings can be concatenated with the `+` operator:

```
"Hello" + " " + "World"
```

## Boolean

The values `true` and `false`.

```
true
false
```

Booleans are the result of comparison and logical operators and are required by conditional expressions.

## Null

The value `null` represents the absence of a value.

```
null
```

Use the type-checking functions `isNull(value)` and `isDefined(value)` to test for null.

## Array

Ordered collections of values (requires `enableArrays`, which is enabled by default).

```
[1, 2, 3]
["a", "b", "c"]
[true, 42, "mixed"]
```

Arrays can contain any data type, including nested arrays. See [Arrays](../guides/arrays.md) for indexing and array functions.

## Date

Date objects represent a specific point in time. There is no date literal syntax -- dates are created via built-in functions or passed through the evaluation context.

```
now()                         // current date/time
date(2024, 3, 15)            // March 15, 2024
parseDate("2024-03-15")      // March 15, 2024
```

Dates support comparison operators (`>`, `<`, `>=`, `<=`) and subtraction (`-`) via numeric coercion. Use `type(d)` to check for `"date"` and `isDate(d)` for type checking.

See [Built-in Functions](./built-in-functions.md#date-functions) for the full list of date creation, extraction, formatting, and arithmetic functions.
