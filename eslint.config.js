// eslint.config.js (Flat config for ESLint v9)
import js from "@eslint/js";
import globals from "globals";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Ignore built artifacts and deps
  { ignores: ["dist/**", "node_modules/**"] },

  // Base JS config for Node ESM
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "prefer-const": "error",
      "eqeqeq": ["error", "smart"]
    }
  }
];

