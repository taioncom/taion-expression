---
sidebar_position: 6
---

# Error Handling

`compileExpression` and `evaluateExpression` never throw. Instead, they return result objects with a `success` field.

The `evaluate()` method of a `CompiledExpression` does throw on runtime errors (with the same error codes), so wrap it in `try`/`catch` or use `evaluateExpression`.

## Result Types

### EvaluateResult

```typescript
type EvaluateSuccess = {
  success: true;
  result: unknown;
};

type EvaluateFailure = {
  success: false;
  error: ExtendedError;   // Error object with message
  errorType: string;       // "TokenizationError" | "ParseError" | "CompilationError" | "EvaluationError"
  errorCode: string;       // Machine-readable error code
  expression?: string;     // Original expression (for runtime errors)
};

type EvaluateResult = EvaluateSuccess | EvaluateFailure;
```

### CompileResult

```typescript
type CompileSuccess = {
  success: true;
  result: CompiledExpression;
};

type CompileFailure = {
  success: false;
  error: ExtendedError;
  errorType: string;
  errorCode: string;
};

type CompileResult = CompileSuccess | CompileFailure;
```

## Error Codes

### Tokenization Errors

| Code | Cause |
|------|-------|
| `TOKENIZE_ERROR` | Invalid character or malformed token in the expression |

### Parse Errors (`errorType: "ParseError"`)

| Code | Cause |
|------|-------|
| `PARSE_ERROR` | Syntax error in the expression |
| `PARSE_FAILED` | Parser could not produce an AST |
| `MAX_EXPRESSION_LENGTH_EXCEEDED` | Expression source is longer than `maxExpressionLength` |
| `MAX_NESTING_EXCEEDED` | Expression is nested too deeply to parse |

### Compilation Errors (`errorType: "CompilationError"`)

These are detected after parsing, before the expression is evaluated.

| Code | Cause |
|------|-------|
| `MAX_COMPLEXITY_EXCEEDED` | Expression AST has more nodes than `maxComplexity` |
| `ARRAY_FEATURE_DISABLED` | Array syntax used but `enableArrays` is false |
| `TEMPLATE_STRINGS_DISABLED` | Template string used but `enableTemplateStrings` is false |
| `ARROW_FUNCTIONS_DISABLED` | Arrow function used but `enableArrowFunctions` is false |
| `INVALID_REGEX_PATTERN` | Invalid regex in `allowedProperties`/`deniedProperties` |
| `INVALID_TIME_ZONE` | `timeZone` is not a time zone the runtime knows |
| `COMPILE_ERROR` | Other error while setting up evaluation |

### Evaluation Errors (`errorType: "EvaluationError"`)

| Code | Cause |
|------|-------|
| `EVALUATION_FAILED` | Unexpected runtime error (wrapped) |
| `EVALUATION_ERROR` | A non-`Error` value was thrown during evaluation |
| `TIMEOUT_EXCEEDED` | Execution exceeded the timeout limit |
| `MAX_CALL_STACK_EXCEEDED` | Function call nesting too deep |
| `MAX_LOOP_ITERATIONS_EXCEEDED` | Array function iterations exceeded the limit |
| `MAX_STRING_LENGTH_EXCEEDED` | String concatenation with `+` produced more than 1,000,000 characters |
| `PROPERTY_ACCESS_DENIED` | Property access blocked by security policy |
| `FUNCTION_ACCESS_DENIED` | Function call blocked by security policy |
| `UNSUPPORTED_FUNCTION_CALL` | Dynamic function reference not allowed |
| `UNKNOWN_NODE_TYPE` | Unknown AST node encountered |

## Error Object

The `error` field on failure results is an `ExtendedError` with optional location information:

```typescript
type ExtendedError = Error & {
  code?: string;    // Same as errorCode
  line?: number;    // Line number (1-based)
  column?: number;  // Column number (1-based)
};
```

## Handling Patterns

### Check Success

```typescript
const result = evaluateExpression('user.age >= 18', context);

if (result.success) {
  console.log(result.result);
} else {
  console.error(`${result.errorCode}: ${result.error.message}`);
}
```

### Handle Specific Error Codes

```typescript
const result = evaluateExpression(expr, context, options);

if (!result.success) {
  switch (result.errorCode) {
    case 'TIMEOUT_EXCEEDED':
      console.error('Expression took too long');
      break;
    case 'PROPERTY_ACCESS_DENIED':
      console.error('Access denied to a property');
      break;
    case 'PARSE_ERROR':
      console.error('Invalid expression syntax');
      break;
    default:
      console.error(result.error.message);
  }
}
```

### Safe Evaluation

Use `safeEvaluateExpression` when you just need the value or `null`:

```typescript
const value = safeEvaluateExpression('2 + 3', context);
// 5 on success, null on any error
```
