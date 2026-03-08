import {
  advance,
  check,
  consume,
  createIdentifier,
  createLiteral,
  createLocation,
  createParserState,
  isAtEnd,
  match,
  ParserState,
  peek,
  previous,
} from './parser-state.js';
import {
  ArrayIndexNode,
  ArrayLiteralNode,
  ArrowFunctionNode,
  BinaryExpressionNode,
  CallExpressionNode,
  ConditionalExpressionNode,
  createParseError,
  ExpressionNode,
  IdentifierNode,
  LiteralNode,
  MemberExpressionNode,
  TemplateLiteralNode,
  Token,
  TokenType,
  UnaryExpressionNode,
} from './types.js';

// Forward declarations
const parseExpression = (
  state: ParserState,
): readonly [Error | null, ParserState, ExpressionNode | null] => {
  // First check if this is an arrow function
  // Case 1: Single parameter without parentheses - x => ...
  if (check(state, TokenType.IDENTIFIER)) {
    // Peek ahead to check if the next token is an arrow
    // We don't need to use the token itself, just advance
    const afterId = advance(state);

    if (check(afterId, TokenType.ARROW)) {
      // Reset state to the beginning and parse as arrow function
      return parseArrowFunction({ ...state, current: state.current });
    }

    // If it's not an arrow function, reset state and continue with normal parsing
    return parseConditional({ ...state, current: state.current });
  }

  // Case 2: Empty or multiple parameters with parentheses - () => ... or (x, y) => ...
  if (check(state, TokenType.LEFT_PAREN)) {
    // Look ahead to see if this might be an arrow function with empty params
    const afterLeftParen = advance(state);

    // Empty parameter list - () =>
    if (check(afterLeftParen, TokenType.RIGHT_PAREN)) {
      const afterRightParen = advance(afterLeftParen);

      if (check(afterRightParen, TokenType.ARROW)) {
        // This is an arrow function with empty params
        return parseArrowFunction({ ...state, current: state.current });
      }
    }
  }

  // Continue with normal conditional expression parsing
  return parseConditional(state);
};

const parseIfThenElse = (
  state: ParserState,
  ifLocation: { readonly line: number; readonly column: number },
): readonly [Error | null, ParserState, ExpressionNode | null] => {
  // Handle the condition - it may be in parentheses or not
  const hasParens = check(state, TokenType.LEFT_PAREN);

  // Check for opening parenthesis and advance if present
  const condState = hasParens ? advance(state) : state;

  // Parse the condition expression
  const [condError, afterCondState, condition] = parseLogicalOr(condState);
  if (condError || !condition)
    return [condError, afterCondState, null] as const;

  // If we had an opening parenthesis, consume the closing one
  const finalCondState = hasParens
    ? ((): ParserState => {
        const [closeError, closeState, closeToken] = consume(
          afterCondState,
          TokenType.RIGHT_PAREN,
          "Expected ')' after condition",
        );
        if (closeError || !closeToken) return afterCondState;
        return closeState;
      })()
    : afterCondState;

  // Consume 'then' keyword
  const [thenError, thenState, thenToken] = consume(
    finalCondState,
    TokenType.THEN,
    "Expected 'then' after if condition",
  );
  if (thenError || !thenToken) return [thenError, thenState, null] as const;

  // Parse the 'then' branch
  const [consequentError, consequentState, consequent] =
    parseExpression(thenState);
  if (consequentError || !consequent)
    return [consequentError, consequentState, null] as const;

  // Consume 'else' keyword
  const [elseError, elseState, elseToken] = consume(
    consequentState,
    TokenType.ELSE,
    "Expected 'else' after then clause",
  );
  if (elseError || !elseToken) return [elseError, elseState, null] as const;

  // Parse the 'else' branch
  const [alternateError, alternateState, alternate] =
    parseExpression(elseState);
  if (alternateError || !alternate)
    return [alternateError, alternateState, null] as const;

  // Create the conditional expression node
  const conditionalExpr: ConditionalExpressionNode = {
    type: 'ConditionalExpression',
    test: condition,
    consequent,
    alternate,
    location: ifLocation,
  };

  return [null, alternateState, conditionalExpr] as const;
};

const parseConditional = (
  state: ParserState,
): readonly [Error | null, ParserState, ExpressionNode | null] => {
  // Check if this is a standalone if-then-else expression
  if (check(state, TokenType.IF)) {
    const ifToken = peek(state);
    const ifState = advance(state);
    return parseIfThenElse(ifState, {
      line: ifToken.line,
      column: ifToken.column,
    });
  }

  // First try to parse a regular expression
  const [error, current, expr] = parseLogicalOr(state);
  if (error || !expr) return [error, current, null] as const;

  // Check if this is a ternary expression with ? and :
  const [isQuestion, questionState] = match(current, [TokenType.QUESTION]);
  if (isQuestion) {
    // This is a ternary operator (expr ? consequent : alternate)
    const [consequentError, consequentState, consequent] =
      parseExpression(questionState);
    if (consequentError || !consequent)
      return [consequentError, consequentState, null] as const;

    // Consume the colon
    const [colonError, colonState, colonToken] = consume(
      consequentState,
      TokenType.COLON,
      "Expected ':' after ternary consequent",
    );
    if (colonError || !colonToken)
      return [colonError, colonState, null] as const;

    // Parse the alternate branch
    const [alternateError, alternateState, alternate] =
      parseExpression(colonState);
    if (alternateError || !alternate)
      return [alternateError, alternateState, null] as const;

    // Create the conditional expression node
    const conditionalExpr: ConditionalExpressionNode = {
      type: 'ConditionalExpression',
      test: expr,
      consequent,
      alternate,
      location: expr.location,
    };

    return [null, alternateState, conditionalExpr] as const;
  }

  // Check if this is an if-then-else expression after another expression
  const [isIf, ifState] = match(current, [TokenType.IF]);
  if (!isIf) return [null, current, expr] as const;

  return parseIfThenElse(ifState, expr.location);
};

const parseLogicalOr = (
  state: ParserState,
): readonly [Error | null, ParserState, ExpressionNode | null] => {
  const parseBinaryExpression = (
    currentState: ParserState,
    left: ExpressionNode,
  ): readonly [Error | null, ParserState, ExpressionNode] => {
    const [matched, newState] = match(currentState, [TokenType.OR]);
    if (!matched) return [null, currentState, left] as const;

    const [error, rightState, right] = parseLogicalAnd(newState);
    if (error || !right) return [error, rightState, left] as const;

    const binaryExpr: BinaryExpressionNode = {
      type: 'BinaryExpression',
      operator: '||',
      left,
      right,
      location: left.location,
    };

    return parseBinaryExpression(rightState, binaryExpr);
  };

  const [error, current, left] = parseLogicalAnd(state);
  if (error || !left) return [error, current, null] as const;

  return parseBinaryExpression(current, left);
};

const parseLogicalAnd = (
  state: ParserState,
): readonly [Error | null, ParserState, ExpressionNode | null] => {
  const parseBinaryExpression = (
    currentState: ParserState,
    left: ExpressionNode,
  ): readonly [Error | null, ParserState, ExpressionNode] => {
    const [matched, newState] = match(currentState, [TokenType.AND]);
    if (!matched) return [null, currentState, left] as const;

    const [error, rightState, right] = parseEquality(newState);
    if (error || !right) return [error, rightState, left] as const;

    const binaryExpr: BinaryExpressionNode = {
      type: 'BinaryExpression',
      operator: '&&',
      left,
      right,
      location: left.location,
    };

    return parseBinaryExpression(rightState, binaryExpr);
  };

  const [error, current, left] = parseEquality(state);
  if (error || !left) return [error, current, null] as const;

  return parseBinaryExpression(current, left);
};

const parseEquality = (
  state: ParserState,
): readonly [Error | null, ParserState, ExpressionNode | null] => {
  const parseBinaryExpression = (
    currentState: ParserState,
    left: ExpressionNode,
  ): readonly [Error | null, ParserState, ExpressionNode] => {
    const [matched, newState] = match(currentState, [
      TokenType.EQUAL,
      TokenType.NOT_EQUAL,
    ]);
    if (!matched) return [null, currentState, left] as const;

    const operator = previous(newState).type === TokenType.EQUAL ? '==' : '!=';

    const [error, rightState, right] = parseComparison(newState);
    if (error || !right) return [error, rightState, left] as const;

    const binaryExpr: BinaryExpressionNode = {
      type: 'BinaryExpression',
      operator,
      left,
      right,
      location: left.location,
    };

    return parseBinaryExpression(rightState, binaryExpr);
  };

  const [error, current, left] = parseComparison(state);
  if (error || !left) return [error, current, null] as const;

  return parseBinaryExpression(current, left);
};

const parseComparison = (
  state: ParserState,
): readonly [Error | null, ParserState, ExpressionNode | null] => {
  const parseBinaryExpression = (
    currentState: ParserState,
    left: ExpressionNode,
  ): readonly [Error | null, ParserState, ExpressionNode] => {
    const [matched, newState] = match(currentState, [
      TokenType.LESS,
      TokenType.GREATER,
      TokenType.LESS_EQUAL,
      TokenType.GREATER_EQUAL,
    ]);
    if (!matched) return [null, currentState, left] as const;

    const prevToken = previous(newState);
    const operator =
      prevToken.type === TokenType.LESS
        ? '<'
        : prevToken.type === TokenType.GREATER
          ? '>'
          : prevToken.type === TokenType.LESS_EQUAL
            ? '<='
            : prevToken.type === TokenType.GREATER_EQUAL
              ? '>='
              : '';

    const [error, rightState, right] = parseTerm(newState);
    if (error || !right) return [error, rightState, left] as const;

    const binaryExpr: BinaryExpressionNode = {
      type: 'BinaryExpression',
      operator,
      left,
      right,
      location: left.location,
    };

    return parseBinaryExpression(rightState, binaryExpr);
  };

  const [error, current, left] = parseTerm(state);
  if (error || !left) return [error, current, null] as const;

  return parseBinaryExpression(current, left);
};

const parseTerm = (
  state: ParserState,
): readonly [Error | null, ParserState, ExpressionNode | null] => {
  const parseBinaryExpression = (
    currentState: ParserState,
    left: ExpressionNode,
  ): readonly [Error | null, ParserState, ExpressionNode] => {
    const [matched, newState] = match(currentState, [
      TokenType.PLUS,
      TokenType.MINUS,
    ]);
    if (!matched) return [null, currentState, left] as const;

    const operator = previous(newState).type === TokenType.PLUS ? '+' : '-';

    const [error, rightState, right] = parseFactor(newState);
    if (error || !right) return [error, rightState, left] as const;

    const binaryExpr: BinaryExpressionNode = {
      type: 'BinaryExpression',
      operator,
      left,
      right,
      location: left.location,
    };

    return parseBinaryExpression(rightState, binaryExpr);
  };

  const [error, current, left] = parseFactor(state);
  if (error || !left) return [error, current, null] as const;

  return parseBinaryExpression(current, left);
};

const parseFactor = (
  state: ParserState,
): readonly [Error | null, ParserState, ExpressionNode | null] => {
  const parseBinaryExpression = (
    currentState: ParserState,
    left: ExpressionNode,
  ): readonly [Error | null, ParserState, ExpressionNode] => {
    const [matched, newState] = match(currentState, [
      TokenType.MULTIPLY,
      TokenType.DIVIDE,
      TokenType.MODULO,
    ]);
    if (!matched) return [null, currentState, left] as const;

    const prevToken = previous(newState);
    const operator =
      prevToken.type === TokenType.MULTIPLY
        ? '*'
        : prevToken.type === TokenType.DIVIDE
          ? '/'
          : prevToken.type === TokenType.MODULO
            ? '%'
            : '';

    const [error, rightState, right] = parsePower(newState);
    if (error || !right) return [error, rightState, left] as const;

    const binaryExpr: BinaryExpressionNode = {
      type: 'BinaryExpression',
      operator,
      left,
      right,
      location: left.location,
    };

    return parseBinaryExpression(rightState, binaryExpr);
  };

  const [error, current, left] = parsePower(state);
  if (error || !left) return [error, current, null] as const;

  return parseBinaryExpression(current, left);
};

const parsePower = (
  state: ParserState,
): readonly [Error | null, ParserState, ExpressionNode | null] => {
  const parseBinaryExpression = (
    currentState: ParserState,
    left: ExpressionNode,
  ): readonly [Error | null, ParserState, ExpressionNode] => {
    const [matched, newState] = match(currentState, [TokenType.POWER]);
    if (!matched) return [null, currentState, left] as const;

    const [error, rightState, right] = parseUnary(newState);
    if (error || !right) return [error, rightState, left] as const;

    const binaryExpr: BinaryExpressionNode = {
      type: 'BinaryExpression',
      operator: '^',
      left,
      right,
      location: left.location,
    };

    return parseBinaryExpression(rightState, binaryExpr);
  };

  const [error, current, left] = parseUnary(state);
  if (error || !left) return [error, current, null] as const;

  return parseBinaryExpression(current, left);
};

const parseUnary = (
  state: ParserState,
): readonly [Error | null, ParserState, ExpressionNode | null] => {
  const [matched, newState] = match(state, [
    TokenType.MINUS,
    TokenType.NOT,
    TokenType.PLUS,
  ]);
  if (!matched) return parseCall(state);

  const token = previous(newState);
  const operator =
    token.type === TokenType.MINUS
      ? '-'
      : token.type === TokenType.NOT
        ? '!'
        : token.type === TokenType.PLUS
          ? '+'
          : '';

  const [error, rightState, right] = parseUnary(newState);
  if (error || !right) return [error, rightState, null] as const;

  const unaryExpr: UnaryExpressionNode = {
    type: 'UnaryExpression',
    operator,
    argument: right,
    location: createLocation(token),
  };

  return [null, rightState, unaryExpr] as const;
};

const parseCall = (
  state: ParserState,
): readonly [Error | null, ParserState, ExpressionNode | null] => {
  const finishCall = (
    currentState: ParserState,
    callee: ExpressionNode,
  ): readonly [Error | null, ParserState, ExpressionNode | null] => {
    // Parse arguments
    if (!check(currentState, TokenType.RIGHT_PAREN)) {
      const parseArguments = (
        s: ParserState,
        currentArgs: readonly ExpressionNode[],
      ): readonly [Error | null, ParserState, readonly ExpressionNode[]] => {
        const [argError, argNextState, arg] = parseExpression(s);
        if (argError || !arg)
          return [argError, argNextState, currentArgs] as const;

        const newArgs = [...currentArgs, arg];

        const [hasComma, afterComma] = match(argNextState, [TokenType.COMMA]);
        if (!hasComma) return [null, argNextState, newArgs] as const;

        return parseArguments(afterComma, newArgs);
      };

      const [argError, newArgState, parsedArgs] = parseArguments(
        currentState,
        [],
      );
      if (argError) return [argError, newArgState, null] as const;

      // Call finishCall with the parsed arguments
      const [closeParen, afterClose, _closeToken] = consume(
        newArgState,
        TokenType.RIGHT_PAREN,
        "Expected ')' after arguments",
      );
      if (closeParen) return [closeParen, afterClose, null] as const;

      const callExpr: CallExpressionNode = {
        type: 'CallExpression',
        callee,
        params: parsedArgs,
        location: callee.location,
      };

      return [null, afterClose, callExpr] as const;
    } else {
      // No arguments
      const [closeParen, afterClose, _closeToken] = consume(
        currentState,
        TokenType.RIGHT_PAREN,
        "Expected ')' after arguments",
      );
      if (closeParen) return [closeParen, afterClose, null] as const;

      const callExpr: CallExpressionNode = {
        type: 'CallExpression',
        callee,
        params: [],
        location: callee.location,
      };

      return [null, afterClose, callExpr] as const;
    }
  };

  const finishProperty = (
    currentState: ParserState,
    object: ExpressionNode,
  ): readonly [Error | null, ParserState, ExpressionNode | null] => {
    const [nameError, nameState, nameToken] = consume(
      currentState,
      TokenType.IDENTIFIER,
      "Expected property name after '.'",
    );
    if (nameError || !nameToken) return [nameError, nameState, null] as const;

    const property: IdentifierNode = {
      type: 'Identifier',
      name: nameToken.value as string,
      location: createLocation(nameToken),
    };

    const memberExpr: MemberExpressionNode = {
      type: 'MemberExpression',
      object,
      property,
      location: object.location,
    };

    return [null, nameState, memberExpr] as const;
  };

  const finishArrayIndex = (
    currentState: ParserState,
    array: ExpressionNode,
  ): readonly [Error | null, ParserState, ExpressionNode | null] => {
    // Parse the index expression
    const [indexError, indexState, indexExpr] = parseExpression(currentState);
    if (indexError || !indexExpr)
      return [indexError, indexState, null] as const;

    // Consume the closing bracket
    const [closeBracketError, closeState, _closeToken] = consume(
      indexState,
      TokenType.RIGHT_BRACKET,
      "Expected ']' after array index",
    );
    if (closeBracketError)
      return [closeBracketError, closeState, null] as const;

    // Create the array index node
    const arrayIndexExpr: ArrayIndexNode = {
      type: 'ArrayIndex',
      array,
      index: indexExpr,
      location: array.location,
    };

    return [null, closeState, arrayIndexExpr] as const;
  };

  const [error, current, expr] = parsePrimary(state);
  if (error || !expr) return [error, current, null] as const;

  // Parse successive function calls, property accesses, and array indexing
  const parseCallOrProperty = (
    currentState: ParserState,
    currentExpr: ExpressionNode,
  ): readonly [Error | null, ParserState, ExpressionNode] => {
    if (check(currentState, TokenType.LEFT_PAREN)) {
      const [callError, callState, callExpr] = finishCall(
        advance(currentState),
        currentExpr,
      );
      if (callError || !callExpr)
        return [callError, callState, currentExpr] as const;
      return parseCallOrProperty(callState, callExpr);
    }

    if (check(currentState, TokenType.DOT)) {
      const [propError, propState, propExpr] = finishProperty(
        advance(currentState),
        currentExpr,
      );
      if (propError || !propExpr)
        return [propError, propState, currentExpr] as const;
      return parseCallOrProperty(propState, propExpr);
    }

    if (check(currentState, TokenType.LEFT_BRACKET)) {
      const [indexError, indexState, indexExpr] = finishArrayIndex(
        advance(currentState),
        currentExpr,
      );
      if (indexError || !indexExpr)
        return [indexError, indexState, currentExpr] as const;
      return parseCallOrProperty(indexState, indexExpr);
    }

    return [null, currentState, currentExpr] as const;
  };

  return parseCallOrProperty(current, expr);
};

/**
 * Parse an array literal [elem1, elem2, ...]
 */
const parseArrayLiteral = (
  state: ParserState,
): readonly [Error | null, ParserState, ArrayLiteralNode | null] => {
  // Consume the opening bracket
  const startToken = previous(state);
  const elements: readonly ExpressionNode[] = [];

  // Check for empty array
  if (check(state, TokenType.RIGHT_BRACKET)) {
    const newState = advance(state);
    return [
      null,
      newState,
      {
        type: 'ArrayLiteral',
        elements,
        location: createLocation(startToken),
      },
    ] as const;
  }

  // Parse array elements recursively
  const parseElements = (
    currentState: ParserState,
    currentElements: readonly ExpressionNode[],
  ): readonly [Error | null, ParserState, readonly ExpressionNode[]] => {
    // Parse the next element
    const [elemError, elemState, elem] = parseExpression(currentState);
    if (elemError || !elem)
      return [elemError, elemState, currentElements] as const;

    // Add element to the list
    const newElements = [...currentElements, elem];

    // Check for comma indicating more elements
    const [hasComma, afterComma] = match(elemState, [TokenType.COMMA]);
    if (!hasComma) return [null, elemState, newElements] as const;

    // Continue parsing elements
    return parseElements(afterComma, newElements);
  };

  // Start parsing elements
  const [elementsError, elementsState, parsedElements] = parseElements(
    state,
    elements,
  );

  if (elementsError) return [elementsError, elementsState, null] as const;

  // Consume the closing bracket
  const [closeError, closeState, _unusedToken] = consume(
    elementsState,
    TokenType.RIGHT_BRACKET,
    "Expected ']' after array elements",
  );

  if (closeError) return [closeError, closeState, null] as const;

  // Create the array literal node
  return [
    null,
    closeState,
    {
      type: 'ArrayLiteral',
      elements: parsedElements,
      location: createLocation(startToken),
    },
  ] as const;
};

/**
 * Parse a template literal with possible interpolation expressions
 */
const parseTemplateLiteral = (
  state: ParserState,
): readonly [Error | null, ParserState, TemplateLiteralNode | null] => {
  // Store the location from the starting token (BACKTICK)
  const startToken = previous(state);

  // Function to immutably update the parts array and parser state
  const updateParts = (
    parts: readonly ExpressionNode[],
    newPart: ExpressionNode,
    parserState: ParserState,
  ): readonly [readonly ExpressionNode[], ParserState] => {
    return [[...parts, newPart], parserState] as const;
  };

  // Recursive function to parse template string parts
  const parseTemplateParts = (
    currentState: ParserState,
    currentParts: readonly ExpressionNode[],
  ): readonly [Error | null, ParserState, readonly ExpressionNode[]] => {
    // Check for the end of the template string
    if (check(currentState, TokenType.BACKTICK)) {
      return [null, currentState, currentParts] as const;
    }

    // Check for string part
    if (check(currentState, TokenType.STRING)) {
      const stringToken = peek(currentState);
      const literalNode: LiteralNode = {
        type: 'Literal',
        value: stringToken.value,
        location: createLocation(stringToken),
      };

      const [newParts, newState] = updateParts(
        currentParts,
        literalNode,
        advance(currentState),
      );

      return parseTemplateParts(newState, newParts);
    }

    // Check for interpolation start (DOLLAR_SIGN followed by LEFT_BRACE)
    if (check(currentState, TokenType.DOLLAR_SIGN)) {
      // Consume the DOLLAR_SIGN token
      const afterDollar = advance(currentState);

      // Expect a LEFT_BRACE token
      if (!check(afterDollar, TokenType.LEFT_BRACE)) {
        const errToken = peek(afterDollar);
        return [
          createParseError(
            "Expected '{' after '$' in template string",
            errToken.line,
            errToken.column,
          ),
          afterDollar,
          currentParts,
        ] as const;
      }

      // Consume the LEFT_BRACE token
      const afterBrace = advance(afterDollar);

      // Parse the expression inside the interpolation
      const [exprError, exprState, expr] = parseExpression(afterBrace);
      if (exprError || !expr) {
        return [
          exprError ||
            createParseError(
              'Failed to parse expression in template string interpolation',
              peek(afterBrace).line,
              peek(afterBrace).column,
            ),
          exprState,
          currentParts,
        ] as const;
      }

      // Add the expression to parts
      const [newParts, _] = updateParts(currentParts, expr, exprState);

      // Expect a RIGHT_BRACE token
      const [braceError, braceState, _braceToken] = consume(
        exprState,
        TokenType.RIGHT_BRACE,
        "Expected '}' after expression in template string",
      );

      if (braceError) {
        // Enhance error message with contextual information
        const enhancedError = createParseError(
          "Missing closing brace '}' in template string interpolation",
          peek(exprState).line,
          peek(exprState).column,
        );
        return [enhancedError, braceState, currentParts] as const;
      }

      // Continue parsing template string
      return parseTemplateParts(braceState, newParts);
    }

    // Unexpected token inside template string
    const errToken = peek(currentState);
    return [
      createParseError(
        `Unexpected token '${errToken.value}' in template string`,
        errToken.line,
        errToken.column,
      ),
      currentState,
      currentParts,
    ] as const;
  };

  // Start parsing template string parts
  const [partsError, finalState, parts] = parseTemplateParts(state, []);

  if (partsError) {
    return [partsError, finalState, null] as const;
  }

  // Expect a closing BACKTICK token
  const [backtickError, backtickState, _backtickToken] = consume(
    finalState,
    TokenType.BACKTICK,
    "Expected '`' to close template string",
  );

  if (backtickError) {
    // Enhance error message with contextual information
    const enhancedError = createParseError(
      'Unterminated template string - missing closing backtick',
      peek(finalState).line,
      peek(finalState).column,
    );
    return [enhancedError, backtickState, null] as const;
  }

  // Create and return the template literal node
  const templateNode: TemplateLiteralNode = {
    type: 'TemplateLiteral',
    parts,
    isExpression: parts.length > 1, // It's an expression if it has multiple parts
    location: createLocation(startToken),
  };

  return [null, backtickState, templateNode] as const;
};

/**
 * Parse an arrow function expression
 */
const parseArrowFunction = (
  state: ParserState,
): readonly [Error | null, ParserState, ArrowFunctionNode | null] => {
  // Track the start position for error reporting
  const startToken = peek(state);
  // Empty array for parameter list initialization
  const emptyParams: readonly IdentifierNode[] = [];
  // Define a function to handle parameter parsing and return the new state and params
  const parseParameters = (): readonly [
    Error | null,
    ParserState,
    readonly IdentifierNode[],
  ] => {
    // Case 1: Single parameter without parentheses - x => ...
    if (check(state, TokenType.IDENTIFIER)) {
      const idToken = peek(state);
      const param: IdentifierNode = {
        type: 'Identifier',
        name: idToken.value as string,
        location: createLocation(idToken),
      };

      const afterId = advance(state);

      // Expect arrow token next
      if (!check(afterId, TokenType.ARROW)) {
        return [
          createParseError(
            "Expected '=>' after parameter in arrow function",
            peek(afterId).line,
            peek(afterId).column,
          ),
          afterId,
          emptyParams,
        ] as const;
      }

      // Consume the arrow token and return
      return [null, advance(afterId), [param]] as const;
    }

    // Case 2: Parameters with parentheses - (param1, param2, ...) or () => ...
    if (check(state, TokenType.LEFT_PAREN)) {
      const afterLeftParen = advance(state);

      // Handle empty parameter list: () => ...
      if (check(afterLeftParen, TokenType.RIGHT_PAREN)) {
        const afterRightParen = advance(afterLeftParen);

        // Expect arrow token next
        if (!check(afterRightParen, TokenType.ARROW)) {
          return [
            createParseError(
              "Expected '=>' after empty parameter list in arrow function",
              peek(afterRightParen).line,
              peek(afterRightParen).column,
            ),
            afterRightParen,
            emptyParams,
          ] as const;
        }

        // Consume the arrow token and return
        return [null, advance(afterRightParen), emptyParams] as const;
      }

      // Parse multiple parameters recursively
      const parseParamList = (
        s: ParserState,
        accumulatedParams: readonly IdentifierNode[] = [],
      ): readonly [Error | null, ParserState, readonly IdentifierNode[]] => {
        // Check for identifier
        if (!check(s, TokenType.IDENTIFIER)) {
          return [
            createParseError(
              'Expected parameter name in arrow function',
              peek(s).line,
              peek(s).column,
            ),
            s,
            accumulatedParams,
          ] as const;
        }

        // Get parameter name
        const paramToken = peek(s);
        const param: IdentifierNode = {
          type: 'Identifier',
          name: paramToken.value as string,
          location: createLocation(paramToken),
        };

        // Add to parameters list
        const newParams = [...accumulatedParams, param];
        const afterParam = advance(s);

        // Check for comma or closing parenthesis
        if (check(afterParam, TokenType.COMMA)) {
          // More parameters follow
          return parseParamList(advance(afterParam), newParams);
        } else if (check(afterParam, TokenType.RIGHT_PAREN)) {
          // End of parameter list
          const afterParen = advance(afterParam);

          // Expect arrow token next
          if (!check(afterParen, TokenType.ARROW)) {
            return [
              createParseError(
                "Expected '=>' after parameter list in arrow function",
                peek(afterParen).line,
                peek(afterParen).column,
              ),
              afterParen,
              newParams,
            ] as const;
          }

          // Consume the arrow token
          return [null, advance(afterParen), newParams] as const;
        } else {
          return [
            createParseError(
              "Expected ',' or ')' after parameter in arrow function",
              peek(afterParam).line,
              peek(afterParam).column,
            ),
            afterParam,
            newParams,
          ] as const;
        }
      };

      // Start parsing the parameter list
      return parseParamList(afterLeftParen, emptyParams);
    }

    // Not an arrow function
    return [
      createParseError(
        'Expected identifier or parameter list for arrow function',
        peek(state).line,
        peek(state).column,
      ),
      state,
      emptyParams,
    ] as const;
  };

  // Parse parameters
  const [paramsError, afterParams, params] = parseParameters();
  if (paramsError) {
    return [paramsError, afterParams, null] as const;
  }

  // Block bodies are not supported
  if (check(afterParams, TokenType.LEFT_BRACE)) {
    return [
      createParseError(
        'Block bodies for arrow functions are not supported. Use expression bodies instead.',
        peek(afterParams).line,
        peek(afterParams).column,
      ),
      afterParams,
      null,
    ] as const;
  }

  // Parse expression body, but be careful to avoid recursion with parseExpression
  // Use a lower-level parsing function to avoid infinite recursion
  const [bodyError, bodyState, body] = parseLogicalOr(afterParams);
  if (bodyError || !body) {
    return [
      bodyError ||
        createParseError(
          'Failed to parse arrow function body',
          peek(afterParams).line,
          peek(afterParams).column,
        ),
      bodyState,
      null,
    ] as const;
  }

  // Create arrow function node
  const arrowFunction: ArrowFunctionNode = {
    type: 'ArrowFunction',
    params,
    body,
    location: createLocation(startToken),
  };

  return [null, bodyState, arrowFunction] as const;
};

const parsePrimary = (
  state: ParserState,
): readonly [Error | null, ParserState, ExpressionNode | null] => {
  // Check for boolean literals specially
  if (state.current < state.tokens.length) {
    const currentToken = state.tokens[state.current];
    if (currentToken.type === TokenType.BOOLEAN) {
      // Ensure 'false' is properly handled
      const newState = advance(state);
      const literalNode = createLiteral(currentToken);
      return [null, newState, literalNode] as const;
    }
  }

  // Other Literals
  const [matched, newState] = match(state, [
    TokenType.NUMBER,
    TokenType.STRING,
    TokenType.NULL,
  ]);

  if (matched) {
    const token = previous(newState);
    const literalNode = createLiteral(token);
    return [null, newState, literalNode] as const;
  }

  // Template literals (backtick strings)
  const [templateMatched, templateNewState] = match(state, [
    TokenType.BACKTICK,
  ]);
  if (templateMatched) {
    return parseTemplateLiteral(templateNewState);
  }

  // Identifiers
  const [idMatched, idNewState] = match(state, [TokenType.IDENTIFIER]);
  if (idMatched) {
    const token = previous(idNewState);
    return [null, idNewState, createIdentifier(token)] as const;
  }

  // Array literals
  const [arrayMatched, arrayNewState] = match(state, [TokenType.LEFT_BRACKET]);
  if (arrayMatched) {
    return parseArrayLiteral(arrayNewState);
  }

  // Grouping expressions with parentheses
  const [parenMatched, parenNewState] = match(state, [TokenType.LEFT_PAREN]);
  if (parenMatched) {
    // This could be either a grouping expression or the start of an arrow function

    // First, check if this could be an arrow function with parameters
    if (check(parenNewState, TokenType.IDENTIFIER)) {
      // Look ahead to check if this might be an arrow function
      const checkIsArrowFunction = (
        curState: ParserState,
        foundRightParen = false,
      ): readonly [boolean, ParserState] => {
        // If we've found a right paren, check for arrow
        if (foundRightParen) {
          return check(curState, TokenType.ARROW)
            ? [true, curState]
            : [false, curState];
        }

        // If we hit the end, it's not an arrow function
        if (isAtEnd(curState)) return [false, curState];

        const curToken = peek(curState);

        // Found right paren, check next token for arrow
        if (curToken.type === TokenType.RIGHT_PAREN) {
          return checkIsArrowFunction(advance(curState), true);
        }

        // Skip identifiers and commas
        if (
          curToken.type === TokenType.IDENTIFIER ||
          curToken.type === TokenType.COMMA
        ) {
          return checkIsArrowFunction(advance(curState), false);
        }

        // Not an arrow function pattern
        return [false, curState];
      };

      const [isArrowFunction, _] = checkIsArrowFunction(parenNewState);

      if (isArrowFunction) {
        return parseArrowFunction(state);
      }
    }

    // Regular grouping expression
    const [exprError, exprState, expr] = parseExpression(parenNewState);
    if (exprError || !expr) return [exprError, exprState, null] as const;

    const [closeError, closeState, _closeToken] = consume(
      exprState,
      TokenType.RIGHT_PAREN,
      "Expected ')' after expression",
    );
    if (closeError) return [closeError, closeState, null] as const;

    return [null, closeState, expr] as const;
  }

  // We handle arrow functions at the parseExpression level now

  // Error for unexpected token
  const token = peek(state);
  const error = createParseError(
    `Unexpected token '${token.value}'`,
    token.line,
    token.column,
  );
  return [error, state, null] as const;
};

/**
 * Parse tokens into an abstract syntax tree
 */
export const parse = (
  tokens: readonly Token[],
): readonly [Error | null, ExpressionNode | null] => {
  // Check for empty input
  if (
    tokens.length === 0 ||
    (tokens.length === 1 && tokens[0].type === TokenType.EOF)
  ) {
    return [createParseError('Empty expression', 1, 1), null] as const;
  }

  // Check for error tokens from the tokenizer
  const errorToken = tokens.find(
    (token) =>
      token.type === TokenType.EOF &&
      typeof token.value === 'string' &&
      token.value.startsWith('Error:'),
  );

  if (errorToken && typeof errorToken.value === 'string') {
    if (errorToken.error) {
      // Use the enhanced error object if available
      return [errorToken.error, null] as const;
    }
    return [
      createParseError(errorToken.value, errorToken.line, errorToken.column),
      null,
    ] as const;
  }

  const state = createParserState(tokens);
  const [error, finalState, expr] = parseExpression(state);

  if (error) return [error, null] as const;
  if (!expr)
    return [
      createParseError('Failed to parse expression', 0, 0),
      null,
    ] as const;

  // Make sure we consumed all tokens
  if (!isAtEnd(finalState) && finalState.current < tokens.length - 1) {
    const token = peek(finalState);
    return [
      createParseError(
        `Unexpected token '${token.value}' after expression`,
        token.line,
        token.column,
      ),
      null,
    ] as const;
  }

  return [null, expr] as const;
};
