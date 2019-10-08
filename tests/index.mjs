import fs from "fs";
import essentials from "../index.js";
const {GLSL} = essentials;

const vertexSrc = fs.readFileSync(`./tests/shaders/basic.vert`);
const fragmentSrc = fs.readFileSync(`./tests/shaders/basic.frag`);
const computeSrc = fs.readFileSync(`./tests/shaders/basic.comp`);
const rayGenSrc = fs.readFileSync(`./tests/shaders/basic.rgen`);
const rayCHitSrc = fs.readFileSync(`./tests/shaders/basic.rchit`);

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

if (errors.length) {
  console.error(`Tests failed! ${errors.length} errors`);
} else {
  console.log(`All tests passed!`);
}
