import { type Config } from "prettier";

const config: Config = {
  trailingComma: "none",
  printWidth: 120,
  tabWidth: 4,
  useTabs: false,
  semi: true,
  singleQuote: true,
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "crlf",
};

// eslint-disable-next-line import/no-default-export
export default config;
