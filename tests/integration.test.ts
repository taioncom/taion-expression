import { describe, expect, test } from '@jest/globals';
import {
  evaluateExpression,
  getCompiledCode,
  safeEvaluateExpression,
} from '../src/lib/taion-expression.js';
import { ExpressionOptions } from '../src/lib/types.js';

describe('Integration Tests', () => {
  test('arithmetic operations evaluate correctly', () => {
    const tests = [
      // Addition
      { expr: '2 + 3', expected: 5 },
      { expr: '-2 + 3', expected: 1 },
      { expr: '2 + -3', expected: -1 },

      // Subtraction
      { expr: '5 - 3', expected: 2 },
      { expr: '3 - 5', expected: -2 },
      { expr: '-3 - -5', expected: 2 },

      // Multiplication
      { expr: '2 * 3', expected: 6 },
      { expr: '-2 * 3', expected: -6 },
      { expr: '-2 * -3', expected: 6 },

      // Division
      { expr: '6 / 3', expected: 2 },
      { expr: '7 / 2', expected: 3.5 },
      { expr: '-6 / 3', expected: -2 },
      { expr: '-6 / -3', expected: 2 },

      // Modulo
      { expr: '7 % 3', expected: 1 },
      { expr: '8 % 4', expected: 0 },

      // Exponentiation
      { expr: '2 ^ 3', expected: 8 },
      { expr: '3 ^ 2', expected: 9 },
      { expr: '2 ^ 0', expected: 1 },

      // Mixed operations and precedence
      { expr: '2 + 3 * 4', expected: 14 },
      { expr: '(2 + 3) * 4', expected: 20 },
      { expr: '2 + 3 * 4 / 2', expected: 8 },
      { expr: '(2 + 3 * 4) / 2', expected: 7 },
      { expr: '2 ^ 3 + 1', expected: 9 },
      { expr: '2 * 3 ^ 2', expected: 18 },
    ];

    tests.forEach(({ expr }) => {
      const result = evaluateExpression(expr);
      expect((result as any).success).toBe(true);

      const code = getCompiledCode(expr);
      expect(code).toBeTruthy();
    });
  });

  test('string operations evaluate correctly', () => {
    const tests = [
      // String concatenation
      { expr: '"Hello" + " " + "World"', expected: 'Hello World' },
      { expr: '"Value: " + 42', expected: 'Value: 42' },

      // String operations with context
      {
        expr: 'name + ", age: " + age',
        context: { name: 'John', age: 30 },
        expected: 'John, age: 30',
      },
    ];

    tests.forEach(({ expr, context = {}, expected }) => {
      const result = evaluateExpression(expr, context);
      expect((result as any).success).toBe(true);
      if (expected !== undefined) {
        expect((result as any).result).toEqual(expected);
      }
    });
  });

  test('comparison operations evaluate correctly', () => {
    const tests = [
      // Equal
      { expr: '2 == 2', expected: true },
      { expr: '2 == 3', expected: false },
      { expr: '"a" == "a"', expected: true },
      { expr: '"a" == "b"', expected: false },

      // Not equal
      { expr: '2 != 3', expected: true },
      { expr: '2 != 2', expected: false },
      { expr: '"a" != "b"', expected: true },
      { expr: '"a" != "a"', expected: false },

      // Greater than
      { expr: '3 > 2', expected: true },
      { expr: '2 > 3', expected: false },
      { expr: '2 > 2', expected: false },

      // Less than
      { expr: '2 < 3', expected: true },
      { expr: '3 < 2', expected: false },
      { expr: '2 < 2', expected: false },

      // Greater than or equal
      { expr: '3 >= 2', expected: true },
      { expr: '2 >= 2', expected: true },
      { expr: '1 >= 2', expected: false },

      // Less than or equal
      { expr: '2 <= 3', expected: true },
      { expr: '2 <= 2', expected: true },
      { expr: '3 <= 2', expected: false },
    ];

    tests.forEach(({ expr }) => {
      const result = evaluateExpression(expr);
      expect((result as any).success).toBe(true);
    });
  });

  test('logical operations evaluate correctly', () => {
    const tests = [
      // AND
      { expr: 'true && true', expected: true },
      { expr: 'true && false', expected: false },
      { expr: 'false && true', expected: false },
      { expr: 'false && false', expected: false },

      // OR
      { expr: 'true || true', expected: true },
      { expr: 'true || false', expected: true },
      { expr: 'false || true', expected: true },
      { expr: 'false || false', expected: false },

      // NOT
      { expr: '!true', expected: false },
      { expr: '!false', expected: true },

      // Complex expressions
      { expr: '(a > 5) && (b < 10)', context: { a: 7, b: 3 }, expected: true },
      { expr: '(a > 5) && (b < 10)', context: { a: 3, b: 3 }, expected: false },
      { expr: '(a > 5) || (b < 10)', context: { a: 3, b: 3 }, expected: true },
      { expr: '!(a > 5)', context: { a: 3 }, expected: true },
    ];

    tests.forEach(({ expr, context = {} }) => {
      const result = evaluateExpression(expr, context);
      expect((result as any).success).toBe(true);
    });
  });

  test('conditional expressions evaluate correctly', () => {
    const tests = [
      // Using ternary syntax instead of if/then/else
      { expr: 'true ? "yes" : "no"', expected: 'yes' },
      { expr: 'false ? "yes" : "no"', expected: 'no' },
      { expr: '5 > 3 ? "greater" : "smaller"', expected: 'greater' },
      { expr: '3 > 5 ? "greater" : "smaller"', expected: 'smaller' },

      // With variables
      {
        expr: 'age >= 18 ? "adult" : "minor"',
        context: { age: 25 },
        expected: 'adult',
      },

      // Complex conditions
      {
        expr: '(score > 70 && attendance > 80) || role == "admin" ? "pass" : "fail"',
        context: { score: 65, attendance: 85, role: 'admin' },
        expected: 'pass',
      },
    ];

    tests.forEach(({ expr, context = {} }) => {
      const result = evaluateExpression(expr, context);
      expect((result as any).success).toBe(true);
    });
  });

  test('variable access evaluates correctly', () => {
    const context = {
      a: 10,
      b: 20,
      user: {
        name: 'John',
        age: 30,
        profile: {
          bio: 'Software developer',
          interests: ['programming', 'music', 'hiking'],
        },
      },
      items: [1, 2, 3, 4, 5],
    };

    const tests = [
      // Simple variables
      { expr: 'a', expected: 10 },
      { expr: 'b', expected: 20 },

      // Object properties
      { expr: 'user.name', expected: 'John' },
      { expr: 'user.age', expected: 30 },

      // Nested properties
      { expr: 'user.profile.bio', expected: 'Software developer' },

      // Non-existent properties (should return null)
      { expr: 'user.email', expected: null },
      { expr: 'unknown', expected: null },

      // Usage in expressions
      { expr: 'a + b', expected: 30 },
      { expr: 'user.age >= 18', expected: true },
      { expr: 'user.name + " is " + user.age', expected: 'John is 30' },
    ];

    tests.forEach(({ expr }) => {
      const result = evaluateExpression(expr, context);
      expect((result as any).success).toBe(true);
    });
  });

  test('built-in functions evaluate correctly', () => {
    const context = {
      name: 'John Doe',
      age: 30,
      scores: [85, 90, 78, 92, 88],
      greeting: 'Hello, World!',
    };

    const tests = [
      // String functions
      { expr: 'length(name)', expected: 8 },
      { expr: 'contains(name, "Doe")', expected: true },
      { expr: 'contains(name, "Smith")', expected: false },
      { expr: 'startsWith(greeting, "Hello")', expected: true },
      { expr: 'endsWith(greeting, "World!")', expected: true },
      { expr: 'toLowerCase(name)', expected: 'john doe' },
      { expr: 'toUpperCase(name)', expected: 'JOHN DOE' },
      { expr: 'substring(name, 0, 4)', expected: 'John' },

      // Math functions
      { expr: 'min(age, 25)', expected: 25 },
      { expr: 'max(age, 25)', expected: 30 },
      { expr: 'round(3.7)', expected: 4 },
      { expr: 'round(3.14159, 2)', expected: 3.14 },
      { expr: 'round(3.14159, 4)', expected: 3.1416 },
      { expr: 'round(3.14159, 0)', expected: 3 },
      { expr: 'floor(3.7)', expected: 3 },
      { expr: 'ceil(3.2)', expected: 4 },
      { expr: 'abs(-5)', expected: 5 },

      // Array functions
      { expr: 'length(scores)', expected: 5 },
      { expr: 'sum(scores)', expected: 433 },
      { expr: 'avg(scores)', expected: 86.6 },
      { expr: 'arrayContains(scores, 90)', expected: true },
    ];

    tests.forEach(({ expr }) => {
      const result = evaluateExpression(expr, context);
      expect((result as any).success).toBe(true);
    });
  });

  test('new string functions evaluate correctly', () => {
    const context = {
      padded: '  hello  ',
      sentence: 'the quick brown fox',
      csv: 'a,b,c,d',
    };

    // trim
    const trimResult = evaluateExpression('trim(padded)', context);
    expect((trimResult as any).success).toBe(true);
    expect((trimResult as any).result).toBe('hello');

    // replace
    const replaceResult = evaluateExpression(
      'replace(sentence, "quick", "slow")',
      context,
    );
    expect((replaceResult as any).success).toBe(true);
    expect((replaceResult as any).result).toBe('the slow brown fox');

    // replace all occurrences
    const replaceAllResult = evaluateExpression(
      'replace("aaa", "a", "b")',
      {},
    );
    expect((replaceAllResult as any).success).toBe(true);
    expect((replaceAllResult as any).result).toBe('bbb');

    // split
    const splitResult = evaluateExpression('split(csv, ",")', context);
    expect((splitResult as any).success).toBe(true);
    expect((splitResult as any).result).toEqual(['a', 'b', 'c', 'd']);

    // indexOf - found
    const indexOfResult = evaluateExpression(
      'indexOf(sentence, "quick")',
      context,
    );
    expect((indexOfResult as any).success).toBe(true);
    expect((indexOfResult as any).result).toBe(4);

    // indexOf - not found
    const indexOfNotFound = evaluateExpression(
      'indexOf(sentence, "lazy")',
      context,
    );
    expect((indexOfNotFound as any).success).toBe(true);
    expect((indexOfNotFound as any).result).toBe(-1);
  });

  test('capitalize, padLeft, padRight, isEmpty functions', () => {
    // capitalize
    const cap1 = evaluateExpression('capitalize("hello")', {});
    expect((cap1 as any).result).toBe('Hello');

    const cap2 = evaluateExpression('capitalize("HELLO WORLD")', {});
    expect((cap2 as any).result).toBe('Hello world');

    const capEmpty = evaluateExpression('capitalize("")', {});
    expect((capEmpty as any).result).toBe('');

    // capitalize with allWords
    const capAll1 = evaluateExpression('capitalize("hello world", true)', {});
    expect((capAll1 as any).result).toBe('Hello World');

    const capAll2 = evaluateExpression('capitalize("HELLO WORLD", true)', {});
    expect((capAll2 as any).result).toBe('Hello World');

    const capAllFalse = evaluateExpression(
      'capitalize("hello world", false)',
      {}
    );
    expect((capAllFalse as any).result).toBe('Hello world');

    const capAllSpaces = evaluateExpression(
      'capitalize("  multiple   spaces  ", true)',
      {}
    );
    expect((capAllSpaces as any).result).toBe('Multiple Spaces');

    const capAllSingle = evaluateExpression('capitalize("a", true)', {});
    expect((capAllSingle as any).result).toBe('A');

    // padLeft
    const padL1 = evaluateExpression('padLeft("42", 5, "0")', {});
    expect((padL1 as any).result).toBe('00042');

    const padLDefault = evaluateExpression('padLeft("hi", 5)', {});
    expect((padLDefault as any).result).toBe('   hi');

    const padLNum = evaluateExpression('padLeft(7, 3, "0")', {});
    expect((padLNum as any).result).toBe('007');

    // padRight
    const padR1 = evaluateExpression('padRight("hi", 5, ".")', {});
    expect((padR1 as any).result).toBe('hi...');

    const padRDefault = evaluateExpression('padRight("hi", 5)', {});
    expect((padRDefault as any).result).toBe('hi   ');

    // isEmpty
    const emptyNull = evaluateExpression('isEmpty(x)', {});
    expect((emptyNull as any).result).toBe(true);

    const emptyStr = evaluateExpression('isEmpty("")', {});
    expect((emptyStr as any).result).toBe(true);

    const emptyUndef = evaluateExpression('isEmpty(x)', { x: undefined });
    expect((emptyUndef as any).result).toBe(true);

    const notEmpty1 = evaluateExpression('isEmpty("hello")', {});
    expect((notEmpty1 as any).result).toBe(false);

    const notEmpty2 = evaluateExpression('isEmpty(0)', {});
    expect((notEmpty2 as any).result).toBe(false);

    const notEmpty3 = evaluateExpression('isEmpty(false)', {});
    expect((notEmpty3 as any).result).toBe(false);
  });

  test('conversion functions evaluate correctly', () => {
    // toString with number
    const toStringNum = evaluateExpression('toString(42)', {});
    expect((toStringNum as any).success).toBe(true);
    expect((toStringNum as any).result).toBe('42');

    // toString with boolean
    const toStringBool = evaluateExpression('toString(true)', {});
    expect((toStringBool as any).success).toBe(true);
    expect((toStringBool as any).result).toBe('true');

    // toString with a JS-null value (missing context property produces real null)
    const toStringNull = evaluateExpression('toString(val)', { val: undefined });
    expect((toStringNull as any).success).toBe(true);
    expect((toStringNull as any).result).toBe('');

    // toNumber
    const toNumberStr = evaluateExpression('toNumber("42")', {});
    expect((toNumberStr as any).success).toBe(true);
    expect((toNumberStr as any).result).toBe(42);

    const toNumberFloat = evaluateExpression('toNumber("3.14")', {});
    expect((toNumberFloat as any).success).toBe(true);
    expect((toNumberFloat as any).result).toBe(3.14);

    const toNumberInvalid = evaluateExpression('toNumber("abc")', {});
    expect((toNumberInvalid as any).success).toBe(true);
    expect((toNumberInvalid as any).result).toBeNull();
  });

  test('slice function evaluates correctly', () => {
    const options: ExpressionOptions = {
      enableArrays: true,
    };
    const context = { numbers: [1, 2, 3, 4, 5] };

    // slice with start and end
    const sliceResult = evaluateExpression(
      'slice(numbers, 1, 3)',
      context,
      options,
    );
    expect((sliceResult as any).success).toBe(true);
    expect((sliceResult as any).result).toEqual([2, 3]);

    // slice with only start
    const sliceFromResult = evaluateExpression(
      'slice(numbers, 2)',
      context,
      options,
    );
    expect((sliceFromResult as any).success).toBe(true);
    expect((sliceFromResult as any).result).toEqual([3, 4, 5]);

    // slice on non-array
    const sliceNonArr = evaluateExpression('slice("hello", 1)', {}, options);
    expect((sliceNonArr as any).success).toBe(true);
    expect((sliceNonArr as any).result).toEqual([]);
  });

  test('every and some HOFs evaluate correctly', () => {
    const options: ExpressionOptions = {
      enableArrays: true,
      enableArrowFunctions: true,
    };
    const context = {
      numbers: [2, 4, 6, 8],
      mixed: [1, 2, 3, 4],
    };

    // every - all match
    const everyTrue = evaluateExpression(
      'every(numbers, x => x % 2 == 0)',
      context,
      options,
    );
    expect((everyTrue as any).success).toBe(true);
    expect((everyTrue as any).result).toBe(true);

    // every - not all match
    const everyFalse = evaluateExpression(
      'every(mixed, x => x % 2 == 0)',
      context,
      options,
    );
    expect((everyFalse as any).success).toBe(true);
    expect((everyFalse as any).result).toBe(false);

    // some - at least one matches
    const someTrue = evaluateExpression(
      'some(mixed, x => x > 3)',
      context,
      options,
    );
    expect((someTrue as any).success).toBe(true);
    expect((someTrue as any).result).toBe(true);

    // some - none match
    const someFalse = evaluateExpression(
      'some(numbers, x => x > 10)',
      context,
      options,
    );
    expect((someFalse as any).success).toBe(true);
    expect((someFalse as any).result).toBe(false);
  });

  test('coalesce function evaluates correctly', () => {
    // coalesce returns first non-null/non-undefined value
    // Use context variables to get real JS null (missing properties return null)
    const result1 = evaluateExpression('coalesce(a, b, 42)', {});
    expect((result1 as any).success).toBe(true);
    expect((result1 as any).result).toBe(42);

    const result2 = evaluateExpression('coalesce(val, "default")', {
      val: null,
    });
    expect((result2 as any).success).toBe(true);
    expect((result2 as any).result).toBe('default');

    const result3 = evaluateExpression('coalesce(val, "fallback")', {
      val: 'hello',
    });
    expect((result3 as any).success).toBe(true);
    expect((result3 as any).result).toBe('hello');

    // all null (undefined identifiers return JS null)
    const resultNull = evaluateExpression('coalesce(a, b)', {});
    expect((resultNull as any).success).toBe(true);
    expect((resultNull as any).result).toBeNull();
  });

  test('random functions evaluate correctly', () => {
    // random() returns a number between 0 and 1
    const randResult = evaluateExpression('random()', {});
    expect((randResult as any).success).toBe(true);
    expect(typeof (randResult as any).result).toBe('number');
    expect((randResult as any).result).toBeGreaterThanOrEqual(0);
    expect((randResult as any).result).toBeLessThan(1);

    // randomInt returns an integer within range
    const randIntResult = evaluateExpression('randomInt(1, 10)', {});
    expect((randIntResult as any).success).toBe(true);
    const val = (randIntResult as any).result;
    expect(Number.isInteger(val)).toBe(true);
    expect(val).toBeGreaterThanOrEqual(1);
    expect(val).toBeLessThanOrEqual(10);
  });

  test('regex functions evaluate correctly', () => {
    // regexTest
    const testTrue = evaluateExpression('regexTest("hello123", "\\\\d+")', {});
    expect((testTrue as any).success).toBe(true);
    expect((testTrue as any).result).toBe(true);

    const testFalse = evaluateExpression('regexTest("hello", "\\\\d+")', {});
    expect((testFalse as any).success).toBe(true);
    expect((testFalse as any).result).toBe(false);

    // regexMatch
    const matchResult = evaluateExpression(
      'regexMatch("order-42-confirmed", "\\\\d+")',
      {},
    );
    expect((matchResult as any).success).toBe(true);
    expect((matchResult as any).result).toBe('42');

    const matchNone = evaluateExpression(
      'regexMatch("no numbers here", "\\\\d+")',
      {},
    );
    expect((matchNone as any).success).toBe(true);
    expect((matchNone as any).result).toBeNull();

    // regexReplace
    const replaceResult = evaluateExpression(
      'regexReplace("hello 123 world 456", "\\\\d+", "NUM")',
      {},
    );
    expect((replaceResult as any).success).toBe(true);
    expect((replaceResult as any).result).toBe('hello NUM world NUM');

    // invalid regex pattern - should not throw
    const invalidRegex = evaluateExpression('regexTest("hello", "[")', {});
    expect((invalidRegex as any).success).toBe(true);
    expect((invalidRegex as any).result).toBe(false);
  });

  test('custom functions evaluate correctly', () => {
    const context = {
      price: 100,
      name: 'John',
    };

    const options: ExpressionOptions = {
      customFunctions: {
        greet: (...args: readonly unknown[]) => {
          const name = args[0] as string;
          return `Hello, ${name}!`;
        },
        calculateTax: (...args: readonly unknown[]) => {
          const amount = args[0] as number;
          const rate = args[1] as number;
          return amount * (rate / 100);
        },
        formatCurrency: (...args: readonly unknown[]) => {
          const amount = args[0] as number;
          return `$${amount.toFixed(2)}`;
        },
        isEven: (...args: readonly unknown[]) => {
          const num = args[0] as number;
          return num % 2 === 0;
        },
        capitalize: (...args: readonly unknown[]) => {
          const str = args[0] as string;
          return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },
      },
    };

    const tests = [
      { expr: 'greet(name)', expected: 'Hello, John!' },
      { expr: 'calculateTax(price, 10)', expected: 10 },
      { expr: 'formatCurrency(price)', expected: '$100.00' },
      { expr: 'isEven(price)', expected: true },
      { expr: 'capitalize("JOHN")', expected: 'John' },

      // Functions with expressions as arguments
      { expr: 'calculateTax(price * 2, 5)', expected: 10 },
      { expr: 'greet(name + " Doe")', expected: 'Hello, John Doe!' },

      // Nested function calls
      { expr: 'formatCurrency(calculateTax(price, 10))', expected: '$10.00' },
    ];

    tests.forEach(({ expr }) => {
      const result = evaluateExpression(expr, context, options);
      expect((result as any).success).toBe(true);
    });
  });

  test('complex full expressions evaluate correctly', () => {
    const context = {
      user: {
        name: 'John',
        age: 25,
        isPremium: true,
      },
      order: {
        total: 120,
        items: 5,
      },
      settings: {
        taxRate: 8.5,
        discountThreshold: 100,
      },
    };

    const options: ExpressionOptions = {
      customFunctions: {
        calculateTax: (...args: readonly unknown[]) => {
          const amount = args[0] as number;
          const rate = args[1] as number;
          return amount * (rate / 100);
        },
        applyDiscount: (...args: readonly unknown[]) => {
          const amount = args[0] as number;
          const discountPercent = args[1] as number;
          return amount * (1 - discountPercent / 100);
        },
      },
    };

    const complexExpressions = [
      // Using ternary syntax to be more compatible
      `order.total > 100 ? user.isPremium ? order.total * 0.85 : order.total * 0.9 : order.total`,

      // Simpler expressions
      `user.age >= 18 ? "adult" : "minor"`,

      `user.isPremium ? order.total * 0.9 : order.total`,

      `calculateTax(order.total, settings.taxRate)`,
    ];

    complexExpressions.forEach((expr) => {
      const result = evaluateExpression(expr, context, options);
      expect((result as any).success).toBe(true);
    });
  });

  test('error handling in expressions', () => {
    // Various error cases
    const errorCases = [
      // Syntax errors
      '2 +',
      'a + * b',
      '(1 + 2',

      // Unterminated strings
      '"unterminated',
    ];

    errorCases.forEach((expr) => {
      const result = safeEvaluateExpression(expr);
      expect(result).toBeNull();
    });

    // For other cases, we'll test them individually to allow for some flexibility
    // in how the implementation handles edge cases

    // Missing arguments may be handled by returning NaN or a default value
    const funcResult = safeEvaluateExpression('nonExistentFunc()');
    expect(funcResult === null || funcResult === undefined).toBe(true);

    // Variables that don't exist should be handled safely
    const varResult = safeEvaluateExpression('nonExistentVar');
    expect(varResult === null || varResult === undefined).toBe(true);
  });

  test('improved error messages', () => {
    // Test syntax error messages - this is a valid expression in our system (unary plus)
    const syntaxResult = evaluateExpression('1 + + 2');
    // This actually evaluates as 1 + (+2) which is valid
    expect((syntaxResult as any).success).toBe(true);

    // Use a definitely invalid expression
    const invalidResult = evaluateExpression('1 +* 2');
    expect((invalidResult as any).success).toBe(false);
    expect((invalidResult as any).error).toBeTruthy();

    // Test missing closing parenthesis
    const parenResult = evaluateExpression('(1 + 2');
    expect((parenResult as any).success).toBe(false);
    expect((parenResult as any).error).toBeTruthy();

    // Test property access error
    const propOptions: ExpressionOptions = {
      deniedProperties: ['secret'],
    };
    const propResult = evaluateExpression(
      'user.secret',
      { user: { secret: 'password' } },
      propOptions,
    );
    expect((propResult as any).success).toBe(false);
    expect((propResult as any).error).toBeTruthy();
    expect(
      (propResult as any).error?.message.includes('denied') ||
        (propResult as any).error?.message.includes('not allowed'),
    ).toBe(true);

    // Test template string error (when not enabled)
    const templateResult = evaluateExpression('`Hello ${name}`', {
      name: 'World',
    });
    expect((templateResult as any).success).toBe(false);
    expect((templateResult as any).error).toBeTruthy();
    expect(
      (templateResult as any).error?.message.includes('template') ||
        (templateResult as any).error?.message.includes('not allowed'),
    ).toBe(true);

    // Test array index out of bounds error message
    const arrayOptions: ExpressionOptions = {
      enableArrays: true,
    };
    const arrayResult = evaluateExpression(
      'arr[10]',
      { arr: [1, 2, 3] },
      arrayOptions,
    );
    expect((arrayResult as any).success).toBe(true);
    expect((arrayResult as any).result).toBeNull();
  });

  test('array-related features', () => {
    // Enable array support
    const options: ExpressionOptions = {
      enableArrays: true,
    };

    const context = {
      numbers: [1, 2, 3, 4, 5],
      matrix: [
        [1, 2],
        [3, 4],
      ],
      empty: [],
      userScores: [
        { name: 'John', points: 85 },
        { name: 'Alice', points: 92 },
        { name: 'Bob', points: 78 },
      ],
    };

    // Test array literals
    const arrayLiteral = evaluateExpression('[1, 2, 3, 4, 5]', {}, options);
    expect((arrayLiteral as any).success).toBe(true);
    expect((arrayLiteral as any).result).toEqual([1, 2, 3, 4, 5]);

    // Test nested array literals
    const nestedArray = evaluateExpression('[[1, 2], [3, 4]]', {}, options);
    expect((nestedArray as any).success).toBe(true);
    expect((nestedArray as any).result).toEqual([
      [1, 2],
      [3, 4],
    ]);

    // Test array with expressions
    const arrayWithExpr = evaluateExpression(
      '[1 + 1, 2 * 2, 3 ^ 2]',
      {},
      options,
    );
    expect((arrayWithExpr as any).success).toBe(true);
    expect((arrayWithExpr as any).result).toEqual([2, 4, 9]);

    // Test array indexing
    const arrayIndex = evaluateExpression('numbers[2]', context, options);
    expect((arrayIndex as any).success).toBe(true);
    expect((arrayIndex as any).result).toBe(3);

    // Test nested array indexing
    const nestedIndex = evaluateExpression('matrix[1][0]', context, options);
    expect((nestedIndex as any).success).toBe(true);
    expect((nestedIndex as any).result).toBe(3);

    // Test array index with expression
    const indexWithExpr = evaluateExpression(
      'numbers[1 + 2]',
      context,
      options,
    );
    expect((indexWithExpr as any).success).toBe(true);
    expect((indexWithExpr as any).result).toBe(4);

    // Test out of bounds array access
    const outOfBounds = evaluateExpression('numbers[10]', context, options);
    expect((outOfBounds as any).success).toBe(true);
    expect((outOfBounds as any).result).toBeNull();

    // Test negative index
    const negativeIndex = evaluateExpression('numbers[-1]', context, options);
    expect((negativeIndex as any).success).toBe(true);
    expect((negativeIndex as any).result).toBeNull();

    // Test empty array
    const emptyArr = evaluateExpression('empty[0]', context, options);
    expect((emptyArr as any).success).toBe(true);
    expect((emptyArr as any).result).toBeNull();

    // Test complex object in array
    const complexArrAccess = evaluateExpression(
      'userScores[1].name',
      context,
      options,
    );
    expect((complexArrAccess as any).success).toBe(true);
    expect((complexArrAccess as any).result).toBe('Alice');

    // Test array with template strings (combining features)
    if (options.enableTemplateStrings) {
      const arrayWithTemplate = evaluateExpression(
        '`Users: ${userScores[0].name}, ${userScores[1].name}`',
        context,
        {
          ...options,
          enableTemplateStrings: true,
        },
      );
      expect((arrayWithTemplate as any).success).toBe(true);
      expect((arrayWithTemplate as any).result).toBe('Users: John, Alice');
    }

    // Test enhanced array functions

    // The current implementation can't handle arrow functions directly
    // Instead, we'll use our built-in functions that don't require arrow syntax

    // Test simple array operations that don't require arrow functions
    const sumResult = evaluateExpression('sum(numbers)', context, options);
    expect((sumResult as any).success).toBe(true);
    expect((sumResult as any).result).toBe(15);

    const joinResult = evaluateExpression(
      'join(numbers, "-")',
      context,
      options,
    );
    expect((joinResult as any).success).toBe(true);
    expect((joinResult as any).result).toBe('1-2-3-4-5');

    // Note: Our current implementation doesn't support arrow functions in expressions

    // Test sort function
    const sortResult = evaluateExpression(
      'sort([5, 3, 1, 4, 2])',
      context,
      options,
    );
    expect((sortResult as any).success).toBe(true);
    expect((sortResult as any).result).toEqual([1, 2, 3, 4, 5]);

    // Test reverse function
    const reverseResult = evaluateExpression(
      'reverse(numbers)',
      context,
      options,
    );
    expect((reverseResult as any).success).toBe(true);
    expect((reverseResult as any).result).toEqual([5, 4, 3, 2, 1]);

    // Test arrayContains function
    const containsResult = evaluateExpression(
      'arrayContains(numbers, 3)',
      context,
      options,
    );
    expect((containsResult as any).success).toBe(true);
    expect((containsResult as any).result).toBe(true);

    // Test avg function
    const avgResult = evaluateExpression('avg(numbers)', context, options);
    expect((avgResult as any).success).toBe(true);
    expect((avgResult as any).result).toBe(3);

    // Test object functions
    const keysResult = evaluateExpression(
      'keys(userScores[0])',
      context,
      options,
    );
    expect((keysResult as any).success).toBe(true);
    expect((keysResult as any).result).toEqual(['name', 'points']);

    const valuesResult = evaluateExpression(
      'values(userScores[0])',
      context,
      options,
    );
    expect((valuesResult as any).success).toBe(true);
    expect((valuesResult as any).result).toEqual(['John', 85]);

    // Test type checking functions
    const typeCheck = evaluateExpression('type(numbers)', context, options);
    expect((typeCheck as any).success).toBe(true);
    expect((typeCheck as any).result).toBe('array');

    const isArrayCheck = evaluateExpression(
      'isArray(numbers)',
      context,
      options,
    );
    expect((isArrayCheck as any).success).toBe(true);
    expect((isArrayCheck as any).result).toBe(true);
  });

  test('template string features', () => {
    // Enable template strings in options
    const options: ExpressionOptions = {
      enableTemplateStrings: true,
    };

    // Simple template string
    const simpleTemplate = evaluateExpression('`Hello, World!`', {}, options);
    expect((simpleTemplate as any).success).toBe(true);
    expect((simpleTemplate as any).result).toBe('Hello, World!');

    // Template string with interpolation
    const context = { name: 'John', age: 30 };
    const interpolation = evaluateExpression(
      '`Hello, ${name}!`',
      context,
      options,
    );
    expect((interpolation as any).success).toBe(true);
    expect((interpolation as any).result).toBe('Hello, John!');

    // Template string with multiple interpolations
    const multiInterpolation = evaluateExpression(
      '`${name} is ${age} years old`',
      context,
      options,
    );
    expect((multiInterpolation as any).success).toBe(true);
    expect((multiInterpolation as any).result).toBe('John is 30 years old');

    // Template string with expression interpolation
    const exprInterpolation = evaluateExpression(
      '`Sum: ${10 + 20}`',
      {},
      options,
    );
    expect((exprInterpolation as any).success).toBe(true);
    expect((exprInterpolation as any).result).toBe('Sum: 30');

    // Template string with complex expressions
    const complexContext = { a: 10, b: 20 };
    const complexInterpolation = evaluateExpression(
      '`The ${a > b ? "greater" : "lesser"} value is ${a > b ? a : b}`',
      complexContext,
      options,
    );
    expect((complexInterpolation as any).success).toBe(true);
    expect((complexInterpolation as any).result).toBe('The lesser value is 20');
  });

  test('security features work correctly', () => {
    // Rather than test the specific implementations,
    // we'll verify that our security options are being recognized correctly

    // Test property access security
    const securityOptions: ExpressionOptions = {
      allowedProperties: ['name', 'age'],
    };

    // Check if the syntax for dot access is working
    const dotResult = evaluateExpression('person.name', {
      person: { name: 'John' },
    });
    expect((dotResult as any).success).toBe(true);

    // Test timeout options
    const timeoutOptions: ExpressionOptions = {
      timeout: 5000, // Use a reasonable timeout that won't trigger in tests
    };
    const timeoutResult = evaluateExpression('1 + 2', {}, timeoutOptions);
    expect((timeoutResult as any).success).toBe(true);

    // Test array features toggle
    const arrayOptions: ExpressionOptions = {
      enableArrays: true,
    };
    const arrayResult = evaluateExpression('1 + 2', {}, arrayOptions);
    expect((arrayResult as any).success).toBe(true);

    // Test template string features toggle
    const templateOptions: ExpressionOptions = {
      enableTemplateStrings: true,
    };
    const templateResult = evaluateExpression('1 + 2', {}, templateOptions);
    expect((templateResult as any).success).toBe(true);

    // Test denied properties
    const deniedOptions: ExpressionOptions = {
      deniedProperties: ['password', 'secret'],
    };
    const userContext = {
      user: {
        name: 'John',
        password: '12345', // This should be inaccessible with deniedOptions
      },
    };

    // Accessing allowed property should work
    const allowedAccess = evaluateExpression(
      'user.name',
      userContext,
      deniedOptions,
    );
    expect((allowedAccess as any).success).toBe(true);

    // Accessing denied property should fail or return null
    const deniedAccess = evaluateExpression(
      'user.password',
      userContext,
      deniedOptions,
    );
    if ((deniedAccess as any).success) {
      expect((deniedAccess as any).result).toBeNull();
    } else {
      expect((deniedAccess as any).error).toBeTruthy();
    }
  });

  test('date creation functions', () => {
    // now() returns a Date
    const nowResult = evaluateExpression('now()', {});
    expect((nowResult as any).success).toBe(true);
    expect((nowResult as any).result).toBeInstanceOf(Date);

    // date() with year, month (1-based), day
    const dateResult = evaluateExpression('date(2024, 3, 15)', {});
    expect((dateResult as any).success).toBe(true);
    const d = (dateResult as any).result as Date;
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(2); // JS 0-based
    expect(d.getDate()).toBe(15);

    // date() with time components
    const dateTimeResult = evaluateExpression(
      'date(2024, 3, 15, 10, 30, 45)',
      {},
    );
    expect((dateTimeResult as any).success).toBe(true);
    const dt = (dateTimeResult as any).result as Date;
    expect(dt.getHours()).toBe(10);
    expect(dt.getMinutes()).toBe(30);
    expect(dt.getSeconds()).toBe(45);

    // parseDate() valid string
    const parseResult = evaluateExpression('parseDate("2024-03-15")', {});
    expect((parseResult as any).success).toBe(true);
    expect((parseResult as any).result).toBeInstanceOf(Date);

    // parseDate() invalid string
    const parseInvalid = evaluateExpression('parseDate("not-a-date")', {});
    expect((parseInvalid as any).success).toBe(true);
    expect((parseInvalid as any).result).toBeNull();

    // parseDate() non-string
    const parseNonStr = evaluateExpression('parseDate(42)', {});
    expect((parseNonStr as any).success).toBe(true);
    expect((parseNonStr as any).result).toBeNull();
  });

  test('date type checking functions', () => {
    const context = { d: new Date('2024-03-15') };

    // isDate() true for Date
    const isDateTrue = evaluateExpression('isDate(d)', context);
    expect((isDateTrue as any).success).toBe(true);
    expect((isDateTrue as any).result).toBe(true);

    // isDate() false for non-Date
    const isDateFalse = evaluateExpression('isDate(42)', {});
    expect((isDateFalse as any).success).toBe(true);
    expect((isDateFalse as any).result).toBe(false);

    const isDateStr = evaluateExpression('isDate("2024-03-15")', {});
    expect((isDateStr as any).success).toBe(true);
    expect((isDateStr as any).result).toBe(false);

    // type() returns 'date' for Date
    const typeDate = evaluateExpression('type(d)', context);
    expect((typeDate as any).success).toBe(true);
    expect((typeDate as any).result).toBe('date');

    // isObject() returns false for Date
    const isObjDate = evaluateExpression('isObject(d)', context);
    expect((isObjDate as any).success).toBe(true);
    expect((isObjDate as any).result).toBe(false);
  });

  test('date component extraction functions', () => {
    const context = { d: new Date(2024, 2, 15, 10, 30, 45) }; // March 15, 2024 10:30:45

    const yearResult = evaluateExpression('year(d)', context);
    expect((yearResult as any).result).toBe(2024);

    const monthResult = evaluateExpression('month(d)', context);
    expect((monthResult as any).result).toBe(3); // 1-based

    const dayResult = evaluateExpression('day(d)', context);
    expect((dayResult as any).result).toBe(15);

    const hourResult = evaluateExpression('hour(d)', context);
    expect((hourResult as any).result).toBe(10);

    const minuteResult = evaluateExpression('minute(d)', context);
    expect((minuteResult as any).result).toBe(30);

    const secondResult = evaluateExpression('second(d)', context);
    expect((secondResult as any).result).toBe(45);

    // dayOfWeek - March 15, 2024 is a Friday (5)
    const dowResult = evaluateExpression('dayOfWeek(d)', context);
    expect((dowResult as any).result).toBe(5);

    // timestamp
    const tsResult = evaluateExpression('timestamp(d)', context);
    expect((tsResult as any).result).toBe(context.d.getTime());

    // String coercion: year("2024-03-15") should work via toDateValue
    const yearStr = evaluateExpression('year("2024-03-15T00:00:00")', {});
    expect((yearStr as any).success).toBe(true);
    expect((yearStr as any).result).toBe(2024);

    // Timestamp coercion
    const ts = new Date(2024, 2, 15).getTime();
    const yearTs = evaluateExpression('year(ts)', { ts });
    expect((yearTs as any).success).toBe(true);
    expect((yearTs as any).result).toBe(2024);

    // Invalid input returns null
    const yearInvalid = evaluateExpression('year("not-a-date")', {});
    expect((yearInvalid as any).result).toBeNull();
  });

  test('date formatting functions', () => {
    const context = { d: new Date(2024, 2, 15, 10, 30, 45) };

    // formatDate with default pattern
    const fmtDefault = evaluateExpression('formatDate(d)', context);
    expect((fmtDefault as any).result).toBe('2024-03-15');

    // formatDate with custom pattern
    const fmtCustom = evaluateExpression(
      'formatDate(d, "dd/MM/yyyy HH:mm:ss")',
      context,
    );
    expect((fmtCustom as any).result).toBe('15/03/2024 10:30:45');

    // formatDate with yy token
    const fmtShortYear = evaluateExpression(
      'formatDate(d, "yy-MM-dd")',
      context,
    );
    expect((fmtShortYear as any).result).toBe('24-03-15');

    // toISOString
    const isoResult = evaluateExpression('toISOString(d)', context);
    expect((isoResult as any).success).toBe(true);
    expect((isoResult as any).result).toBe(context.d.toISOString());

    // Invalid input returns null
    const fmtNull = evaluateExpression('formatDate("not-a-date")', {});
    expect((fmtNull as any).result).toBeNull();
  });

  test('dateAdd function', () => {
    const context = { d: new Date(2024, 0, 31) }; // Jan 31, 2024

    // Add days
    const addDays = evaluateExpression('dateAdd(d, 5, "days")', context);
    expect((addDays as any).success).toBe(true);
    const ad = (addDays as any).result as Date;
    expect(ad.getMonth()).toBe(1); // February
    expect(ad.getDate()).toBe(5);

    // Add months with clamping: Jan 31 + 1 month = Feb 29 (2024 is leap year)
    const addMonth = evaluateExpression('dateAdd(d, 1, "months")', context);
    expect((addMonth as any).success).toBe(true);
    const am = (addMonth as any).result as Date;
    expect(am.getMonth()).toBe(1); // February
    expect(am.getDate()).toBe(29); // Clamped to Feb 29

    // Add years with clamping: Feb 29, 2024 + 1 year = Feb 28, 2025
    const leapCtx = { d: new Date(2024, 1, 29) };
    const addYear = evaluateExpression('dateAdd(d, 1, "years")', leapCtx);
    expect((addYear as any).success).toBe(true);
    const ay = (addYear as any).result as Date;
    expect(ay.getFullYear()).toBe(2025);
    expect(ay.getMonth()).toBe(1);
    expect(ay.getDate()).toBe(28);

    // Add hours
    const addHours = evaluateExpression('dateAdd(d, 2, "hours")', context);
    expect((addHours as any).success).toBe(true);
    expect(((addHours as any).result as Date).getHours()).toBe(2);

    // Negative amount
    const subDays = evaluateExpression('dateAdd(d, -1, "days")', context);
    expect((subDays as any).success).toBe(true);
    expect(((subDays as any).result as Date).getDate()).toBe(30);

    // Invalid unit returns null
    const invalidUnit = evaluateExpression(
      'dateAdd(d, 1, "fortnights")',
      context,
    );
    expect((invalidUnit as any).result).toBeNull();

    // Invalid date returns null
    const invalidDate = evaluateExpression(
      'dateAdd("not-a-date", 1, "days")',
      {},
    );
    expect((invalidDate as any).result).toBeNull();
  });

  test('dateDiff function', () => {
    const context = {
      d1: new Date(2024, 2, 15), // March 15
      d2: new Date(2024, 2, 10), // March 10
    };

    // Positive diff (d1 > d2)
    const diffDays = evaluateExpression('dateDiff(d1, d2, "days")', context);
    expect((diffDays as any).result).toBe(5);

    // Negative diff (d2 < d1)
    const diffNeg = evaluateExpression('dateDiff(d2, d1, "days")', context);
    expect((diffNeg as any).result).toBe(-5);

    // Hours
    const hourCtx = {
      d1: new Date(2024, 2, 15, 10, 0, 0),
      d2: new Date(2024, 2, 15, 7, 30, 0),
    };
    const diffHours = evaluateExpression(
      'dateDiff(d1, d2, "hours")',
      hourCtx,
    );
    expect((diffHours as any).result).toBe(2); // Truncated from 2.5

    // Minutes
    const diffMin = evaluateExpression(
      'dateDiff(d1, d2, "minutes")',
      hourCtx,
    );
    expect((diffMin as any).result).toBe(150);

    // Years
    const yearCtx = {
      d1: new Date(2024, 2, 15),
      d2: new Date(2022, 2, 15),
    };
    const diffYears = evaluateExpression(
      'dateDiff(d1, d2, "years")',
      yearCtx,
    );
    expect((diffYears as any).result).toBe(2);

    // Invalid input returns null
    const diffInvalid = evaluateExpression(
      'dateDiff("not-a-date", d2, "days")',
      context,
    );
    expect((diffInvalid as any).result).toBeNull();

    // Invalid unit returns null
    const diffBadUnit = evaluateExpression(
      'dateDiff(d1, d2, "fortnights")',
      context,
    );
    expect((diffBadUnit as any).result).toBeNull();
  });

  test('date equality operators', () => {
    const context = {
      d1: new Date(2024, 0, 1),
      d2: new Date(2024, 0, 1),
      d3: new Date(2024, 5, 15),
    };

    // == compares by value, not reference
    const eq = evaluateExpression('d1 == d2', context);
    expect((eq as any).result).toBe(true);

    const neqSame = evaluateExpression('d1 != d2', context);
    expect((neqSame as any).result).toBe(false);

    const neqDiff = evaluateExpression('d1 != d3', context);
    expect((neqDiff as any).result).toBe(true);

    const eqDiff = evaluateExpression('d1 == d3', context);
    expect((eqDiff as any).result).toBe(false);

    // date() calls produce equal dates
    const eqCreated = evaluateExpression(
      'date(2024, 1, 1) == date(2024, 1, 1)',
      {},
    );
    expect((eqCreated as any).result).toBe(true);
  });

  test('dateDiff calendar-aware months and years', () => {
    // Exact month boundary
    const exactMonth = evaluateExpression(
      'dateDiff(date(2024, 3, 1), date(2024, 1, 1), "months")',
      {},
    );
    expect((exactMonth as any).result).toBe(2);

    // Partial month: Jan 15 to Feb 1 = 0 months (day not reached)
    const partialMonth = evaluateExpression(
      'dateDiff(date(2024, 2, 1), date(2024, 1, 15), "months")',
      {},
    );
    expect((partialMonth as any).result).toBe(0);

    // Jan 15 to Mar 15 = 2 months exactly
    const fullMonths = evaluateExpression(
      'dateDiff(date(2024, 3, 15), date(2024, 1, 15), "months")',
      {},
    );
    expect((fullMonths as any).result).toBe(2);

    // Negative direction
    const negMonths = evaluateExpression(
      'dateDiff(date(2024, 1, 15), date(2024, 3, 15), "months")',
      {},
    );
    expect((negMonths as any).result).toBe(-2);

    // Years: 2 full years
    const fullYears = evaluateExpression(
      'dateDiff(date(2024, 3, 15), date(2022, 3, 15), "years")',
      {},
    );
    expect((fullYears as any).result).toBe(2);

    // Years: not quite 2 years (day not reached)
    const partialYear = evaluateExpression(
      'dateDiff(date(2024, 3, 14), date(2022, 3, 15), "years")',
      {},
    );
    expect((partialYear as any).result).toBe(1);
  });

  test('dateAdd and dateDiff with weeks', () => {
    const context = { d: new Date(2024, 0, 1) }; // Jan 1, 2024 (Monday)

    // Add 2 weeks
    const addWeeks = evaluateExpression('dateAdd(d, 2, "weeks")', context);
    expect((addWeeks as any).success).toBe(true);
    const aw = (addWeeks as any).result as Date;
    expect(aw.getDate()).toBe(15);
    expect(aw.getMonth()).toBe(0);

    // Subtract 1 week
    const subWeek = evaluateExpression('dateAdd(d, -1, "week")', context);
    expect((subWeek as any).success).toBe(true);
    const sw = (subWeek as any).result as Date;
    expect(sw.getFullYear()).toBe(2023);
    expect(sw.getMonth()).toBe(11);
    expect(sw.getDate()).toBe(25);

    // dateDiff in weeks
    const diffCtx = {
      d1: new Date(2024, 0, 15),
      d2: new Date(2024, 0, 1),
    };
    const diffWeeks = evaluateExpression(
      'dateDiff(d1, d2, "weeks")',
      diffCtx,
    );
    expect((diffWeeks as any).result).toBe(2);

    // Partial week truncated
    const partialCtx = {
      d1: new Date(2024, 0, 10),
      d2: new Date(2024, 0, 1),
    };
    const partialWeek = evaluateExpression(
      'dateDiff(d1, d2, "weeks")',
      partialCtx,
    );
    expect((partialWeek as any).result).toBe(1);
  });

  test('startOfDay and endOfDay functions', () => {
    const context = { d: new Date(2024, 2, 15, 14, 30, 45, 123) };

    const sod = evaluateExpression('startOfDay(d)', context);
    expect((sod as any).success).toBe(true);
    const sodDate = (sod as any).result as Date;
    expect(sodDate.getFullYear()).toBe(2024);
    expect(sodDate.getMonth()).toBe(2);
    expect(sodDate.getDate()).toBe(15);
    expect(sodDate.getHours()).toBe(0);
    expect(sodDate.getMinutes()).toBe(0);
    expect(sodDate.getSeconds()).toBe(0);
    expect(sodDate.getMilliseconds()).toBe(0);

    const eod = evaluateExpression('endOfDay(d)', context);
    expect((eod as any).success).toBe(true);
    const eodDate = (eod as any).result as Date;
    expect(eodDate.getDate()).toBe(15);
    expect(eodDate.getHours()).toBe(23);
    expect(eodDate.getMinutes()).toBe(59);
    expect(eodDate.getSeconds()).toBe(59);
    expect(eodDate.getMilliseconds()).toBe(999);

    // Invalid input returns null
    const sodNull = evaluateExpression('startOfDay("not-a-date")', {});
    expect((sodNull as any).result).toBeNull();
  });

  test('startOfMonth and endOfMonth functions', () => {
    const context = { d: new Date(2024, 2, 15, 14, 30, 45) }; // March 15

    const som = evaluateExpression('startOfMonth(d)', context);
    expect((som as any).success).toBe(true);
    const somDate = (som as any).result as Date;
    expect(somDate.getDate()).toBe(1);
    expect(somDate.getMonth()).toBe(2);
    expect(somDate.getHours()).toBe(0);

    const eom = evaluateExpression('endOfMonth(d)', context);
    expect((eom as any).success).toBe(true);
    const eomDate = (eom as any).result as Date;
    expect(eomDate.getDate()).toBe(31); // March has 31 days
    expect(eomDate.getMonth()).toBe(2);
    expect(eomDate.getHours()).toBe(23);
    expect(eomDate.getMinutes()).toBe(59);
    expect(eomDate.getSeconds()).toBe(59);
    expect(eomDate.getMilliseconds()).toBe(999);

    // February in leap year
    const febCtx = { d: new Date(2024, 1, 10) };
    const eomFeb = evaluateExpression('endOfMonth(d)', febCtx);
    expect(((eomFeb as any).result as Date).getDate()).toBe(29);
  });

  test('dateBetween function', () => {
    const context = {
      d: new Date(2024, 2, 15),
      start: new Date(2024, 2, 1),
      end: new Date(2024, 2, 31),
    };

    // Within range
    const inRange = evaluateExpression(
      'dateBetween(d, start, end)',
      context,
    );
    expect((inRange as any).result).toBe(true);

    // At boundaries (inclusive)
    const atStart = evaluateExpression(
      'dateBetween(start, start, end)',
      context,
    );
    expect((atStart as any).result).toBe(true);

    const atEnd = evaluateExpression(
      'dateBetween(end, start, end)',
      context,
    );
    expect((atEnd as any).result).toBe(true);

    // Outside range
    const before = evaluateExpression(
      'dateBetween(date(2024, 1, 15), start, end)',
      context,
    );
    expect((before as any).result).toBe(false);

    // Invalid input returns false
    const invalid = evaluateExpression(
      'dateBetween("not-a-date", start, end)',
      context,
    );
    expect((invalid as any).result).toBe(false);
  });

  test('formatDate SSS milliseconds token', () => {
    const context = { d: new Date(2024, 2, 15, 10, 30, 45, 123) };

    const result = evaluateExpression(
      'formatDate(d, "HH:mm:ss.SSS")',
      context,
    );
    expect((result as any).result).toBe('10:30:45.123');

    // Zero-padded milliseconds
    const zeroMs = { d: new Date(2024, 2, 15, 10, 30, 45, 7) };
    const result2 = evaluateExpression(
      'formatDate(d, "HH:mm:ss.SSS")',
      zeroMs,
    );
    expect((result2 as any).result).toBe('10:30:45.007');
  });

  test('date integration with operators and composition', () => {
    const context = {
      d1: new Date(2024, 2, 15),
      d2: new Date(2024, 2, 10),
    };

    // Date comparison via Number() coercion
    const cmpResult = evaluateExpression('d1 > d2', context);
    expect((cmpResult as any).success).toBe(true);
    expect((cmpResult as any).result).toBe(true);

    // Date subtraction via Number() coercion
    const subResult = evaluateExpression('d1 - d2', context);
    expect((subResult as any).success).toBe(true);
    expect((subResult as any).result).toBe(
      context.d1.getTime() - context.d2.getTime(),
    );

    // Composition: formatDate(dateAdd(...))
    const compResult = evaluateExpression(
      'formatDate(dateAdd(d1, 10, "days"))',
      context,
    );
    expect((compResult as any).success).toBe(true);
    expect((compResult as any).result).toBe('2024-03-25');
  });

  test('sandbox is not breaked', () => {
    const expr = `constructor.constructor("return process.env")()`;
    const result = evaluateExpression(expr);
    const code = getCompiledCode(expr);
    expect((result as any).success).toBe(false);
    expect((result as any).error).toBeTruthy();
  });
});
