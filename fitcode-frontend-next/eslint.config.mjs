import { FlatCompat } from '@eslint/eslintrc';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import globals from 'globals';

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
    settings: { next: { rootDir: 'fitcode-frontend-next' } },
  }),

  // typescript-eslint
  {
    files: ['**/*.ts?(x)'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser },
    },
  },

  // next & import-resolver-typescript
  {
    settings: {
      next: { rootDir: 'fitcode-frontend-next' },
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json'],
        },
      },
    },

    rules: {
      '@next/next/no-html-link-for-pages': ['error', ['.']],
    },
  },

  {
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
      import: importPlugin,
      'simple-import-sort': simpleImportSortPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // React
      'react-hooks/exhaustive-deps': 'off',

      // Prettier
      'prettier/prettier': ['warn'],

      // General JS
      eqeqeq: 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // TypeScript
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'off',

      // Import sorting
      'import/order': 'off',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [['^@?\\w'], ['^@src(/.*)?$'], ['^\\u0000']],
        },
      ],
      'simple-import-sort/exports': 'error',

      // Restrict relative deep imports
      'no-restricted-imports': [
        'error',
        {
          patterns: ['../../*'],
        },
      ],
    },
  },

  // prettier
  eslintConfigPrettier,

  // global ignores
  {
    ignores: [
      '**/node_modules/',
      '**/.git/',
      '**/.next/',
      '**/dist/',
      '**/.turbo',
      'src/app/model-testing/**',
      'src/components/mediapipe-react-app/**',
    ],
  },
];

export default eslintConfig;
