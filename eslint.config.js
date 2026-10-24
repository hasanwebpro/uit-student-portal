import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['client/dist/**', 'node_modules/**', 'client/node_modules/**', 'recon/**', 'audit-out/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { ...globals.node } },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    files: ['client/**/*.{js,jsx}'],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // React Compiler-era rule: the "reset local state when props change" effects in a few pages are intentional and keep the
      // original portal's behaviour; rewriting them with keys would risk visual regressions. Revisit during the UI refactor.
      'react-hooks/set-state-in-effect': 'off', 'react/jsx-uses-vars': 'error', 'react/jsx-uses-react': 'off', 'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^(_|React$)', caughtErrors: 'none' }] },
  },
  { files: ['client/public/sw.js'], languageOptions: { globals: { ...globals.serviceworker } } },
  { files: ['tools/audit/ui-audit.mjs', 'tools/scrape/**'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
];
