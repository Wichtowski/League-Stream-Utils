import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from "eslint-plugin-import";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      import: importPlugin
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "import/no-default-export": "error"
    }
  },
  {
    // Allow default exports for Next.js pages and config files
    files: [
      "**/pages/**/*.{js,jsx,ts,tsx}",
      "**/app/**/page.{js,jsx,ts,tsx}",
      "**/app/**/layout.{js,jsx,ts,tsx}",
      "**/app/**/loading.{js,jsx,ts,tsx}",
      "**/app/**/not-found.{js,jsx,ts,tsx}",
      "**/app/**/error.{js,jsx,ts,tsx}",
      "**/app/**/global-error.{js,jsx,ts,tsx}",
      "**/app/**/route.{js,ts}",
      "next.config.{js,mjs,ts}",
      "tailwind.config.{js,ts}",
      "postcss.config.{js,mjs}",
      "eslint.config.{js,mjs}"
    ],
    rules: {
      "import/no-default-export": "off"
    }
  }
];

export default eslintConfig;
