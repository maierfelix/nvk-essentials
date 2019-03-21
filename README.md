# nvk-essentials

This package contains tools to aid development with [nvk](https://github.com/maierfelix/nvk)

## Interface:

### GLSL:

Contains pre-built binaries of `glslangValidator`.

Examples:
````js
import { GLSL } from "nvk-essentials";
`````

#### GLSL.*version*

Returns a string of the equivalent `glslangValidator -v`

Examples:

````js
let {version} = GLSL;
````

#### GLSL.*toSPIRV*

Returns the binary SPIR-V representation of the passed in GLSL source. This function expects an Object as it's first parameter in the following format:

````js
{
  source: <Buffer>,
  extension: <String>
}
````

Available extensions are:
* `vert` for a vertex shader
* `tesc` for a tessellation control shader
* `tese` for a tessellation evaluation shader
* `geom` for a geometry shader
* `frag` for a fragment shader
* `comp` for a compute shader

Examples:

````js
let {output, error} = await GLSL.toSPIRV({
  source: fs.readFileSync(`./shaders/object.vert`),
  extension: `vert`
});
````

#### GLSL.*toSPIRVSync*

Synchronous variant of `GLSL.toSPIRV` with an equal function signature.

Examples:

````js
let {output, error} = GLSL.toSPIRVSync({
  source: fs.readFileSync(`./shaders/object.frag`),
  extension: `frag`
});
````
