---
sidebar_position: 1
---

# Security Overview

The expression evaluator is designed from the ground up to safely evaluate untrusted user input. It uses a defense-in-depth approach with multiple layers of protection.

## Sandboxed Execution Model

Expressions run in a fully sandboxed interpreter. Unlike approaches that compile to JavaScript and use `eval()`, this library:

- Parses expressions into an AST (Abstract Syntax Tree)
- Interprets the AST directly with controlled semantics
- Never generates or executes arbitrary JavaScript code

This means expressions can only do what the interpreter explicitly allows.

## What Expressions Cannot Do

- **No side effects** -- expressions cannot modify the context, environment, or any external state
- **No loops** -- there are no `for`, `while`, or `do` constructs (array functions like `map`/`filter` are the only iteration mechanism and are bounded)
- **No dynamic code execution** -- no `eval()`, `Function()`, or `import()`
- **No prototype access** -- `__proto__`, `constructor`, and `prototype` are blocked by default
- **No arbitrary function calls** -- only pre-registered built-in and custom functions can be called

## Defense Layers

| Layer | Protection | Default |
|-------|-----------|---------|
| [Property Access Control](./property-access.md) | Allowlist/denylist for property names | Prototype blocked |
| [Timeout](./resource-limits.md) | Maximum execution time | 1000ms |
| [Complexity Limit](./resource-limits.md) | Maximum AST nodes | 100 |
| [Call Stack Depth](./resource-limits.md) | Maximum function nesting | 50 |
| [Loop Iterations](./resource-limits.md) | Maximum iterations in array functions | 10000 |
| Feature Toggles | Disable arrays, template strings, arrow functions | Arrays on; template strings and arrow functions off |

## Recommended Configuration

For evaluating fully untrusted input, use restrictive settings:

```typescript
const options = {
  timeout: 500,
  maxComplexity: 50,
  maxCallStackDepth: 20,
  maxLoopIterations: 1000,
  enableTemplateStrings: false,
  enableArrowFunctions: false,
  deniedProperties: ['password', 'secret', 'token', 'key'],
};
```

For trusted internal use where you control the expressions, you can use more permissive settings:

```typescript
const options = {
  enableTemplateStrings: true,
  enableArrowFunctions: true,
  timeout: 5000,
  maxComplexity: 500,
};
```
