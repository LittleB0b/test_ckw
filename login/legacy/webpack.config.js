const path = require('path');

module.exports = {
    output: {
        filename: 'login.js',
        path: path.resolve(__dirname, '../../web/js'),
    },

    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env"]
                }
            }
        }]
    }
};
