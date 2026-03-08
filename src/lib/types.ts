/**
 * Token types for the expression language
 */
export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',

  // Identifiers
  IDENTIFIER = 'IDENTIFIER',

  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  MODULO = 'MODULO',
  POWER = 'POWER',

  // Comparison operators
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  GREATER = 'GREATER',
  LESS = 'LESS',
  GREATER_EQUAL = 'GREATER_EQUAL',
  LESS_EQUAL = 'LESS_EQUAL',

  // Logical operators
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',

  // Parentheses and control characters
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  LEFT_BRACKET = 'LEFT_BRACKET', // For array literals [...]
  RIGHT_BRACKET = 'RIGHT_BRACKET', // For array literals [...]
  LEFT_BRACE = 'LEFT_BRACE', // For template strings ${...} and function bodies {...}
  RIGHT_BRACE = 'RIGHT_BRACE', // For template strings ${...} and function bodies {...}
  DOLLAR_SIGN = 'DOLLAR_SIGN', // For template strings ${...}
  BACKTICK = 'BACKTICK', // For template strings `...`
  COMMA = 'COMMA',
  DOT = 'DOT',
  QUESTION = 'QUESTION',
  COLON = 'COLON',

  // Arrow function
  ARROW = 'ARROW', // =>

  // Keywords
  IF = 'IF',
  THEN = 'THEN',
  ELSE = 'ELSE',

  // End of input
  EOF = 'EOF',
}

/**
 * Token representing a unit of the expression language
 */
export type Token = {
  readonly type: TokenType;
  readonly value: string | number | boolean | null;
  readonly line: number;
  readonly column: number;
  readonly error?: ExtendedError; // Optional error object for tokens that represent errors
};

/**
 * Base interface for all AST nodes
 */
export type ASTNode = {
  readonly type: string;
  readonly location: {
    readonly line: number;
    readonly column: number;
  };
};

/**
 * Literal node (number, string, boolean, null)
 */
export type LiteralNode = ASTNode & {
  readonly type: 'Literal';
  readonly value: number | string | boolean | null;
};

/**
 * Identifier node (variable or property reference)
 */
export type IdentifierNode = ASTNode & {
  readonly type: 'Identifier';
  readonly name: string;
};

/**
 * Member expression node (object property access)
 */
export type MemberExpressionNode = ASTNode & {
  readonly type: 'MemberExpression';
  readonly object: ExpressionNode;
  readonly property: IdentifierNode;
};

/**
 * Binary expression node (operations with two operands)
 */
export type BinaryExpressionNode = ASTNode & {
  readonly type: 'BinaryExpression';
  readonly operator: string;
  readonly left: ExpressionNode;
  readonly right: ExpressionNode;
};

/**
 * Unary expression node (operations with one operand)
 */
export type UnaryExpressionNode = ASTNode & {
  readonly type: 'UnaryExpression';
  readonly operator: string;
  readonly argument: ExpressionNode;
};

/**
 * Call expression node (function calls)
 */
export type CallExpressionNode = ASTNode & {
  readonly type: 'CallExpression';
  readonly callee: ExpressionNode;
  readonly params: readonly ExpressionNode[];
};

/**
 * Conditional expression node (if-then-else)
 */
export type ConditionalExpressionNode = ASTNode & {
  readonly type: 'ConditionalExpression';
  readonly test: ExpressionNode;
  readonly consequent: ExpressionNode;
  readonly alternate: ExpressionNode;
};

/**
 * Array literal node
 */
export type ArrayLiteralNode = ASTNode & {
  readonly type: 'ArrayLiteral';
  readonly elements: readonly ExpressionNode[];
};

/**
 * Array index access node (arr[index])
 */
export type ArrayIndexNode = ASTNode & {
  readonly type: 'ArrayIndex';
  readonly array: ExpressionNode;
  readonly index: ExpressionNode;
};

/**
 * Template literal node for string interpolation
 */
export type TemplateLiteralNode = ASTNode & {
  readonly type: 'TemplateLiteral';
  readonly parts: readonly ExpressionNode[];
  readonly isExpression: boolean;
};

/**
 * Arrow function node (lambda expressions)
 */
export type ArrowFunctionNode = ASTNode & {
  readonly type: 'ArrowFunction';
  readonly params: readonly IdentifierNode[];
  readonly body: ExpressionNode;
};

/**
 * Union type for all expression nodes
 */
export type ExpressionNode =
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

/**
 * Compiled expression result
 */
export type CompiledExpression = {
  /**
   * Evaluates the compiled expression with the given context
   * @param context The context object containing variables referenced in the expression
   * @returns The result of evaluating the expression
   */
  readonly evaluate: (context: Record<string, unknown>) => unknown;

  /**
   * Original source of the expression
   */
  readonly source: string;

  /**
   * Compiled JavaScript code
   */
  readonly compiledCode: string;
};

/**
 * Options for the expression evaluator
 */
export type ExpressionOptions = {
  /**
   * Custom functions that can be called from expressions
   */
  readonly customFunctions?: Record<
    string,
    (...args: readonly unknown[]) => unknown
  >;

  /**
   * Maximum execution time in milliseconds
   * Default: 1000 (1 second)
   */
  readonly timeout?: number;

  /**
   * Maximum call stack depth for function calls
   * Default: 50
   */
  readonly maxCallStackDepth?: number;

  /**
   * Maximum expression complexity (nodes in AST)
   * Default: 100
   */
  readonly maxComplexity?: number;

  /**
   * Maximum loop iterations to prevent infinite loops
   * Default: 10000
   */
  readonly maxLoopIterations?: number;

  /**
   * Allowed property access patterns (regex)
   * If provided, only properties matching these patterns can be accessed
   */
  readonly allowedProperties?: readonly string[];

  /**
   * Denied property access patterns (regex)
   * Properties matching these patterns cannot be accessed
   */
  readonly deniedProperties?: readonly string[];

  /**
   * If true, allows accessing prototype chain properties
   * Default: false (for security)
   */
  readonly allowPrototypeAccess?: boolean;

  /**
   * If true, enables array literal and indexing support
   * Default: true
   */
  readonly enableArrays?: boolean;

  /**
   * If true, enables template string support
   * Default: false
   */
  readonly enableTemplateStrings?: boolean;

  /**
   * If true, enables arrow function support
   * Default: false
   */
  readonly enableArrowFunctions?: boolean;
};

// Extend Error type to include our custom properties
export type ExtendedError = Error & {
  readonly code?: string;
  readonly line?: number;
  readonly column?: number;
};

// Use the extended error type in our error creation functions
// This avoids interface declarations which are discouraged by the linter

/**
 * Create a tokenization error with detailed location information and context
 */
export const createTokenizationError = (
  message: string,
  line: number,
  column: number,
  sourceContext?: string,
): ExtendedError => {
  const contextMessage = sourceContext ? `\nNear: "${sourceContext}"` : '';

  return Object.assign(
    new Error(`${message} at line ${line}, column ${column}${contextMessage}`),
    {
      name: 'TokenizationError',
      line,
      column,
      code: 'TOKENIZE_ERROR',
      sourceContext,
    },
  );
};

/**
 * Create a parse error with detailed location information and context
 */
export const createParseError = (
  message: string,
  line: number,
  column: number,
  sourceContext?: string,
): ExtendedError => {
  const contextMessage = sourceContext ? `\nNear: "${sourceContext}"` : '';

  return Object.assign(
    new Error(`${message} at line ${line}, column ${column}${contextMessage}`),
    {
      name: 'ParseError',
      line,
      column,
      code: 'PARSE_ERROR',
      sourceContext,
    },
  );
};

/**
 * Create a compilation error with specific error code and extra context
 */
export const createCompilationError = (
  message: string,
  code = 'COMPILE_ERROR',
  nodeType?: string,
  location?: { readonly line: number; readonly column: number },
): ExtendedError => {
  const locationInfo = location
    ? ` at line ${location.line}, column ${location.column}`
    : '';
  const nodeTypeInfo = nodeType ? ` in ${nodeType} node` : '';

  return Object.assign(new Error(`${message}${nodeTypeInfo}${locationInfo}`), {
    name: 'CompilationError',
    code,
    line: location?.line,
    column: location?.column,
    nodeType,
  });
};

/**
 * Create an evaluation error with specific error code and context
 */
export const createEvaluationError = (
  message: string,
  code = 'EVAL_ERROR',
  expressionPart?: string,
): ExtendedError => {
  const contextMessage = expressionPart
    ? `\nIn expression part: "${expressionPart}"`
    : '';

  return Object.assign(new Error(`${message}${contextMessage}`), {
    name: 'EvaluationError',
    code,
    expressionPart,
  });
};
