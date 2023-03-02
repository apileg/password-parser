const path = require("path");

module.exports = /** @type { import('webpack').Configuration } */ ({
  context: __dirname,
  entry: "./src/password_parser.ts",

  mode: "production",
  target: "node",

  output: {
    filename: "password_parser.js",
    path: path.resolve(__dirname, "out"),
  },

  resolve: {
    extensions: [".ts", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
      },
    ],
  },
});
