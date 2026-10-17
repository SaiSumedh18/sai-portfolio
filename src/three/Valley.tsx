import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import Mark from '../Mark'
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, DoubleSide,
  ExtrudeGeometry, Float32BufferAttribute, Object3D, PlaneGeometry, SRGBColorSpace, Shape, Vector3,
  type Group, type InstancedMesh, type Points,
} from 'three'

/* ---------- shared helpers ---------- */

// Small deterministic random so the scene looks the same on every visit.
function random(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  draw(canvas.getContext('2d')!)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

const glowTexture = (inner = 'rgba(255,240,200,1)', mid = 'rgba(255,220,150,.55)', outer = 'rgba(255,200,120,0)') => canvasTexture(128, 128, ctx => {
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, inner); g.addColorStop(0.25, mid); g.addColorStop(1, outer)
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128)
})

const skyTexture = (night: boolean) => canvasTexture(4, 512, ctx => {
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  if (night) { g.addColorStop(0, '#070b1c'); g.addColorStop(0.45, '#111a3a'); g.addColorStop(0.75, '#26315e'); g.addColorStop(1, '#3d3f72') }
  else { g.addColorStop(0, '#2f7fd6'); g.addColorStop(0.35, '#5aa6ea'); g.addColorStop(0.65, '#9fd0f5'); g.addColorStop(0.85, '#d3ecfb'); g.addColorStop(1, '#eef8ff') }
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 512)
})

export type PlaceId = 'incois' | 'vnr' | 'ncstate' | 'me'

// A grid of windows, some lit, for the distant skyline.
const windowTexture = (columns: number, rows: number, seed: number) => canvasTexture(columns * 16, rows * 20, ctx => {
  const r = random(seed)
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, columns * 16, rows * 20)
  for (let c = 0; c < columns; c++) for (let w = 0; w < rows; w++) {
    if (r() < 0.55) { ctx.fillStyle = r() < 0.8 ? '#ffd27a' : '#ffe9b8'; ctx.fillRect(c * 16 + 4, w * 20 + 4, 8, 12) }
  }
})

// One row of windows on a transparent strip: long glass ribbons, or separate punched windows.
// White where there's glass, so the material decides the colour (blue glass by day, lamplight at night).
const windowStrip = (columns: number, ribbon: boolean) => canvasTexture(columns * 32, 32, ctx => {
  ctx.fillStyle = '#fff'
  for (let c = 0; c < columns; c++) {
    if (ribbon) ctx.fillRect(c * 32 + 1, 4, 30, 24)
    else ctx.fillRect(c * 32 + 9, 3, 14, 26)
  }
})

// Some windows lit and some dark at night, so a building doesn't glow like a lamp.
const litStrip = (columns: number, ribbon: boolean, seed: number) => canvasTexture(columns * 32, 32, ctx => {
  const r = random(seed)
  for (let c = 0; c < columns; c++) {
    if (r() > 0.6) continue
    ctx.fillStyle = r() < 0.75 ? '#ffd27a' : '#fff0c8'
    if (ribbon) ctx.fillRect(c * 32 + 1, 4, 30, 24)
    else ctx.fillRect(c * 32 + 9, 3, 14, 26)
  }
})

function Windows({ columns, ribbon, seed, night, width, height, glass = '#2d4a68' }: { columns: number; ribbon: boolean; seed: number; night: boolean; width: number; height: number; glass?: string }) {
  const map = useMemo(() => windowStrip(columns, ribbon), [columns, ribbon])
  const lit = useMemo(() => litStrip(columns, ribbon, seed), [columns, ribbon, seed])
  return <mesh>
    <planeGeometry args={[width, height]}/>
    <meshStandardMaterial alphaMap={map} transparent alphaTest={0.5} color={night ? '#1c2033' : glass} roughness={0.25} metalness={0.3}
      emissive="#ffffff" emissiveMap={lit} emissiveIntensity={night ? 1.4 : 0}/>
  </mesh>
}

/* ---------- day and night palettes ---------- */

type Palette = {
  low: string; high: string; mountain: string; near: string; shore: string; sea: string; road: string; dash: string
  trunk: string; crowns: string[]; skyline: string; fog: [color: string, near: number, far: number]
}

const palette: Record<'day' | 'night', Palette> = {
  day: {
    low: '#7cbb5c', high: '#b5cf7c', mountain: '#8fa58a', near: '#5e9c48', shore: '#e6d6a0',
    sea: '#3a9ad8', road: '#a3a3a8', dash: '#ffffff', trunk: '#7a5236', crowns: ['#3f8f4f', '#56a35a', '#2f7a45'],
    skyline: '#c7d1de', fog: ['#cfe7f7', 34, 100],
  },
  night: {
    low: '#46508a', high: '#8a78ad', mountain: '#8a78ad', near: '#2c3360', shore: '#7a6b98',
    sea: '#8c84bd', road: '#cdb594', dash: '#fff4dc', trunk: '#4a3346', crowns: ['#3f6a86', '#355c7a', '#4d7c8e'],
    skyline: '#6a6596', fog: ['#1b2246', 18, 72],
  },
}

/* ---------- the landscape ---------- */

const roadPoints = [new Vector3(-0.6, 0, 15), new Vector3(1.6, 0, 10), new Vector3(-0.2, 0, 5.5), new Vector3(1.4, 0, 1.5), new Vector3(2.1, 0, -2.4), new Vector3(2.4, 0, -4.4)]
const road = new CatmullRomCurve3(roadPoints)
const roadSamples = road.getSpacedPoints(160)

const landmarks = {
  incois: new Vector3(6.9, 0, -8.6),
  tower: new Vector3(2.5, 0, -5.4),
  college: new Vector3(-0.9, 0, -1.9),
}

function distanceToRoad(x: number, z: number) {
  let best = Infinity
  for (const p of roadSamples) best = Math.min(best, (p.x - x) ** 2 + (p.z - z) ** 2)
  return Math.sqrt(best)
}

// The INCOIS campus stands on a headland that reaches into the sea.
const onHeadland = (x: number, z: number) => Math.hypot((x - landmarks.incois.x) * 0.8, z - landmarks.incois.z) < 2.9
const isSea = (x: number, z: number) => x > 4.2 + Math.sin(z * 0.6) * 0.6 && z < -3 && !onHeadland(x, z)

// Rolling hills, rising into mountains in the distance, flattened where things stand.
function height(x: number, z: number) {
  let h = 0.55 * Math.sin(x * 0.33 + 1) * Math.cos(z * 0.28) + 0.3 * Math.sin(x * 0.9 + z * 0.55) + 0.15 * Math.cos(x * 1.7 - z * 1.3)
  if (z < -11) h += (-(z + 11)) * 0.32 * (0.55 + 0.45 * Math.sin(x * 0.22 + 0.7))
  h = Math.max(h, -0.2)
  const flatten = (cx: number, cz: number, radius: number) => {
    const d = Math.hypot(x - cx, z - cz)
    if (d < radius) h *= d / radius
  }
  flatten(landmarks.tower.x, landmarks.tower.z, 1.8)
  flatten(landmarks.college.x, landmarks.college.z, 3.4)
  const roadDistance = distanceToRoad(x, z)
  if (roadDistance < 1.6) h = h * (roadDistance / 1.6) * 0.6
  if (onHeadland(x, z)) {
    const d = Math.hypot((x - landmarks.incois.x) * 0.8, z - landmarks.incois.z)
    h = d < 2.2 ? 0.05 : 0.05 + (d - 2.2) / 0.7 * (Math.min(h, 0.3) - 0.05)
  }
  if (isSea(x, z)) h = Math.min(h, -0.7)
  return h
}

function Terrain({ colors: p }: { colors: Palette }) {
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(90, 70, 110, 90).toNonIndexed()
    plane.rotateX(-Math.PI / 2)
    plane.translate(0, 0, -20)
    const position = plane.getAttribute('position') as BufferAttribute
    for (let i = 0; i < position.count; i++) position.setY(i, height(position.getX(i), position.getZ(i)))
    // Colour each triangle by its height and distance: darker up close, paler in the hills.
    const colors: number[] = []
    const low = new Color(p.low), high = new Color(p.high), mountain = new Color(p.mountain), near = new Color(p.near), shore = new Color(p.shore)
    for (let i = 0; i < position.count; i += 3) {
      const y = (position.getY(i) + position.getY(i + 1) + position.getY(i + 2)) / 3
      const z = (position.getZ(i) + position.getZ(i + 1) + position.getZ(i + 2)) / 3
      const c = low.clone().lerp(high, Math.min(1, Math.max(0, (y + 0.2) / 2.5)))
      if (y > 2.5) c.lerp(mountain, Math.min(1, (y - 2.5) / 4))
      if (z > 4) c.lerp(near, Math.min(1, (z - 4) / 8))
      if (y < -0.3) c.copy(shore)
      c.offsetHSL(0, 0, ((i * 7) % 5) * 0.006)
      for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b)
    }
    plane.setAttribute('color', new Float32BufferAttribute(colors, 3))
    plane.computeVertexNormals()
    return plane
  }, [p])
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors flatShading roughness={1}/></mesh>
}

function Sea({ reduceMotion, color }: { reduceMotion: boolean; color: string }) {
  const geometry = useMemo(() => new PlaneGeometry(60, 50, 60, 50), [])
  const base = useMemo(() => Float32Array.from(geometry.getAttribute('position').array), [geometry])
  useFrame(({ clock }) => {
    if (reduceMotion) return
    const position = geometry.getAttribute('position') as BufferAttribute
    const t = clock.elapsedTime
    for (let i = 0; i < position.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1]
      position.setZ(i, Math.sin(x * 0.8 + t * 0.9) * 0.05 + Math.cos(y * 0.6 + t * 0.7) * 0.05)
    }
    position.needsUpdate = true
    geometry.computeVertexNormals()
  })
  return <mesh geometry={geometry} rotation-x={-Math.PI / 2} position={[30, -0.35, -26]} receiveShadow>
    <meshStandardMaterial color={color} roughness={0.2} metalness={0.25} flatShading/>
  </mesh>
}

function Road({ colors: p }: { colors: Palette }) {
  const { surface, dashes } = useMemo(() => {
    const build = (width: number, lift: number, every = 1, skip = 0) => {
      const vertices: number[] = []
      for (let i = 0; i < roadSamples.length - 1; i += every) {
        if (skip && Math.floor(i / every) % 2 === 1) continue
        const a = roadSamples[i], b = roadSamples[Math.min(i + every, roadSamples.length - 1)]
        const dir = new Vector3().subVectors(b, a).normalize()
        const side = new Vector3(-dir.z, 0, dir.x).multiplyScalar(width / 2)
        const ya = height(a.x, a.z) + lift, yb = height(b.x, b.z) + lift
        const q = [a.x + side.x, ya, a.z + side.z, a.x - side.x, ya, a.z - side.z, b.x + side.x, yb, b.z + side.z, b.x - side.x, yb, b.z - side.z]
        vertices.push(...q.slice(0, 3), ...q.slice(3, 6), ...q.slice(6, 9), ...q.slice(3, 6), ...q.slice(9, 12), ...q.slice(6, 9))
      }
      const geometry = new BufferGeometry()
      geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
      geometry.computeVertexNormals()
      return geometry
    }
    return { surface: build(1.05, 0.04), dashes: build(0.07, 0.06, 2, 1) }
  }, [])
  return <group>
    <mesh geometry={surface} receiveShadow><meshStandardMaterial color={p.road} roughness={0.9} side={DoubleSide}/></mesh>
    <mesh geometry={dashes}><meshBasicMaterial color={p.dash} side={DoubleSide}/></mesh>
  </group>
}

function Trees({ colors: p }: { colors: Palette }) {
  const trunks = useRef<InstancedMesh>(null)
  const crowns = useRef<InstancedMesh>(null)
  const spots = useMemo(() => {
    const r = random(7)
    const list: { x: number; z: number; s: number }[] = []
    while (list.length < 70) {
      const x = -14 + r() * 26, z = -15 + r() * 26
      if (distanceToRoad(x, z) < 1.4 || isSea(x, z) || x > 3.6 && z < -2) continue
      if (Math.hypot(x - landmarks.tower.x, z - landmarks.tower.z) < 1.8 || Math.hypot(x - landmarks.college.x, z - landmarks.college.z) < 3.6) continue
      if (z > 4 && Math.abs(x) < 7) continue
      if (Math.hypot(x - landmarks.college.x, z - landmarks.college.z) < 4.6 && z > landmarks.college.z) continue
      list.push({ x, z, s: 0.45 + r() * 0.5 })
    }
    return list
  }, [])
  useLayoutEffect(() => {
    const dummy = new Object3D()
    spots.forEach(({ x, z, s }, i) => {
      const y = height(x, z)
      dummy.position.set(x, y + 0.25 * s, z); dummy.scale.set(s, s, s); dummy.rotation.set(0, i, 0); dummy.updateMatrix()
      trunks.current?.setMatrixAt(i, dummy.matrix)
      dummy.position.set(x, y + 0.85 * s, z); dummy.updateMatrix()
      crowns.current?.setMatrixAt(i, dummy.matrix)
      crowns.current?.setColorAt(i, new Color(p.crowns[i % 3]))
    })
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true
    if (crowns.current) { crowns.current.instanceMatrix.needsUpdate = true; if (crowns.current.instanceColor) crowns.current.instanceColor.needsUpdate = true }
  }, [spots, p])
  return <group>
    <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]} castShadow><cylinderGeometry args={[0.06, 0.09, 0.5, 5]}/><meshStandardMaterial color={p.trunk} flatShading/></instancedMesh>
    <instancedMesh ref={crowns} args={[undefined, undefined, spots.length]} castShadow><icosahedronGeometry args={[0.55, 0]}/><meshStandardMaterial flatShading roughness={0.9}/></instancedMesh>
  </group>
}

/* ---------- landmarks, modelled on the real buildings ---------- */

// Four copies of a face detail, one on each side of a square building.
function OnFaces({ children }: { children: (side: number) => React.ReactNode }) {
  return <>{[0, 1, 2, 3].map(side => <group key={side} rotation-y={side * Math.PI / 2}>{children(side)}</group>)}</>
}

// NC State's Memorial Belltower: pale granite, a gently tapering shaft with a vertical channel
// on each face, a clock under a belfry of three tall arched openings, and a battlemented top
// with four corner pinnacles.
function Belltower({ night }: { night: boolean }) {
  const { x, z } = landmarks.tower
  const glow = useMemo(() => glowTexture('rgba(255,236,200,1)', 'rgba(255,220,170,.4)', 'rgba(255,210,150,0)'), [])
  const stone = night ? '#b3aea6' : '#e2ddd2'
  const shade = night ? '#8f8a84' : '#c9c3b6'
  const stoneMaterial = (color = stone) => <meshStandardMaterial color={color} emissive={night ? '#3b3226' : '#000000'} emissiveIntensity={night ? 0.5 : 0} flatShading roughness={0.95}/>
  const openingMaterial = () => <meshStandardMaterial color={night ? '#ffd9a0' : '#3a3a46'} emissive={night ? '#ffc070' : '#000000'} emissiveIntensity={night ? 1.6 : 0}/>
  const lean = -Math.atan(0.07 / 3.8)
  const half = (y: number) => 0.4 - (y - 1.36) * (0.07 / 3.8)
  return <group position={[x, 0, z]}>
    <mesh position-y={0.06} receiveShadow castShadow><boxGeometry args={[2.1, 0.12, 2.1]}/>{stoneMaterial(shade)}</mesh>
    <mesh position-y={0.19} receiveShadow castShadow><boxGeometry args={[1.6, 0.14, 1.6]}/>{stoneMaterial(shade)}</mesh>
    <mesh position-y={0.81} castShadow receiveShadow><boxGeometry args={[1.0, 1.1, 1.0]}/>{stoneMaterial()}</mesh>
    <mesh position-y={1.37} castShadow><boxGeometry args={[1.06, 0.06, 1.06]}/>{stoneMaterial(shade)}</mesh>
    <mesh position={[0, 0.5, 0.502]}><planeGeometry args={[0.26, 0.48]}/><meshStandardMaterial color="#2f2b2a"/></mesh>
    <mesh position-y={3.26} rotation-y={Math.PI / 4} castShadow receiveShadow><cylinderGeometry args={[0.33 * Math.SQRT2, 0.4 * Math.SQRT2, 3.8, 4, 1]}/>{stoneMaterial()}</mesh>
    <OnFaces>{() => <>
      <mesh position={[0, 3.2, half(3.2) + 0.006]} rotation-x={lean}><planeGeometry args={[0.08, 3.4]}/>{stoneMaterial(shade)}</mesh>
      {[2.3, 3.9].map(y => <mesh key={y} position={[0.2, y, half(y) + 0.008]} rotation-x={lean}><planeGeometry args={[0.07, 0.22]}/><meshStandardMaterial color="#3a3a46"/></mesh>)}
    </>}</OnFaces>
    <mesh position-y={5.18} castShadow><boxGeometry args={[0.8, 0.07, 0.8]}/>{stoneMaterial(shade)}</mesh>
    <mesh position-y={5.74} castShadow><boxGeometry args={[0.72, 1.12, 0.72]}/>{stoneMaterial()}</mesh>
    <mesh position-y={6.32} castShadow><boxGeometry args={[0.82, 0.07, 0.82]}/>{stoneMaterial(shade)}</mesh>
    <OnFaces>{() => <>
      <mesh position={[0, 5.37, 0.362]}><circleGeometry args={[0.09, 20]}/><meshStandardMaterial color={night ? '#fff3d6' : '#f4efe4'} emissive={night ? '#ffe3a8' : '#000000'} emissiveIntensity={night ? 0.8 : 0}/></mesh>
      {[-0.17, 0, 0.17].map(dx => <group key={dx} position={[dx, 0, 0.362]}>
        <mesh position-y={5.86}><planeGeometry args={[0.1, 0.46]}/>{openingMaterial()}</mesh>
        <mesh position-y={6.09}><circleGeometry args={[0.05, 12, 0, Math.PI]}/>{openingMaterial()}</mesh>
      </group>)}
      {[-0.27, -0.09, 0.09, 0.27].map(dx => <mesh key={dx} position={[dx, 6.42, 0.37]} castShadow><boxGeometry args={[0.1, 0.13, 0.08]}/>{stoneMaterial()}</mesh>)}
    </>}</OnFaces>
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => <group key={`${sx}${sz}`} position={[sx * 0.37, 0, sz * 0.37]}>
      <mesh position-y={6.5} castShadow><boxGeometry args={[0.13, 0.3, 0.13]}/>{stoneMaterial()}</mesh>
      <mesh position-y={6.73} rotation-y={Math.PI / 4}><coneGeometry args={[0.1, 0.18, 4]}/>{stoneMaterial()}</mesh>
    </group>)}
    {night && <sprite position-y={5.8} scale={[2.2, 2.2, 1]}><spriteMaterial map={glow} blending={AdditiveBlending} depthWrite={false} transparent opacity={0.55}/></sprite>}
    {night && <pointLight position={[0, 1.2, 1.6]} intensity={5} distance={7} color="#ffe2b0"/>}
  </group>
}

// A slice of a ring, standing `depth` tall, centred on the +z axis: the curved INCOIS front.
const R = 2.1, D = 0.8, H = 1.05, A = 0.82

function sector(outer: number, inner: number, from: number, to: number, depth: number) {
  const shape = new Shape()
  shape.absarc(0, 0, outer, -Math.PI / 2 + from, -Math.PI / 2 + to, false)
  shape.absarc(0, 0, inner, -Math.PI / 2 + to, -Math.PI / 2 + from, true)
  const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 48 })
  geometry.rotateX(-Math.PI / 2)
  return geometry
}

// INCOIS in Hyderabad: a long, low building in grey stone blocks whose front sweeps in a
// wide curve, with ribbons of windows, a white entrance canopy, white blocks on the roof
// and a satellite dish for its ocean data.
function Incois({ night }: { night: boolean }) {
  const { x, z } = landmarks.incois
  const body = useMemo(() => sector(R, R - D, -A, A, H), [])
  const canopy = useMemo(() => sector(R + 0.55, R - 0.05, -0.2, 0.2, 0.07), [])
  const windows = useMemo(() => windowStrip(44, false), [])
  const lit = useMemo(() => litStrip(44, false, 5), [])
  const stone = night ? '#5f6176' : '#9c9da2'
  const white = night ? '#b7bbd0' : '#f4f2ec'
  // A point on the curved front, `angle` radians round from the middle.
  const onCurve = (angle: number, radius = R - D / 2) => [Math.sin(angle) * radius, Math.cos(angle) * radius] as const
  const [dishX, dishZ] = onCurve(-0.45)
  const [tallX, tallZ] = onCurve(0.42)
  const [boxX, boxZ] = onCurve(-0.05, R - D / 2 - 0.1)
  return <group position={[x, 0.05, z]} rotation-y={-0.32}>
    <group position-z={-(R - D / 2)}>
      <mesh geometry={body} castShadow receiveShadow><meshStandardMaterial color={stone} flatShading roughness={1}/></mesh>
      {[0.3, 0.72].map((y, i) => <mesh key={y} position-y={y}>
        <cylinderGeometry args={[R + 0.006, R + 0.006, 0.2, 64, 1, true, -A + 0.04, 2 * A - 0.08]}/>
        <meshStandardMaterial alphaMap={windows} transparent alphaTest={0.5} color={night ? '#1c2033' : '#2d4a68'} roughness={0.3} metalness={0.3}
          emissive="#ffffff" emissiveMap={i ? lit : windows} emissiveIntensity={night ? (i ? 1.4 : 0.9) : 0}/>
      </mesh>)}
      <mesh position-y={H + 0.04}><cylinderGeometry args={[R + 0.01, R + 0.01, 0.08, 64, 1, true, -A, 2 * A]}/><meshStandardMaterial color={white} side={DoubleSide}/></mesh>
      {Array.from({ length: 15 }, (_, i) => -A + 0.06 + i * (2 * A - 0.12) / 14).map(angle => {
        const [px, pz] = onCurve(angle, R - 0.04)
        return <mesh key={angle} position={[px, H + 0.11, pz]} rotation-y={angle}><boxGeometry args={[0.07, 0.07, 0.07]}/><meshStandardMaterial color={white}/></mesh>
      })}
      <mesh geometry={canopy} position-y={0.52} castShadow><meshStandardMaterial color={white}/></mesh>
      <mesh position={[0, 0.26, R + 0.004]}><planeGeometry args={[0.5, 0.52]}/><meshStandardMaterial color="#26283a" emissive={night ? '#ffcf8a' : '#000000'} emissiveIntensity={night ? 0.5 : 0}/></mesh>
      <mesh position={[tallX, H + 0.45, tallZ]} rotation-y={0.42} castShadow><boxGeometry args={[0.42, 0.9, 0.42]}/><meshStandardMaterial color={white} flatShading/></mesh>
      <mesh position={[boxX, H + 0.2, boxZ]} rotation-y={-0.05} castShadow><boxGeometry args={[0.95, 0.4, 0.5]}/><meshStandardMaterial color={white} flatShading/></mesh>
      <group position={[dishX, H, dishZ]}>
        <mesh position-y={0.14}><cylinderGeometry args={[0.03, 0.05, 0.28, 8]}/><meshStandardMaterial color="#d8dbe2"/></mesh>
        <mesh position-y={0.36} rotation={[Math.PI - 0.7, 0, 0]} castShadow><sphereGeometry args={[0.3, 20, 8, 0, Math.PI * 2, 0, 0.95]}/><meshStandardMaterial color={white} side={DoubleSide}/></mesh>
      </group>
    </group>
  </group>
}

// VNR VJIET's main block: white, four floors of blue-glass ribbon windows, a wide flat roof that
// overhangs on every side, and a portico with the college name in red. Beside it, the newer
// block in terracotta cladding.
function College({ night }: { night: boolean }) {
  const { x, z } = landmarks.college
  const sign = useMemo(() => canvasTexture(512, 48, ctx => {
    ctx.fillStyle = '#f6f4ef'; ctx.fillRect(0, 0, 512, 48)
    ctx.fillStyle = '#c4161c'; ctx.font = '800 30px "Bricolage Grotesque Variable", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('VNR VIGNANA JYOTHI', 256, 26)
  }), [])
  const white = night ? '#a9a9c4' : '#f4f3ef'
  const terracotta = night ? '#6e4a4c' : '#b8694d'
  return <group position={[x, 0, z]} rotation-y={0.25}>
    <mesh position-y={0.95} castShadow receiveShadow><boxGeometry args={[3.4, 1.9, 1.3]}/><meshStandardMaterial color={white} flatShading/></mesh>
    {[0.48, 0.88, 1.28, 1.68].map((y, i) => <group key={y} position={[0, y, 0.653]}>
      <Windows columns={12} ribbon seed={11 + i} night={night} width={3.1} height={0.2}/>
    </group>)}
    <mesh position-y={1.97} castShadow><boxGeometry args={[3.95, 0.1, 1.8]}/><meshStandardMaterial color={white}/></mesh>
    <mesh position-y={1.9}><boxGeometry args={[3.9, 0.05, 1.75]}/><meshStandardMaterial color={night ? '#8a8aa6' : '#d9d7d0'}/></mesh>
    <mesh position={[0, 0.82, 1.0]} castShadow><boxGeometry args={[1.5, 0.14, 0.7]}/><meshStandardMaterial color={white}/></mesh>
    <mesh position={[0, 0.82, 1.352]}><planeGeometry args={[1.45, 0.12]}/><meshStandardMaterial map={sign} emissive={night ? '#ffffff' : '#000000'} emissiveMap={sign} emissiveIntensity={night ? 0.35 : 0}/></mesh>
    {[-0.62, 0.62].map(dx => <mesh key={dx} position={[dx, 0.38, 1.25]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.76, 8]}/><meshStandardMaterial color="#2e2c33"/></mesh>)}
    <mesh position={[0, 0.25, 0.654]}><planeGeometry args={[0.7, 0.5]}/><meshStandardMaterial color="#2e2c33" emissive={night ? '#ffcf8a' : '#000000'} emissiveIntensity={night ? 0.6 : 0}/></mesh>
    <group position={[2.15, 0, -0.75]}>
      <mesh position-y={0.8} castShadow receiveShadow><boxGeometry args={[1.4, 1.6, 1.0]}/><meshStandardMaterial color={terracotta} flatShading/></mesh>
      {[0.4, 0.75, 1.1, 1.45].map((y, i) => <group key={y} position={[0, y, 0.503]}>
        <Windows columns={7} ribbon={false} seed={31 + i} night={night} width={1.3} height={0.2} glass="#e9eef3"/>
      </group>)}
      <mesh position-y={1.62}><boxGeometry args={[1.44, 0.05, 1.04]}/><meshStandardMaterial color={night ? '#6c6c80' : '#9a9a9e'}/></mesh>
    </group>
  </group>
}

function Skyline({ colors: p, night }: { colors: Palette; night: boolean }) {
  const buildings = useMemo(() => {
    const r = random(23)
    return Array.from({ length: 11 }, (_, i) => ({ x: 5 + i * 0.75 + r() * 0.3, z: -27 - r() * 3, w: 0.55 + r() * 0.4, h: 1.2 + r() * 2.2, texture: windowTexture(4, 12, 40 + i) }))
  }, [])
  return <group>
    {buildings.map((b, i) => {
      const y = height(b.x, b.z)
      return <mesh key={i} position={[b.x, y + b.h / 2, b.z]}>
        <boxGeometry args={[b.w, b.h, b.w]}/>
        <meshStandardMaterial color={p.skyline} emissive="#ffffff" emissiveMap={b.texture} emissiveIntensity={night ? 0.9 : 0} flatShading/>
      </mesh>
    })}
  </group>
}

// Low-poly clouds that drift across the day sky.
function Clouds({ reduceMotion }: { reduceMotion: boolean }) {
  const group = useRef<Group>(null)
  const clouds = useMemo(() => {
    const r = random(57)
    return Array.from({ length: 9 }, (_, i) => ({
      x: -34 + i * 8.5 + r() * 4, y: 9 + r() * 7, z: -34 - r() * 16, s: 1.2 + r() * 1.3,
      puffs: Array.from({ length: 4 + Math.floor(r() * 3) }, (_, k) => [(k - 2.5) * 0.9 + r() * 0.4, r() * 0.5, r() * 0.6 - 0.3, 0.7 + r() * 0.6] as const),
    }))
  }, [])
  useFrame((_, delta) => {
    if (!group.current || reduceMotion) return
    group.current.children.forEach((cloud, i) => {
      cloud.position.x += delta * (0.25 + (i % 3) * 0.08)
      if (cloud.position.x > 44) cloud.position.x = -44
    })
  })
  return <group ref={group}>
    {clouds.map((c, i) => <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
      {c.puffs.map(([px, py, pz, ps], k) => <mesh key={k} position={[px, py, pz]} scale={[ps * 1.25, ps, ps]}>
        <icosahedronGeometry args={[1, 0]}/><meshStandardMaterial color="#ffffff" emissive="#dbeeff" emissiveIntensity={0.35} flatShading roughness={1}/>
      </mesh>)}
    </group>)}
  </group>
}

function Sky({ night }: { night: boolean }) {
  const stars = useMemo(() => {
    const r = random(3)
    const positions: number[] = []
    for (let i = 0; i < 700; i++) {
      const theta = r() * Math.PI * 2, phi = Math.acos(0.15 + r() * 0.85)
      positions.push(Math.sin(phi) * Math.cos(theta) * 90, Math.cos(phi) * 90, Math.sin(phi) * Math.sin(theta) * 90 - 20)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return geometry
  }, [])
  const moonGlow = useMemo(() => glowTexture(), [])
  const sunGlow = useMemo(() => glowTexture('rgba(255,252,235,1)', 'rgba(255,240,190,.5)', 'rgba(255,235,180,0)'), [])
  return <group>
    {night && <points geometry={stars}><pointsMaterial color="#fff6e6" size={1.6} sizeAttenuation={false} transparent opacity={0.85} fog={false}/></points>}
    <group position={[16, 19, -55]}>
      <mesh><sphereGeometry args={[night ? 2.4 : 2.2, 32, 32]}/><meshBasicMaterial color={night ? '#fbefd9' : '#fffbea'} fog={false}/></mesh>
      <sprite scale={night ? [14, 14, 1] : [15, 15, 1]}><spriteMaterial map={night ? moonGlow : sunGlow} blending={AdditiveBlending} depthWrite={false} transparent opacity={night ? 0.35 : 0.5} fog={false}/></sprite>
    </group>
  </group>
}

function Fireflies({ reduceMotion }: { reduceMotion: boolean }) {
  const points = useRef<Points>(null)
  const seeds = useMemo(() => {
    const r = random(91)
    return Array.from({ length: 60 }, () => ({ x: -8 + r() * 14, z: -6 + r() * 16, y: 0.4 + r() * 1.6, p: r() * 10 }))
  }, [])
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(seeds.flatMap(s => [s.x, height(s.x, s.z) + s.y, s.z]), 3))
    return g
  }, [seeds])
  useFrame(({ clock }) => {
    if (!points.current || reduceMotion) return
    const position = geometry.getAttribute('position') as BufferAttribute
    const t = clock.elapsedTime
    seeds.forEach((s, i) => {
      position.setXYZ(i, s.x + Math.sin(t * 0.4 + s.p) * 0.4, height(s.x, s.z) + s.y + Math.sin(t * 0.9 + s.p * 2) * 0.25, s.z + Math.cos(t * 0.35 + s.p) * 0.4)
    })
    position.needsUpdate = true
  })
  const glow = useMemo(() => glowTexture(), [])
  return <points ref={points} geometry={geometry}><pointsMaterial map={glow} color="#ffe39a" size={0.32} transparent depthWrite={false} blending={AdditiveBlending}/></points>
}

/* ---------- pins, camera and scene ---------- */

const pins: { id: PlaceId; label: string; year: string; position: readonly [number, number, number] }[] = [
  { id: 'vnr', label: 'VNR', year: '2025', position: [landmarks.college.x, 2.75, landmarks.college.z] },
  { id: 'ncstate', label: 'NC State', year: 'Now', position: [landmarks.tower.x, 7.6, landmarks.tower.z] },
  { id: 'incois', label: 'INCOIS', year: '2025', position: [landmarks.incois.x, 2.9, landmarks.incois.z] },
]
const mePoint = road.getPointAt(0.45)

// Where the camera goes for each place: a little in front of it, aimed so the landmark sits
// to the right of the story card (or above it on phones). `top` is the landmark's height.
// `side` sets which side the camera comes from, so nothing tall stands in the way.
const places: Record<PlaceId, { at: Vector3; top: number; side: number }> = {
  incois: { at: landmarks.incois, top: 2.0, side: 2.4 },
  vnr: { at: landmarks.college, top: 2.0, side: -2.2 },
  ncstate: { at: landmarks.tower, top: 6.8, side: -2.2 },
  me: { at: new Vector3(mePoint.x, height(mePoint.x, mePoint.z), mePoint.z), top: 1.2, side: -2.2 },
}

function Pins({ active, onSelect, showHint }: { active: PlaceId | null; onSelect: (id: PlaceId) => void; showHint: boolean }) {
  const me = mePoint
  // Mount the HTML labels one frame after the scene, otherwise the first one can be
  // torn down mid-render and never appear.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  if (!ready || active) return null
  return <>
    {pins.map(pin => <Html key={pin.id} position={[...pin.position]} center zIndexRange={[5, 0]}>
      <button type="button" className="pin3d" onClick={() => onSelect(pin.id)} aria-label={`${pin.label}, ${pin.year}: open its story`}>
        {showHint && pin.id === 'ncstate' && <span className="pin3d-hint" aria-hidden="true">click a place <svg viewBox="0 0 40 16"><path d="M2 10 C 14 2 26 2 36 8 M30 3 L 37 8 L 30 13"/></svg></span>}
        <span className="pin3d-label">{pin.label}<em>{pin.year}</em></span><span className="pin3d-dot" aria-hidden="true"/>
      </button>
    </Html>)}
    <Html position={[me.x, height(me.x, me.z) + 1.0, me.z]} center zIndexRange={[5, 0]}>
      <button type="button" className="pin3d" onClick={() => onSelect('me')} aria-label="That’s me: open my story"><span className="pin3d-label"><Mark size={22}/>That’s me</span><span className="pin3d-dot" aria-hidden="true"/></button>
    </Html>
  </>
}

function CameraRig({ reduceMotion, active }: { reduceMotion: boolean; active: PlaceId | null }) {
  const { size } = useThree()
  const portrait = size.width / size.height < 0.8
  const target = useMemo(() => new Vector3(), [])
  useFrame(({ camera, pointer }, delta) => {
    const scroll = Math.min(1, window.scrollY / window.innerHeight)
    let base: Vector3, aim: Vector3
    if (active) {
      // Fly to the chosen place: close in front of it, with the story card's side left clear.
      const { at, top, side } = places[active]
      base = portrait ? at.clone().add(new Vector3(0, top * 0.6 + 3, 12 + top * 1.6)) : at.clone().add(new Vector3(side, top * 0.5 + 1.8, 7.5 + top * 1.25))
      aim = portrait ? at.clone().add(new Vector3(0, top * 0.5 - 2.6, 0)) : at.clone().add(new Vector3(-2.6 - top * 0.35, top * 0.5, 0))
    } else {
      // Home view: wide screens look past the headline at the landmarks on the right;
      // phones step back and centre on the tower.
      base = portrait ? new Vector3(2.6, 4.2, 31) : new Vector3(-0.6, 2.7, 14.5)
      // On phones, aim above the landmarks so they sit in the lower half, under the headline.
      aim = portrait ? new Vector3(2.6, 8.3, -4) : new Vector3(1.4, 2.6, -4)
      // Scrolling glides the camera down the road toward the belltower.
      base.lerp(new Vector3(1.6, 2.2, 8), reduceMotion ? 0 : scroll * 0.55)
    }
    if (!reduceMotion) { base.x += pointer.x * (active ? 0.25 : 0.7); base.y += pointer.y * (active ? 0.12 : 0.35) }
    const ease = 1 - Math.pow(active ? 0.12 : 0.03, delta)
    camera.position.lerp(base, reduceMotion ? 1 : ease)
    target.lerp(aim, reduceMotion ? 1 : ease)
    camera.lookAt(target)
  })
  return null
}

type SceneProps = { reduceMotion: boolean; night: boolean; active: PlaceId | null; onSelect: (id: PlaceId) => void; showHint: boolean }

function Scene({ reduceMotion, night, active, onSelect, showHint }: SceneProps) {
  const daySky = useMemo(() => skyTexture(false), [])
  const nightSky = useMemo(() => skyTexture(true), [])
  const colors = night ? palette.night : palette.day
  // Day is a clear blue sky with a high sun and soft shadows; night is cool moonlight,
  // so the windows and the floodlit belltower glow.
  return <>
    <primitive attach="background" object={night ? nightSky : daySky}/>
    <fog attach="fog" args={colors.fog}/>
    <ambientLight intensity={night ? 0.22 : 0.5} color={night ? '#9fb0ff' : '#ffffff'}/>
    <hemisphereLight args={night ? ['#5d6bb0', '#141830', 0.9] : ['#cfe8ff', '#6f9a52', 1.1]}/>
    <directionalLight position={[10, 7, 9]} intensity={night ? 0.25 : 0.5} color={night ? '#8ea2ff' : '#dbeaff'}/>
    <directionalLight position={night ? [-6, 12, 10] : [9, 16, 9]} intensity={night ? 1.25 : 2.3} color={night ? '#c3ceff' : '#fff2dc'} castShadow
      shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0008}/>
    <Sky night={night}/>
    {!night && <Clouds reduceMotion={reduceMotion}/>}
    <Terrain colors={colors}/>
    <Sea reduceMotion={reduceMotion} color={colors.sea}/>
    <Road colors={colors}/>
    <Trees colors={colors}/>
    <Skyline colors={colors} night={night}/>
    <College night={night}/>
    <Belltower night={night}/>
    <Incois night={night}/>
    {night && <Fireflies reduceMotion={reduceMotion}/>}
    <Pins active={active} onSelect={onSelect} showHint={showHint}/>
    <CameraRig reduceMotion={reduceMotion} active={active}/>
  </>
}

export default function Valley({ paused, eventSource, ...scene }: SceneProps & { paused: boolean; eventSource: React.RefObject<HTMLElement | null> }) {
  // Pointer parallax listens on the whole hero, so the headline doesn't block it.
  return <Canvas shadows="percentage" dpr={[1, 1.75]} frameloop={paused ? 'never' : 'always'} camera={{ position: [-0.6, 2.7, 14.5], fov: 40, near: 0.1, far: 200 }}
    gl={{ antialias: true, powerPreference: 'high-performance', toneMappingExposure: 1.2 }} eventSource={eventSource as React.RefObject<HTMLElement>} eventPrefix="client">
    <Scene {...scene}/>
  </Canvas>
}
