import { createTokenizationError, Token, TokenType } from './types.js';

/**
 * Check if a character is a digit (0-9)
 */
const isDigit = (char: string): boolean => /^[0-9]$/.test(char);

/**
 * Check if a character is a letter (a-z, A-Z) or underscore
 */
const isAlpha = (char: string): boolean => /^[a-zA-Z_]$/.test(char);

/**
 * Check if a character is alphanumeric (a-z, A-Z, 0-9) or underscore
 */
const isAlphaNumeric = (char: string): boolean =>
  isAlpha(char) || isDigit(char);

// Used directly in skipWhitespace instead
// const isWhitespace = (char: string): boolean => /^\s$/.test(char);

/**
 * Tokenizer state
 */
type TokenizerState = {
  readonly source: string;
  readonly tokens: readonly Token[];
  readonly start: number;
  readonly current: number;
  readonly line: number;
  readonly column: number;
  readonly inTemplate?: boolean; // Track if we're in a template string
};

/**
 * Create a new tokenizer state
 */
const createTokenizerState = (source: string): TokenizerState => ({
  source,
  tokens: [],
  start: 0,
  current: 0,
  line: 1,
  column: 1,
});

/**
 * Add a token to the tokenizer state
 */
const addToken = (
  state: TokenizerState,
  type: TokenType,
  value: string | number | boolean | null = null,
): TokenizerState => {
  const token: Token = {
    type,
    value:
      value !== null
        ? value
        : state.source.substring(state.start, state.current),
    line: state.line,
    column: state.column - (state.current - state.start),
  };

  return {
    ...state,
    tokens: [...state.tokens, token],
  };
};

/**
 * Add an error token to the tokenizer state with source context
 */
const addErrorToken = (
  state: TokenizerState,
  message: string,
  line: number,
  column: number,
): TokenizerState => {
  // Get a snippet of the source code around the error for context
  const errorPosition = state.current;
  const start = Math.max(0, errorPosition - 10);
  const end = Math.min(state.source.length, errorPosition + 10);
  const sourceContext = state.source.substring(start, end).replace(/\n/g, '↵');

  // Create error with the context
  const error = createTokenizationError(message, line, column, sourceContext);

  const token: Token = {
    type: TokenType.EOF,
    value: `Error: ${message} at line ${line}, column ${column}`,
    line,
    column,
    error,
  };

  return {
    ...state,
    tokens: [...state.tokens, token],
  };
};

/**
 * Advance the tokenizer state by one character
 */
const advance = (state: TokenizerState): TokenizerState => {
  const char = state.source.charAt(state.current);
  return {
    ...state,
    current: state.current + 1,
    column: char === '\n' ? 1 : state.column + 1,
    line: char === '\n' ? state.line + 1 : state.line,
  };
};

/**
 * Peek at the current character without advancing
 */
const peek = (state: TokenizerState): string =>
  state.current >= state.source.length
    ? '\0'
    : state.source.charAt(state.current);

/**
 * Peek at the next character
 */
const peekNext = (state: TokenizerState): string =>
  state.current + 1 >= state.source.length
    ? '\0'
    : state.source.charAt(state.current + 1);

/**
 * Check if the current character matches the expected one
 */
const match = (
  state: TokenizerState,
  expected: string,
): readonly [boolean, TokenizerState] => {
  if (state.current >= state.source.length) return [false, state];
  if (state.source.charAt(state.current) !== expected)
    return [false, state] as const;

  return [true, advance(state)] as const;
};

/**
 * Skip whitespace characters
 */
const skipWhitespace = (state: TokenizerState): TokenizerState => {
  let current = state;

  for (;;) {
    const char = peek(current);

    if (char === ' ' || char === '\r' || char === '\t' || char === '\n') {
      current = advance(current);
      continue;
    }

    if (char === '/' && peekNext(current) === '/') {
      // Skip the '//' at the start of the comment
      current = advance(advance(current));
      // Skip until end of line
      while (!isAtEnd(current) && peek(current) !== '\n') {
        current = advance(current);
      }
      continue;
    }

    return current;
  }
};

/**
 * Check if we've reached the end of the source
 */
const isAtEnd = (state: TokenizerState): boolean =>
  state.current >= state.source.length;

/**
 * Process a number token
 */
const number = (state: TokenizerState): TokenizerState => {
  const processDigits = (s: TokenizerState): TokenizerState => {
    if (!isDigit(peek(s))) {
      return s;
    }
    return processDigits(advance(s));
  };

  const afterInteger = processDigits(state);

  // Look for a decimal point
  if (peek(afterInteger) === '.' && isDigit(peekNext(afterInteger))) {
    // Process decimal part
    const afterDecimal = processDigits(advance(afterInteger));
    const value = parseFloat(
      afterDecimal.source.substring(state.start, afterDecimal.current),
    );
    return addToken(afterDecimal, TokenType.NUMBER, value);
  }

  const value = parseFloat(
    afterInteger.source.substring(state.start, afterInteger.current),
  );
  return addToken(afterInteger, TokenType.NUMBER, value);
};

/**
 * Process a string token
 */
const string = (state: TokenizerState, quote: string): TokenizerState => {
  const processStringChars = (s: TokenizerState): TokenizerState => {
    if (peek(s) === quote || isAtEnd(s)) {
      return s;
    }
    // Handle escape sequences in strings
    if (peek(s) === '\\' && !isAtEnd(s)) {
      // Skip the backslash and the next character
      return processStringChars(advance(advance(s)));
    }
    return processStringChars(advance(s));
  };

  const afterString = processStringChars(state);

  if (isAtEnd(afterString)) {
    // Return a special token to indicate the error
    return addErrorToken(
      afterString,
      'Unterminated string',
      afterString.line,
      afterString.column,
    );
  }

  // Consume the closing quote
  const afterQuote = advance(afterString);

  // Trim the surrounding quotes and process escape sequences
  const stringContent = afterQuote.source.substring(
    state.start + 1,
    afterQuote.current - 1,
  );

  // Process escape sequences
  const value = processEscapeSequences(stringContent);

  return addToken(afterQuote, TokenType.STRING, value);
};

/**
 * Process escape sequences in a string
 */
const processEscapeSequences = (text: string): string => {
  return text.replace(/\\(.)/g, (_, c: string) => {
    switch (c) {
      case 'n':
        return '\n';
      case 'r':
        return '\r';
      case 't':
        return '\t';
      case '"':
        return '"';
      case "'":
        return "'";
      case '\\':
        return '\\';
      default:
        return '\\' + c;
    }
  });
};

/**
 * Process a template string with possible interpolations
 */
const processTemplateString = (state: TokenizerState): TokenizerState => {
  // Variable to track the current state as we process the template string
  const processTemplateParts = (
    current: TokenizerState,
    textStart: number,
  ): TokenizerState => {
    // If we've reached the end of the input
    if (isAtEnd(current)) {
      // Error: unterminated template string
      return addErrorToken(
        current,
        'Unterminated template string',
        current.line,
        current.column,
      );
    }

    // If we've found the closing backtick
    if (peek(current) === '`') {
      // Add the text part before the closing backtick, if any
      const updatedState =
        current.current > textStart
          ? addToken(
              { ...current, start: textStart },
              TokenType.STRING,
              processEscapeSequences(
                current.source.substring(textStart, current.current),
              ),
            )
          : current;

      // Consume the closing backtick
      const afterBacktick = advance(updatedState);

      // Add the BACKTICK token to indicate the end of the template
      return addToken(afterBacktick, TokenType.BACKTICK);
    }

    // Check for interpolation start
    if (peek(current) === '$' && peekNext(current) === '{') {
      // If there's text before the interpolation, add it as a string token
      const beforeInterpolation =
        current.current > textStart
          ? addToken(
              { ...current, start: textStart },
              TokenType.STRING,
              processEscapeSequences(
                current.source.substring(textStart, current.current),
              ),
            )
          : current;

      // Add the DOLLAR_SIGN token
      const afterDollar = addToken(
        advance(beforeInterpolation),
        TokenType.DOLLAR_SIGN,
      );

      // Add the LEFT_BRACE token
      const afterBrace = addToken(advance(afterDollar), TokenType.LEFT_BRACE);

      // Return after the opening brace with inTemplate=true to indicate we're inside an interpolation
      // The parser will handle the expression inside the interpolation
      return { ...afterBrace, inTemplate: true };
    }

    // Handle escape sequences
    if (peek(current) === '\\') {
      // Skip the backslash and include the next character as-is
      return processTemplateParts(advance(advance(current)), textStart);
    }

    // Advance to the next character
    return processTemplateParts(advance(current), textStart);
  };

  // Start after the opening backtick
  return processTemplateParts(state, state.current);
};

/**
 * Process an identifier token
 */
const identifier = (state: TokenizerState): TokenizerState => {
  const processIdChars = (s: TokenizerState): TokenizerState => {
    if (!isAlphaNumeric(peek(s))) {
      return s;
    }
    return processIdChars(advance(s));
  };

  const afterId = processIdChars(state);
  const text = afterId.source.substring(state.start, afterId.current);

  // Check for keywords
  switch (text) {
    case 'true':
      return addToken(afterId, TokenType.BOOLEAN, true);
    case 'false':
      return addToken(afterId, TokenType.BOOLEAN, false);
    case 'null':
      return addToken(afterId, TokenType.NULL, null);
    case 'if':
      return addToken(afterId, TokenType.IF);
    case 'then':
      return addToken(afterId, TokenType.THEN);
    case 'else':
      return addToken(afterId, TokenType.ELSE);
    case 'and':
      return addToken(afterId, TokenType.AND);
    case 'or':
      return addToken(afterId, TokenType.OR);
    case 'not':
      return addToken(afterId, TokenType.NOT);
    default:
      return addToken(afterId, TokenType.IDENTIFIER);
  }
};

/**
 * Scan a single token
 */
const scanToken = (state: TokenizerState): TokenizerState => {
  const char = peek(state);
  const current = advance(state);

  // Look ahead for arrow function token (=>)
  if (char === '=' && peek(current) === '>') {
    // Create an ARROW token instead of EQUAL token
    const afterToken = advance(current);
    return addToken(
      { ...afterToken, start: state.start },
      TokenType.ARROW,
      '=>',
    );
  }

  switch (char) {
    case '(':
      return addToken(current, TokenType.LEFT_PAREN);
    case ')':
      return addToken(current, TokenType.RIGHT_PAREN);
    case ',':
      return addToken(current, TokenType.COMMA);
    case '.':
      return addToken(current, TokenType.DOT);
    case '?':
      return addToken(current, TokenType.QUESTION);
    case ':':
      return addToken(current, TokenType.COLON);
    case '[':
      return addToken(current, TokenType.LEFT_BRACKET);
    case ']':
      return addToken(current, TokenType.RIGHT_BRACKET);
    case '{':
      return addToken(current, TokenType.LEFT_BRACE);
    case '}':
      // If we're in a template string interpolation, mark that we're back in template string mode
      // after adding the RIGHT_BRACE token
      if (state.inTemplate) {
        const withBrace = addToken(current, TokenType.RIGHT_BRACE);
        // After closing brace, we should continue processing template string content
        // The scanner should look for string content until the next ${...} or closing backtick
        return processTemplateString({
          ...withBrace,
          start: withBrace.current,
          inTemplate: true,
        });
      }
      return addToken(current, TokenType.RIGHT_BRACE);
    case '-':
      return addToken(current, TokenType.MINUS);
    case '+':
      return addToken(current, TokenType.PLUS);
    case '*':
      return addToken(current, TokenType.MULTIPLY);
    case '%':
      return addToken(current, TokenType.MODULO);

    case '!': {
      const [matched, newState] = match(current, '=');
      return addToken(
        matched ? newState : current,
        matched ? TokenType.NOT_EQUAL : TokenType.NOT,
      );
    }

    case '=': {
      const [matched, newState] = match(current, '=');
      if (matched) {
        return addToken(newState, TokenType.EQUAL);
      }

      // Check for arrow token (=>) - handled earlier but just in case
      if (peek(current) === '>') {
        return addToken(advance(current), TokenType.ARROW, '=>');
      }

      // Standalone '=' is treated as equality (alias for '==')
      return addToken(current, TokenType.EQUAL);
    }

    case '<': {
      const [matched, newState] = match(current, '=');
      return addToken(
        matched ? newState : current,
        matched ? TokenType.LESS_EQUAL : TokenType.LESS,
      );
    }

    case '>': {
      const [matched, newState] = match(current, '=');
      return addToken(
        matched ? newState : current,
        matched ? TokenType.GREATER_EQUAL : TokenType.GREATER,
      );
    }

    case '/':
      return addToken(current, TokenType.DIVIDE);

    case '^':
      return addToken(current, TokenType.POWER);

    case '&': {
      const [matched, newState] = match(current, '&');
      if (matched) {
        return addToken(newState, TokenType.AND);
      }

      // Create a specific error token for a standalone '&'
      return addErrorToken(
        current,
        "Unexpected character '&'. Did you mean '&&'?",
        current.line,
        current.column,
      );
    }

    case '|': {
      const [matched, newState] = match(current, '|');
      if (matched) {
        return addToken(newState, TokenType.OR);
      }

      // Create a specific error token for a standalone '|'
      return addErrorToken(
        current,
        "Unexpected character '|'. Did you mean '||'?",
        current.line,
        current.column,
      );
    }

    case '"':
      return string({ ...current, start: current.current - 1 }, '"');
    case "'":
      return string({ ...current, start: current.current - 1 }, "'");
    case '`': {
      // First add the BACKTICK token to mark the start of template string
      const withBacktick = addToken(current, TokenType.BACKTICK);

      // Check if we're inside a template literal (closing an interpolation)
      if (state.inTemplate) {
        // We're at the end of a template string after processing an interpolation
        // Just return the BACKTICK token to mark the end
        return withBacktick;
      }

      // Otherwise this is the start of a new template string
      // Process the template string content
      return processTemplateString({
        ...withBacktick,
        start: withBacktick.current,
        inTemplate: true,
      });
    }

    // Handle dollar sign
    case '$': {
      // If $ is not part of a template string, treat it as an identifier if in a valid position
      if (isAlpha(peekNext(current))) {
        return identifier({ ...current, start: current.current - 1 });
      }

      // Otherwise, report error
      return addErrorToken(
        current,
        "Unexpected character '$'",
        current.line,
        current.column,
      );
    }

    case ' ':
    case '\r':
    case '\t':
    case '\n':
      return current;

    default: {
      if (isDigit(char)) {
        return number({ ...current, start: current.current - 1 });
      }

      if (isAlpha(char)) {
        return identifier({ ...current, start: current.current - 1 });
      }

      // Return error token with more specific error message
      const errorMsg = `Unexpected character '${char}'`;
      const errorToken = addErrorToken(
        current,
        errorMsg,
        current.line,
        current.column,
      );

      return errorToken;
    }
  }
};

/**
 * Process tokens recursively
 */
const processTokens = (state: TokenizerState): TokenizerState => {
  let current = state;

  while (!isAtEnd(current)) {
    const updated = { ...current, start: current.current };
    const afterWhitespace = skipWhitespace(updated);

    if (isAtEnd(afterWhitespace)) {
      return afterWhitespace;
    }

    current = scanToken(afterWhitespace);
  }

  return current;
};

/**
 * Tokenize a source string into tokens
 */
export const tokenize = (source: string): readonly Token[] => {
  // Normal tokenization flow
  const initialState = createTokenizerState(source);
  const finalState = processTokens(initialState);

  // Add EOF token if not already added (could be added by error handling)
  const hasError = finalState.tokens.some(
    (t) =>
      t.type === TokenType.EOF &&
      typeof t.value === 'string' &&
      t.value.startsWith('Error:'),
  );

  if (hasError) {
    return finalState.tokens;
  }

  const withEof = addToken(finalState, TokenType.EOF);
  return withEof.tokens;
};
