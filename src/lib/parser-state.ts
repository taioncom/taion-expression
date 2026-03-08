import {
  createParseError,
  IdentifierNode,
  LiteralNode,
  Token,
  TokenType,
} from './types.js';

// Parser state
export type ParserState = {
  readonly tokens: readonly Token[];
  readonly current: number;
};

// Create initial parser state
export const createParserState = (tokens: readonly Token[]): ParserState => ({
  tokens,
  current: 0,
});

// Get the current token without advancing
export const peek = (state: ParserState): Token =>
  state.current < state.tokens.length
    ? state.tokens[state.current]
    : state.tokens[state.tokens.length - 1]; // Return EOF token if we're at the end

// Get the previous token
export const previous = (state: ParserState): Token =>
  state.tokens[state.current - 1];

// Check if we've reached the end of the tokens
export const isAtEnd = (state: ParserState): boolean =>
  peek(state).type === TokenType.EOF;

// Advance to the next token
export const advance = (state: ParserState): ParserState =>
  isAtEnd(state) ? state : { ...state, current: state.current + 1 };

// Check if the current token has the expected type
export const check = (state: ParserState, type: TokenType): boolean =>
  !isAtEnd(state) && peek(state).type === type;

// Match if the current token is one of the expected types
export const match = (
  state: ParserState,
  types: readonly TokenType[],
): readonly [boolean, ParserState] => {
  const matchType = (typeIndex: number): readonly [boolean, ParserState] => {
    if (typeIndex >= types.length) {
      return [false, state] as const;
    }

    if (check(state, types[typeIndex])) {
      return [true, advance(state)] as const;
    }

    return matchType(typeIndex + 1);
  };

  return matchType(0);
};

// Get source context for improved error messages
export const getSourceContext = (
  state: ParserState,
  _unusedToken: Token, // Parameter kept for API compatibility but not used
): string | undefined => {
  if (state.tokens.length === 0) return undefined;

  // Get up to 3 tokens before and after the current position for context
  const startIdx = Math.max(0, state.current - 3);
  const endIdx = Math.min(state.tokens.length - 1, state.current + 3);

  // Create a string representation of the token sequence
  const tokenValues = state.tokens
    .slice(startIdx, endIdx + 1)
    .map((t, i) => {
      const value = typeof t.value === 'string' ? t.value : String(t.value);
      // Highlight the current token
      return startIdx + i === state.current ? `[${value}]` : value;
    })
    .join(' ');

  return tokenValues;
};

// Consume a token if it matches the expected type, otherwise create an error
export const consume = (
  state: ParserState,
  type: TokenType,
  message: string,
): readonly [Error | null, ParserState, Token | null] => {
  if (check(state, type)) {
    const newState = advance(state);
    return [null, newState, previous(newState)] as const;
  }

  const token = peek(state);
  const sourceContext = getSourceContext(state, token);

  // Create error with additional information about expected vs. actual token
  const detailedMessage = `${message}. Expected '${type}' but got '${token.type}'`;
  const error = createParseError(
    detailedMessage,
    token.line,
    token.column,
    sourceContext,
  );

  return [error, state, null] as const;
};

// Create a location object from a token
export const createLocation = (token: Token) => ({
  line: token.line,
  column: token.column,
});

// Helper to create a literal node
export const createLiteral = (token: Token): LiteralNode => ({
  type: 'Literal',
  value: token.value,
  location: createLocation(token),
});

// Helper to create an identifier node
export const createIdentifier = (token: Token): IdentifierNode => ({
  type: 'Identifier',
  name: token.value as string,
  location: createLocation(token),
});
