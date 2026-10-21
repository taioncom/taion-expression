import {
  checkStrictFunctions,
  collectReferences,
  ExpressionReferences,
} from './analyzer.js';
import { evaluateAST } from './evaluator.js';
import { parse } from './parser.js';
import { tokenize } from './tokenizer.js';
import {
  CompiledExpression,
  createCompilationError,
  createEvaluationError,
  ExpressionNode,
  ExpressionOptions,
  ExtendedError,
  Token,
} from './types.js';
import { validateAST } from './validator.js';

/**
 * Type representing a successful compilation result
 */
export type CompileSuccess = {
  readonly success: true;
  readonly result: CompiledExpression;
};

/**
 * Type representing a failed compilation result
 */
export type CompileFailure = {
  readonly success: false;
  readonly error: ExtendedError;
  readonly errorType: string;
  readonly errorCode: string;
};

/**
 * Compile result type - either success or failure
 */
export type CompileResult = CompileSuccess | CompileFailure;

/**
 * Type representing a successful evaluation result
 */
export type EvaluateSuccess = {
  readonly success: true;
  readonly result: unknown;
};

/**
 * Type representing a failed evaluation result
 */
export type EvaluateFailure = {
  readonly success: false;
  readonly error: ExtendedError;
  readonly errorType: string;
  readonly errorCode: string;
  readonly expression?: string; // Original expression for better error context
};

/**
 * Evaluate result type - either success or failure
 */
export type EvaluateResult = EvaluateSuccess | EvaluateFailure;

/**
 * Type representing a successful analysis: the parsed AST and what it references
 */
export type AnalyzeSuccess = {
  readonly success: true;
  readonly ast: ExpressionNode;
  /** Context paths read, deduplicated, excluding arrow parameters and function names */
  readonly identifiers: readonly string[];
  /** Called function names as written, deduplicated */
  readonly functions: readonly string[];
};

/**
 * Analyze result type - either success or the same failure as compilation
 */
export type AnalyzeResult = AnalyzeSuccess | CompileFailure;

/**
 * A parsed and validated expression, ready to be interpreted
 */
type Validated = {
  readonly success: true;
  readonly ast: ExpressionNode;
  readonly references: ExpressionReferences;
};

/**
 * Normalize options by providing defaults
 */
const normalizeOptions = (
  options: ExpressionOptions = {},
): ExpressionOptions => ({
  // Custom functions
  customFunctions: options.customFunctions || {},

  // Security limits
  timeout: options.timeout !== undefined ? options.timeout : 1000,
  maxCallStackDepth:
    options.maxCallStackDepth !== undefined ? options.maxCallStackDepth : 50,
  maxComplexity:
    options.maxComplexity !== undefined ? options.maxComplexity : 100,
  maxLoopIterations:
    options.maxLoopIterations !== undefined ? options.maxLoopIterations : 10000,
  maxExpressionLength:
    options.maxExpressionLength !== undefined
      ? options.maxExpressionLength
      : 10000,

  // Property access security (preserve undefined vs empty array distinction)
  allowedProperties: options.allowedProperties,
  deniedProperties: options.deniedProperties,
  allowPrototypeAccess:
    options.allowPrototypeAccess !== undefined
      ? options.allowPrototypeAccess
      : false,

  // Feature toggles
  enableArrays:
    options.enableArrays !== undefined ? options.enableArrays : true,
  enableTemplateStrings:
    options.enableTemplateStrings !== undefined
      ? options.enableTemplateStrings
      : false,
  enableArrowFunctions:
    options.enableArrowFunctions !== undefined
      ? options.enableArrowFunctions
      : false,

  // Opt-in language variants
  caseInsensitiveNames: options.caseInsensitiveNames === true,
  semantics: options.semantics ?? 'javascript',
  strictFunctions: options.strictFunctions === true,
});

/**
 * Find any tokenization error in tokens
 */
const findTokenizationError = (
  tokens: readonly Token[],
): ExtendedError | null => {
  const errorToken = tokens.find(
    (token) =>
      token.type === 'EOF' &&
      typeof token.value === 'string' &&
      token.value.startsWith('Error:'),
  );

  if (errorToken && typeof errorToken.value === 'string') {
    // Return error directly if available, otherwise create a new ExtendedError
    if (errorToken.error) {
      return errorToken.error as ExtendedError;
    }
    // Create a new ExtendedError with appropriate properties
    return Object.assign(new Error(errorToken.value), {
      code: 'TOKENIZE_ERROR',
      line: errorToken.line,
      column: errorToken.column,
    }) as ExtendedError;
  }

  return null;
};

/**
 * Compile an expression string into a CompiledExpression
 * @param expressionString The expression to compile
 * @param options Configuration options for the evaluator
 * @returns The compile result - either success with the compiled expression or failure with an error
 */
export const compileExpression = (
  expressionString: string,
  options: ExpressionOptions = {},
): CompileResult => {
  const normalizedOptions = normalizeOptions(options);
  const validated = validateExpressionSource(
    expressionString,
    normalizedOptions,
  );
  if (!validated.success) return validated;

  // Set up the AST interpreter
  try {
    const compiled = evaluateAST(
      validated.ast,
      expressionString,
      normalizedOptions,
    );
    return { success: true, result: compiled };
  } catch (e) {
    return compilationFailure(e as ExtendedError);
  }
};

/**
 * Analyze an expression without evaluating it: parse and validate it exactly
 * as compilation does (so limits, feature flags and strictFunctions apply)
 * and list the context paths it reads and the functions it calls.
 * @param expressionString The expression to analyze
 * @param options Configuration options for the evaluator
 * @returns The AST and its references, or the compilation failure
 */
export const analyzeExpression = (
  expressionString: string,
  options: ExpressionOptions = {},
): AnalyzeResult => {
  const normalizedOptions = normalizeOptions(options);
  const validated = validateExpressionSource(
    expressionString,
    normalizedOptions,
  );
  if (!validated.success) return validated;

  // Run the interpreter setup for its checks (security patterns), unused otherwise
  try {
    evaluateAST(validated.ast, expressionString, normalizedOptions);
  } catch (e) {
    return compilationFailure(e as ExtendedError);
  }

  return {
    success: true,
    ast: validated.ast,
    identifiers: validated.references.identifiers,
    functions: validated.references.functions,
  };
};

/**
 * Check the length limit, then tokenize, parse and validate an expression
 */
const validateExpressionSource = (
  expressionString: string,
  normalizedOptions: ExpressionOptions,
): Validated | CompileFailure => {
  const maxLength = normalizedOptions.maxExpressionLength ?? 0;
  if (maxLength > 0 && expressionString.length > maxLength) {
    return {
      success: false,
      error: createCompilationError(
        `Expression too long: ${expressionString.length} characters exceeds the maximum of ${maxLength}`,
        'MAX_EXPRESSION_LENGTH_EXCEEDED',
      ),
      errorType: 'ParseError',
      errorCode: 'MAX_EXPRESSION_LENGTH_EXCEEDED',
    };
  }

  try {
    return compileTokens(expressionString, normalizedOptions);
  } catch (e) {
    // Deeply nested input can exhaust the JS call stack in the recursive parser
    if (e instanceof RangeError) {
      return {
        success: false,
        error: createCompilationError(
          'Expression is nested too deeply',
          'MAX_NESTING_EXCEEDED',
        ),
        errorType: 'ParseError',
        errorCode: 'MAX_NESTING_EXCEEDED',
      };
    }
    throw e;
  }
};

/**
 * Tokenize, parse and validate an expression with normalized options
 */
const compileTokens = (
  expressionString: string,
  normalizedOptions: ExpressionOptions,
): Validated | CompileFailure => {
  // Step 1: Tokenize the expression
  const tokens = tokenize(expressionString, {
    caseInsensitiveNames: normalizedOptions.caseInsensitiveNames,
  });

  // Check for tokenization errors
  const tokenizationError = findTokenizationError(tokens);
  if (tokenizationError) {
    return {
      success: false,
      error: tokenizationError,
      errorType: 'TokenizationError',
      errorCode: tokenizationError.code || 'TOKENIZE_ERROR',
    };
  }

  // Step 2: Parse tokens into an AST
  const [parseError, ast] = parse(tokens);

  if (parseError || !ast) {
    const error =
      parseError || createCompilationError('Parsing failed', 'PARSE_FAILED');
    return {
      success: false,
      error: error as ExtendedError,
      errorType: 'ParseError',
      errorCode: (error as ExtendedError).code || 'PARSE_ERROR',
    };
  }

  // Step 3: Check feature flags and complexity
  const validationError = validateAST(ast, normalizedOptions);
  if (validationError) {
    return compilationFailure(validationError);
  }

  // Step 4: Collect references and check called names (strictFunctions)
  const references = collectReferences(ast, normalizedOptions);
  const functionError = checkStrictFunctions(references, normalizedOptions);
  if (functionError) {
    return compilationFailure(functionError);
  }

  return { success: true, ast, references };
};

/**
 * Build a compile failure result for errors found after parsing
 */
const compilationFailure = (error: ExtendedError): CompileFailure => ({
  success: false,
  error,
  errorType: 'CompilationError',
  errorCode: error.code || 'COMPILE_ERROR',
});

/**
 * Safe compile function that returns null instead of throwing
 */
export const safeCompileExpression = (
  expressionString: string,
  options: ExpressionOptions = {},
): CompiledExpression | null => {
  const result = compileExpression(expressionString, options);
  return result.success ? result.result : null;
};

/**
 * Evaluate an expression with the given context
 * @param expressionString The expression to evaluate
 * @param context The context object containing variables referenced in the expression
 * @param options Configuration options for the evaluator
 * @returns The result of evaluating the expression
 */
export const evaluateExpression = (
  expressionString: string,
  context: Record<string, unknown> = {},
  options: ExpressionOptions = {},
): EvaluateResult => {
  const compileResult = compileExpression(expressionString, options);

  if (!compileResult.success) {
    return {
      success: false,
      error: compileResult.error,
      errorType: compileResult.errorType,
      errorCode: compileResult.errorCode,
    };
  }

  try {
    const result = compileResult.result.evaluate(context);
    return {
      success: true,
      result,
    };
  } catch (error) {
    // Extract meaningful information from the error for better diagnostics
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Include the original expression in the error for better context
    const expressionSnippet =
      expressionString.length > 20
        ? `${expressionString.substring(0, 20)}...`
        : expressionString;

    const evalError =
      error instanceof Error
        ? (error as ExtendedError)
        : createEvaluationError(
            `Error evaluating expression: ${errorMessage}`,
            'EVALUATION_ERROR',
            expressionSnippet,
          );

    return {
      success: false,
      error: evalError,
      errorType: 'EvaluationError',
      errorCode: evalError.code || 'EVAL_ERROR',
      expression: expressionString, // Include the original expression for reference
    };
  }
};

/**
 * Safe evaluate function that returns null instead of throwing
 */
export const safeEvaluateExpression = (
  expressionString: string,
  context: Record<string, unknown> = {},
  options: ExpressionOptions = {},
): unknown => {
  try {
    const result = evaluateExpression(expressionString, context, options);
    return result.success ? result.result : null;
  } catch (_error) {
    // If any unexpected error occurs, still return null
    return null;
  }
};

/**
 * Get the compiled JavaScript code for an expression
 */
export const getCompiledCode = (
  expressionString: string,
  options: ExpressionOptions = {},
): string | null => {
  const compileResult = compileExpression(expressionString, options);
  return compileResult.success ? compileResult.result.compiledCode : null;
};
