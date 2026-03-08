---
sidebar_position: 1
---

# Getting Started

## Installation

```bash
npm install @taioncom/taion-expression
```

## Quick Start

```typescript
import { evaluateExpression } from '@taioncom/taion-expression';

const result = evaluateExpression('2 + 3 * 4');

if (result.success) {
  console.log(result.result); // 14
}
```

## Using with Context

Pass variables to expressions through a context object:

```typescript
import { evaluateExpression } from '@taioncom/taion-expression';

const context = {
  user: { name: 'Alice', age: 25 },
  threshold: 18,
};

const result = evaluateExpression(
  'user.age >= threshold ? "Adult" : "Minor"',
  context
);

console.log(result.result); // "Adult"
```

## Result Types

Every call to `evaluateExpression` returns a discriminated union -- either a success or a failure:

```typescript
const result = evaluateExpression('1 + 2');

if (result.success) {
  // result.result contains the value
  console.log(result.result); // 3
} else {
  // result.error contains the Error object
  // result.errorCode contains a machine-readable code like "PARSE_ERROR"
  console.error(result.errorCode, result.error.message);
}
```

## Safe Evaluation

If you prefer `null` on error instead of checking `success`, use `safeEvaluateExpression`:

```typescript
import { safeEvaluateExpression } from '@taioncom/taion-expression';

const value = safeEvaluateExpression('2 + 3');
console.log(value); // 5

const bad = safeEvaluateExpression('1 + / 2');
console.log(bad); // null
```

## CommonJS Usage

The library supports both ESM and CommonJS:

```javascript
const { evaluateExpression } = require('@taioncom/taion-expression');

const result = evaluateExpression('10 % 3');
console.log(result.result); // 1
```

## Next Steps

- Learn the [Core Concepts](./core-concepts.md) behind the evaluator
- Explore the [Language Reference](./language-reference/data-types.md) for all supported syntax
- Try expressions interactively in the [Playground](/playground)
