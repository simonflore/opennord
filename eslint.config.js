// Lean ESLint config — the project's quality gate is `tsc` (see CLAUDE.md), so
// this does NOT pull in full rulesets. Its one job is to enforce the design-token
// rule: no hardcoded hex colors inside JSX style props. Use var(--token) instead.
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.generated.ts', 'dist/**'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Hooks correctness — valuable as the app grows; exhaustive-deps is a warning
      // (won't fail CI) so it surfaces issues without blocking.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='style'] Literal[value=/#[0-9a-fA-F]{3,8}/]",
          message: 'Hardcoded hex in a style prop — use a var(--token) from tokens.css.',
        },
      ],
    },
  },
);
