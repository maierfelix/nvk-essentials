const fs = require("fs");
const path = require("path");
const glslang = require("./glslang.js")();

process.removeAllListeners("uncaughtException");

function findIncludedFile(filePath, includes) {
  let matches = [];
  for (let ii = 0; ii < includes.length; ++ii) {
    let incl = includes[ii];
    let stats = fs.lstatSync(incl);
    if (!stats.isDirectory()) {
      throw new SyntaxError(`Include path '${incl}' is not a directory`);
    }
    let includeFilePath = path.join(incl, filePath);
    if (fs.existsSync(includeFilePath) && fs.lstatSync(includeFilePath).isFile()) {
      try {
        matches.push(fs.readFileSync(includeFilePath, "utf-8"));
      } catch (e) {
        throw new ReferenceError(`Cannot read included file from '${includeFilePath}'`);
      }
    } else {
      throw new ReferenceError(`Failed to resolve file include path for '${filePath}': '${includeFilePath}' is not a valid file path`);
    }
  };
  if (matches.length <= 0) {
    throw new ReferenceError(`Cannot inline included file '${filePath}'`);
  }
  if (matches.length > 1) {
    throw new ReferenceError(`Ambigious include directive for '${filePath}'. More than one match was found`);
  }
  return matches[0];
};

function flattenShaderIncludes(source, includeDirectories) {
  let rx = /#include ((<[^>]+>)|("[^"]+"))/g;
  let match = null;
  while (match = rx.exec(source)) {
    let filePath = match[1].slice(1, -1);
    let start = match.index;
    let length = match[0].length;
    let includedFile = flattenShaderIncludes(
      findIncludedFile(filePath, includeDirectories),
      includeDirectories
    );
    source = source.substr(0, start) + includedFile + source.substr(start + length);
  };
  return source;
};

function version() {
  return glslang.getVersion();
};

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
  // if necessary, convert intput source buffer to string 
  if (source instanceof Buffer) source = source.toString();
  // process #include
  source = flattenShaderIncludes(source, opts.includeDirectories || []);
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
