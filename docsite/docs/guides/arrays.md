---
sidebar_position: 1
---

# Arrays

Arrays are enabled by default (`enableArrays: true`).

## Array Literals

Create arrays inline:

```
[1, 2, 3, 4, 5]
["apple", "banana", "cherry"]
[true, 42, "mixed", null]
```

Array elements can be any expression:

```
[a, b + c, length(name)]
```

## Indexing

Access elements by zero-based index:

```
items[0]        // first element
items[2]        // third element
```

Nested indexing works for multidimensional arrays:

```
matrix[0][1]
```

Use variables as indices:

```
items[index]
```

## Array Functions

### Aggregation

```
sum([10, 20, 30])         // 60
avg([10, 20, 30])         // 20
length([1, 2, 3, 4])      // 4
```

### Searching

```
arrayContains(items, "apple")    // true if "apple" is in items
find(items, x => x > 3)         // first element greater than 3
```

### Transformation

```
sort([3, 1, 4, 1, 5])          // [1, 1, 3, 4, 5]
reverse([1, 2, 3])              // [3, 2, 1]
join(["a", "b", "c"], "-")     // "a-b-c"
```

### Higher-Order Functions

These require `enableArrowFunctions: true`:

```
map(numbers, x => x * 2)
filter(numbers, x => x > 10)
reduce(numbers, (acc, x) => acc + x, 0)
```

See [Arrow Functions](./arrow-functions.md) for more on lambda syntax.

## Combining with Context

Arrays from the context work exactly like array literals:

```typescript
const context = {
  scores: [85, 92, 78, 95, 88],
};

evaluateExpression('avg(scores)', context);           // 87.6
evaluateExpression('sort(scores)', context);           // [78, 85, 88, 92, 95]
evaluateExpression('scores[0]', context);              // 85
evaluateExpression('length(scores)', context);         // 5
```
