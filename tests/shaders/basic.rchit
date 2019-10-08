#version 460
#extension GL_NV_ray_tracing : require
#extension GL_EXT_nonuniform_qualifier : enable
#extension GL_GOOGLE_include_directive : enable

#extension GL_EXT_control_flow_attributes : require

#pragma optionNV(fastmath on)
#pragma optionNV(ifcvt none)
#pragma optionNV(inline all)
#pragma optionNV(strict on)
#pragma optionNV(unroll all)

#define PI       3.14159265
#define HALF_PI  0.5 * PI

vec2 blerp(vec2 b, vec2 p1, vec2 p2, vec2 p3) {
  return (1.0 - b.x - b.y) * p1 + b.x * p2 + b.y * p3;
}

vec3 blerp(vec2 b, vec3 p1, vec3 p2, vec3 p3) {
  return (1.0 - b.x - b.y) * p1 + b.x * p2 + b.y * p3;
}

float schlick(const float NoR, const float IOR) {
  float r0 = (1.0 - IOR) / (1.0 + IOR);
  r0 = r0 * r0;
  return r0 + (1.0 - r0) * pow(1.0 - NoR, 5.0);
}

// rand functions taken from neo java lib and
// https://github.com/nvpro-samples/optix_advanced_samples/blob/master/src/optixIntroduction/optixIntro_07/shaders/random_number_generators.h

const uint LCG_A = 1664525u;
const uint LCG_C = 1013904223u;
const int MAX_RAND = 0x7fff;
const int IEEE_ONE = 0x3f800000;
const int IEEE_MASK = 0x007fffff;

uint tea(uint val0, uint val1) {
  uint v0 = val0;
  uint v1 = val1;
  uint s0 = 0;
  for (uint n = 0; n < 16; n++) {
    s0 += 0x9e3779b9;
    v0 += ((v1<<4)+0xa341316c)^(v1+s0)^((v1>>5)+0xc8013ea4);
    v1 += ((v0<<4)+0xad90777d)^(v0+s0)^((v0>>5)+0x7e95761e);
  }
  return v0;
}

uint rand(inout uint seed) { // random integer in the range [0, MAX_RAND]
  seed = 69069 * seed + 1;
  return ((seed = 69069 * seed + 1) & MAX_RAND);
}

float randf01(inout uint seed) { // random number in the range [0.0f, 1.0f]
  seed = (LCG_A * seed + LCG_C);
  return float(seed & 0x00FFFFFF) / float(0x01000000u);
}

float randf11(inout uint seed) { // random number in the range [-1.0f, 1.0f]
  uint i = 0;
  seed = LCG_A * seed + LCG_C;
  i = IEEE_ONE | (((rand(seed)) & IEEE_MASK) >> 9);
  return uintBitsToFloat(i) - 1.0;
}

vec2 randInUnitDisk(inout uint seed) {
  vec2 p = vec2(0);
  do {
    p = 2 * vec2(randf01(seed), randf01(seed)) - 1;
  } while (dot(p, p) >= 1);
  return p;
}

vec3 randInUnitSphere(inout uint seed) {
  vec3 p = vec3(0);
  do {
    p = 2 * vec3(randf01(seed), randf01(seed), randf01(seed)) - 1;
  } while (dot(p, p) >= 1);
  return p;
}

// source: internetz
vec3 hash32(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * vec3(443.8975,397.2973, 491.1871));
  p3 += dot(p3, p3.yxz + 19.19);
  return fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
}

vec3 ditherRGB(vec3 c, vec2 seed){
  return c + hash32(seed) / 255.0;
}

const uint EMISSIVE = 0;
const uint METALLIC = 1;
const uint DIELECTRIC = 2;
const uint LAMBERTIAN = 3;

struct RayPayload {
  vec4 colorAndDistance;
  vec4 scatterDirection;
  uint seed;
};

struct Vertex {
  vec4 normal;
  vec4 tangent;
  vec2 uv;
  vec2 pad_0;
};

struct Material {
  vec3 color;
  uint materialModel;
  float IOR;
  uint textureIndex;
  vec2 pad0;
};

struct InstanceOffset {
  uint geometry;
  uint material;
  uint instance;
  uint pad_0;
};

layout(location = 0) rayPayloadInNV RayPayload Ray;

layout(binding = 0, set = 0) uniform accelerationStructureNV topLevelAS;

layout(binding = 4, set = 0, std430) readonly buffer GeometryBuffer {
  Vertex GeometryAttributes[];
} GeometryAttributesArray[];

layout(binding = 5, set = 0, std430) readonly buffer FacesBuffer {
  uvec4 Faces[];
} FaceArray[];

layout(binding = 6, set = 0, std430) readonly buffer MaterialBuffer {
  Material material;
} MaterialArray[];

layout(binding = 7, set = 0, std430) readonly buffer InstanceOffsetBuffer {
  InstanceOffset offset;
} InstanceOffsetArray[];

layout (binding = 8, set = 0) uniform sampler2DArray textureArray;

hitAttributeNV vec2 attribs;

void main() {

  const InstanceOffset instanceOffset = InstanceOffsetArray[nonuniformEXT((gl_InstanceCustomIndexNV >> 0) & 0xFFFFFF)].offset;

  const uint geometryId = instanceOffset.geometry;
  const uint materialId = instanceOffset.material;

  const uvec4 face = FaceArray[nonuniformEXT(geometryId)].Faces[gl_PrimitiveID];

  const Vertex v0 = GeometryAttributesArray[nonuniformEXT(geometryId)].GeometryAttributes[int(face.x)];
  const Vertex v1 = GeometryAttributesArray[nonuniformEXT(geometryId)].GeometryAttributes[int(face.y)];
  const Vertex v2 = GeometryAttributesArray[nonuniformEXT(geometryId)].GeometryAttributes[int(face.z)];

  const vec2 u0 = v0.uv.xy, u1 = v1.uv.xy, u2 = v2.uv.xy;
  const vec3 n0 = v0.normal.xyz, n1 = v1.normal.xyz, n2 = v2.normal.xyz;
  const vec3 t0 = v0.tangent.xyz, t1 = v1.tangent.xyz, t2 = v2.tangent.xyz;

  const Material material = MaterialArray[materialId].material;

  const vec2 uv = blerp(attribs, u0.xy, u1.xy, u2.xy);
  vec3 normal = blerp(attribs, n0.xyz, n1.xyz, n2.xyz);
  const vec3 tangent = blerp(attribs, t0.xyz, t1.xyz, t2.xyz);

  const vec3 normalWorld = normalize(gl_ObjectToWorldNV * vec4(normal, 0));
  const vec3 tangentWorld = normalize(gl_ObjectToWorldNV * vec4(tangent, 0));
  const vec3 bitangentWorld = cross(normalWorld, tangentWorld);
  const mat3 TBN = mat3(
    tangentWorld,
    bitangentWorld,
    normalWorld
  );

  const uint materialModel = material.materialModel;
  const float IOR = material.IOR;
  const uint textureIndex = material.textureIndex;

  vec3 normalTexture = texture(textureArray, vec3(uv, textureIndex + 1)).rgb * 2.0 - 1.0;
  normal = (TBN * normalTexture).xyz;

  const vec3 color = (
    textureIndex > 0 ? texture(textureArray, vec3(uv, textureIndex)).rgb : vec3(0)
  ) + material.color;

  const float NoR = dot(gl_WorldRayDirectionNV, normal);

  uint seed = Ray.seed;
  switch (materialModel) {
    case EMISSIVE:
      Ray = RayPayload(
        vec4(color, gl_HitTNV),
        vec4(1, 0, 0, 0),
        seed
      );
    break;
    case METALLIC:
      const vec3 reflected = reflect(gl_WorldRayDirectionNV, normal);
      const bool isScattered = dot(reflected, normal) > 0.0;
      Ray = RayPayload(
        isScattered ? vec4(color, gl_HitTNV) : vec4(0, 0, 0, -1),
        vec4(reflected + IOR * randInUnitSphere(seed), float(isScattered)),
        seed
      );
    break;
    case DIELECTRIC:
      const bool outside = NoR > 0;
      const vec3 outer = outside ? -normal : normal;
      const vec3 refracted = refract(gl_WorldRayDirectionNV, outer, outside ? IOR : 1 / IOR);
      const float reflectProb = refracted != vec3(0) ? schlick(outside ? NoR * IOR : -NoR, IOR) : 1.0;
      if (randf01(seed) < reflectProb) {
        Ray = RayPayload(vec4(color, gl_HitTNV), vec4(reflect(gl_WorldRayDirectionNV, normal), 1), seed);
      } else {
        Ray = RayPayload(vec4(color, gl_HitTNV), vec4(refracted, 1), seed);
      }
    break;
    case LAMBERTIAN:
      const vec4 scatter = vec4(normal + randInUnitSphere(seed), float(NoR < 0));
      Ray = RayPayload(vec4(color, gl_HitTNV), scatter, seed);
    break;
  };

}
