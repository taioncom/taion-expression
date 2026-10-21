import { Token, TokenType } from './types.js';

/**
 * Keyword spellings and the token type each produces
 */
const KEYWORDS: Readonly<Record<string, TokenType>> = {
  true: TokenType.BOOLEAN,
  false: TokenType.BOOLEAN,
  null: TokenType.NULL,
  if: TokenType.IF,
  then: TokenType.THEN,
  else: TokenType.ELSE,
  and: TokenType.AND,
  or: TokenType.OR,
  not: TokenType.NOT,
};

/**
 * Keywords that a spreadsheet-style expression also uses as function names
 * (`IF(a, b, c)`, `AND(a, b)`, `OR(a, b)`)
 */
const FUNCTION_LIKE_KEYWORDS: ReadonlySet<string> = new Set([
  'if',
  'and',
  'or',
]);

/**
 * Token types after which the next token continues an expression (an operator
 * position), rather than starting a new operand
 */
const OPERAND_END_TYPES: ReadonlySet<TokenType> = new Set([
  TokenType.NUMBER,
  TokenType.STRING,
  TokenType.BOOLEAN,
  TokenType.NULL,
  TokenType.IDENTIFIER,
  TokenType.RIGHT_PAREN,
  TokenType.RIGHT_BRACKET,
]);

/**
 * Options that change how words are recognised as keywords
 */
export type KeywordOptions = {
  /** Match keywords in any letter case (`AND`, `Null`, `IF`) */
  readonly caseInsensitiveNames?: boolean;
};

/**
 * Resolve the keyword token type for a word, or null when it is an identifier.
 *
 * Exact lowercase spellings are always keywords. With `caseInsensitiveNames`,
 * other spellings are keywords too, except a non-lowercase `IF` / `AND` / `OR`
 * written in operand position directly before `(`: that is a call to a
 * function of that name (`IF(a, b, c)`), as in spreadsheets.
 */
export const keywordType = (
  word: string,
  previous: Token | undefined,
  nextChar: string,
  options: KeywordOptions,
): TokenType | null => {
  if (Object.prototype.hasOwnProperty.call(KEYWORDS, word)) {
    return KEYWORDS[word] as TokenType;
  }
  if (!options.caseInsensitiveNames) return null;

  const lower = word.toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(KEYWORDS, lower)) return null;

  const operandPosition =
    previous === undefined || !OPERAND_END_TYPES.has(previous.type);
  if (
    FUNCTION_LIKE_KEYWORDS.has(lower) &&
    operandPosition &&
    nextChar === '('
  ) {
    return null;
  }
  return KEYWORDS[lower] as TokenType;
};
