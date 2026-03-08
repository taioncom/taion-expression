---
sidebar_position: 2
---

# Property Access Control

The evaluator provides fine-grained control over which properties expressions can access on context objects.

Patterns are matched against the **full dotted path** (e.g., `user.address.city`) and against the **leaf property name** (e.g., `city`). This lets you write broad rules like `'password'` that block a property everywhere, or specific rules like `'user.secret'` that target a single path.

## Prototype Blocking

By default, access to prototype-chain properties is blocked. These properties are always denied unless `allowPrototypeAccess` is explicitly set to `true`:

- `__proto__`
- `constructor`
- `prototype`

Additionally, when `allowPrototypeAccess` is `false` (the default), only **own properties** of objects are accessible. Inherited properties return `null`.

```typescript
// This will fail with PROPERTY_ACCESS_DENIED
evaluateExpression('obj.__proto__', { obj: {} });

// Only enable if you fully trust the input
const options = { allowPrototypeAccess: true };
```

## Allowlist

When `allowedProperties` is set, only properties matching the provided patterns are accessible:

```typescript
const options = {
  allowedProperties: ['name', 'age', 'email'],
};

// These work -- 'name' and 'age' match the leaf property name
evaluateExpression('user.name', { user: { name: 'Alice' } }, options);
evaluateExpression('user.age', { user: { age: 25 } }, options);

// This fails -- 'password' is not in the allowlist
evaluateExpression('user.password', { user: { password: 'secret' } }, options);
```

### Path-Specific Rules

Use dotted paths to restrict access to specific objects:

```typescript
const options = {
  allowedProperties: ['user.name', 'user.email'],
};

// user.name is allowed
evaluateExpression('user.name', context, options);

// group.name is NOT allowed -- the full path doesn't match
evaluateExpression('group.name', context, options);
```

Deep paths work too -- intermediate segments are automatically allowed:

```typescript
const options = {
  allowedProperties: ['user.address.city'],
};

// Allowed -- matches the full path
evaluateExpression('user.address.city', context, options);

// Blocked -- different leaf property
evaluateExpression('user.address.zip', context, options);
```

## Denylist

When `deniedProperties` is set, properties matching those patterns are blocked. All other properties remain accessible:

```typescript
const options = {
  deniedProperties: ['password', 'secret', 'token', 'apiKey'],
};

// This works
evaluateExpression('user.name', context, options);

// This fails -- 'password' matches on any object
evaluateExpression('user.password', context, options);
```

Path-specific denials work the same way:

```typescript
const options = {
  deniedProperties: ['user.secret'],
};

// Blocked
evaluateExpression('user.secret', context, options);

// Allowed -- different path
evaluateExpression('group.secret', context, options);
```

## Combining Allowlist and Denylist

When both are set, a property must match the allowlist **and** not match the denylist:

```typescript
const options = {
  allowedProperties: ['name', 'email', 'pass.*'],
  deniedProperties: ['password'],
};

// Allowed: matches allowlist, doesn't match denylist
evaluateExpression('user.name', context, options);
evaluateExpression('user.passphrase', context, options);

// Denied: matches denylist even though it matches allowlist
evaluateExpression('user.password', context, options);
```
