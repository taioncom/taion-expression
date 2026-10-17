import {
  createCompilationError,
  ExpressionNode,
  ExpressionOptions,
  ExtendedError,
} from './types.js';

/**
 * Return the child nodes of an AST node that are evaluated.
 * The property identifier of a member expression is not evaluated, so it is not a child.
 */
const childNodes = (node: ExpressionNode): readonly ExpressionNode[] => {
  switch (node.type) {
    case 'MemberExpression':
      return [node.object];
    case 'BinaryExpression':
      return [node.left, node.right];
    case 'UnaryExpression':
      return [node.argument];
    case 'CallExpression':
      return [node.callee, ...node.params];
    case 'ConditionalExpression':
      return [node.test, node.consequent, node.alternate];
    case 'ArrayLiteral':
      return node.elements;
    case 'ArrayIndex':
      return [node.array, node.index];
    case 'TemplateLiteral':
      return node.parts;
    case 'ArrowFunction':
      return [node.body];
    default:
      return [];
  }
};

/**
 * Return an error if the node uses a feature disabled by the options
 */
const checkFeature = (
  node: ExpressionNode,
  options: ExpressionOptions,
): ExtendedError | null => {
  if (
    (node.type === 'ArrayLiteral' || node.type === 'ArrayIndex') &&
    options.enableArrays === false
  ) {
    return createCompilationError(
      'Arrays are not allowed in the current context',
      'ARRAY_FEATURE_DISABLED',
      node.type,
      node.location,
    );
  }
  if (
    node.type === 'TemplateLiteral' &&
    options.enableTemplateStrings !== true
  ) {
    return createCompilationError(
      'Template literals are not allowed in the current context. Enable them with the enableTemplateStrings option.',
      'TEMPLATE_STRINGS_DISABLED',
      node.type,
      node.location,
    );
  }
  if (node.type === 'ArrowFunction' && options.enableArrowFunctions !== true) {
    return createCompilationError(
      'Arrow functions are not allowed in the current context. Enable them with the enableArrowFunctions option.',
      'ARROW_FUNCTIONS_DISABLED',
      node.type,
      node.location,
    );
  }
  return null;
};

/**
 * Validate a parsed AST against the options before evaluation: rejects disabled
 * features and enforces maxComplexity as a limit on the number of AST nodes.
 * Walks the tree iteratively so deep trees don't exhaust the call stack.
 */
export const validateAST = (
  ast: ExpressionNode,
  options: ExpressionOptions,
): ExtendedError | null => {
  const pending: ExpressionNode[] = [ast];
  let nodeCount = 0;

  while (pending.length > 0) {
    const node = pending.pop() as ExpressionNode;
    nodeCount++;

    if (
      options.maxComplexity !== undefined &&
      nodeCount > options.maxComplexity
    ) {
      return createCompilationError(
        `Expression too complex: maximum of ${options.maxComplexity} nodes exceeded`,
        'MAX_COMPLEXITY_EXCEEDED',
      );
    }

    const featureError = checkFeature(node, options);
    if (featureError) return featureError;

    pending.push(...childNodes(node));
  }

  return null;
};
