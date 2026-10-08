import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // `examples/*` are standalone npm projects outside the root tsconfig, so typed
  // linting cannot parse them; the tool configs are outside it for the same reason.
  globalIgnores(['dist', 'coverage', 'examples', '*.config.ts']),
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // This file itself is plain JavaScript that no tsconfig includes.
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
