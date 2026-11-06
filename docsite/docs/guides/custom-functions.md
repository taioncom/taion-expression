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

## Function Definitions

A custom function can also be a **definition**: the function with its parameters and documentation. Calls are then checked at compile time, and parameters can take a field name or an arrow function instead of a value.

```typescript
import { compileExpression, FunctionCall } from '@taioncom/taion-expression';

const options = {
  strictFunctions: true,
  customFunctions: {
    RUNNINGSUM: {
      fn: ({ runtime }: FunctionCall, field: unknown) => {
        const { rows, index } = runtime as { rows: Record<string, number>[]; index: number };
        const value = (row: Record<string, number>) =>
          typeof field === 'function' ? field(row) : row[field as string];
        return rows.slice(0, index + 1).reduce((sum, row) => sum + value(row), 0);
      },
      usesRuntime: true,
      params: [{ name: 'field', kind: ['field', 'lambda'] }],
      returns: 'number',
      category: 'Window',
      description: 'Sum of the field over this row and the rows before it',
    },
  },
};

const compiled = compileExpression('RUNNINGSUM(amount)', options);
if (compiled.success) {
  const rows = [{ amount: 100 }, { amount: 200 }];
  compiled.result.evaluate({}, { rows, index: 1 }); // 300
}
// An arrow works where the parameter accepts a lambda:
// RUNNINGSUM(r => r.price * r.qty)
```

### `FunctionDefinition`

| Property | Meaning |
|---|---|
| `fn` | The implementation. With `usesRuntime` it is called as `fn(call, ...args)` |
| `params` | Parameters (`ParamSpec[]`). When given, the number of arguments and their kinds are checked at compile time |
| `usesRuntime` | The first argument is `{ context, runtime }`: the evaluation context and the value given as the second argument of `evaluate(context, runtime)` (or the fourth of `evaluateExpression`). The runtime value is never visible to the expression itself |
| `returns`, `description`, `category` | Documentation, listed by `describeFunctions` |

### `ParamSpec`

| Property | Meaning |
|---|---|
| `name` | Shown in catalogs and error messages |
| `kind` | `'value'` (default): the argument is evaluated. `'field'`: the argument must be a context path (`amount`, `order.total`); the function receives the path as text and the analyzer lists it in `identifiers`. The path is checked against the property policy (prototype names, `deniedProperties`, `allowedProperties`) as reading it would be, so a blocked path throws `PROPERTY_ACCESS_DENIED`. `'lambda'`: the argument must be an arrow function, allowed even without `enableArrowFunctions`; the function receives it as a callable. An array accepts several kinds (`['field', 'lambda']`) |
| `optional` | The argument may be left out (trailing parameters) |
| `variadic` | The last parameter takes any number of arguments |
| `description` | What the parameter is for |

A call that does not fit fails compilation, also in branches never evaluated:

- `ARGUMENT_COUNT`: too few or too many arguments (`Function 'RUNNINGSUM' takes 1 argument, got 0`)
- `INVALID_ARGUMENT`: an argument of the wrong kind, with its line and column (`Argument 'field' of 'RUNNINGSUM' must be a field name or an arrow function`)

A value parameter takes an arrow function only where `enableArrowFunctions` is on.

## Listing Functions

`describeFunctions(options)` lists what expressions can call with these options: the built-ins by category (higher-order ones only with `enableArrowFunctions`), and the custom functions with their definitions. Use it for autocomplete, help texts or instructions for an AI writing expressions.

```typescript
import { describeFunctions } from '@taioncom/taion-expression';

describeFunctions(options).find((f) => f.name === 'RUNNINGSUM');
// { name: 'RUNNINGSUM', source: 'custom', category: 'Window',
//   description: 'Sum of the field over ...', params: [...], returns: 'number' }
```

## Using with Context

A plain custom function gets only the arguments passed from the expression. Pass data through arguments, or use a definition with `usesRuntime` (above) to read the context and a runtime value:

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

## Errors and `this`

- If a custom function (or a function passed in the context) throws, the call evaluates to `null` instead of failing the expression. Return an explicit value if callers need to tell errors apart.
- Functions are called without a `this` binding, so methods on context objects that rely on `this` won't work. Pass plain functions or bind them first (`obj.method.bind(obj)`).

## Safety Considerations

Custom functions execute in the host JavaScript environment, so they can perform operations that the expression language itself cannot. Keep these guidelines in mind:

- Custom functions **should be pure** -- they should not modify external state
- Avoid giving expressions access to I/O, file system, or network operations
- Validate inputs inside your custom functions
- Keep custom functions simple and focused
