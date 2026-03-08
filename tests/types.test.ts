import { describe, expect, test } from '@jest/globals';
import {
  createTokenizationError,
  createParseError,
  createCompilationError,
  createEvaluationError,
} from '../src/lib/types.js';

describe('Error Types', () => {
  test('createTokenizationError creates correctly formatted error', () => {
    const error = createTokenizationError('Unexpected character', 5, 10);

    expect(error.name).toBe('TokenizationError');
    expect(error.message).toBe('Unexpected character at line 5, column 10');
    expect(error instanceof Error).toBe(true);
  });

  test('createParseError creates correctly formatted error', () => {
    const error = createParseError('Unexpected token', 2, 15);

    expect(error.name).toBe('ParseError');
    expect(error.message).toBe('Unexpected token at line 2, column 15');
    expect(error instanceof Error).toBe(true);
  });

  test('createCompilationError creates correctly formatted error', () => {
    const error = createCompilationError('Invalid operation');

    expect(error.name).toBe('CompilationError');
    expect(error.message).toBe('Invalid operation');
    expect(error instanceof Error).toBe(true);
  });

  test('createEvaluationError creates correctly formatted error', () => {
    const error = createEvaluationError('Division by zero');

    expect(error.name).toBe('EvaluationError');
    expect(error.message).toBe('Division by zero');
    expect(error instanceof Error).toBe(true);
  });
});
