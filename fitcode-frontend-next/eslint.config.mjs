import pluginJs from "@eslint/js";
import importPlugin from 'eslint-plugin-import';
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  importPlugin.flatConfigs.recommended,
  {
    rules: {
      'import/order': ["error", {
        groups: [
          "builtin",
          ["sibling", "parent"],
          "index",
          "object",
        ],
      }],
    }
  }
];