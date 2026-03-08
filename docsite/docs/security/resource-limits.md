---
sidebar_position: 3
---

# Resource Limits

Resource limits prevent expressions from consuming excessive CPU time or memory.

## Timeout

The `timeout` option sets the maximum execution time in milliseconds. If an expression takes longer, evaluation stops with a `TIMEOUT_EXCEEDED` error.

```typescript
const options = { timeout: 500 }; // 500ms limit

const result = evaluateExpression(longExpression, context, options);
if (!result.success && result.errorCode === 'TIMEOUT_EXCEEDED') {
  console.log('Expression took too long');
}
```

**Default:** 1000ms (1 second)

## Expression Complexity

The `maxComplexity` option limits the number of nodes in the expression's AST. This prevents extremely large expressions from being parsed and evaluated.

```typescript
const options = { maxComplexity: 50 };

// Simple expressions like "a + b" have ~3 nodes
// Complex expressions like "a + b * c - d / e + f" have more
```

**Default:** 100 nodes

Exceeding this limit produces a `MAX_COMPLEXITY_EXCEEDED` error.

## Call Stack Depth

The `maxCallStackDepth` option limits how deeply function calls can be nested. This prevents stack overflow from deeply nested function compositions.

```typescript
const options = { maxCallStackDepth: 20 };

// Nested calls like map(filter(sort(data), fn), fn2) increase depth
```

**Default:** 50 levels

Exceeding this limit produces a `MAX_CALL_STACK_EXCEEDED` error.

## Loop Iterations

The `maxLoopIterations` option limits the total number of iterations across all array functions (`map`, `filter`, `find`, `reduce`, `sort`). This prevents very large arrays from being processed.

```typescript
const options = { maxLoopIterations: 1000 };

// Processing an array of 500 items with map uses 500 iterations
// Chaining map then filter on 500 items uses up to 1000 iterations
```

**Default:** 10000 iterations

Exceeding this limit produces a `MAX_LOOP_ITERATIONS_EXCEEDED` error.

## Recommended Limits by Use Case

| Use Case | timeout | maxComplexity | maxCallStackDepth | maxLoopIterations |
|----------|---------|---------------|-------------------|-------------------|
| Untrusted user input | 500 | 50 | 20 | 1000 |
| Business rules | 1000 | 100 | 50 | 10000 |
| Internal tooling | 5000 | 500 | 100 | 50000 |
