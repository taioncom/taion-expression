---
sidebar_position: 4
---

# Custom Functions

You can extend the expression language by registering custom functions that expressions can call.

## Registering Functions

Pass functions through the `customFunctions` option:

```typescript
import { evaluateExpression } from '@taioncom/taion-expression';

const options = {
  customFunctions: {
    greet: (name) => `Hello, ${name}!`,
    double: (x) => x * 2,
    discount: (price, pct) => price * (1 - pct / 100),
  },
};

evaluateExpression('greet("World")', {}, options);
// { success: true, result: "Hello, World!" }

evaluateExpression('double(21)', {}, options);
// { success: true, result: 42 }

evaluateExpression('discount(100, 15)', {}, options);
// { success: true, result: 85 }
```

## Using with Context

Custom functions have access to arguments passed from the expression but not to the context directly. Pass data through arguments:

```typescript
const options = {
  customFunctions: {
    calculateTax: (amount, rate) => amount * (rate / 100),
    formatCurrency: (amount) => `$${Number(amount).toFixed(2)}`,
  },
};

const context = { subtotal: 99.99, taxRate: 8.5 };

evaluateExpression(
  'formatCurrency(subtotal + calculateTax(subtotal, taxRate))',
  context,
  options
);
// { success: true, result: "$108.49" }
```

## Overriding Built-ins

Custom functions take precedence over built-in functions. You can override a built-in if needed:

```typescript
const options = {
  customFunctions: {
    // Override built-in max to support arrays
    max: (...args) => Math.max(...args.flat()),
  },
};
```

## Safety Considerations

Custom functions execute in the host JavaScript environment, so they can perform operations that the expression language itself cannot. Keep these guidelines in mind:

- Custom functions **should be pure** -- they should not modify external state
- Avoid giving expressions access to I/O, file system, or network operations
- Validate inputs inside your custom functions
- Keep custom functions simple and focused
