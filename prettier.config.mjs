/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
export default {
  trailingComma: "none",
  tabWidth: 4,
  semi: true,
  singleQuote: false,
  printWidth: 120,
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  importOrder: ["^(.*).css$", "^@components(.*)$", "^@(.*)$", "^[./]", "<THIRD_PARTY_MODULES>"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
