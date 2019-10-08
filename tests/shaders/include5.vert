#version 460

#extension GL_GOOGLE_include_directive : enable

#include "ambiguous.glsl"
#include "include/ambiguous.glsl"

vec3 veryNiceColor() {
  return amgiuousColorFile() + amgiuousColorDirectory() + vec3(0.25);
}

void main() {
  gl_Position = vec4(veryNiceColor(), 1.0);
}
