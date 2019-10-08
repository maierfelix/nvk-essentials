const glslang = require("./glslang.js")();

process.removeAllListeners("uncaughtException");

function version() {
  return glslang.getVersion();
}

function toSPIRVSync(opts) {
  if (typeof opts !== "object") {
    throw new TypeError(`Expected Object for 'opts' argument`);
  }
  let {source, extension} = opts;
  if (typeof source !== "string" && !(source instanceof Buffer)) {
    throw new TypeError(`Expected String or Buffer for 'source' member`);
  }
  if (typeof extension !== "string" && typeof extension !== "number") {
    throw new TypeError(`Expected String or Number for 'extension' member`);
  }
  if (source instanceof Buffer) {
    source = source.toString();
  }
  let out = {
    output: null,
    error: null
  };
  try {
    let compiled = glslang.compileGLSL(source, extension);
    out.output = new Uint8Array(compiled.buffer, compiled.byteOffset);
  } catch (e) {
    out.error = e;
  }
  return out;
};

module.exports = {
  version,
  toSPIRV: function(opts) {
    return new Promise(resolve => {
      resolve(toSPIRVSync(opts));
    });
  },
  toSPIRVSync: function(opts) {
    return toSPIRVSync(opts);
  }
};
