import { resolveLibraryFunction } from './function-resolver.js';
import { getPropertyPath } from './security.js';
import {
  createCompilationError,
  ExpressionNode,
  ExpressionOptions,
  ExtendedError,
} from './types.js';

/**
 * What an expression references: context paths and called function names
 */
export type ExpressionReferences = {
  /** Context paths read, in source order, deduplicated (`user.address.city`) */
  readonly identifiers: readonly string[];
  /** Called function names as written, in source order, deduplicated */
  readonly functions: readonly string[];
  /** Called names that are not a custom or built-in function */
  readonly unknownFunctions: readonly string[];
};

/**
 * A node to visit, with the arrow parameters in scope at it
 */
type Pending = {
  readonly node: ExpressionNode;
  readonly scope: ReadonlySet<string>;
};

/**
 * The root identifier of a member/index chain (`a` for `a.b[0].c`)
 */
const rootName = (node: ExpressionNode): string | null => {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'MemberExpression') return rootName(node.object);
  if (node.type === 'ArrayIndex') return rootName(node.array);
  return null;
};

/**
 * Collect the references of an AST. Walks iteratively so deep trees do not
 * exhaust the call stack. A member chain counts as one path (`user.name`);
 * a computed index ends the path (`items[i].price` reads `items` and `i`).
 * Arrow parameters and the names they shadow are not context references.
 */
export const collectReferences = (
  ast: ExpressionNode,
  options: ExpressionOptions,
): ExpressionReferences => {
  const identifiers = new Set<string>();
  const functions = new Set<string>();
  const unknownFunctions = new Set<string>();
  // Visited last-in first-out; children are pushed in reverse to keep source order
  const pending: Pending[] = [{ node: ast, scope: new Set() }];

  const visit = (
    children: readonly ExpressionNode[],
    scope: ReadonlySet<string>,
  ): void => {
    pending.push(...[...children].reverse().map((node) => ({ node, scope })));
  };

  while (pending.length > 0) {
    const { node, scope } = pending.pop() as Pending;
    switch (node.type) {
      case 'Identifier':
        if (!scope.has(node.name)) identifiers.add(node.name);
        break;
      case 'MemberExpression':
      case 'ArrayIndex': {
        const path = getPropertyPath(node);
        const root = rootName(node);
        if (path !== null && root !== null) {
          if (!scope.has(root)) identifiers.add(path);
        } else if (node.type === 'MemberExpression') {
          visit([node.object], scope);
        } else {
          visit([node.array, node.index], scope);
        }
        break;
      }
      case 'CallExpression':
        if (node.callee.type === 'Identifier') {
          const name = node.callee.name;
          functions.add(name);
          if (!scope.has(name) && !resolveLibraryFunction(name, options)) {
            unknownFunctions.add(name);
          }
          visit(node.params, scope);
        } else {
          visit([node.callee, ...node.params], scope);
        }
        break;
      case 'ArrowFunction':
        visit(
          [node.body],
          new Set([...scope, ...node.params.map((param) => param.name)]),
        );
        break;
      case 'BinaryExpression':
        visit([node.left, node.right], scope);
        break;
      case 'UnaryExpression':
        visit([node.argument], scope);
        break;
      case 'ConditionalExpression':
        visit([node.test, node.consequent, node.alternate], scope);
        break;
      case 'ArrayLiteral':
        visit(node.elements, scope);
        break;
      case 'TemplateLiteral':
        visit(node.parts, scope);
        break;
      default:
        break;
    }
  }

  return {
    identifiers: [...identifiers],
    functions: [...functions],
    unknownFunctions: [...unknownFunctions],
  };
};

/**
 * With `strictFunctions`, an error for the first called name that is not a
 * custom or built-in function; null otherwise
 */
export const checkStrictFunctions = (
  references: ExpressionReferences,
  options: ExpressionOptions,
): ExtendedError | null => {
  const [unknown] = references.unknownFunctions;
  if (!options.strictFunctions || unknown === undefined) return null;
  return createCompilationError(
    `Unknown function '${unknown}'`,
    'UNKNOWN_FUNCTION',
  );
};
