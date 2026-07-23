import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Non-production files
    "test-*.js",
    "check-id.ts",
    "prisma/**",
    "scripts/**",
  ]),
  // Production-appropriate rule overrides
  {
    rules: {
      // Downgrade to warn — fixing 650+ `any` usages is a separate refactor
      "@typescript-eslint/no-explicit-any": "warn",
      // Standard unused-var handling: allow underscore-prefixed args
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "prefer-const": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
    },
  },
]);

export default eslintConfig;
