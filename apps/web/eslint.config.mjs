/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: ["node_modules", ".next", "out", "dist"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Minimal baseline; we can tighten later if you like.
      "no-unused-vars": "warn",
      "no-undef": "error",
    },
  },
];
