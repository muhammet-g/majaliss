const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

// محاولة قراءة من .env محلياً، وإلا استخدام متغيرات البيئة النظام (Netlify)
require('dotenv').config();

module.exports = {
    entry: './src/js/app.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        // استخدام DefinePlugin لنقل متغيرات البيئة إلى الـ bundle
        // يدعم كل من ملفات .env والمتغيرات من النظام (Netlify)
        new webpack.DefinePlugin({
            'process.env.SUPABASE_URL': JSON.stringify(
                process.env.SUPABASE_URL || ''
            ),
            'process.env.SUPABASE_ANON_KEY': JSON.stringify(
                process.env.SUPABASE_ANON_KEY || ''
            ),
        }),
    ],
    devServer: {
        static: './dist',
        historyApiFallback: true,
    },
};
