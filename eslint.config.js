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
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      '**/*.generated.ts', 'dist/**',
      // RE area — allowed to import RE; the boundary only binds product code.
      'src/lib/contribute/**', 'src/components/contribute/**', 'src/dev/**',
      'src/routes/contribute.tsx', 'src/routes/dev.tsx', 'src/router-re.tsx',
      // RE tool components (rendered only by RE routes).
      'src/components/DecodeInspector.tsx',
      'src/components/decode/**',
      'src/components/dev/**',
      // Pre-existing cross-boundary import: MatrixView + ByteMapView use lib/contribute/coverage
      // to show decode-status badges and body-coverage maps. TODO: move coverage metadata to lib/clavia/.
      'src/components/compatibility/MatrixView.tsx',
      'src/components/compatibility/ByteMapView.tsx',
      // Test files may import RE modules directly.
      'src/**/*.test.ts', 'src/**/*.test.tsx',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: [
            '**/lib/contribute/*', '**/lib/contribute/**',
            '**/components/contribute/*', '**/components/contribute/**',
            '**/dev/*', '**/dev/**', '**/routes/contribute', '**/routes/dev',
            '@/lib/contribute/*', '@/components/contribute/*', '@/dev/*',
            '@/routes/contribute', '@/routes/dev',
          ],
          message: 'Product code must not import the RE area (lib/contribute, components/contribute, dev, /contribute, /dev). RE ships only in the web build.',
        }],
      }],
    },
  },
);
