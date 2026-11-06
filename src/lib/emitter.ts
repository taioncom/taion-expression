import { customDefinitionOf, kindsOf, paramAt } from './custom-functions.js';
import { resolveLibraryFunction } from './function-resolver.js';
import { getPropertyPath } from './security.js';
import { CompileFailure, parseExpression } from './taion-expression.js';
import {
  createCompilationError,
  ExpressionNode,
  ExpressionOptions,
  ExtendedError,
} from './types.js';

/** The binary operators an emitter receives, in canonical form */
export type EmitBinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '^'
  | '<'
  | '>'
  | '<='
  | '>='
  | '=='
  | '!='
  | '&&'
  | '||';

/** The unary operators an emitter receives (`not` and `!` are both `!`) */
export type EmitUnaryOperator = '-' | '+' | '!';

/**
 * An argument of a call: an emitted value, a field path (a custom
 * function's `field` parameter), or an arrow function whose body is emitted
 * when the emitter asks for it
 */
export type EmitArg<T> =
  | { readonly kind: 'value'; readonly value: T; readonly node: ExpressionNode }
  | {
      readonly kind: 'field';
      readonly path: string;
      readonly node: ExpressionNode;
    }
  | {
      readonly kind: 'lambda';
      readonly params: readonly string[];
      readonly body: () => T;
      readonly node: ExpressionNode;
    };

/**
 * Turns a validated expression into a target (SQL, another language, a
 * description): one method per kind of node, called bottom-up. Optional
 * methods left out make that kind of node unsupported. A method throws
 * `createEmitError` for what the target cannot express.
 */
export type Emitter<T> = {
  /** A literal: number, text, boolean or null */
  readonly literal: (
    value: number | string | boolean | null,
    node: ExpressionNode,
  ) => T;
  /**
   * A context path (`amount`, `order.total`); `local` when it starts with an
   * arrow function's parameter
   */
  readonly identifier: (
    path: string,
    node: ExpressionNode,
    local: boolean,
  ) => T;
  readonly unary: (
    op: EmitUnaryOperator,
    operand: T,
    node: ExpressionNode,
  ) => T;
  readonly binary: (
    op: EmitBinaryOperator,
    left: T,
    right: T,
    node: ExpressionNode,
  ) => T;
  /** `c ? a : b` and `if c then a else b` */
  readonly conditional: (
    test: T,
    consequent: T,
    alternate: T,
    node: ExpressionNode,
  ) => T;
  /**
   * A call by the function's registered name (its custom or built-in
   * spelling, or as written when it is neither)
   */
  readonly call: (
    name: string,
    args: readonly EmitArg<T>[],
    node: ExpressionNode,
  ) => T;
  readonly array?: (items: readonly T[], node: ExpressionNode) => T;
  readonly index?: (target: T, index: T, node: ExpressionNode) => T;
  readonly template?: (parts: readonly T[], node: ExpressionNode) => T;
};

/** A successful emit: the target and what the expression references */
export type EmitSuccess<T> = {
  readonly success: true;
  readonly result: T;
  readonly identifiers: readonly string[];
  readonly functions: readonly string[];
};

/** The result of `emitExpression` */
export type EmitResult<T> = EmitSuccess<T> | CompileFailure;

/**
 * An error for what an emitter cannot express, positioned at the node
 */
export const createEmitError = (
  message: string,
  node: ExpressionNode,
  code = 'UNSUPPORTED',
): ExtendedError =>
  createCompilationError(message, code, node.type, node.location);

const unsupported = (what: string, node: ExpressionNode): ExtendedError =>
  createEmitError(`${what} is not supported by this target`, node);

/** The root name of a path (`order` of `order.total`) */
const rootOf = (path: string): string => path.split('.')[0] as string;

/**
 * Walk a node bottom-up into the emitter's target. `scope` holds the arrow
 * parameters in scope.
 */
const emitNode = <T>(
  node: ExpressionNode,
  emitter: Emitter<T>,
  options: ExpressionOptions,
  scope: ReadonlySet<string>,
): T => {
  const emit = (child: ExpressionNode, inner = scope): T =>
    emitNode(child, emitter, options, inner);
  switch (node.type) {
    case 'Literal':
      return emitter.literal(node.value, node);
    case 'Identifier':
      return emitter.identifier(node.name, node, scope.has(node.name));
    case 'MemberExpression': {
      const path = getPropertyPath(node);
      if (path === null) throw unsupported('A computed member', node);
      return emitter.identifier(path, node, scope.has(rootOf(path)));
    }
    case 'ArrayIndex': {
      const path = getPropertyPath(node);
      if (path !== null)
        return emitter.identifier(path, node, scope.has(rootOf(path)));
      if (!emitter.index) throw unsupported('Indexing', node);
      return emitter.index(emit(node.array), emit(node.index), node);
    }
    case 'UnaryExpression':
      return emitter.unary(
        node.operator as EmitUnaryOperator,
        emit(node.argument),
        node,
      );
    case 'BinaryExpression':
      return emitter.binary(
        node.operator as EmitBinaryOperator,
        emit(node.left),
        emit(node.right),
        node,
      );
    case 'ConditionalExpression':
      return emitter.conditional(
        emit(node.test),
        emit(node.consequent),
        emit(node.alternate),
        node,
      );
    case 'ArrayLiteral':
      if (!emitter.array) throw unsupported('An array', node);
      return emitter.array(
        node.elements.map((e) => emit(e)),
        node,
      );
    case 'TemplateLiteral':
      if (!emitter.template) throw unsupported('A template string', node);
      return emitter.template(
        node.parts.map((p) => emit(p)),
        node,
      );
    case 'ArrowFunction':
      throw unsupported('An arrow function outside a call', node);
    case 'CallExpression': {
      if (node.callee.type !== 'Identifier')
        throw unsupported('A dynamic function call', node);
      const written = node.callee.name;
      const name = resolveLibraryFunction(written, options)?.name ?? written;
      const params = customDefinitionOf(node, options)?.params;
      const args = node.params.map((arg, i): EmitArg<T> => {
        const kinds = kindsOf(paramAt(params, i));
        if (arg.type === 'ArrowFunction') {
          const names = arg.params.map((p) => p.name);
          const inner = new Set([...scope, ...names]);
          return {
            kind: 'lambda',
            params: names,
            body: () => emit(arg.body, inner),
            node: arg,
          };
        }
        const path =
          kinds.includes('field') &&
          (arg.type === 'Identifier' || arg.type === 'MemberExpression')
            ? getPropertyPath(arg)
            : null;
        return path !== null
          ? { kind: 'field', path, node: arg }
          : { kind: 'value', value: emit(arg), node: arg };
      });
      return emitter.call(name, args, node);
    }
    default:
      throw unsupported('This expression', node);
  }
};

/**
 * Turn an expression into another target with an emitter. The expression is
 * parsed and validated as for evaluation (limits, feature flags,
 * `strictFunctions`, custom function parameters), then walked bottom-up.
 * What the emitter cannot express fails like a compile error, positioned.
 */
export const emitExpression = <T>(
  expressionString: string,
  emitter: Emitter<T>,
  options: ExpressionOptions = {},
): EmitResult<T> => {
  const parsed = parseExpression(expressionString, options);
  if (!parsed.success) return parsed;
  try {
    return {
      success: true,
      result: emitNode(parsed.ast, emitter, parsed.options, new Set()),
      identifiers: parsed.identifiers,
      functions: parsed.functions,
    };
  } catch (e) {
    const error =
      e instanceof Error && e.name === 'CompilationError'
        ? (e as ExtendedError)
        : createCompilationError(
            e instanceof Error ? e.message : String(e),
            'EMIT_ERROR',
          );
    return {
      success: false,
      error,
      errorType: 'CompilationError',
      errorCode: error.code || 'EMIT_ERROR',
    };
  }
};
