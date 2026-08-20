/** @type {import("stylelint").Config} */
export default {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-html/astro",
    "stylelint-prettier/recommended",
  ],
  rules: {
    "property-no-vendor-prefix": null,
    "selector-class-pattern": "(?:[a-z][a-z0-9]*)(?:-[a-z0-9]+)*(?:--[a-z0-9]+)*",
    "no-descending-specificity": null,
  },
  ignoreFiles: [
    "dist/**",
    "build/**",
    ".astro/**",
    "netlify/**",
    "node_modules/**",
  ],
};