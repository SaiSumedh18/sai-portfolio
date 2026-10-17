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
  return texture
}

const glowTexture = () => canvasTexture(128, 128, ctx => {
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.25, 'rgba(255,220,150,.55)'); g.addColorStop(1, 'rgba(255,200,120,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128)
})

const skyTexture = (night = false) => canvasTexture(4, 512, ctx => {
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  if (night) { g.addColorStop(0, '#070b1c'); g.addColorStop(0.45, '#111a3a'); g.addColorStop(0.75, '#26315e'); g.addColorStop(1, '#3d3f72') }
  else { g.addColorStop(0, '#2b3b72'); g.addColorStop(0.3, '#4b5b96'); g.addColorStop(0.5, '#9479ab'); g.addColorStop(0.66, '#e09e8c'); g.addColorStop(0.8, '#f7c693'); g.addColorStop(1, '#fde3b4') }
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 512)
})

export type PlaceId = 'incois' | 'vnr' | 'ncstate' | 'me'

// A grid of windows, some lit, for buildings.
const windowTexture = (columns: number, rows: number, seed: number) => canvasTexture(columns * 16, rows * 20, ctx => {
  const r = random(seed)
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, columns * 16, rows * 20)
  for (let c = 0; c < columns; c++) for (let w = 0; w < rows; w++) {
    if (r() < 0.55) { ctx.fillStyle = r() < 0.8 ? '#ffd27a' : '#ffe9b8'; ctx.fillRect(c * 16 + 4, w * 20 + 4, 8, 12) }
  }
})

/* ---------- the landscape ---------- */

const roadPoints = [new Vector3(-0.6, 0, 15), new Vector3(1.6, 0, 10), new Vector3(-0.2, 0, 5.5), new Vector3(1.4, 0, 1.5), new Vector3(2.1, 0, -2.4), new Vector3(2.4, 0, -4.4)]
const road = new CatmullRomCurve3(roadPoints)
const roadSamples = road.getSpacedPoints(160)

const landmarks = {
  lighthouse: new Vector3(7.2, 0, -8.5),
  tower: new Vector3(2.5, 0, -5.4),
  college: new Vector3(-0.9, 0, -1.9),
}

function distanceToRoad(x: number, z: number) {
  let best = Infinity
  for (const p of roadSamples) best = Math.min(best, (p.x - x) ** 2 + (p.z - z) ** 2)
  return Math.sqrt(best)
}

const isSea = (x: number, z: number) => x > 4.2 + Math.sin(z * 0.6) * 0.6 && z < -3

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
  flatten(landmarks.college.x, landmarks.college.z, 2.6)
  const roadDistance = distanceToRoad(x, z)
  if (roadDistance < 1.6) h = h * (roadDistance / 1.6) * 0.6
  if (isSea(x, z)) h = Math.min(h, -0.7)
  return h
}

function Terrain() {
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(90, 70, 110, 90).toNonIndexed()
    plane.rotateX(-Math.PI / 2)
    plane.translate(0, 0, -20)
    const position = plane.getAttribute('position') as BufferAttribute
    for (let i = 0; i < position.count; i++) position.setY(i, height(position.getX(i), position.getZ(i)))
    // Colour each triangle by its height and distance: darker up close, lilac in the hills.
    const colors: number[] = []
    const low = new Color('#46508a'), high = new Color('#8a78ad'), near = new Color('#2c3360'), shore = new Color('#7a6b98')
    for (let i = 0; i < position.count; i += 3) {
      const y = (position.getY(i) + position.getY(i + 1) + position.getY(i + 2)) / 3
      const z = (position.getZ(i) + position.getZ(i + 1) + position.getZ(i + 2)) / 3
      const c = low.clone().lerp(high, Math.min(1, Math.max(0, (y + 0.2) / 4)))
      if (z > 4) c.lerp(near, Math.min(1, (z - 4) / 8))
      if (y < -0.3) c.copy(shore)
      c.offsetHSL(0, 0, ((i * 7) % 5) * 0.004)
      for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b)
    }
    plane.setAttribute('color', new Float32BufferAttribute(colors, 3))
    plane.computeVertexNormals()
    return plane
  }, [])
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors flatShading roughness={1}/></mesh>
}

function Sea({ reduceMotion }: { reduceMotion: boolean }) {
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
  return <mesh geometry={geometry} rotation-x={-Math.PI / 2} position={[30, -0.35, -26]}>
    <meshStandardMaterial color="#8c84bd" roughness={0.2} metalness={0.25} flatShading/>
  </mesh>
}

function Road() {
  const { surface, dashes } = useMemo(() => {
    const build = (width: number, lift: number, every = 1, skip = 0) => {
      const vertices: number[] = []
      for (let i = 0; i < roadSamples.length - 1; i += every) {
        if (skip && Math.floor(i / every) % 2 === 1) continue
        const a = roadSamples[i], b = roadSamples[Math.min(i + every, roadSamples.length - 1)]
        const dir = new Vector3().subVectors(b, a).normalize()
        const side = new Vector3(-dir.z, 0, dir.x).multiplyScalar(width / 2)
        const ya = height(a.x, a.z) + lift, yb = height(b.x, b.z) + lift
        const p = [a.x + side.x, ya, a.z + side.z, a.x - side.x, ya, a.z - side.z, b.x + side.x, yb, b.z + side.z, b.x - side.x, yb, b.z - side.z]
        vertices.push(...p.slice(0, 3), ...p.slice(3, 6), ...p.slice(6, 9), ...p.slice(3, 6), ...p.slice(9, 12), ...p.slice(6, 9))
      }
      const geometry = new BufferGeometry()
      geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
      geometry.computeVertexNormals()
      return geometry
    }
    return { surface: build(1.05, 0.04), dashes: build(0.07, 0.06, 2, 1) }
  }, [])
  return <group>
    <mesh geometry={surface} receiveShadow><meshStandardMaterial color="#cdb594" roughness={0.9} side={DoubleSide}/></mesh>
    <mesh geometry={dashes}><meshBasicMaterial color="#fff4dc" side={DoubleSide}/></mesh>
  </group>
}

function Trees() {
  const trunks = useRef<InstancedMesh>(null)
  const crowns = useRef<InstancedMesh>(null)
  const spots = useMemo(() => {
    const r = random(7)
    const list: { x: number; z: number; s: number }[] = []
    while (list.length < 70) {
      const x = -14 + r() * 26, z = -15 + r() * 26
      if (distanceToRoad(x, z) < 1.4 || isSea(x, z) || x > 3.6 && z < -2) continue
      if (Math.hypot(x - landmarks.tower.x, z - landmarks.tower.z) < 1.8 || Math.hypot(x - landmarks.college.x, z - landmarks.college.z) < 2.8) continue
      if (z > 4 && Math.abs(x) < 7) continue
      if (Math.hypot(x - landmarks.college.x, z - landmarks.college.z) < 4 && z > landmarks.college.z) continue
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
      crowns.current?.setColorAt(i, new Color(i % 3 === 0 ? '#3f6a86' : i % 3 === 1 ? '#355c7a' : '#4d7c8e'))
    })
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true
    if (crowns.current) { crowns.current.instanceMatrix.needsUpdate = true; if (crowns.current.instanceColor) crowns.current.instanceColor.needsUpdate = true }
  }, [spots])
  return <group>
    <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]} castShadow><cylinderGeometry args={[0.06, 0.09, 0.5, 5]}/><meshStandardMaterial color="#4a3346" flatShading/></instancedMesh>
    <instancedMesh ref={crowns} args={[undefined, undefined, spots.length]} castShadow><icosahedronGeometry args={[0.55, 0]}/><meshStandardMaterial flatShading roughness={0.9}/></instancedMesh>
  </group>
}

/* ---------- landmarks ---------- */

function Lighthouse({ reduceMotion }: { reduceMotion: boolean }) {
  const beam = useRef<Group>(null)
  const glow = useMemo(() => glowTexture(), [])
  const beamTexture = useMemo(() => canvasTexture(4, 256, ctx => {
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, 'rgba(255,236,170,0)'); g.addColorStop(1, 'rgba(255,236,170,.22)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 256)
  }), [])
  useFrame((_, delta) => { if (beam.current && !reduceMotion) beam.current.rotation.y += delta * 0.6 })
  const { x, z } = landmarks.lighthouse
  return <group position={[x, -0.4, z]}>
    <mesh position-y={0.2} castShadow receiveShadow scale={[1.6, 0.6, 1.3]}><dodecahedronGeometry args={[1, 0]}/><meshStandardMaterial color="#6d668f" flatShading/></mesh>
    <mesh position-y={2.2} castShadow><cylinderGeometry args={[0.36, 0.52, 3.2, 16]}/><meshStandardMaterial color="#e9e0d4" roughness={0.8}/></mesh>
    {[1.3, 2.4].map(y => <mesh key={y} position-y={y}><cylinderGeometry args={[0.44 - (y - 1.3) * 0.06, 0.47 - (y - 1.3) * 0.06, 0.4, 16]}/><meshStandardMaterial color="#c8524a" roughness={0.7}/></mesh>)}
    <mesh position-y={3.85}><cylinderGeometry args={[0.6, 0.6, 0.08, 16]}/><meshStandardMaterial color="#2a2f52"/></mesh>
    <mesh position-y={4.15}><cylinderGeometry args={[0.3, 0.3, 0.5, 12]}/><meshStandardMaterial color="#ffd36e" emissive="#ffc95a" emissiveIntensity={1.6}/></mesh>
    <mesh position-y={4.62}><coneGeometry args={[0.42, 0.45, 12]}/><meshStandardMaterial color="#2a2f52"/></mesh>
    <sprite position-y={4.15} scale={[3.2, 3.2, 1]}><spriteMaterial map={glow} blending={AdditiveBlending} depthWrite={false} transparent/></sprite>
    <pointLight position-y={4.2} intensity={6} distance={9} color="#ffd59a"/>
    <group ref={beam} position-y={4.15}>
      <mesh rotation-z={Math.PI / 2} position-x={-6}><coneGeometry args={[0.9, 12, 24, 1, true]}/><meshBasicMaterial map={beamTexture} transparent blending={AdditiveBlending} depthWrite={false} side={DoubleSide}/></mesh>
    </group>
  </group>
}

function Belltower() {
  const { x, z } = landmarks.tower
  const glow = useMemo(() => glowTexture(), [])
  return <group position={[x, 0, z]}>
    <mesh position-y={0.15} castShadow receiveShadow><boxGeometry args={[1.5, 0.3, 1.5]}/><meshStandardMaterial color="#5e3036" flatShading/></mesh>
    <mesh position-y={2.4} rotation-y={Math.PI / 4} castShadow><cylinderGeometry args={[0.5, 0.68, 4.2, 4]}/><meshStandardMaterial color="#7a4045" flatShading roughness={0.85}/></mesh>
    <mesh position-y={5} castShadow><boxGeometry args={[0.92, 1.05, 0.92]}/><meshStandardMaterial color="#8a4a4e" flatShading/></mesh>
    {[[0, 0.47, 0], [0.47, 0, Math.PI / 2], [0, -0.47, Math.PI], [-0.47, 0, -Math.PI / 2]].map(([dx, dz, ry], i) =>
      <mesh key={i} position={[dx, 5, dz]} rotation-y={ry}><planeGeometry args={[0.36, 0.6]}/><meshStandardMaterial color="#ffd27a" emissive="#ffc35a" emissiveIntensity={1.8}/></mesh>)}
    <sprite position-y={5} scale={[2.4, 2.4, 1]}><spriteMaterial map={glow} blending={AdditiveBlending} depthWrite={false} transparent opacity={0.7}/></sprite>
    <mesh position-y={6.25} rotation-y={Math.PI / 4} castShadow><coneGeometry args={[0.68, 1.45, 4]}/><meshStandardMaterial color="#6b3a40" flatShading/></mesh>
    {[[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].map(([dx, dz]) =>
      <mesh key={`${dx}${dz}`} position={[dx, 5.75, dz]} rotation-y={Math.PI / 4}><coneGeometry args={[0.1, 0.45, 4]}/><meshStandardMaterial color="#6b3a40" flatShading/></mesh>)}
    {[1.6, 2.6, 3.6].map(y => <mesh key={y} position={[0, y, 0.6 - (y - 1.6) * 0.045]} rotation-x={-0.04}><planeGeometry args={[0.14, 0.42]}/><meshStandardMaterial color="#ffd27a" emissive="#ffc35a" emissiveIntensity={1.4}/></mesh>)}
  </group>
}

function College() {
  const { x, z } = landmarks.college
  const windows = useMemo(() => windowTexture(10, 3, 11), [])
  const roof = useMemo(() => {
    const triangle = new Shape()
    triangle.moveTo(-1.75, 0); triangle.lineTo(0, 0.85); triangle.lineTo(1.75, 0); triangle.lineTo(-1.75, 0)
    const shape = new ExtrudeGeometry(triangle, { depth: 1.6, bevelEnabled: false })
    shape.translate(0, 0, -0.8)
    return shape
  }, [])
  return <group position={[x, 0, z]} rotation-y={0.25}>
    <mesh position-y={0.75} castShadow receiveShadow><boxGeometry args={[3.3, 1.5, 1.4]}/><meshStandardMaterial color="#8a76a8" flatShading/></mesh>
    <mesh position={[0, 0.8, 0.705]}><planeGeometry args={[3.1, 1.2]}/><meshStandardMaterial color="#1c1830" emissive="#ffffff" emissiveMap={windows} emissiveIntensity={1.3} transparent opacity={0.98}/></mesh>
    <mesh geometry={roof} position-y={1.5} castShadow><meshStandardMaterial color="#5c4878" flatShading/></mesh>
    <mesh position={[0, 0.45, 0.72]}><planeGeometry args={[0.45, 0.9]}/><meshStandardMaterial color="#2a2140"/></mesh>
  </group>
}

function Skyline() {
  const buildings = useMemo(() => {
    const r = random(23)
    return Array.from({ length: 11 }, (_, i) => ({ x: 5 + i * 0.75 + r() * 0.3, z: -27 - r() * 3, w: 0.55 + r() * 0.4, h: 1.2 + r() * 2.2, texture: windowTexture(4, 12, 40 + i) }))
  }, [])
  return <group>
    {buildings.map((b, i) => {
      const y = height(b.x, b.z)
      return <mesh key={i} position={[b.x, y + b.h / 2, b.z]}>
        <boxGeometry args={[b.w, b.h, b.w]}/>
        <meshStandardMaterial color="#6a6596" emissive="#ffffff" emissiveMap={b.texture} emissiveIntensity={0.9} flatShading/>
      </mesh>
    })}
  </group>
}

function Sky() {
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
  const glow = useMemo(() => glowTexture(), [])
  return <group>
    <points geometry={stars}><pointsMaterial color="#fff6e6" size={1.6} sizeAttenuation={false} transparent opacity={0.85} fog={false}/></points>
    <group position={[16, 19, -55]}>
      <mesh><sphereGeometry args={[2.4, 32, 32]}/><meshBasicMaterial color="#fbefd9" fog={false}/></mesh>
      <sprite scale={[14, 14, 1]}><spriteMaterial map={glow} blending={AdditiveBlending} depthWrite={false} transparent opacity={0.35} fog={false}/></sprite>
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
  { id: 'vnr', label: 'VNR', year: '2025', position: [landmarks.college.x, 2.95, landmarks.college.z] },
  { id: 'ncstate', label: 'NC State', year: 'Now', position: [landmarks.tower.x, 7.4, landmarks.tower.z] },
  { id: 'incois', label: 'INCOIS', year: '2025', position: [landmarks.lighthouse.x, 5.5, landmarks.lighthouse.z] },
]
const mePoint = road.getPointAt(0.45)

// Where the camera goes for each place: a little in front of it, aimed so the landmark sits
// to the right of the story card (or above it on phones). `top` is the landmark's height.
// `side` sets which side the camera comes from, so nothing tall stands in the way.
const places: Record<PlaceId, { at: Vector3; top: number; side: number }> = {
  incois: { at: landmarks.lighthouse, top: 4.6, side: 3.6 },
  vnr: { at: landmarks.college, top: 2.2, side: -2.2 },
  ncstate: { at: landmarks.tower, top: 6.6, side: -2.2 },
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
  const dusk = useMemo(() => skyTexture(), [])
  const dark = useMemo(() => skyTexture(true), [])
  // Dusk is warm and low; night swaps the sunset for cool moonlight so the windows glow.
  return <>
    <primitive attach="background" object={night ? dark : dusk}/>
    <fog attach="fog" args={night ? ['#1b2246', 18, 72] : ['#b896aa', 22, 80]}/>
    <ambientLight intensity={night ? 0.22 : 0.45} color={night ? '#9fb0ff' : '#ffe6d6'}/>
    <hemisphereLight args={night ? ['#5d6bb0', '#141830', 0.9] : ['#c2b8ff', '#4a4070', 1.5]}/>
    <directionalLight position={[14, 4, -30]} intensity={night ? 0 : 1.6} color="#ffa979"/>
    <directionalLight position={[10, 7, 9]} intensity={night ? 0.25 : 1.5} color={night ? '#8ea2ff' : '#ffc49c'}/>
    <directionalLight position={[-6, 12, 10]} intensity={night ? 1.25 : 0.9} color="#c3ceff" castShadow
      shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0008}/>
    <Sky/>
    <Terrain/>
    <Sea reduceMotion={reduceMotion}/>
    <Road/>
    <Trees/>
    <Skyline/>
    <College/>
    <Belltower/>
    <Lighthouse reduceMotion={reduceMotion}/>
    <Fireflies reduceMotion={reduceMotion}/>
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
