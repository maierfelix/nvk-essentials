import fs from "fs";
import { GLSL } from "../index";

const vertexSrc = fs.readFileSync(`./tests/shaders/basic.vert`);
const fragmentSrc = fs.readFileSync(`./tests/shaders/basic.frag`);

let errors = [];

function error(error, desc) {
  console.error(error);
  errors.push({ error, desc });
};

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
    output = GLSL.toSPIRVSync({ source: fragmentSrc, extension: `frag` });
    if (output.error) throw output.error;
  } catch (e) {
    error(e, "GLSL.toSPIRVSync with 'Fragment shader' failed!");
  }
}

if (errors.length) {
  console.error(`Tests failed! ${errors.length} errors`);
} else {
  console.log(`All tests passed!`);
}
