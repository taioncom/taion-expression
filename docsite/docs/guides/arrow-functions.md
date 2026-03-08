---
sidebar_position: 3
---

# Arrow Functions

Arrow functions (lambdas) allow you to pass inline functions to higher-order functions like `map`, `filter`, `find`, and `reduce`. They must be enabled with the `enableArrowFunctions` option.

## Enabling Arrow Functions

```typescript
const options = { enableArrowFunctions: true };
```

## Syntax Forms

### Single Parameter

No parentheses needed:

```
x => x * 2
item => item.price > 100
name => toUpperCase(name)
```

### Multiple Parameters

Parentheses are required:

```
(a, b) => a + b
(item, index) => index
(acc, val) => acc + val
```

### No Parameters

Use empty parentheses:

```
() => 42
() => "constant"
```

## Usage with Array Functions

### map

Transform each element:

```
map([1, 2, 3], x => x * 2)           // [2, 4, 6]
map(users, u => u.name)               // extract names
```

### filter

Keep elements that satisfy a condition:

```
filter([1, 2, 3, 4, 5], x => x > 3)  // [4, 5]
filter(items, item => item.active)     // keep active items
```

### find

Get the first matching element:

```
find(users, u => u.name == "Alice")
find(scores, s => s >= 90)
```

### reduce

Accumulate values:

```
reduce([1, 2, 3, 4, 5], (acc, x) => acc + x, 0)     // 15
reduce(items, (total, item) => total + item.price, 0) // sum prices
```

## Combining Features

Arrow functions work with all other expression features:

```typescript
const options = {
  enableArrowFunctions: true,
  enableArrays: true,
  enableTemplateStrings: true,
};

const context = {
  users: [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 17 },
    { name: 'Carol', age: 30 },
  ],
};

// Filter adults and get their names
evaluateExpression(
  'map(filter(users, u => u.age >= 18), u => u.name)',
  context,
  options
);
// ["Alice", "Carol"]
```
