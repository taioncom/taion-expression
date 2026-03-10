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

### find / findIndex

Get the first matching element or its index:

```
find(users, u => u.name == "Alice")
find(scores, s => s >= 90)
findIndex([10, 20, 30], x => x > 15)  // 1
```

### reduce

Accumulate values:

```
reduce([1, 2, 3, 4, 5], (acc, x) => acc + x, 0)     // 15
reduce(items, (total, item) => total + item.price, 0) // sum prices
```

### sortBy / groupBy / distinctBy

Sort, group, or deduplicate by a computed key:

```
sortBy(users, u => u.age)
// [{name: "Bob", age: 17}, {name: "Alice", age: 25}, ...]

groupBy(items, x => x.category)
// { "fruit": [...], "vegetable": [...] }

distinctBy(users, u => u.department)
// one user per department
```

### minBy / maxBy / sumBy / countBy

Aggregate using a computed value:

```
minBy(products, p => p.price)         // cheapest product
maxBy(products, p => p.price)         // most expensive product
sumBy(orders, o => o.total)           // total revenue
countBy(users, u => u.active)         // number of active users
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

// Get the youngest adult
evaluateExpression(
  'minBy(filter(users, u => u.age >= 18), u => u.age)',
  context,
  options
);
// { name: "Alice", age: 25 }
```
