// Export main functions
export {
  compileExpression,
  safeCompileExpression,
  evaluateExpression,
  safeEvaluateExpression,
  getCompiledCode,
  CompileSuccess,
  CompileFailure,
  CompileResult,
  EvaluateSuccess,
  EvaluateFailure,
  EvaluateResult,
} from './lib/taion-expression.js';

// Export types
export {
  ArrayIndexNode,
  ArrayLiteralNode,
  ArrowFunctionNode,
  CompiledExpression,
  ExpressionOptions,
  ExpressionNode,
  ExtendedError,
  BinaryExpressionNode,
  CallExpressionNode,
  ConditionalExpressionNode,
  IdentifierNode,
  LiteralNode,
  MemberExpressionNode,
  TemplateLiteralNode,
  TokenType,
  UnaryExpressionNode,
} from './lib/types.js';
