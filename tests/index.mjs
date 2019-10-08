import fs from "fs";
import essentials from "../index.js";
const {GLSL} = essentials;

const vertexSrc = fs.readFileSync(`./tests/shaders/basic.vert`);
const fragmentSrc = fs.readFileSync(`./tests/shaders/basic.frag`);
const computeSrc = fs.readFileSync(`./tests/shaders/basic.comp`);
const rayGenSrc = fs.readFileSync(`./tests/shaders/basic.rgen`);
const rayCHitSrc = fs.readFileSync(`./tests/shaders/basic.rchit`);

const include0 = fs.readFileSync(`./tests/shaders/include0.rchit`);
const include1 = fs.readFileSync(`./tests/shaders/include1.vert`);
const include2 = fs.readFileSync(`./tests/shaders/include2.vert`);
const include3 = fs.readFileSync(`./tests/shaders/include3.vert`);
const include4 = fs.readFileSync(`./tests/shaders/include4.vert`);
const include5 = fs.readFileSync(`./tests/shaders/include5.vert`);

let errors = [];

function error(error, desc) {
  console.error(error);
  errors.push({ error, desc });
};

{
  try {
    GLSL.version();
  } catch (e) {
    error(e, "GLSL.version failed!");
  }
}

{
  let output = null;
  try {
    output = GLSL.toSPIRVSync({ source: vertexSrc, extension: `vert` });
    if (output.error) throw output.error;
  } catch (e) {
    error(e, "GLSL.toSPIRVSync with 'Vertex shader' failed!");
  }
}

{
  let output = null;
  try {
    output = GLSL.toSPIRVSync({ source: computeSrc, extension: `comp` });
    if (output.error) throw output.error;
  } catch (e) {
    error(e, "GLSL.toSPIRVSync with 'Compute shader' failed!");
  }
}

{
  let output = null;
  try {
    output = GLSL.toSPIRVSync({ source: fragmentSrc, extension: `frag` });
    if (output.error) throw output.error;
  } catch (e) {
    error(e, "GLSL.toSPIRVSync with 'Fragment shader' failed!");
  }
}

{
  let output = null;
  try {
    output = GLSL.toSPIRVSync({ source: rayGenSrc, extension: `rgen` });
    if (output.error) throw output.error;
  } catch (e) {
    error(e, "GLSL.toSPIRVSync with 'Ray-Generation shader' failed!");
  }
}

{
  let output = null;
  try {
    output = GLSL.toSPIRVSync({ source: rayCHitSrc, extension: `rchit` });
    if (output.error) throw output.error;
  } catch (e) {
    error(e, "GLSL.toSPIRVSync with 'Ray-Closest-Hit shader' failed!");
  }
}

{
  let output = null;
  let includeDirectories = [
    "./tests/shaders"
  ];
  try {
    output = GLSL.toSPIRVSync({ source: include0, extension: `rchit`, includeDirectories });
    if (output.error) throw output.error;
  } catch (e) {
    error(e, "GLSL.toSPIRVSync with 'Basic include' failed!");
  }
}

{
  let output = null;
  let includeDirectories = [
    "./tests/shaders"
  ];
  try {
    output = GLSL.toSPIRVSync({ source: include1, extension: `vert`, includeDirectories });
    if (output.error) throw output.error;
  } catch (e) {
    error(e, "GLSL.toSPIRVSync with 'Recursive include' failed!");
  }
}

{
  let output = null;
  let includeDirectories = [
    "./tests/shaders"
  ];
  try {
    output = GLSL.toSPIRVSync({ source: include2, extension: `vert`, includeDirectories });
    if (output.error) throw output.error;
  } catch (e) {
    error(e, "GLSL.toSPIRVSync with 'Folder include' failed!");
  }
}

{
  let output = null;
  let includeDirectories = [
    "./tests/shaders/include"
  ];
  try {
    output = GLSL.toSPIRVSync({ source: include3, extension: `vert`, includeDirectories });
    if (output.error) throw output.error;
  } catch (e) {
    error(e, "GLSL.toSPIRVSync with 'Direct folder include' failed!");
  }
}

{
  let output = null;
  let includeDirectories = [
    "./tests/shaders"
  ];
  try {
    output = GLSL.toSPIRVSync({ source: include4, extension: `vert`, includeDirectories });
    if (output.error) throw output.error;
  } catch (e) {
    error(e, "GLSL.toSPIRVSync with 'Complex include' failed!");
  }
}

{
  let output = null;
  let includeDirectories = [
    "./tests/shaders"
  ];
  try {
    output = GLSL.toSPIRVSync({ source: include5, extension: `vert`, includeDirectories });
    if (!output.error) throw output.error;
  } catch (e) {
    error(e, "GLSL.toSPIRVSync with 'Ambiguous include' failed!");
  }
}

if (errors.length) {
  console.error(`Tests failed! ${errors.length} errors`);
} else {
  console.log(`All tests passed!`);
}
