import { type Config } from "prettier";

export const config: Config = {
  trailingComma: "none",
  printWidth: 120,
  tabWidth: 4,
  useTabs: false,
  semi: true,
  singleQuote: true,
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
  ignorePath: ".prettierignore",
};
