module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "plugin:prettier/recommended"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": [
      "error",
      {
        "endOfLine": "auto"
      }
    ],
    "react/react-in-jsx-scope": "off"
  },
  ignorePatterns: [".next", "node_modules"]
};
