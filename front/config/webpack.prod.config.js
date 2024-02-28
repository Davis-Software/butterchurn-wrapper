const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: "production",
    entry: "./src",

    plugins: [
        new HtmlWebpackPlugin({
            publicPath: "/static/js/bundle",
            scriptLoading: "blocking",
            template: __dirname + "/../../../../templates/pages/index.template.html",
            filename: __dirname + "/../../../../templates/pages/index.html",
            inject: false,
            minify: true
        })
    ],

    output: {
        path: __dirname + "/../../bundle",
        filename: "[name].bundle.js",
        chunkFilename: "[id].chunk.js",
        clean: true
    },

    resolve: {
        extensions: [".js", ".ts", ".tsx"]
    },

    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: "babel-loader",
                exclude: /node_modules$/
            }
        ]
    }
}