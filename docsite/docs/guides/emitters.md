---
sidebar_position: 6
---

# Emitting to Other Targets

`emitExpression` turns an expression into something other than a value: SQL for a database, code in another language, a description. The library parses and validates the expression exactly as for evaluation (limits, feature flags, `strictFunctions`, custom function parameters), then walks it bottom-up and calls your **emitter**, one method per kind of node. The target stays in your code; the library knows nothing about SQL.

```typescript
import { createEmitError, emitExpression, Emitter } from '@taioncom/taion-expression';

const SQL: Record<string, string> = { round: 'round', abs: 'abs' }; // the allowlist

const toSql: Emitter<string> = {
  literal: (v) =>
    v === null ? 'NULL' : typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : String(v),
  identifier: (path, node) => `"${path}"`,
  unary: (op, x) => (op === '!' ? `NOT ${x}` : `${op}${x}`),
  binary: (op, l, r) =>
    `(${l} ${op === '&&' ? 'AND' : op === '||' ? 'OR' : op === '==' ? '=' : op} ${r})`,
  conditional: (t, a, b) => `CASE WHEN ${t} THEN ${a} ELSE ${b} END`,
  call: (name, args, node) => {
    const fn = SQL[name];
    if (!fn) throw createEmitError(`No SQL for ${name}`, node);
    return `${fn}(${args.map((a) => (a.kind === 'value' ? a.value : '')).join(', ')})`;
  },
};

emitExpression('round(price * qty, 2) > 100 and not archived', toSql, { strictFunctions: true });
// { success: true, result: '((round(("price" * "qty"), 2) > 100) AND NOT "archived")',
//   identifiers: ['price', 'qty', 'archived'], functions: ['round'] }
```

## The emitter

| Method | Called for |
|---|---|
| `literal(value, node)` | A number, text, boolean or `null` |
| `identifier(path, node, local)` | A context path (`amount`, `order.total`); `local` when it starts with an arrow function's parameter |
| `unary(op, operand, node)` | `-x`, `+x`, `!x` (`not x` is `!`) |
| `binary(op, left, right, node)` | `+ - * / % ^ < > <= >= == != && \|\|` (`=` is `==`, `and`/`or` are `&&`/`\|\|`) |
| `conditional(test, consequent, alternate, node)` | `c ? a : b` and `if c then a else b` |
| `call(name, args, node)` | A function call, by its registered name (the custom or built-in spelling; as written when it is neither) |
| `array?`, `index?`, `template?` | Array literals, computed indexes and template strings: optional, left out means unsupported |

Each argument of a call is an `EmitArg`:

- `{ kind: 'value', value }`: the emitted argument;
- `{ kind: 'field', path }`: a context path given to a custom function's `field` parameter;
- `{ kind: 'lambda', params, body }`: an arrow function; `body()` emits its body, where its parameters arrive as `local` identifiers.

## Errors

Throw `createEmitError(message, node, code?)` for anything the target cannot express (an unknown function: your mapping table is the allowlist). The result is then a failure shaped like a compile failure, with the node's line and column; invalid input fails as compilation does (`PARSE_ERROR`, `UNKNOWN_FUNCTION`, `INVALID_ARGUMENT` ...). `parseExpression(expr, options)` gives the validated AST and its references if you want to walk it yourself.
