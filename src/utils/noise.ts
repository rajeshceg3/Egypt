
// Port of Ashima/webgl-noise Simplex 2D from Terrain.tsx
// Used for CPU-side height collision detection

// GLSL Math Helpers
function mod(x: number, y: number): number {
  return x - y * Math.floor(x / y)
}

function floor(x: number): number {
  return Math.floor(x)
}

function dot2(a: [number, number], b: [number, number]): number {
  return a[0] * b[0] + a[1] * b[1]
}

function dot3(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

// Vec3 Helpers
type Vec3 = [number, number, number]
type Vec4 = [number, number, number, number]

function add3(a: Vec3, b: Vec3): Vec3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]] }
function sub3(a: Vec3, b: Vec3): Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]] }
function mul3(a: Vec3, b: Vec3): Vec3 { return [a[0] * b[0], a[1] * b[1], a[2] * b[2]] }
function mul3s(a: Vec3, s: number): Vec3 { return [a[0] * s, a[1] * s, a[2] * s] }
function mod3(a: Vec3, s: number): Vec3 { return [mod(a[0], s), mod(a[1], s), mod(a[2], s)] }
function floor3(a: Vec3): Vec3 { return [floor(a[0]), floor(a[1]), floor(a[2])] }
function max3(a: Vec3, b: number): Vec3 { return [Math.max(a[0], b), Math.max(a[1], b), Math.max(a[2], b)] }

// Simplex 2D noise
// vec3 permute_terrain(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
function permute(x: Vec3): Vec3 {
  // ((x*34.0)+1.0)*x
  const t1 = add3(mul3s(x, 34.0), [1.0, 1.0, 1.0])
  const t2 = mul3(t1, x)
  return mod3(t2, 289.0)
}

export function snoise(v: [number, number]): number {
  const C: Vec4 = [0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439]

  // vec2 i  = floor(v + dot(v, C.yy) );
  const dotVCyy = dot2(v, [C[1], C[1]])
  const i: [number, number] = [floor(v[0] + dotVCyy), floor(v[1] + dotVCyy)]

  // vec2 x0 = v -   i + dot(i, C.xx);
  const dotICxx = dot2(i, [C[0], C[0]])
  const x0: [number, number] = [v[0] - i[0] + dotICxx, v[1] - i[1] + dotICxx]

  // vec2 i1;
  // i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  const i1: [number, number] = (x0[0] > x0[1]) ? [1.0, 0.0] : [0.0, 1.0]

  // vec4 x12 = x0.xyxy + C.xxzz;
  // x12.xy -= i1;
  // C.xxzz is [C[0], C[0], C[2], C[2]]
  // x0.xyxy is [x0[0], x0[1], x0[0], x0[1]]
  let x12: Vec4 = [x0[0] + C[0], x0[1] + C[0], x0[0] + C[2], x0[1] + C[2]]
  x12 = [x12[0] - i1[0], x12[1] - i1[1], x12[2], x12[3]]

  // i = mod(i, 289.0);
  const iMod: [number, number] = [mod(i[0], 289.0), mod(i[1], 289.0)]

  // vec3 p = permute_terrain( permute_terrain( i.y + vec3(0.0, i1.y, 1.0 ))
  // + i.x + vec3(0.0, i1.x, 1.0 ));
  const term1Input: Vec3 = [iMod[1] + 0.0, iMod[1] + i1[1], iMod[1] + 1.0]
  const p1 = permute(term1Input)

  const term2Input: Vec3 = [p1[0] + iMod[0] + 0.0, p1[1] + iMod[0] + i1[0], p1[2] + iMod[0] + 1.0]
  const p = permute(term2Input)

  // vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  const dotx0x0 = dot2(x0, x0)
  const dotx12xy = x12[0]*x12[0] + x12[1]*x12[1]
  const dotx12zw = x12[2]*x12[2] + x12[3]*x12[3]

  let m: Vec3 = [0.5 - dotx0x0, 0.5 - dotx12xy, 0.5 - dotx12zw]
  m = max3(m, 0.0)

  // m = m*m ;
  m = mul3(m, m)
  // m = m*m ;
  m = mul3(m, m)

  // vec3 x = 2.0 * fract(p * C.www) - 1.0;
  // C.www is [C[3], C[3], C[3]]
  // p * C.www
  const pCwww = mul3s(p, C[3])
  const fractPCwww: Vec3 = [pCwww[0] - floor(pCwww[0]), pCwww[1] - floor(pCwww[1]), pCwww[2] - floor(pCwww[2])]
  const x: Vec3 = sub3(mul3s(fractPCwww, 2.0), [1.0, 1.0, 1.0])

  // vec3 h = abs(x) - 0.5;
  const h: Vec3 = [Math.abs(x[0]) - 0.5, Math.abs(x[1]) - 0.5, Math.abs(x[2]) - 0.5]

  // vec3 ox = floor(x + 0.5);
  const ox: Vec3 = floor3(add3(x, [0.5, 0.5, 0.5]))

  // vec3 a0 = x - ox;
  const a0: Vec3 = sub3(x, ox)

  // m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  // a0*a0 + h*h
  const a0a0hh: Vec3 = [
    a0[0]*a0[0] + h[0]*h[0],
    a0[1]*a0[1] + h[1]*h[1],
    a0[2]*a0[2] + h[2]*h[2]
  ]
  const factor: Vec3 = sub3([1.79284291400159, 1.79284291400159, 1.79284291400159], mul3s(a0a0hh, 0.85373472095314))
  m = mul3(m, factor)

  // vec3 g;
  // g.x  = a0.x  * x0.x  + h.x  * x0.y;
  // g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  const gx = a0[0] * x0[0] + h[0] * x0[1]
  const gy = a0[1] * x12[0] + h[1] * x12[1] // a0.y * x12.x + h.y * x12.y
  const gz = a0[2] * x12[2] + h[2] * x12[3] // a0.z * x12.z + h.z * x12.w

  const g: Vec3 = [gx, gy, gz]

  // return 130.0 * dot(m, g);
  return 130.0 * dot3(m, g)
}

// FBM for Organic Dunes
// float fbm_terrain(vec2 x)
export function fbm(x: [number, number]): number {
  let v = 0.0
  let a = 0.5
  const shift: [number, number] = [100.0, 100.0]

  // mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
  const c = Math.cos(0.5)
  const s = Math.sin(0.5)
  // mat2 in GLSL is column-major: [col1, col2] -> [[c, -s], [s, c]]
  // But usually written mat2(a,b,c,d) is [a,b] [c,d] columns
  // Here: mat2(cos, sin, -sin, cos) -> col1=[cos, sin], col2=[-sin, cos]
  // Vector multiply M * v = v.x * col1 + v.y * col2
  // x' = x*c + y*-s
  // y' = x*s + y*c

  let p: [number, number] = [x[0], x[1]]

  for (let i = 0; i < 5; ++i) { // 5 Octaves
      v += a * snoise(p)

      // x = rot * x * 2.0 + shift;
      const nx = (p[0] * c + p[1] * -s) * 2.0 + shift[0]
      const ny = (p[0] * s + p[1] * c) * 2.0 + shift[1]
      p = [nx, ny]

      a *= 0.5
  }
  return v
}

// Calculate Terrain Height at World Position
export function getTerrainHeight(worldX: number, worldZ: number): number {
  // Mesh is rotated [-Math.PI / 2, 0, 0] and at position [0, -2, 0]
  // World Space -> Object Space Mapping:
  // World X = Object X
  // World Y = Object Z - 2 (since pos y is -2)
  // World Z = -Object Y

  // So Object X = World X
  // Object Y = -World Z

  const objX = worldX
  const objY = -worldZ

  const pos: [number, number] = [objX, objY]

  // 1. Large rolling dunes (Low frequency)
  // float largeDunes = snoise_terrain(position.xy * 0.005) * 3.0;
  const largeDunes = snoise([pos[0] * 0.005, pos[1] * 0.005]) * 3.0

  // 2. Medium details (FBM)
  // float details = fbm_terrain(position.xy * 0.02) * 1.0;
  const details = fbm([pos[0] * 0.02, pos[1] * 0.02]) * 1.0

  // Combine
  const elevation = largeDunes + details

  // Apply to Z (Up in World due to rotation)
  // Base Y is -2
  return -2 + elevation
}
