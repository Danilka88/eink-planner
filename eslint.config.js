/* ESLint: только статический анализ, никакой сборки.
   Браузерные глобальные — для приложения и service worker,
   node:test — для тестов. */

import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "design/**", ".code-gate/**"]
  },
  js.configs.recommended,
  {
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: globals.browser
    },
    rules: {
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
      "no-var": "error",
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
      "no-shadow": "error",
      "no-implicit-globals": "error"
    }
  },
  {
    files: ["sw.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "script",
      globals: globals.serviceworker
    },
    rules: {
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }]
    }
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: globals.node
    }
  }
];
