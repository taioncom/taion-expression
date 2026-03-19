import { describe, expect, test } from '@jest/globals';
import { tokenize } from '../src/lib/tokenizer.js';
import { TokenType } from '../src/lib/types.js';

describe('Tokenizer', () => {
  test('tokenizes numeric literals correctly', () => {
    const tokens = tokenize('42');
    expect(tokens.length).toBe(2);
    expect(tokens[0].type).toBe(TokenType.NUMBER);
    expect(tokens[0].value).toBe(42);
    expect(tokens[1].type).toBe(TokenType.EOF);
  });

  test('tokenizes floating point numbers correctly', () => {
    const tokens = tokenize('3.14');
    expect(tokens.length).toBe(2);
    expect(tokens[0].type).toBe(TokenType.NUMBER);
    expect(tokens[0].value).toBe(3.14);
  });

  test('tokenizes string literals with double quotes correctly', () => {
    const tokens = tokenize('"hello"');
    expect(tokens.length).toBe(2);
    expect(tokens[0].type).toBe(TokenType.STRING);
    expect(tokens[0].value).toBe('hello');
  });

  test('tokenizes string literals with single quotes correctly', () => {
    const tokens = tokenize("'world'");
    expect(tokens.length).toBe(2);
    expect(tokens[0].type).toBe(TokenType.STRING);
    expect(tokens[0].value).toBe('world');
  });

  test('tokenizes boolean literals correctly', () => {
    const trueTokens = tokenize('true');
    expect(trueTokens.length).toBe(2);
    expect(trueTokens[0].type).toBe(TokenType.BOOLEAN);
    expect(trueTokens[0].value).toBe(true);

    const falseTokens = tokenize('false');
    expect(falseTokens.length).toBe(2);
    expect(falseTokens[0].type).toBe(TokenType.BOOLEAN);
    expect(falseTokens[0].value).toBe(false);
  });

  test('tokenizes null literal correctly', () => {
    const tokens = tokenize('null');
    expect(tokens.length).toBe(2);
    expect(tokens[0].type).toBe(TokenType.NULL);
    expect(tokens[0].value === null || tokens[0].value === 'null').toBeTruthy();
  });

  test('tokenizes identifiers correctly', () => {
    const tokens = tokenize('variable');
    expect(tokens.length).toBe(2);
    expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[0].value).toBe('variable');
  });

  test('tokenizes operators correctly', () => {
    const operators = [
      ['+', TokenType.PLUS],
      ['-', TokenType.MINUS],
      ['*', TokenType.MULTIPLY],
      ['/', TokenType.DIVIDE],
      ['%', TokenType.MODULO],
      ['^', TokenType.POWER],
      ['!', TokenType.NOT],
      ['==', TokenType.EQUAL],
      ['!=', TokenType.NOT_EQUAL],
      ['<', TokenType.LESS],
      ['>', TokenType.GREATER],
      ['<=', TokenType.LESS_EQUAL],
      ['>=', TokenType.GREATER_EQUAL],
      ['&&', TokenType.AND],
      ['||', TokenType.OR],
    ] as const;

    operators.forEach(([op, type]) => {
      const tokens = tokenize(op);
      expect(tokens.length).toBe(2);
      expect(tokens[0].type).toBe(type);
    });
  });

  test('tokenizes parentheses and control characters correctly', () => {
    const chars = [
      ['(', TokenType.LEFT_PAREN],
      [')', TokenType.RIGHT_PAREN],
      [',', TokenType.COMMA],
      ['.', TokenType.DOT],
      ['[', TokenType.LEFT_BRACKET],
      [']', TokenType.RIGHT_BRACKET],
      ['{', TokenType.LEFT_BRACE],
      ['}', TokenType.RIGHT_BRACE],
    ] as const;

    chars.forEach(([char, type]) => {
      const tokens = tokenize(char);
      expect(tokens.length).toBe(2);
      expect(tokens[0].type).toBe(type);
    });
  });

  test('tokenizes if/then/else keywords correctly', () => {
    const keywords = [
      ['if', TokenType.IF],
      ['then', TokenType.THEN],
      ['else', TokenType.ELSE],
    ] as const;

    keywords.forEach(([keyword, type]) => {
      const tokens = tokenize(keyword);
      expect(tokens.length).toBe(2);
      expect(tokens[0].type).toBe(type);
    });
  });

  test('tokenizes operator aliases correctly', () => {
    // 'and' -> AND
    const andTokens = tokenize('and');
    expect(andTokens.length).toBe(2);
    expect(andTokens[0].type).toBe(TokenType.AND);

    // 'or' -> OR
    const orTokens = tokenize('or');
    expect(orTokens.length).toBe(2);
    expect(orTokens[0].type).toBe(TokenType.OR);

    // 'not' -> NOT
    const notTokens = tokenize('not');
    expect(notTokens.length).toBe(2);
    expect(notTokens[0].type).toBe(TokenType.NOT);

    // '=' -> EQUAL
    const eqTokens = tokenize('=');
    expect(eqTokens.length).toBe(2);
    expect(eqTokens[0].type).toBe(TokenType.EQUAL);

    // '=>' still works as ARROW
    const arrowTokens = tokenize('=>');
    expect(arrowTokens.length).toBe(2);
    expect(arrowTokens[0].type).toBe(TokenType.ARROW);
  });

  test('tokenizes complex expressions correctly', () => {
    const expr = 'if (x > 10 && y < 20) then "big" else "small"';
    const tokens = tokenize(expr);

    // With the addition of question and colon tokens, length may vary
    // Let's verify key tokens instead of exact length
    expect(tokens.length).toBeGreaterThanOrEqual(14); // At least the essential tokens + EOF
    expect(tokens[0].type).toBe(TokenType.IF);
    expect(tokens[1].type).toBe(TokenType.LEFT_PAREN);
    expect(tokens[2].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[2].value).toBe('x');
    expect(tokens[3].type).toBe(TokenType.GREATER);
    expect(tokens[4].type).toBe(TokenType.NUMBER);
    expect(tokens[4].value).toBe(10);
    expect(tokens[5].type).toBe(TokenType.AND);
    expect(tokens[6].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[6].value).toBe('y');
    expect(tokens[7].type).toBe(TokenType.LESS);
    expect(tokens[8].type).toBe(TokenType.NUMBER);
    expect(tokens[8].value).toBe(20);
    expect(tokens[9].type).toBe(TokenType.RIGHT_PAREN);
    expect(tokens[10].type).toBe(TokenType.THEN);
    expect(tokens[11].type).toBe(TokenType.STRING);
    expect(tokens[11].value).toBe('big');
    expect(tokens[12].type).toBe(TokenType.ELSE);
    expect(tokens[13].type).toBe(TokenType.STRING);
    expect(tokens[13].value).toBe('small');
    expect(tokens[14].type).toBe(TokenType.EOF);
  });

  test('tokenizes with proper line and column tracking', () => {
    const expr = 'x + y\nz * 2';
    const tokens = tokenize(expr);

    expect(tokens[0].line).toBe(1);
    expect(tokens[0].column).toBe(1);
    expect(tokens[2].line).toBe(1);
    expect(tokens[2].column).toBe(5);
    expect(tokens[3].line).toBe(2);
    expect(tokens[3].column).toBe(1);
  });

  test('handles whitespace correctly', () => {
    const expr = '  a  +  b  ';
    const tokens = tokenize(expr);

    expect(tokens.length).toBe(4); // a, +, b, EOF
    expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[0].value).toBe('a');
    expect(tokens[1].type).toBe(TokenType.PLUS);
    expect(tokens[2].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[2].value).toBe('b');
  });

  test('handles comments correctly', () => {
    const expr = 'a + b // This is a comment\nc * d';
    const tokens = tokenize(expr);

    expect(tokens.length).toBeGreaterThanOrEqual(6); // At least a, +, b, c, *, d, EOF
    expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[0].value).toBe('a');
    expect(tokens[1].type).toBe(TokenType.PLUS);
    expect(tokens[2].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[2].value).toBe('b');
    expect(tokens[3].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[3].value).toBe('c');
  });

  test('detects unterminated string errors', () => {
    const expr = '"unterminated';
    const tokens = tokenize(expr);

    expect(tokens.length).toBe(1);
    expect(tokens[0].type).toBe(TokenType.EOF);
    expect(String(tokens[0].value)).toMatch(/^Error: Unterminated string/);
  });

  test('detects invalid character errors', () => {
    const expr = 'a @ b';
    const tokens = tokenize(expr);

    expect(tokens.length).toBe(3);
    expect(tokens[0].value).toBe('a');
    expect(tokens[1].type).toBe(TokenType.EOF);
    expect(String(tokens[1].value)).toMatch(/^Error: Unexpected character '@'/);
  });

  test('detects invalid operator errors', () => {
    const expr = 'a & b'; // Should be && for AND
    const tokens = tokenize(expr);

    // We'll verify that we have an identifier 'a' and an error about '&'
    expect(tokens.length).toBeGreaterThanOrEqual(2); // At least identifier and EOF with error
    expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[0].value).toBe('a');

    // Find the error token in the tokens array
    const errorToken = tokens.find(
      (token) =>
        token.type === TokenType.EOF &&
        typeof token.value === 'string' &&
        token.value.includes('&'),
    );

    expect(errorToken).toBeTruthy();
  });

  test('tokenizes backtick strings correctly', () => {
    const tokens = tokenize('`hello`');
    expect(tokens.length).toBe(4);
    expect(tokens[0].type).toBe(TokenType.BACKTICK);
    expect(tokens[1].type).toBe(TokenType.STRING);
    expect(tokens[1].value).toBe('hello');
    expect(tokens[2].type).toBe(TokenType.BACKTICK);
    expect(tokens[3].type).toBe(TokenType.EOF);
  });

  test('tokenizes template string interpolation correctly', () => {
    const tokens = tokenize('`Hello, ${name}!`');

    expect(tokens[0].type).toBe(TokenType.BACKTICK);
    expect(tokens[1].type).toBe(TokenType.STRING);
    expect(tokens[1].value).toBe('Hello, ');
    expect(tokens[2].type).toBe(TokenType.DOLLAR_SIGN);
    expect(tokens[3].type).toBe(TokenType.LEFT_BRACE);
    expect(tokens[4].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[4].value).toBe('name');
    expect(tokens[5].type).toBe(TokenType.RIGHT_BRACE);
    expect(tokens[6].type).toBe(TokenType.STRING);
    expect(tokens[6].value).toBe('!');
    expect(tokens[7].type).toBe(TokenType.BACKTICK);
  });

  test('handles escaped characters in strings correctly', () => {
    const tokens = tokenize('"Hello\\nWorld"');
    expect(tokens.length).toBe(2);
    expect(tokens[0].type).toBe(TokenType.STRING);
    expect(tokens[0].value).toBe('Hello\nWorld');

    const tokensWithQuotes = tokenize('"Quoted \\"text\\""');
    expect(tokensWithQuotes.length).toBe(2);
    expect(tokensWithQuotes[0].type).toBe(TokenType.STRING);
    expect(tokensWithQuotes[0].value).toBe('Quoted "text"');
  });

  test('tokenizes multiple template interpolations', () => {
    const tokens = tokenize('`${a} + ${b} = ${a + b}`');

    expect(tokens[0].type).toBe(TokenType.BACKTICK);

    // First interpolation
    expect(tokens[1].type).toBe(TokenType.DOLLAR_SIGN);
    expect(tokens[2].type).toBe(TokenType.LEFT_BRACE);
    expect(tokens[3].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[3].value).toBe('a');
    expect(tokens[4].type).toBe(TokenType.RIGHT_BRACE);

    expect(tokens[5].type).toBe(TokenType.STRING);
    expect(tokens[5].value).toBe(' + ');

    // Second interpolation
    expect(tokens[6].type).toBe(TokenType.DOLLAR_SIGN);
    expect(tokens[7].type).toBe(TokenType.LEFT_BRACE);
    expect(tokens[8].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[8].value).toBe('b');
    expect(tokens[9].type).toBe(TokenType.RIGHT_BRACE);

    expect(tokens[10].type).toBe(TokenType.STRING);
    expect(tokens[10].value).toBe(' = ');

    // Third interpolation
    expect(tokens[11].type).toBe(TokenType.DOLLAR_SIGN);
    expect(tokens[12].type).toBe(TokenType.LEFT_BRACE);
    // And so on...
  });

  test('detects unterminated template string errors', () => {
    const expr = '`unterminated';
    const tokens = tokenize(expr);
    // First token is the opening BACKTICK, last is the EOF error
    expect(tokens[0].type).toBe(TokenType.BACKTICK);
    const errorToken = tokens.find(
      (t: any) =>
        t.type === TokenType.EOF &&
        typeof t.value === 'string' &&
        t.value.startsWith('Error:'),
    );
    expect(errorToken).toBeDefined();
    expect(String(errorToken!.value)).toMatch(
      /^Error: Unterminated template string/,
    );
  });
});
