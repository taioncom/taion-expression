import globals from 'globals';
import typescriptEslint from 'typescript-eslint';
import eslintPluginESLintComments from '@eslint-community/eslint-plugin-eslint-comments';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/**', 'build/**', 'coverage/**'],
  },
  // Apply TypeScript configuration
  ...typescriptEslint.configs.recommended,
  // Base configuration for all TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptEslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        BigInt: true,
        console: true,
        WebAssembly: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint.plugin,
      'eslint-comments': eslintPluginESLintComments,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // ESLint comments plugin rules
      'eslint-comments/disable-enable-pair': [
        'error',
        { allowWholeFile: true },
      ],
      'eslint-comments/no-unused-disable': 'error',

      // General ESLint rules
      'sort-imports': [
        'error',
        {
          ignoreDeclarationSort: true,
          ignoreCase: true,
        },
      ],
    },
  },
  // Apply Prettier configuration
  prettierConfig,
];
