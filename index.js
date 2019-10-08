const path = require("path");

module.exports = {
  GLSL: require(path.join(__dirname, `/bin/wasm/index`))
};
