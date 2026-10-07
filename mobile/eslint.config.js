// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    rules: {
      // AGENTS.md → Код бичих дүрэм
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'error',
    },
  },
]);
