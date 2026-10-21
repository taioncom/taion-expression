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

### analyzeExpression

Parses and validates an expression exactly as `compileExpression` does, without evaluating it, and lists what it references.

```typescript
function analyzeExpression(
  expressionString: string,
  options?: ExpressionOptions
): AnalyzeResult;
```

**Returns:** `AnalyzeResult` -- either `{ success: true, ast, identifiers, functions }` or the same failure object as `compileExpression`. See [Spreadsheet-style Expressions](./guides/spreadsheet-style.md#analyzeexpression).

---

## Types

### ExpressionOptions

```typescript
type ExpressionOptions = {
  customFunctions?: Record<string, (...args: readonly unknown[]) => unknown>;
  timeout?: number;                    // default: 1000
  maxCallStackDepth?: number;          // default: 50
  maxComplexity?: number;              // default: 100 (AST nodes, checked at compile time)
  maxLoopIterations?: number;          // default: 10000
  maxExpressionLength?: number;        // default: 10000 (0 disables)
  allowedProperties?: readonly string[]; // empty or omitted = allow all
  deniedProperties?: readonly string[];
  allowPrototypeAccess?: boolean;      // default: false
  enableArrays?: boolean;              // default: true
  enableTemplateStrings?: boolean;     // default: false
  enableArrowFunctions?: boolean;      // default: false
  caseInsensitiveNames?: boolean;      // default: false
  semantics?: 'javascript' | 'spreadsheet'; // default: 'javascript'
  strictFunctions?: boolean;           // default: false
  timeZone?: string;                   // default: undefined
};
```

`caseInsensitiveNames`, `semantics` and `strictFunctions` are described in [Spreadsheet-style Expressions](./guides/spreadsheet-style.md). `timeZone` (an IANA zone) makes a `Date` compared with a date alone (`'2026-10-01'`) compare by calendar day in that zone; see [Operators](./language-reference/operators.md).

### AnalyzeResult

```typescript
type AnalyzeResult =
  | {
      success: true;
      ast: ExpressionNode;
      identifiers: readonly string[]; // context paths, deduplicated, in source order
      functions: readonly string[];   // called names as written, deduplicated
    }
  | CompileFailure;
```

### CompiledExpression

```typescript
type CompiledExpression = {
  evaluate: (context: Record<string, unknown>) => unknown;
  source: string;
  compiledCode: string;
};
```

`evaluate()` throws on runtime errors (the error carries a `code`). Use `evaluateExpression` if you want a result object instead.

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
