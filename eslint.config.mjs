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
    "src/generated/**",
    ".cloudflare/**",
  ]),
  {
    files: [
      "src/components/landing/**/*.{ts,tsx}",
      "src/app/page.tsx",
      "src/app/valorar/**/*.{ts,tsx}",
      "src/app/lista-de-espera/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='br']",
          message:
            "Do not force line breaks in titles or subtitles. Let text wrap with text-wrap: pretty/balance. See docs/DESIGN-TOKENS.md.",
        },
      ],
    },
  },
]);

export default eslintConfig;
