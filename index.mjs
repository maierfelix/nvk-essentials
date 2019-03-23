import fs from "fs";
import path from "path";
import { spawn, execSync } from "child_process";

const platform = process.platform;
const __dirname = path.dirname(new URL(import.meta.url).pathname).substr(1);

let glslangPath = `${__dirname}/bin/${platform}/bin`;
if (platform === `linux` || platform === `darwin`) {
  glslangPath = "/" + glslangPath;
  fs.chmodSync(glslangPath, 755);
}

let version = execSync(`${glslangPath} -v`).toString();

function isValidExtension(ext) {
  switch (ext) {
    case "vert":
    case "tesc":
    case "tese":
    case "geom":
    case "frag":
    case "comp":
    case "mesh":
    case "task":
    case "rgen":
    case "rint":
    case "rahit":
    case "rchit":
    case "rmiss":
    case "rcall":
    case "glsl":
    case "hlsl":
      return true;
  };
  return false;
};

function reserve({ source, extension }, workDir) {
  fs.mkdirSync(`${workDir}`, { recursive: true });
  fs.writeFileSync(`${workDir}/input.${extension}`, source);
};
 
function free(paths) {
  paths.map(p => {
    if (!fs.existsSync(p)) return;
    if (path.extname(p)) fs.unlinkSync(p);
    else fs.rmdirSync(p);
  });
};
 
function toSPIRV({ source, extension }) {
  let ext = (
    platform === `win32`  ? `.exe` :
    platform === `linux`  ? `` :
    platform === `darwin` ? `` :
    ``
  );
  let uid = Date.now();
  let workDir = `${__dirname}/uid-${uid}`;
  let inputPath = `${workDir}/input.${extension}`;
  let outputPath = `${workDir}/output.${extension}.spv`;
  let cmd = `${glslangPath} -V ${inputPath} -o ${outputPath} -s`;
  return new Promise(resolve => {
    if (!extension) {
      let msg = `Error: No extension provided!`;
      process.stderr.write(`${msg}\n`);
      resolve({ error: msg });
      return;
    }
    if (!isValidExtension(extension)) {
      let msg = `Error: Invalid extension ${extension}`;
      process.stderr.write(`${msg}\n`);
      resolve({ error: msg });
      return;
    }
    reserve({ source, extension }, workDir);
    let shell = spawn(cmd, { shell: true, stdio: "inherit" }, { stdio: "pipe" });
    shell.on("exit", error => {
      let output = !error ? new Uint8Array(fs.readFileSync(outputPath, null)) : null;
      free([inputPath, outputPath, workDir]);
      resolve({ error: error || null, output });
    });
  });
};
 
function toSPIRVSync({ source, extension }) {
  let ext = (
    platform === `win32`  ? `.exe` :
    platform === `linux`  ? `` :
    platform === `darwin` ? `` :
    ``
  );
  let uid = Date.now();
  let workDir = `${__dirname}/uid-${uid}`;
  let inputPath = `${workDir}/input.${extension}`;
  let outputPath = `${workDir}/output.${extension}.spv`;
  let cmd = `${glslangPath} -V ${inputPath} -o ${outputPath} -s`;
  if (!extension) {
    let msg = `Error: No extension provided!`;
    return ({ error: msg });
  }
  if (!isValidExtension(extension)) {
    let msg = `Error: Invalid extension ${extension}`;
    return ({ error: msg });
  }
  reserve({ source, extension }, workDir);
  let error = null;
  try {
    execSync(cmd).toString();
  }
  catch (e) {
    error = e;
  }
  let output = !error ? new Uint8Array(fs.readFileSync(outputPath, null)) : null;
  free([inputPath, outputPath, workDir]);
  return ({ error: error || null, output });
};
 
const GLSL = {
  version,
  toSPIRV,
  toSPIRVSync
};
 
export {
  GLSL
};