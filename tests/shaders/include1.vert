#version 460

#extension GL_GOOGLE_include_directive : enable

#include "include1_0.glsl"

vec3 veryNiceColor() {
  return niceColor() + vec3(0.25);
}

void main() {
  gl_Position = vec4(veryNiceColor(), 1.0);
}
