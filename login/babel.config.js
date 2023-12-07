
module.exports = {
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "esmodules": true
      },
      "useBuiltIns": "entry",
      "corejs": 2
    }]
  ],
  "plugins": ["@babel/plugin-proposal-class-properties"]
};
