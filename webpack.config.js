const path = require("path");
const { BytenodeWebpackPlugin } = require("@herberttn/bytenode-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const pkg = require("./package.json");

module.exports = {
    entry: {
        main: "./src/index.js",
    },
    mode: "production",
    output: {
        clean: true,
        path: path.resolve("out"),
        filename: "[name].js",
    },
    plugins: [
        new BytenodeWebpackPlugin(),
        new ZipPlugin({
            path: path.resolve("dist"),
            filename: `${pkg.version}.zip`,
        }),
    ],
    target: "node",
    externals: [nodeExternals()],
};
