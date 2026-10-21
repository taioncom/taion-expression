import {
  builtInFunctions,
  contextPassingFunctions,
} from './functions/index.js';
import { dateOperands } from './date-coercion.js';
import { resolveLibraryFunction } from './function-resolver.js';
import {
  checkSecurityLimits,
  compilePatterns,
  createSecurityContext,
  EvaluatorContext,
  getPropertyPath,
  isPropertyAccessAllowed,
  MAX_STRING_LENGTH,
} from './security.js';
import {
  spreadsheetBinary,
  spreadsheetUnary,
} from './spreadsheet-semantics.js';
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

const hasOwn = (obj: unknown, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

const denyAccess = (propertyName: string): Error =>
  createCompilationError(
    `Access to property '${propertyName}' is not allowed by security policy`,
    'PROPERTY_ACCESS_DENIED',
  );

// Evaluate an identifier. Expression-local variables (arrow parameters) are not
// subject to the property policy; context variables are.
const evaluateIdentifier = (
  node: IdentifierNode,
  context: EvaluatorContext,
  intermediate: boolean,
): unknown => {
  if (hasOwn(context.localVariables, node.name)) {
    return context.localVariables[node.name];
  }
  if (!hasOwn(context.rootContext, node.name)) return null;
  if (!isPropertyAccessAllowed(node.name, node.name, context, intermediate)) {
    throw denyAccess(node.name);
  }
  return context.rootContext[node.name];
};

// Read a property from an object, honouring the prototype access setting
const readProperty = (
  object: unknown,
  propertyName: string,
  context: EvaluatorContext,
): unknown => {
  if (!context.options.allowPrototypeAccess && !hasOwn(object, propertyName)) {
    return null;
  }
  try {
    const val = (object as Record<string, unknown>)[propertyName];
    return val === undefined ? null : val;
  } catch {
    return null;
  }
};

const evaluateMemberExpression = (
  node: MemberExpressionNode,
  context: EvaluatorContext,
  intermediate: boolean,
): unknown => {
  const object = evaluateNode(node.object, context, true);
  if (object == null) return null;

  const propertyName = node.property.name;
  const fullPath = getPropertyPath(node) || propertyName;

  if (!isPropertyAccessAllowed(propertyName, fullPath, context, intermediate)) {
    throw denyAccess(propertyName);
  }

  return readProperty(object, propertyName, context);
};

// Concatenate strings, rejecting results over the maximum string length
const concatStrings = (left: string, right: string): string => {
  if (left.length + right.length > MAX_STRING_LENGTH) {
    throw createCompilationError(
      `String result exceeds the maximum length of ${MAX_STRING_LENGTH} characters`,
      'MAX_STRING_LENGTH_EXCEEDED',
    );
  }
  return left + right;
};

// Compare two values: strings lexicographically, everything else numerically
const compareValues = (
  operator: string,
  left: unknown,
  right: unknown,
): boolean => {
  const dates = dateOperands(left, right);
  const bothStrings =
    !dates && typeof left === 'string' && typeof right === 'string';
  const [a, b] = dates ?? [
    bothStrings ? left : Number(left),
    bothStrings ? right : Number(right),
  ];
  switch (operator) {
    case '>':
      return a > b;
    case '<':
      return a < b;
    case '>=':
      return a >= b;
    default:
      return a <= b;
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

  if (context.options.semantics === 'spreadsheet') {
    return spreadsheetBinary(node.operator, left, right, MAX_STRING_LENGTH);
  }

  switch (node.operator) {
    case '+':
      return typeof left === 'string' || typeof right === 'string'
        ? concatStrings(String(left), String(right))
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
    case '<':
    case '>=':
    case '<=':
      return compareValues(node.operator, left, right);
    case '==': {
      const dates = dateOperands(left, right);
      return dates ? dates[0] === dates[1] : left === right;
    }
    case '!=': {
      const dates = dateOperands(left, right);
      return dates ? dates[0] !== dates[1] : left !== right;
    }
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
  if (context.options.semantics === 'spreadsheet') {
    return spreadsheetUnary(node.operator, argument);
  }
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
    const customFunctions = context.options.customFunctions ?? {};
    // Exact names first; a name differing only in case (caseInsensitiveNames)
    // never shadows an expression-local or context function
    const resolved =
      resolveLibraryFunction(funcName, {
        ...context.options,
        caseInsensitiveNames: false,
      }) ??
      (hasOwn(context.localVariables, funcName) ||
      hasOwn(context.rootContext, funcName)
        ? null
        : resolveLibraryFunction(funcName, context.options));
    // Custom and built-in function names are exempt from the allowlist,
    // context functions are not
    if (
      !isPropertyAccessAllowed(funcName, funcName, context, resolved !== null)
    ) {
      throw createCompilationError(
        `Function '${funcName}' is not allowed by security policy`,
        'FUNCTION_ACCESS_DENIED',
      );
    }

    // Custom functions take precedence over built-ins with the same name
    if (resolved?.source === 'custom') {
      func = customFunctions[resolved.name];
    } else if (resolved?.source === 'builtin') {
      const builtin = builtInFunctions[resolved.name] as (
        ...args: readonly unknown[]
      ) => unknown;
      func = contextPassingFunctions.includes(resolved.name)
        ? (...funcArgs: unknown[]) => builtin(updatedContext, ...funcArgs)
        : builtin;
    } else if (hasOwn(context.localVariables, funcName)) {
      func = context.localVariables[funcName];
    } else if (hasOwn(context.rootContext, funcName)) {
      func = context.rootContext[funcName];
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
  intermediate: boolean,
): unknown => {
  if (context.options.enableArrays === false) {
    throw createCompilationError(
      'Array indexing is not allowed in the current context',
      'ARRAY_FEATURE_DISABLED',
      node.type,
      node.location,
    );
  }

  const array = evaluateNode(node.array, context, true);
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
      const objectPath = getPropertyPath(node.array);
      const fullPath = objectPath
        ? `${objectPath}.${propertyName}`
        : propertyName;
      if (
        !isPropertyAccessAllowed(propertyName, fullPath, context, intermediate)
      ) {
        throw createCompilationError(
          `Access to property '${propertyName}' via array index is not allowed by security policy`,
          'PROPERTY_ACCESS_DENIED',
        );
      }

      return readProperty(array, propertyName, context);
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
 * Main AST Walker. `intermediate` marks nodes evaluated only to reach a child
 * property, which are exempt from the property allowlist.
 */
const evaluateNode = (
  node: ExpressionNode,
  context: EvaluatorContext,
  intermediate = false,
): unknown => {
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
      return evaluateIdentifier(node, context, intermediate);
    case 'MemberExpression':
      return evaluateMemberExpression(node, context, intermediate);
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
      return evaluateArrayIndex(node, context, intermediate);
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
  // Compile property patterns once; throws INVALID_REGEX_PATTERN on bad input
  const compiledAllowedProperties = compilePatterns(options.allowedProperties);
  const compiledDeniedProperties = compilePatterns(options.deniedProperties);

  const evaluate = (context: Record<string, unknown> = {}): unknown => {
    const evaluatorContext: EvaluatorContext = {
      options,
      securityContext: createSecurityContext(),
      rootContext: context,
      localVariables: {},
      compiledAllowedProperties,
      compiledDeniedProperties,
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
