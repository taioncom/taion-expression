import { evaluateAST } from './evaluator.js';
import { parse } from './parser.js';
import { tokenize } from './tokenizer.js';
import {
  CompiledExpression,
  createCompilationError,
  createEvaluationError,
  ExpressionOptions,
  ExtendedError,
  Token,
} from './types.js';

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
  // Normalize options
  const normalizedOptions = normalizeOptions(options);

  // Step 1: Tokenize the expression
  const tokens = tokenize(expressionString);

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

  // Step 3: Set up AST interpreter
  const compiled = evaluateAST(ast, expressionString, normalizedOptions);

  return {
    success: true,
    result: compiled,
  };
};

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
