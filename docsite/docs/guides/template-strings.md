---
sidebar_position: 2
---

# Template Strings

Template strings allow string interpolation using backtick syntax. They must be enabled with the `enableTemplateStrings` option.

## Enabling Template Strings

```typescript
const options = { enableTemplateStrings: true };

evaluateExpression('`Hello, ${name}!`', { name: 'Alice' }, options);
// "Hello, Alice!"
```

## Syntax

Template strings are enclosed in backticks and can embed expressions using `${...}`:

```
`Hello, ${name}!`
`The result is ${2 + 3}`
`${firstName} ${lastName}`
```

## Embedded Expressions

Any valid expression can appear inside `${}`:

```
`Total: ${price * quantity}`
`Status: ${score >= 90 ? "Pass" : "Fail"}`
`Items: ${length(items)}`
```

## Multi-Part Templates

Templates can mix static text and multiple interpolations:

```
`${user.name} is ${user.age} years old and lives in ${user.city}`
```

## Example

```typescript
import { evaluateExpression } from '@taioncom/taion-expression';

const context = {
  user: { name: 'Alice', age: 30 },
  items: ['apple', 'banana'],
};

const options = { enableTemplateStrings: true };

const result = evaluateExpression(
  '`${user.name} has ${length(items)} items`',
  context,
  options
);

console.log(result.result); // "Alice has 2 items"
```
