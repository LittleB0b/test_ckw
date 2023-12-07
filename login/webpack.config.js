const dotenv = require('dotenv');
const path = require('path');
const { DefinePlugin } = require('webpack');

/**
 * Récupère le chemin du fichier .env en fonction de l'environment
 * @param {string} env L'environment dans lequel le CIRD va s'executer
 * @returns
 */
function getEnvFilePath(env) {
    if (['production', 'prod'].includes(env.toLowerCase())) {
        return path.join(__dirname, '.env.prod');
    } else if (['preproduction', 'preprod', 'qa'].includes(env.toLowerCase())) {
        return path.join(__dirname, '.env.preprod');
    } else {
        return path.join(__dirname, '.env.dev');
    }
}

//
const NODE_ENV = process.env.NODE_ENV || 'dev';

const { parsed } = dotenv.config({ path: getEnvFilePath(NODE_ENV) });

module.exports = {
    output: {
        filename: 'cird.js',
        path: path.resolve(__dirname, '../web/dist/cird/v2'),
    },

    plugins: [
        // Il faut ajouter chaque variable du fichier env ici.
        // On ne peut pas directement mettre "parsed" dans le JSON.stringify
        // sinon on se retrouve avec l'intégralité du fichier env dans le code compilé
        // par webpack
        new DefinePlugin({
            'ENV_FILE': JSON.stringify({
                RECAPTCHA_V3_PUBLIC_KEY: parsed.RECAPTCHA_V3_PUBLIC_KEY
            })
        })
    ],

    module: {
        rules: [{
            test: /\.js$/,
            use: {
                loader: "babel-loader"
            },
        }, {
            test: /\.hbs$/,
            loader: "handlebars-loader",
            options: {
                knownHelpers: ['trans', 'svg', 'envFile'],
                precompileOptions: {
                    knownHelpersOnly: true
                }
            }
        }, {
            test: /\.scss$/,
            use: [
                // Creates `style` nodes from JS strings
                'style-loader',
                // Translates CSS into CommonJS
                'css-loader',
                'postcss-loader',
                // Compiles Sass to CSS
                'sass-loader',
            ],
        }, {
            test: /\.(svg)$/i,
            loader: 'raw-loader'
        }]
    }
};
