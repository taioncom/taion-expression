---
sidebar_position: 6
---

# Error Handling

The expression evaluator never throws. Instead, all functions return result objects with a `success` field.

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

### Parse Errors

| Code | Cause |
|------|-------|
| `PARSE_ERROR` | Syntax error in the expression |
| `PARSE_FAILED` | Parser could not produce an AST |

### Compilation Errors

| Code | Cause |
|------|-------|
| `COMPILE_ERROR` | Error during AST interpretation setup |
| `COMPILE_FAILED` | AST interpretation setup failed |

### Evaluation Errors

| Code | Cause |
|------|-------|
| `EVALUATION_ERROR` | General runtime error |
| `EVAL_ERROR` | General evaluation failure |
| `TIMEOUT_EXCEEDED` | Execution exceeded the timeout limit |
| `MAX_CALL_STACK_EXCEEDED` | Function call nesting too deep |
| `MAX_COMPLEXITY_EXCEEDED` | Expression AST has too many nodes |
| `MAX_LOOP_ITERATIONS_EXCEEDED` | Array function iterations exceeded the limit |
| `PROPERTY_ACCESS_DENIED` | Property access blocked by security policy |
| `FUNCTION_ACCESS_DENIED` | Function call blocked by security policy |
| `ARRAY_FEATURE_DISABLED` | Array syntax used but `enableArrays` is false |
| `TEMPLATE_STRINGS_DISABLED` | Template string used but `enableTemplateStrings` is false |
| `ARROW_FUNCTIONS_DISABLED` | Arrow function used but `enableArrowFunctions` is false |
| `UNSUPPORTED_FUNCTION_CALL` | Dynamic function reference not allowed |
| `UNKNOWN_NODE_TYPE` | Unknown AST node encountered |
| `INVALID_REGEX_PATTERN` | Invalid regex in allowedProperties/deniedProperties |

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
