import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.config({
    ignorePatterns: [
      '**/dist/**',
      '**/node_modules/**',
      'src/app/model-testing/**',
    ],
    extends: ['next'],
    settings: {
      next: {
        rootDir: 'fitcode-frontend-next',
      },
    },
  }),
];

export default eslintConfig;
