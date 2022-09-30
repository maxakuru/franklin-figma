// const path = require('path');

module.exports = {
  root: true,
  extends: [
    '../../.eslintrc.js',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    'no-plusplus': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-param-reassign': 'off',
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
    },
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
};
