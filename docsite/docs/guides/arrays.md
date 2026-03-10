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
count([1, 2, 3, 4])       // 4
median([3, 1, 2])         // 2
```

### Access

```
first([10, 20, 30])             // 10
last([10, 20, 30])              // 30
```

### Searching

```
arrayContains(items, "apple")    // true if "apple" is in items
includes(items, "apple")         // same, also works for strings
find(items, x => x > 3)         // first element greater than 3
findIndex(items, x => x > 3)    // index of first element greater than 3
```

### Transformation

```
sort([3, 1, 4, 1, 5])          // [1, 1, 3, 4, 5]
reverse([1, 2, 3])              // [3, 2, 1]
join(["a", "b", "c"], "-")     // "a-b-c"
unique([1, 2, 2, 3, 3])        // [1, 2, 3]
compact([1, null, 2, "", 3])   // [1, 2, 3]
flat([[1, 2], [3, 4]])         // [1, 2, 3, 4]
```

### Generating

```
range(0, 5)                     // [0, 1, 2, 3, 4]
range(0, 10, 2)                 // [0, 2, 4, 6, 8]
chunk([1, 2, 3, 4, 5], 2)     // [[1, 2], [3, 4], [5]]
zip([1, 2, 3], ["a", "b", "c"]) // [[1, "a"], [2, "b"], [3, "c"]]
```

### Statistics

```
median([1, 2, 3, 4])           // 2.5
stddev([2, 4, 4, 4, 5, 5, 7, 9]) // 2.0
variance([2, 4, 4, 4, 5, 5, 7, 9]) // 4.0
percentile([1, 2, 3, 4, 5], 90) // 4.6
```

### Higher-Order Functions

These require `enableArrowFunctions: true`:

```
map(numbers, x => x * 2)
filter(numbers, x => x > 10)
reduce(numbers, (acc, x) => acc + x, 0)
sortBy(users, u => u.age)
groupBy(items, x => x.category)
minBy(products, p => p.price)
maxBy(products, p => p.price)
sumBy(orders, o => o.total)
countBy(users, u => u.active)
distinctBy(users, u => u.department)
```

See [Arrow Functions](./arrow-functions.md) for more on lambda syntax.

## Combining with Context

Arrays from the context work exactly like array literals:

```typescript
const context = {
  scores: [85, 92, 78, 95, 88],
};

evaluateExpression('avg(scores)', context);           // 87.6
evaluateExpression('median(scores)', context);         // 88
evaluateExpression('sort(scores)', context);           // [78, 85, 88, 92, 95]
evaluateExpression('scores[0]', context);              // 85
evaluateExpression('first(scores)', context);          // 85
evaluateExpression('last(scores)', context);           // 88
evaluateExpression('length(scores)', context);         // 5
```
