// Export main functions
export {
  analyzeExpression,
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
  AnalyzeSuccess,
  AnalyzeResult,
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
