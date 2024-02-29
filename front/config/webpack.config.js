const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: "development",
    watch: true,

    entry: "./src",

    plugins: [
        new HtmlWebpackPlugin({
            publicPath: "../bundle",
            scriptLoading: "blocking",
            template: __dirname + "/../../templates/index.template.html",
            filename: __dirname + "/../../templates/index.html",
            inject: false,
            minify: false
        })
    ],

    output: {
        path: __dirname + "/../../bundle",
        filename: "[name].bundle.js",
        chunkFilename: "[id].chunk.js",
        clean: true
    },

    resolve: {
        extensions: [".js"]
    },

    module: {
        rules: [
            {
                test: /\.(js)$/,
                loader: "babel-loader",
                exclude: /node_modules$/
            }
        ]
    },

    devtool: "source-map"
}