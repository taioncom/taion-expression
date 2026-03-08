---
sidebar_position: 2
---

# Core Concepts

## Expressions

An expression is a string that the evaluator parses and interprets to produce a value. Expressions can contain literals, variables, operators, function calls, and control flow.

```
user.age >= 18 ? "Welcome" : "Too young"
```

Expressions are **not** a general-purpose programming language. They intentionally cannot:

- Modify the context or environment (no side effects)
- Execute loops (prevents infinite loops)
- Access the prototype chain (prevents prototype pollution)
- Call arbitrary code (no `eval` or dynamic dispatch)

## Context

The context is a plain JavaScript object whose properties become the variables available inside an expression:

```typescript
const context = {
  user: { name: 'Alice', age: 25 },
  items: [10, 20, 30],
  discount: 0.1,
};

// Inside the expression, `user.name`, `items`, and `discount` are available
evaluateExpression('user.name', context);
```

Nested property access uses dot notation: `user.name`, `order.items.length`.

## Options

Options control security limits, feature toggles, and custom functions:

```typescript
const options = {
  // Feature toggles
  enableTemplateStrings: true,
  enableArrowFunctions: true,
  enableArrays: true,          // enabled by default

  // Security limits
  timeout: 1000,               // max execution time in ms
  maxComplexity: 100,          // max AST nodes
  maxCallStackDepth: 50,       // max function call depth
  maxLoopIterations: 10000,    // max iterations in array functions

  // Property access control
  allowedProperties: [],       // regex patterns; if set, only these allowed
  deniedProperties: [],        // regex patterns; always denied
  allowPrototypeAccess: false, // block __proto__, constructor, prototype

  // Custom functions
  customFunctions: {
    greet: (name) => `Hello, ${name}!`,
  },
};
```

See [Security](./security/overview.md) for details on each limit.

## Evaluation Pipeline

The evaluator processes an expression in three stages:

1. **Tokenize** -- the expression string is split into tokens (numbers, operators, identifiers, keywords, etc.)
2. **Parse** -- tokens are assembled into an Abstract Syntax Tree (AST) following operator precedence rules
3. **Evaluate** -- the AST is interpreted against the provided context to produce a result

Each stage can produce an error. The result type tells you exactly where the failure occurred through the `errorType` field (`TokenizationError`, `ParseError`, `CompilationError`, or `EvaluationError`).

## Compile Once, Evaluate Many

For expressions that will be evaluated multiple times with different contexts, compile once and reuse:

```typescript
import { compileExpression } from '@taioncom/taion-expression';

const compiled = compileExpression('price * quantity * (1 - discount)');

if (compiled.success) {
  const result1 = compiled.result.evaluate({ price: 10, quantity: 5, discount: 0.1 });
  const result2 = compiled.result.evaluate({ price: 20, quantity: 3, discount: 0.2 });

  console.log(result1); // 45
  console.log(result2); // 48
}
```
