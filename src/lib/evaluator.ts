import {
  builtInFunctions,
  contextPassingFunctions,
} from './functions/index.js';
import {
  anchorPattern,
  checkSecurityLimits,
  createSecurityContext,
  EvaluatorContext,
  getPropertyPath,
  isPropertyAccessAllowed,
} from './security.js';
import {
  ArrayIndexNode,
  ArrayLiteralNode,
  ArrowFunctionNode,
  ASTNode,
  BinaryExpressionNode,
  CallExpressionNode,
  CompiledExpression,
  ConditionalExpressionNode,
  createCompilationError,
  ExpressionNode,
  ExpressionOptions,
  ExtendedError,
  IdentifierNode,
  LiteralNode,
  MemberExpressionNode,
  TemplateLiteralNode,
  UnaryExpressionNode,
} from './types.js';

// Evaluate a literal node
const evaluateLiteral = (node: LiteralNode): unknown => {
  return node.value;
};

// Evaluate an identifier
const evaluateIdentifier = (
  node: IdentifierNode,
  context: EvaluatorContext,
): unknown => {
  if (node.name in context.localVariables) {
    return context.localVariables[node.name];
  }
  if (node.name in context.rootContext) {
    return context.rootContext[node.name];
  }
  return null;
};

const evaluateMemberExpression = (
  node: MemberExpressionNode,
  context: EvaluatorContext,
): unknown => {
  const object = evaluateNode(node.object, context);
  if (object == null) return null;

  const propertyName = node.property.name;
  const fullPath = getPropertyPath(node) || propertyName;

  if (!isPropertyAccessAllowed(propertyName, fullPath, context)) {
    throw createCompilationError(
      `Access to property '${propertyName}' is not allowed by security policy`,
      'PROPERTY_ACCESS_DENIED',
    );
  }

  if (
    !context.options.allowPrototypeAccess &&
    !Object.prototype.hasOwnProperty.call(object, propertyName)
  ) {
    return null;
  }

  try {
    const val = (object as Record<string, unknown>)[propertyName];
    return val === undefined ? null : val;
  } catch {
    return null;
  }
};

// Evaluate a binary expression
const evaluateBinaryExpression = (
  node: BinaryExpressionNode,
  context: EvaluatorContext,
): unknown => {
  const left = evaluateNode(node.left, context);

  // Short-circuit logical operators returning operand values
  if (node.operator === '&&') {
    return left ? evaluateNode(node.right, context) : left;
  }
  if (node.operator === '||') {
    return left ? left : evaluateNode(node.right, context);
  }

  const right = evaluateNode(node.right, context);

  switch (node.operator) {
    case '+':
      return typeof left === 'string' || typeof right === 'string'
        ? String(left) + String(right)
        : Number(left) + Number(right);
    case '-':
      return Number(left) - Number(right);
    case '*':
      return Number(left) * Number(right);
    case '/':
      return Number(left) / Number(right);
    case '%':
      return Number(left) % Number(right);
    case '^':
      return Math.pow(Number(left), Number(right));
    case '>':
      return Number(left) > Number(right);
    case '<':
      return Number(left) < Number(right);
    case '>=':
      return Number(left) >= Number(right);
    case '<=':
      return Number(left) <= Number(right);
    case '==':
      if (left instanceof Date && right instanceof Date) {
        return left.getTime() === right.getTime();
      }
      return left === right;
    case '!=':
      if (left instanceof Date && right instanceof Date) {
        return left.getTime() !== right.getTime();
      }
      return left !== right;
    default:
      return null;
  }
};

// Evaluate a unary expression
const evaluateUnaryExpression = (
  node: UnaryExpressionNode,
  context: EvaluatorContext,
): unknown => {
  const argument = evaluateNode(node.argument, context);
  switch (node.operator) {
    case '+':
      return Number(argument);
    case '-':
      return -Number(argument);
    case '!':
      return !argument;
    default:
      return null;
  }
};

// Evaluate a call expression
const evaluateCallExpression = (
  node: CallExpressionNode,
  context: EvaluatorContext,
): unknown => {
  const updatedContext = {
    ...context,
    securityContext: {
      ...context.securityContext,
      callStackDepth: context.securityContext.callStackDepth + 1,
    },
  };

  if (
    node.callee.type !== 'Identifier' &&
    node.callee.type !== 'MemberExpression'
  ) {
    throw createCompilationError(
      'Only direct function calls are supported. Dynamic function references are not allowed for security reasons.',
      'UNSUPPORTED_FUNCTION_CALL',
    );
  }

  let func: unknown = null;
  if (node.callee.type === 'Identifier') {
    const funcName = node.callee.name;
    if (!isPropertyAccessAllowed(funcName, funcName, context)) {
      throw createCompilationError(
        `Function '${funcName}' is not allowed by security policy`,
        'FUNCTION_ACCESS_DENIED',
      );
    }

    if (Object.prototype.hasOwnProperty.call(builtInFunctions, funcName)) {
      const builtin = builtInFunctions[funcName] as (
        ...args: readonly unknown[]
      ) => unknown;
      if (contextPassingFunctions.includes(funcName)) {
        func = (...funcArgs: unknown[]) => builtin(updatedContext, ...funcArgs);
      } else {
        func = builtin;
      }
    } else if (
      context.options.customFunctions &&
      Object.prototype.hasOwnProperty.call(
        context.options.customFunctions,
        funcName,
      )
    ) {
      func = context.options.customFunctions[funcName];
    } else if (funcName in context.rootContext) {
      func = context.rootContext[funcName];
    } else if (funcName in context.localVariables) {
      func = context.localVariables[funcName];
    }
  } else {
    func = evaluateNode(node.callee, updatedContext);
  }

  if (typeof func !== 'function') {
    return null;
  }

  const args = node.params.map((param) => evaluateNode(param, updatedContext));

  try {
    return func(...args);
  } catch (_e) {
    if (_e instanceof Error && _e.name === 'CompilationError') throw _e;
    return null;
  }
};

// Evaluate conditional
const evaluateConditionalExpression = (
  node: ConditionalExpressionNode,
  context: EvaluatorContext,
): unknown => {
  const test = evaluateNode(node.test, context);
  if (test) {
    return evaluateNode(node.consequent, context);
  } else {
    return evaluateNode(node.alternate, context);
  }
};

// Evaluate array literal
const evaluateArrayLiteral = (
  node: ArrayLiteralNode,
  context: EvaluatorContext,
): unknown => {
  if (context.options.enableArrays === false) {
    throw createCompilationError(
      'Array literals are not allowed in the current context',
      'ARRAY_FEATURE_DISABLED',
    );
  }
  return node.elements.map((el) => evaluateNode(el, context));
};

// Evaluate array index
const evaluateArrayIndex = (
  node: ArrayIndexNode,
  context: EvaluatorContext,
): unknown => {
  if (context.options.enableArrays === false) {
    throw createCompilationError(
      'Array indexing is not allowed in the current context',
      'ARRAY_FEATURE_DISABLED',
      node.type,
      node.location,
    );
  }

  const array = evaluateNode(node.array, context);
  if (array == null) return null;

  const index = evaluateNode(node.index, context);

  if (!Array.isArray(array)) {
    if (typeof array === 'string') {
      const numIdx = Number(index);
      if (Number.isInteger(numIdx) && numIdx >= 0 && numIdx < array.length) {
        return array[numIdx];
      }
      return null;
    }
    if (typeof array === 'object') {
      const propertyName = String(index);
      if (!isPropertyAccessAllowed(propertyName, propertyName, context)) {
        throw createCompilationError(
          `Access to property '${propertyName}' via array index is not allowed by security policy`,
          'PROPERTY_ACCESS_DENIED',
        );
      }

      if (
        !context.options.allowPrototypeAccess &&
        !Object.prototype.hasOwnProperty.call(array, propertyName)
      ) {
        return null;
      }

      try {
        const val = (array as Record<string, unknown>)[propertyName];
        return val === undefined ? null : val;
      } catch {
        return null;
      }
    }
    return null;
  }

  const numIdx = Number(index);
  if (!Number.isInteger(numIdx) || numIdx < 0 || numIdx >= array.length) {
    return null;
  }

  const val = array[numIdx];
  return val === undefined ? null : val;
};

// Evaluate template literal
const evaluateTemplateLiteral = (
  node: TemplateLiteralNode,
  context: EvaluatorContext,
): unknown => {
  if (context.options.enableTemplateStrings === false) {
    throw createCompilationError(
      'Template literals are not allowed in the current context',
      'TEMPLATE_STRINGS_DISABLED',
    );
  }

  const parts = node.parts.map((part) => {
    const val = evaluateNode(part, context);
    return val === null || val === undefined ? '' : String(val);
  });

  return parts.join('');
};

// Evaluate arrow function
const evaluateArrowFunction = (
  node: ArrowFunctionNode,
  context: EvaluatorContext,
): unknown => {
  if (context.options.enableArrowFunctions !== true) {
    throw createCompilationError(
      'Arrow functions are not allowed in the current context. Enable them with the enableArrowFunctions option.',
      'ARROW_FUNCTIONS_DISABLED',
      node.type,
      node.location,
    );
  }

  return (...args: unknown[]) => {
    // Bind parameters to their specific arguments
    const localVars = { ...context.localVariables };
    node.params.forEach((param, i) => {
      localVars[param.name] = i < args.length ? args[i] : null;
    });

    const arrowContext = {
      ...context,
      localVariables: localVars,
      securityContext: {
        ...context.securityContext,
        callStackDepth: context.securityContext.callStackDepth + 1,
      },
    };

    try {
      return evaluateNode(node.body, arrowContext);
    } catch (_e) {
      if (
        _e instanceof Error &&
        (_e.name === 'CompilationError' || _e.name === 'EvaluationError')
      )
        throw _e;
      return null;
    }
  };
};

/**
 * Main AST Walker
 */
const evaluateNode = (
  node: ExpressionNode,
  context: EvaluatorContext,
): unknown => {
  // Update complexity count using dynamic reference
  context.securityContext.nodeCount.value++;

  const limitError = checkSecurityLimits(
    context.securityContext,
    context.options,
  );
  if (limitError) {
    throw createCompilationError(
      limitError.message,
      (limitError as ExtendedError).code || 'SECURITY_LIMIT_EXCEEDED',
      node.type,
      node.location,
    );
  }

  switch (node.type) {
    case 'Literal':
      return evaluateLiteral(node);
    case 'Identifier':
      return evaluateIdentifier(node, context);
    case 'MemberExpression':
      return evaluateMemberExpression(node, context);
    case 'BinaryExpression':
      return evaluateBinaryExpression(node, context);
    case 'UnaryExpression':
      return evaluateUnaryExpression(node, context);
    case 'CallExpression':
      return evaluateCallExpression(node, context);
    case 'ConditionalExpression':
      return evaluateConditionalExpression(node, context);
    case 'ArrayLiteral':
      return evaluateArrayLiteral(node, context);
    case 'ArrayIndex':
      return evaluateArrayIndex(node, context);
    case 'TemplateLiteral':
      return evaluateTemplateLiteral(node, context);
    case 'ArrowFunction':
      return evaluateArrowFunction(node, context);
    default: {
      const bNode = node as ASTNode;
      throw createCompilationError(
        `Unknown node type: ${bNode.type}`,
        'UNKNOWN_NODE_TYPE',
        bNode.type,
        bNode.location,
      );
    }
  }
};

/**
 * Main evaluateAST entrypoint replacing compilation
 */
export const evaluateAST = (
  ast: ExpressionNode,
  source: string,
  options: ExpressionOptions,
): CompiledExpression => {
  const evaluate = (context: Record<string, unknown> = {}): unknown => {
    let compiledAllowedProperties: RegExp[] = [];
    let compiledDeniedProperties: RegExp[] = [];

    try {
      if (options.allowedProperties) {
        compiledAllowedProperties = options.allowedProperties.map(
          (p) => new RegExp(anchorPattern(p)),
        );
      }
      if (options.deniedProperties) {
        compiledDeniedProperties = options.deniedProperties.map(
          (p) => new RegExp(anchorPattern(p)),
        );
      }
    } catch (e: unknown) {
      throw createCompilationError(
        `Invalid RegExp pattern in security options: ${e instanceof Error ? e.message : String(e)}`,
        'INVALID_REGEX_PATTERN',
      );
    }

    const evaluatorContext: EvaluatorContext = {
      options,
      securityContext: createSecurityContext(),
      rootContext: context,
      localVariables: {},
      compiledAllowedProperties,
      compiledDeniedProperties,
      allowedPropertyStrings: options.allowedProperties
        ? [...options.allowedProperties]
        : [],
    };

    try {
      return evaluateNode(ast, evaluatorContext);
    } catch (e) {
      if (e instanceof Error && e.name === 'CompilationError') {
        throw e;
      }
      throw createCompilationError(
        `Evaluation failed: ${e instanceof Error ? e.message : String(e)}`,
        'EVALUATION_FAILED',
      );
    }
  };

  return {
    evaluate,
    source,
    compiledCode: `/* Interpreted: ${source} */`,
  };
};
