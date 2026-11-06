import { resolveLibraryFunction } from './function-resolver.js';
import { getPropertyPath } from './security.js';
import {
  CallExpressionNode,
  createCompilationError,
  CustomFunction,
  ExpressionNode,
  ExpressionOptions,
  ExtendedError,
  FunctionDefinition,
  ParamKind,
  ParamSpec,
} from './types.js';

/**
 * The definition of a custom function (a plain function has no signature)
 */
export const definitionOf = (entry: CustomFunction): FunctionDefinition =>
  typeof entry === 'function' ? { fn: entry } : entry;

/**
 * The kinds a parameter accepts
 */
export const kindsOf = (param: ParamSpec | undefined): readonly ParamKind[] =>
  param?.kind === undefined
    ? ['value']
    : typeof param.kind === 'string'
      ? [param.kind]
      : param.kind;

/**
 * The parameter an argument at `index` is bound to (the variadic last one
 * takes the rest)
 */
export const paramAt = (
  params: readonly ParamSpec[] | undefined,
  index: number,
): ParamSpec | undefined => {
  if (!params || params.length === 0) return undefined;
  const last = params[params.length - 1];
  return index >= params.length && last?.variadic ? last : params[index];
};

/**
 * The custom definition a call resolves to, or null (a built-in, a context
 * function, or a dynamic callee)
 */
export const customDefinitionOf = (
  node: CallExpressionNode,
  options: ExpressionOptions,
): FunctionDefinition | null => {
  if (node.callee.type !== 'Identifier') return null;
  const resolved = resolveLibraryFunction(node.callee.name, options);
  if (resolved?.source !== 'custom') return null;
  const entry = options.customFunctions?.[resolved.name];
  return entry === undefined ? null : definitionOf(entry);
};

/**
 * Whether an argument node fits the kinds its parameter accepts (a value
 * parameter takes an arrow too where arrow functions are enabled)
 */
const fitsKinds = (
  arg: ExpressionNode,
  kinds: readonly ParamKind[],
  options: ExpressionOptions,
): boolean =>
  (kinds.includes('value') &&
    (arg.type !== 'ArrowFunction' || options.enableArrowFunctions === true)) ||
  (kinds.includes('lambda') && arg.type === 'ArrowFunction') ||
  (kinds.includes('field') &&
    (arg.type === 'Identifier' || arg.type === 'MemberExpression') &&
    getPropertyPath(arg) !== null);

/**
 * Check a call to a custom function with declared parameters: the number of
 * arguments, and each argument's kind (a field must be a context path, a
 * lambda an arrow function). Null when it fits or nothing is declared.
 */
export const checkCall = (
  node: CallExpressionNode,
  options: ExpressionOptions,
): ExtendedError | null => {
  const definition = customDefinitionOf(node, options);
  const params = definition?.params;
  if (!definition || !params) return null;
  const name =
    node.callee.type === 'Identifier' ? node.callee.name : 'function';
  const required = params.filter((p) => !p.optional && !p.variadic).length;
  const variadic = params[params.length - 1]?.variadic === true;
  const count = node.params.length;
  if (count < required || (!variadic && count > params.length)) {
    const most = variadic ? required : params.length;
    const expected = variadic
      ? `at least ${required}`
      : required === params.length
        ? `${required}`
        : `${required} to ${params.length}`;
    return createCompilationError(
      `Function '${name}' takes ${expected} argument${most === 1 ? '' : 's'}, got ${count}`,
      'ARGUMENT_COUNT',
      node.type,
      node.location,
    );
  }
  const misfit = node.params.findIndex(
    (arg, i) => !fitsKinds(arg, kindsOf(paramAt(params, i)), options),
  );
  if (misfit < 0) return null;
  const param = paramAt(params, misfit);
  const kinds = kindsOf(param);
  const arg = node.params[misfit] as ExpressionNode;
  const wanted = kinds
    .map((k) =>
      k === 'field'
        ? 'a field name'
        : k === 'lambda'
          ? 'an arrow function'
          : 'a value',
    )
    .join(' or ');
  return createCompilationError(
    `Argument '${param?.name ?? misfit + 1}' of '${name}' must be ${wanted}`,
    'INVALID_ARGUMENT',
    arg.type,
    arg.location,
  );
};

/**
 * Check every call in an AST against the custom function definitions.
 * Walks iteratively so deep trees do not exhaust the call stack.
 */
export const checkCalls = (
  ast: ExpressionNode,
  options: ExpressionOptions,
): ExtendedError | null => {
  const pending: ExpressionNode[] = [ast];
  while (pending.length > 0) {
    const node = pending.pop() as ExpressionNode;
    if (node.type === 'CallExpression') {
      const error = checkCall(node, options);
      if (error) return error;
    }
    pending.push(...childrenOf(node));
  }
  return null;
};

/**
 * The child nodes of a node (all of them, evaluated or not)
 */
export const childrenOf = (node: ExpressionNode): readonly ExpressionNode[] => {
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
 * The arrow functions an AST passes directly as lambda arguments of custom
 * functions: allowed even without `enableArrowFunctions`
 */
export const lambdaArguments = (
  ast: ExpressionNode,
  options: ExpressionOptions,
): ReadonlySet<ExpressionNode> => {
  const lambdas = new Set<ExpressionNode>();
  const pending: ExpressionNode[] = [ast];
  while (pending.length > 0) {
    const node = pending.pop() as ExpressionNode;
    if (node.type === 'CallExpression') {
      const params = customDefinitionOf(node, options)?.params;
      node.params.forEach((arg, i) => {
        if (
          arg.type === 'ArrowFunction' &&
          kindsOf(paramAt(params, i)).includes('lambda')
        ) {
          lambdas.add(arg);
        }
      });
    }
    pending.push(...childrenOf(node));
  }
  return lambdas;
};
