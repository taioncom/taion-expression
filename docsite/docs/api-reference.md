---
sidebar_position: 7
---

# API Reference

## Functions

### evaluateExpression

Evaluates an expression string with a context and returns a result.

```typescript
function evaluateExpression(
  expressionString: string,
  context?: Record<string, unknown>,
  options?: ExpressionOptions
): EvaluateResult;
```

**Parameters:**
- `expressionString` -- the expression to evaluate
- `context` -- object whose properties become variables (default: `{}`)
- `options` -- evaluation options (default: `{}`)

**Returns:** `EvaluateResult` -- either `{ success: true, result }` or `{ success: false, error, errorType, errorCode }`

---

### safeEvaluateExpression

Evaluates an expression and returns the result value directly, or `null` on any error.

```typescript
function safeEvaluateExpression(
  expressionString: string,
  context?: Record<string, unknown>,
  options?: ExpressionOptions
): unknown;
```

**Returns:** The result value, or `null` if evaluation fails.

---

### compileExpression

Compiles an expression into a reusable `CompiledExpression` without evaluating it.

```typescript
function compileExpression(
  expressionString: string,
  options?: ExpressionOptions
): CompileResult;
```

**Returns:** `CompileResult` -- either `{ success: true, result: CompiledExpression }` or `{ success: false, error, errorType, errorCode }`

---

### safeCompileExpression

Compiles an expression and returns a `CompiledExpression`, or `null` on any error.

```typescript
function safeCompileExpression(
  expressionString: string,
  options?: ExpressionOptions
): CompiledExpression | null;
```

---

### getCompiledCode

Returns the compiled code representation for an expression, or `null` on error.

```typescript
function getCompiledCode(
  expressionString: string,
  options?: ExpressionOptions
): string | null;
```

---

## Types

### ExpressionOptions

```typescript
type ExpressionOptions = {
  customFunctions?: Record<string, (...args: readonly unknown[]) => unknown>;
  timeout?: number;                    // default: 1000
  maxCallStackDepth?: number;          // default: 50
  maxComplexity?: number;              // default: 100
  maxLoopIterations?: number;          // default: 10000
  allowedProperties?: readonly string[];
  deniedProperties?: readonly string[];
  allowPrototypeAccess?: boolean;      // default: false
  enableArrays?: boolean;              // default: true
  enableTemplateStrings?: boolean;     // default: false
  enableArrowFunctions?: boolean;      // default: false
};
```

### CompiledExpression

```typescript
type CompiledExpression = {
  evaluate: (context: Record<string, unknown>) => unknown;
  source: string;
  compiledCode: string;
};
```

### EvaluateResult

```typescript
type EvaluateSuccess = { success: true; result: unknown };
type EvaluateFailure = {
  success: false;
  error: ExtendedError;
  errorType: string;
  errorCode: string;
  expression?: string;
};
type EvaluateResult = EvaluateSuccess | EvaluateFailure;
```

### CompileResult

```typescript
type CompileSuccess = { success: true; result: CompiledExpression };
type CompileFailure = {
  success: false;
  error: ExtendedError;
  errorType: string;
  errorCode: string;
};
type CompileResult = CompileSuccess | CompileFailure;
```

### ExtendedError

```typescript
type ExtendedError = Error & {
  code?: string;
  line?: number;
  column?: number;
};
```

### ExpressionNode

Union type of all AST node types:

```typescript
type ExpressionNode =
  | LiteralNode
  | IdentifierNode
  | MemberExpressionNode
  | BinaryExpressionNode
  | UnaryExpressionNode
  | CallExpressionNode
  | ConditionalExpressionNode
  | ArrayLiteralNode
  | ArrayIndexNode
  | TemplateLiteralNode
  | ArrowFunctionNode;
```

Each node has a `type` discriminant and a `location: { line: number; column: number }` field.
