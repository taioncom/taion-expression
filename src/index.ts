// Export main functions
export {
  analyzeExpression,
  compileExpression,
  parseExpression,
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

// Emitting to other targets (SQL, ...)
export {
  createEmitError,
  emitExpression,
  EmitArg,
  EmitBinaryOperator,
  Emitter,
  EmitResult,
  EmitSuccess,
  EmitUnaryOperator,
} from './lib/emitter.js';

// Function catalog
export { describeFunctions, FunctionDescription } from './lib/catalog.js';

// Export types
export {
  ArrayIndexNode,
  ArrayLiteralNode,
  ArrowFunctionNode,
  CompiledExpression,
  CustomFunction,
  ExpressionOptions,
  FunctionCall,
  FunctionDefinition,
  ParamKind,
  ParamSpec,
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
