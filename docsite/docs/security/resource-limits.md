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

The `maxComplexity` option limits the number of nodes in the expression's AST. It is checked at compile time, before evaluation, and fails with `errorType: "CompilationError"`. Repeated evaluation of an arrow function body (for example once per element in `map`) does not count toward it; runtime work is bounded by `maxLoopIterations` and `timeout`.

```typescript
const options = { maxComplexity: 50 };

// Simple expressions like "a + b" have ~3 nodes
// Complex expressions like "a + b * c - d / e + f" have more
```

**Default:** 100 nodes

Exceeding this limit produces a `MAX_COMPLEXITY_EXCEEDED` error.

## Expression Length

The `maxExpressionLength` option limits the length of the expression source in characters. Set it to `0` to disable the check.

```typescript
const options = { maxExpressionLength: 2000 };
```

**Default:** 10000 characters

Exceeding this limit produces a `MAX_EXPRESSION_LENGTH_EXCEEDED` error. Expressions nested too deeply to parse (for example thousands of nested parentheses) fail with `MAX_NESTING_EXCEEDED`.

## Call Stack Depth

The `maxCallStackDepth` option limits how deeply function calls can be nested. This prevents stack overflow from deeply nested function compositions.

```typescript
const options = { maxCallStackDepth: 20 };

// Nested calls like map(filter(sort(data), fn), fn2) increase depth
```

**Default:** 50 levels

Exceeding this limit produces a `MAX_CALL_STACK_EXCEEDED` error.

## Loop Iterations

The `maxLoopIterations` option limits the total number of iterations across all higher-order array functions (`map`, `filter`, `find`, `findIndex`, `reduce`, `every`, `some`, `sort`, `reverse`, `sortBy`, `minBy`, `maxBy`, `sumBy`, `groupBy`, `distinctBy`, `countBy`). `sortBy` counts twice the array length. This prevents very large arrays from being processed.

```typescript
const options = { maxLoopIterations: 1000 };

// Processing an array of 500 items with map uses 500 iterations
// Chaining map then filter on 500 items uses up to 1000 iterations
```

**Default:** 10000 iterations

Exceeding this limit produces a `MAX_LOOP_ITERATIONS_EXCEEDED` error.

## Built-in Size Caps

Some limits are fixed and not configurable:

- Strings produced by expressions are capped at 1,000,000 characters. `+` concatenation beyond that fails with `MAX_STRING_LENGTH_EXCEEDED`; `repeat`, `join` and `concat` return `""`, and `padLeft`/`padRight` return the input unchanged.
- `repeat` accepts counts up to 10000, `split` keeps at most 10000 pieces and `range` produces at most 10000 elements.
- Regex functions reject patterns longer than 200 characters, inputs longer than 100000 characters, and patterns with nested quantifiers (e.g. `(a+)+`) or backreferences. This blocks common catastrophic-backtracking patterns but is a heuristic, not a guarantee.

## Recommended Limits by Use Case

| Use Case | timeout | maxComplexity | maxCallStackDepth | maxLoopIterations |
|----------|---------|---------------|-------------------|-------------------|
| Untrusted user input | 500 | 50 | 20 | 1000 |
| Business rules | 1000 | 100 | 50 | 10000 |
| Internal tooling | 5000 | 500 | 100 | 50000 |
