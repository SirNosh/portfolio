import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

// Bakes the four shelf books (CC0 Poly Haven scans) into GLBs with finished textures. Every book
// uses the same convention: metres, x through the boards with the front cover at +x, y up, spine
// at +z, centred on the origin. Texture space is glTF's (v down), and every map is 2048 square.

const CACHE = '/scripts/bake-books/.cache'
const SIZE = 2048
const GOLD = '#c9a052'
const FONT = (size, weight = 600) => `${weight} ${size}px "Fira Code", ui-monospace, monospace`

// ---------------------------------------------------------------- basics

const loadImage = (url) => new Promise((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error(url))
  image.src = url
})

function makeCanvas(width = SIZE, height = width) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const ctx = (canvas) => canvas.getContext('2d', { willReadFrequently: true })

function fromImage(image, size = SIZE) {
  const canvas = makeCanvas(size)
  ctx(canvas).drawImage(image, 0, 0, size, size)
  return canvas
}

function seeded(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hash = (text) => [...text].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261)
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smoothstep = (v, a, b) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t) }

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}

function hslToRgb(h, s, l) {
  if (s === 0) return [l, l, l]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t) => {
    const u = t < 0 ? t + 1 : t > 1 ? t - 1 : t
    if (u < 1 / 6) return p + (q - p) * 6 * u
    if (u < 1 / 2) return q
    if (u < 2 / 3) return p + (q - p) * (2 / 3 - u) * 6
    return p
  }
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)]
}

// ---------------------------------------------------------------- geometry

/** A mesh's geometry in world space, non-indexed, in metres. */
function extract(mesh, metresPerUnit) {
  mesh.updateWorldMatrix(true, false)
  let geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)
  if (geometry.index) geometry = geometry.toNonIndexed()
  geometry.scale(metresPerUnit, metresPerUnit, metresPerUnit)
  return geometry
}

/** FBX texture space is bottom-up; convert to glTF's top-down. */
function flipV(geometry) {
  for (const name of ['uv', 'uv1']) {
    const uv = geometry.attributes[name]
    if (!uv) continue
    for (let i = 0; i < uv.count; i += 1) uv.setY(i, 1 - uv.getY(i))
  }
}

/** Rotates into the book convention and centres several geometries on their joint bounds. */
function orient(geometries, matrix) {
  const bounds = new THREE.Box3()
  for (const geometry of geometries) {
    geometry.applyMatrix4(matrix)
    geometry.computeBoundingBox()
    bounds.union(geometry.boundingBox)
  }
  const center = bounds.getCenter(new THREE.Vector3())
  for (const geometry of geometries) {
    geometry.translate(-center.x, -center.y, -center.z)
    geometry.computeBoundingBox()
  }
  return bounds.getSize(new THREE.Vector3())
}

// ---------------------------------------------------------------- texture space

/** Groups triangles into texture islands (connected through shared texture coordinates). */
function islands(geometry, attribute = 'uv') {
  const uv = geometry.attributes[attribute]
  const triangles = uv.count / 3
  const parent = Array.from({ length: triangles }, (_, i) => i)
  const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i] } return i }
  const seen = new Map()
  for (let t = 0; t < triangles; t += 1) {
    for (let k = 0; k < 3; k += 1) {
      const key = `${Math.round(uv.getX(t * 3 + k) * 1e5)},${Math.round(uv.getY(t * 3 + k) * 1e5)}`
      const other = seen.get(key)
      if (other === undefined) seen.set(key, t)
      else parent[find(t)] = find(other)
    }
  }
  const groups = new Map()
  for (let t = 0; t < triangles; t += 1) {
    const root = find(t)
    if (!groups.has(root)) groups.set(root, { triangles: [], x0: 1, y0: 1, x1: 0, y1: 0 })
    const group = groups.get(root)
    group.triangles.push(t)
    for (let k = 0; k < 3; k += 1) {
      const u = uv.getX(t * 3 + k)
      const v = uv.getY(t * 3 + k)
      group.x0 = Math.min(group.x0, u); group.y0 = Math.min(group.y0, v)
      group.x1 = Math.max(group.x1, u); group.y1 = Math.max(group.y1, v)
    }
  }
  return [...groups.values()]
}

/**
 * Packs a geometry's texture islands into a fresh atlas at the largest uniform scale that fits,
 * copying each source map region with it and rewriting the geometry's coordinates. The shared
 * encyclopedia atlas gives one volume ~1/12 of its area; repacked, the same volume gets all of it.
 */
function repack(geometry, maps, sourceSize = SIZE) {
  const parts = islands(geometry).map((island) => ({
    ...island, sx: island.x0 * sourceSize, sy: island.y0 * sourceSize,
    sw: (island.x1 - island.x0) * sourceSize, sh: (island.y1 - island.y0) * sourceSize,
  }))
  const pad = 10
  const fits = (scale) => {
    const order = [...parts].sort((a, b) => b.sh - a.sh)
    let x = pad
    let y = pad
    let row = 0
    for (const part of order) {
      const w = part.sw * scale + pad * 2
      const h = part.sh * scale + pad * 2
      if (x + w > SIZE) { x = pad; y += row; row = 0 }
      if (x + w > SIZE || y + h > SIZE) return null
      part.dx = x + pad
      part.dy = y + pad
      x += w
      row = Math.max(row, h)
    }
    return order
  }
  let low = 0.25
  let high = 8
  for (let step = 0; step < 30; step += 1) {
    const mid = (low + high) / 2
    if (fits(mid)) low = mid; else high = mid
  }
  const scale = low
  fits(scale)
  const out = maps.map(() => makeCanvas())
  maps.forEach((map, m) => {
    const target = ctx(out[m])
    target.imageSmoothingQuality = 'high'
    for (const part of parts) {
      const grow = pad / scale
      target.drawImage(map, part.sx - grow, part.sy - grow, part.sw + grow * 2, part.sh + grow * 2,
        part.dx - pad, part.dy - pad, part.sw * scale + pad * 2, part.sh * scale + pad * 2)
    }
  })
  const uv = geometry.attributes.uv
  for (const part of parts) {
    for (const t of part.triangles) {
      for (let k = 0; k < 3; k += 1) {
        const i = t * 3 + k
        uv.setXY(i, ((uv.getX(i) * sourceSize - part.sx) * scale + part.dx) / SIZE, ((uv.getY(i) * sourceSize - part.sy) * scale + part.dy) / SIZE)
      }
    }
  }
  return { maps: out, scale }
}

/** Least-squares affine (a, b) -> (px, py) as a canvas matrix. */
function fitAffine(samples) {
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  const bx = [0, 0, 0]
  const by = [0, 0, 0]
  for (const [a, b, x, y] of samples) {
    const r = [a, b, 1]
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) A[i][j] += r[i] * r[j]
      bx[i] += r[i] * x
      by[i] += r[i] * y
    }
  }
  const solve = (M, v) => {
    const m = M.map((row, i) => [...row, v[i]])
    for (let c = 0; c < 3; c += 1) {
      let p = c
      for (let r = c + 1; r < 3; r += 1) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r
      ;[m[c], m[p]] = [m[p], m[c]]
      for (let r = 0; r < 3; r += 1) {
        if (r === c) continue
        const f = m[r][c] / m[c][c]
        for (let k = c; k < 4; k += 1) m[r][k] -= f * m[c][k]
      }
    }
    return m.map((row, i) => row[3] / row[i])
  }
  const x = solve(A, bx)
  const y = solve(A, by)
  return new DOMMatrix([x[0], y[0], x[1], y[1], x[2], y[2]])
}

/**
 * Drawing frames on a face, in millimetres. Front: X from the spine edge toward the fore-edge,
 * Y from the head down. Back (seen from outside): X from the fore-edge toward the spine. Spine:
 * X from the head down, Y across, glyph tops toward the front cover. Returns the matrix into
 * texture pixels plus the face's extent in millimetres.
 */
function frame(geometry, face, attribute = 'uv') {
  const P = geometry.attributes.position
  const U = geometry.attributes[attribute]
  const { min, max } = geometry.boundingBox
  // The face is the largest texture island among triangles facing that way (by surface area),
  // which skips straps, clasps and board edges that also face outward.
  const want = face === 'front' ? [1, 0, 0] : face === 'back' ? [-1, 0, 0] : [0, 0, 1]
  // Direction from the stored vertex normals (winding order isn't consistent across sources).
  const N = geometry.attributes.normal
  const a = new THREE.Vector3(); const b = new THREE.Vector3(); const c = new THREE.Vector3()
  const n = new THREE.Vector3()
  const facing = []
  for (let t = 0; t < P.count / 3; t += 1) {
    a.fromBufferAttribute(P, t * 3); b.fromBufferAttribute(P, t * 3 + 1); c.fromBufferAttribute(P, t * 3 + 2)
    const area = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).length() / 2
    if (area < 1e-10) continue
    // Outer surface only: the inside of a board faces the same way as the far cover.
    const cx = (a.x + b.x + c.x) / 3
    const cz = (a.z + b.z + c.z) / 3
    const near = face === 'front' ? cx > max.x - (max.x - min.x) * 0.45
      : face === 'back' ? cx < min.x + (max.x - min.x) * 0.45
        : cz > max.z - (max.z - min.z) * 0.12
    if (!near) continue
    n.set(0, 0, 0)
    for (let k = 0; k < 3; k += 1) n.add(new THREE.Vector3().fromBufferAttribute(N, t * 3 + k))
    n.normalize()
    if (n.x * want[0] + n.y * want[1] + n.z * want[2] > (face === 'spine' ? 0.55 : 0.85)) facing.push({ t, area })
  }
  const parent = new Map(facing.map(({ t }) => [t, t]))
  const find = (i) => { while (parent.get(i) !== i) { parent.set(i, parent.get(parent.get(i))); i = parent.get(i) } return i }
  const seen = new Map()
  for (const { t } of facing) {
    for (let k = 0; k < 3; k += 1) {
      const key = `${Math.round(U.getX(t * 3 + k) * 1e5)},${Math.round(U.getY(t * 3 + k) * 1e5)}`
      if (seen.has(key)) parent.set(find(t), find(seen.get(key))); else seen.set(key, t)
    }
  }
  const area = new Map()
  for (const { t, area: s } of facing) area.set(find(t), (area.get(find(t)) ?? 0) + s)
  const best = [...area.entries()].sort((x, y) => y[1] - x[1])[0]?.[0]
  let samples = []
  for (const { t } of facing) {
    if (find(t) !== best) continue
    for (let k = 0; k < 3; k += 1) {
      const i = t * 3 + k
      const [p, q] = face === 'spine' ? [P.getX(i), P.getY(i)] : [P.getZ(i), P.getY(i)]
      samples.push([p, q, U.getX(i) * SIZE, U.getY(i) * SIZE])
    }
  }
  if (samples.length < 6) throw new Error(`${face} frame: only ${samples.length} samples`)
  // Refit without the worst residuals (seams, curling corners).
  let toTexture = fitAffine(samples)
  for (let pass = 0; pass < 2; pass += 1) {
    const residual = samples.map((s) => { const r = toTexture.transformPoint(new DOMPoint(s[0], s[1])); return Math.hypot(r.x - s[2], r.y - s[3]) })
    const cut = [...residual].sort((x, y) => x - y)[Math.floor(residual.length * 0.85)]
    samples = samples.filter((_, i) => residual[i] <= Math.max(cut, 1.5))
    toTexture = fitAffine(samples)
  }
  const height = (max.y - min.y) * 1000
  // The chosen island's extent in face millimetres, for laying out lettering inside it.
  const toFace = face === 'spine' ? ([p, q]) => [(max.y - q) * 1000, -p * 1000]
    : face === 'front' ? ([p, q]) => [(max.z - p) * 1000, (max.y - q) * 1000] : ([p, q]) => [(p - min.z) * 1000, (max.y - q) * 1000]
  // Every outward-facing texel that agrees with this mapping (other islands of the same face).
  const agreeing = []
  for (const { t } of facing) {
    for (let k = 0; k < 3; k += 1) {
      const i = t * 3 + k
      const pq = face === 'spine' ? [P.getX(i), P.getY(i)] : [P.getZ(i), P.getY(i)]
      const r = toTexture.transformPoint(new DOMPoint(pq[0], pq[1]))
      if (Math.hypot(r.x - U.getX(i) * SIZE, r.y - U.getY(i) * SIZE) < 3) agreeing.push(pq)
    }
  }
  const pts = (agreeing.length ? agreeing : samples).map(toFace)
  const box = { x0: Math.min(...pts.map((v) => v[0])), x1: Math.max(...pts.map((v) => v[0])), y0: Math.min(...pts.map((v) => v[1])), y1: Math.max(...pts.map((v) => v[1])) }
  if (face === 'spine') {
    return { m: toTexture.multiply(new DOMMatrix([0, -0.001, -0.001, 0, 0, max.y])), length: height, width: (max.x - min.x) * 1000, box }
  }
  const local = face === 'front' ? new DOMMatrix([-0.001, 0, 0, -0.001, max.z, max.y]) : new DOMMatrix([0.001, 0, 0, -0.001, min.z, max.y])
  return { m: toTexture.multiply(local), width: (max.z - min.z) * 1000, height, box }
}

/** Rasterises a geometry's triangles into a coverage mask in texture space. */
function coverage(geometry, attribute = 'uv') {
  const canvas = makeCanvas()
  const c = ctx(canvas)
  const uv = geometry.attributes[attribute]
  c.fillStyle = '#fff'
  c.beginPath()
  for (let i = 0; i < uv.count; i += 3) {
    c.moveTo(uv.getX(i) * SIZE, uv.getY(i) * SIZE)
    c.lineTo(uv.getX(i + 1) * SIZE, uv.getY(i + 1) * SIZE)
    c.lineTo(uv.getX(i + 2) * SIZE, uv.getY(i + 2) * SIZE)
    c.closePath()
  }
  c.fill()
  return c.getImageData(0, 0, SIZE, SIZE).data
}

/** Transfers a canvas laid out in one texture space (e.g. a jacket print in uv1) into another
 * (uv), triangle by triangle, through each triangle's own affine map. */
function transfer(source, geometry, from, to, target) {
  const A = geometry.attributes[from]
  const B = geometry.attributes[to]
  const t = ctx(target)
  for (let i = 0; i < A.count; i += 3) {
    const s = [0, 1, 2].map((k) => [A.getX(i + k) * SIZE, A.getY(i + k) * SIZE])
    const d = [0, 1, 2].map((k) => [B.getX(i + k) * SIZE, B.getY(i + k) * SIZE])
    const e1 = [s[1][0] - s[0][0], s[1][1] - s[0][1]]
    const e2 = [s[2][0] - s[0][0], s[2][1] - s[0][1]]
    const det = e1[0] * e2[1] - e1[1] * e2[0]
    if (Math.abs(det) < 1e-6) continue
    const f1 = [d[1][0] - d[0][0], d[1][1] - d[0][1]]
    const f2 = [d[2][0] - d[0][0], d[2][1] - d[0][1]]
    const inv = [e2[1] / det, -e1[1] / det, -e2[0] / det, e1[0] / det]
    const a = f1[0] * inv[0] + f2[0] * inv[1]
    const b = f1[1] * inv[0] + f2[1] * inv[1]
    const c = f1[0] * inv[2] + f2[0] * inv[3]
    const dd = f1[1] * inv[2] + f2[1] * inv[3]
    const e = d[0][0] - a * s[0][0] - c * s[0][1]
    const f = d[0][1] - b * s[0][0] - dd * s[0][1]
    // Clip slightly outside the triangle so neighbours meet without hairline gaps.
    const cx = (d[0][0] + d[1][0] + d[2][0]) / 3
    const cy = (d[0][1] + d[1][1] + d[2][1]) / 3
    t.save()
    t.beginPath()
    d.forEach(([x, y], k) => {
      const len = Math.hypot(x - cx, y - cy) || 1
      const gx = x + ((x - cx) / len) * 1.2
      const gy = y + ((y - cy) / len) * 1.2
      if (k === 0) t.moveTo(gx, gy); else t.lineTo(gx, gy)
    })
    t.closePath()
    t.clip()
    t.setTransform(a, b, c, dd, e, f)
    const sx = Math.max(0, Math.floor(Math.min(...s.map((p) => p[0]))) - 3)
    const sy = Math.max(0, Math.floor(Math.min(...s.map((p) => p[1]))) - 3)
    const sw = Math.min(SIZE - sx, Math.ceil(Math.max(...s.map((p) => p[0]))) - sx + 6)
    const sh = Math.min(SIZE - sy, Math.ceil(Math.max(...s.map((p) => p[1]))) - sy + 6)
    if (sw > 0 && sh > 0) t.drawImage(source, sx, sy, sw, sh, sx, sy, sw, sh)
    t.restore()
  }
}

// ---------------------------------------------------------------- painting

/** Flakes a gold layer away with wear (in whatever frame is current). */
function flake(c, book, width, height, density) {
  const random = seeded(hash(`${book.id}-flake`))
  c.save()
  c.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < Math.round(density * book.wear); i += 1) {
    c.globalAlpha = 0.4 + random() * 0.6
    const dot = 0.2 + random() * 0.55
    c.fillRect(random() * width, random() * height, dot, dot)
  }
  for (let i = 0; i < Math.round(6 * book.wear); i += 1) {
    const x = random() * width
    const y = random() * height
    const r = 1.5 + random() * 5 * book.wear
    const g = c.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(0,0,0,${0.35 + 0.5 * book.wear})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    c.globalAlpha = 1
    c.fillStyle = g
    c.fillRect(x - r, y - r, r * 2, r * 2)
  }
  c.restore()
}

/** Composites a gold layer: tooling shadow into the colour, gold on top, metal into the ORM map. */
function applyGold(color, orm, gold) {
  const c = ctx(color)
  const shadow = makeCanvas()
  const s = ctx(shadow)
  s.drawImage(gold, 0, 0)
  s.globalCompositeOperation = 'source-in'
  s.fillStyle = 'rgba(12, 7, 3, 0.6)'
  s.fillRect(0, 0, SIZE, SIZE)
  c.drawImage(shadow, 1.2, 1.2)
  c.drawImage(gold, 0, 0)
  const g = ctx(gold).getImageData(0, 0, SIZE, SIZE).data
  const o = ctx(orm)
  const data = o.getImageData(0, 0, SIZE, SIZE)
  for (let p = 0; p < SIZE * SIZE; p += 1) {
    const a = g[p * 4 + 3] / 255
    if (a <= 0) continue
    data.data[p * 4 + 1] = data.data[p * 4 + 1] * (1 - a) + 92 * a
    data.data[p * 4 + 2] = data.data[p * 4 + 2] * (1 - a) + 255 * a
  }
  o.putImageData(data, 0, 0)
}

/** Rubbed edges, bumped corners, scuffs and a cup ring on leather, in front/back frames. */
function leatherWear(color, book, faces) {
  const c = ctx(color)
  const random = seeded(hash(`${book.id}-leather`))
  const RUB = '176, 138, 98'
  const blob = (x, y, r, alpha) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(${RUB}, ${clamp(alpha)})`)
    g.addColorStop(1, `rgba(${RUB}, 0)`)
    c.fillStyle = g
    c.fillRect(x - r, y - r, r * 2, r * 2)
  }
  for (const face of faces) {
    c.setTransform(face.m)
    const { width, height } = face
    const edges = [[0, 0, width, 0, 1], [0, height, width, height, 1], [width, 0, width, height, 1.2], [0, 0, 0, height, 0.35]]
    for (const [x0, y0, x1, y1, weight] of edges) {
      const run = Math.hypot(x1 - x0, y1 - y0)
      const nx = y0 === y1 ? 0 : x0 === 0 ? 1 : -1
      const ny = x0 === x1 ? 0 : y0 === 0 ? 1 : -1
      for (let i = 0; i < Math.round(run * 0.9 * book.wear * weight); i += 1) {
        const t = random()
        const inward = random() ** 2 * (1.5 + 5 * book.wear)
        blob(x0 + (x1 - x0) * t + nx * inward, y0 + (y1 - y0) * t + ny * inward, 0.8 + random() * (1.5 + 4 * book.wear), (0.05 + random() * 0.12) * book.wear * weight)
      }
    }
    for (let i = 0; i < Math.round(26 * book.wear); i += 1) {
      const x = 8 + random() * (width - 16)
      const y = 8 + random() * (height - 16)
      const run = 1.5 + random() * 7
      const angle = random() * Math.PI
      c.globalAlpha = (0.08 + random() * 0.12) * book.wear
      c.strokeStyle = `rgb(${RUB})`
      c.lineWidth = 0.25 + random() * 0.35
      c.beginPath()
      c.moveTo(x, y)
      c.quadraticCurveTo(x + Math.cos(angle) * run / 2 + (random() - 0.5) * 1.5, y + Math.sin(angle) * run / 2, x + Math.cos(angle) * run, y + Math.sin(angle) * run)
      c.stroke()
      c.globalAlpha = 1
    }
  }
  if (book.wear > 0.55) {
    const face = faces[0]
    c.setTransform(face.m)
    const radius = 15 + random() * 8
    const cx = 35 + random() * (face.width - 70)
    const cy = 90 + random() * (face.height - 150)
    const start = random() * Math.PI * 2
    const pooled = random() * Math.PI * 2
    for (let i = 0; i < 48; i += 1) {
      const a0 = start + (Math.PI * 1.6 * i) / 48
      const heavy = 0.5 + 0.5 * Math.cos(a0 - pooled)
      c.globalAlpha = (0.08 + 0.18 * heavy) * book.wear
      c.strokeStyle = '#140c06'
      c.lineWidth = 0.4 + heavy * 1.2 * random()
      c.beginPath()
      c.arc(cx, cy, radius * (0.97 + random() * 0.06), a0, a0 + (Math.PI * 1.6) / 48)
      c.stroke()
    }
    c.globalAlpha = 1
  }
  c.setTransform(1, 0, 0, 1, 0, 0)
}

/** Recolours every covered, non-metal texel toward a dye, toning light panels down. */
function dye(color, orm, mask, hex) {
  const target = new THREE.Color(hex)
  const [th, ts, tl] = rgbToHsl(target.r, target.g, target.b)
  const c = ctx(color)
  const data = c.getImageData(0, 0, SIZE, SIZE)
  const metal = ctx(orm).getImageData(0, 0, SIZE, SIZE).data
  for (let p = 0; p < SIZE * SIZE; p += 1) {
    const o = p * 4
    if (mask[o + 3] < 128 || metal[o + 2] > 110) continue
    const [, s, l] = rgbToHsl(data.data[o] / 255, data.data[o + 1] / 255, data.data[o + 2] / 255)
    const panel = smoothstep(l, 0.25, 0.4)
    const sat = (s + (ts - s) * 0.65) * (1 - 0.5 * panel)
    const light = l * (0.6 + tl * 1.3 + (0.7 - (0.6 + tl * 1.3)) * panel)
    const [r, g, b] = hslToRgb(th, clamp(sat), clamp(light))
    data.data[o] = r * 255
    data.data[o + 1] = g * 255
    data.data[o + 2] = b * 255
  }
  c.putImageData(data, 0, 0)
}

/** Average colour of covered, non-metal texels (for the reader's plain cover faces). */
function averageColor(color, orm, mask) {
  const data = ctx(color).getImageData(0, 0, SIZE, SIZE).data
  const metal = ctx(orm).getImageData(0, 0, SIZE, SIZE).data
  let r = 0; let g = 0; let b = 0; let n = 0
  for (let p = 0; p < SIZE * SIZE; p += 7) {
    const o = p * 4
    if (mask[o + 3] < 128 || metal[o + 2] > 110) continue
    r += data[o]; g += data[o + 1]; b += data[o + 2]; n += 1
  }
  return `#${new THREE.Color(r / n / 255, g / n / 255, b / n / 255).getHexString()}`
}

/** The front cover, upright (spine at left, head at top), for the reader's opening board. */
function coverImage(color, front) {
  const canvas = makeCanvas(640, Math.round(640 * front.height / front.width))
  const c = canvas.getContext('2d')
  c.setTransform(new DOMMatrix().scale(640 / front.width).multiply(front.m.inverse()))
  c.drawImage(color, 0, 0)
  return canvas
}

// ---------------------------------------------------------------- export

function texture(canvas, srgb) {
  const t = new THREE.CanvasTexture(canvas)
  t.flipY = false
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.userData.mimeType = 'image/jpeg'
  return t
}

function material({ color, orm, normal, roughness = 1 }) {
  const occlusion = texture(orm, false)
  return new THREE.MeshStandardMaterial({
    map: texture(color, true), normalMap: normal ? texture(normal, false) : null,
    roughnessMap: occlusion, metalnessMap: occlusion, aoMap: occlusion, roughness, metalness: 1,
  })
}

async function exportGlb(parts) {
  const group = new THREE.Group()
  for (const { geometry, material: m, name } of parts) {
    const mesh = new THREE.Mesh(geometry, m)
    mesh.name = name
    group.add(mesh)
  }
  const buffer = await new GLTFExporter().parseAsync(group, { binary: true, maxTextureSize: SIZE })
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return { glb: btoa(binary), group }
}

const jpeg = (canvas, quality = 0.88) => canvas.toDataURL('image/jpeg', quality).split(',')[1]

// ---------------------------------------------------------------- recipes

async function research(src, book) {
  const node = src.encyclopedia.scene.getObjectByName('book_encyclopedia_set_01_book01')
  const meshes = []
  node.traverse((o) => { if (o.isMesh) meshes.push(o) })
  const cover = meshes.find((m) => m.material.name.endsWith('cover'))
  const paper = meshes.find((m) => m.material.name.endsWith('paper'))
  const coverGeometry = extract(cover, 1)
  const paperGeometry = extract(paper, 1)
  const size = orient([coverGeometry, paperGeometry], new THREE.Matrix4())
  const { maps: [color, orm, normal] } = repack(coverGeometry, [cover.material.map.image, cover.material.metalnessMap.image, cover.material.normalMap.image])
  const { maps: [paperColor, paperNormal] } = repack(paperGeometry, [paper.material.map.image, paper.material.normalMap.image])
  const front = frame(coverGeometry, 'front')
  const back = frame(coverGeometry, 'back')
  const spine = frame(coverGeometry, 'spine')

  // Lift the baked ENCYCLOPEDIA lettering out of the spine panels, row by row, in both maps.
  const colorData = ctx(color).getImageData(0, 0, SIZE, SIZE)
  const ormData = ctx(orm).getImageData(0, 0, SIZE, SIZE)
  const random = seeded(hash('research-inpaint'))
  const at = (X, Y) => spine.m.transformPoint(new DOMPoint(X, Y))
  const x0 = Math.ceil(Math.min(at(0, spine.width / 2).x, at(0, -spine.width / 2).x)) + 2
  const x1 = Math.floor(Math.max(at(0, spine.width / 2).x, at(0, -spine.width / 2).x)) - 2
  const lum = (x, y) => { const o = (y * SIZE + x) * 4; return 0.3 * colorData.data[o] + 0.59 * colorData.data[o + 1] + 0.11 * colorData.data[o + 2] }
  // Gold bands: texel rows down the spine that are mostly metal. Lettering is erased in the
  // panels between consecutive bands (not above the first or below the last, which hold the
  // tooled ornaments).
  const head = Math.ceil(Math.min(at(0, 0).y, at(spine.length, 0).y))
  const tail = Math.floor(Math.max(at(0, 0).y, at(spine.length, 0).y))
  const bands = []
  let run = null
  for (let y = head; y <= tail; y += 1) {
    let metal = 0
    for (let x = x0; x <= x1; x += 1) if (ormData.data[(y * SIZE + x) * 4 + 2] > 70) metal += 1
    const isBand = metal > (x1 - x0 + 1) * 0.5
    if (isBand && run === null) run = y
    if (!isBand && run !== null) { if (y - run >= 2) bands.push([run, y - 1]); run = null }
  }
  const panels = []
  for (let i = 0; i + 1 < bands.length; i += 1) panels.push([bands[i][1] + 2, bands[i + 1][0] - 2])
  console.log(`research spine bands: ${bands.length}, panels: ${panels.map((q) => q.join('-')).join(' ')}`)
  for (const [top, bottom] of panels) {
    const levels = []
    for (let y = top; y <= bottom; y += 2) for (let x = x0; x <= x1; x += 2) levels.push(lum(x, y))
    levels.sort((a, b) => a - b)
    const leather = levels[Math.floor(levels.length * 0.4)]
    const seed = (x, y) => ormData.data[(y * SIZE + x) * 4 + 2] > 40 || lum(x, y) > leather + 22
    const reach = Math.round(2 * (SIZE / 2048) * 2.5)
    const lettered = (x, y) => { for (let dy = -reach; dy <= reach; dy += 1) for (let dx = -reach; dx <= reach; dx += 1) if (seed(x + dx, y + dy)) return true; return false }
    for (let y = top; y <= bottom; y += 1) {
      const plain = []
      const marked = []
      for (let x = x0; x <= x1; x += 1) (lettered(x, y) ? marked : plain).push(x)
      for (const x of marked) {
        const source = (plain.length ? y * SIZE + plain[Math.floor(random() * plain.length)] : (y - 1) * SIZE + x) * 4
        const target = (y * SIZE + x) * 4
        for (let k = 0; k < 4; k += 1) { colorData.data[target + k] = colorData.data[source + k]; ormData.data[target + k] = ormData.data[source + k] }
      }
    }
  }
  ctx(color).putImageData(colorData, 0, 0)
  ctx(orm).putImageData(ormData, 0, 0)
  const mask = coverage(coverGeometry)
  dye(color, orm, mask, book.dye)
  leatherWear(color, book, [front, back])

  // Gold: title and volume number on the spine, a tooled frame and the title on the front.
  const gold = makeCanvas()
  const g = ctx(gold)
  g.fillStyle = GOLD
  g.strokeStyle = GOLD
  g.setTransform(spine.m)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const title = book.title.toUpperCase()
  const inverse = spine.m.inverse()
  const along = (y) => inverse.transformPoint(new DOMPoint((x0 + x1) / 2, y)).x
  const spans = panels.map(([a, b]) => [along(a), along(b)].sort((p, q) => p - q))
  const [t0, t1] = spans[0] ?? [0.135 * spine.length, 0.64 * spine.length]
  const label = spans[1] ?? [0.665 * spine.length, 0.805 * spine.length]
  let fontSize = spine.width * 0.42
  g.font = FONT(fontSize)
  if (g.measureText(title).width > (t1 - t0) * 0.86) fontSize *= ((t1 - t0) * 0.86) / g.measureText(title).width
  g.font = FONT(fontSize)
  g.fillText(title, (t0 + t1) / 2, 0)
  g.save()
  g.translate((label[0] + label[1]) / 2, 0)
  g.rotate(-Math.PI / 2)
  g.font = FONT(Math.min(spine.width * 0.36, (label[1] - label[0]) * 0.5))
  g.fillText('DV', 0, 0)
  g.restore()
  g.setTransform(front.m)
  g.lineWidth = 0.55
  g.strokeRect(9, 9, front.width - 18, front.height - 18)
  g.lineWidth = 0.3
  g.strokeRect(11.5, 11.5, front.width - 23, front.height - 23)
  g.textAlign = 'left'
  g.textBaseline = 'alphabetic'
  g.font = FONT(12.5)
  book.title.split(' ').forEach((word, line) => g.fillText(word, 22, 52 + line * 15.5))
  g.font = FONT(5.6)
  g.fillText('Dev Vyas', 22, front.height - 24)
  flake(g, book, front.width, front.height, 3600)
  g.setTransform(spine.m)
  flake(g, book, spine.length, spine.width, 2400)
  g.setTransform(1, 0, 0, 1, 0, 0)
  applyGold(color, orm, gold)

  // Paper edges tan with wear.
  const p = ctx(paperColor)
  p.globalCompositeOperation = 'multiply'
  p.fillStyle = `rgba(222, 196, 150, ${0.25 + 0.4 * book.wear})`
  p.fillRect(0, 0, SIZE, SIZE)
  const paperOrm = makeCanvas(4)
  ctx(paperOrm).fillStyle = 'rgb(255, 225, 0)'
  ctx(paperOrm).fillRect(0, 0, 4, 4)
  return {
    size, front, frames: { front, back, spine },
    parts: [
      { name: 'cover', geometry: coverGeometry, material: material({ color, orm, normal }) },
      { name: 'paper', geometry: paperGeometry, material: material({ color: paperColor, orm: paperOrm, normal: paperNormal }) },
    ],
    color, orm, mask,
  }
}

async function experience(src, book) {
  const node = src.binder.scene.getObjectByName('binder_notebook_closed')
  const meshes = []
  node.traverse((o) => { if (o.isMesh) meshes.push(o) })
  const mesh = meshes[0]
  const geometry = extract(mesh, 1)
  // Lying flat (front cover up, spine at -x, head at -z): stand it up in the book convention.
  const size = orient([geometry], new THREE.Matrix4().set(0, 1, 0, 0, 0, 0, -1, 0, -1, 0, 0, 0, 0, 0, 0, 1))
  const { maps: [color, orm, normal] } = repack(geometry, [mesh.material.map.image, mesh.material.metalnessMap.image, mesh.material.normalMap.image])
  const front = frame(geometry, 'front')
  const spine = frame(geometry, 'spine')

  // The maker's blind-stamped emblem (a teal-tinged ring, lower right of the front): replace
  // its texels with leather from just above it.
  const data = ctx(color).getImageData(0, 0, SIZE, SIZE)
  const ormData = ctx(orm).getImageData(0, 0, SIZE, SIZE)
  const emblem = []
  for (let X = front.width * 0.5; X < front.width; X += 0.25) {
    for (let Y = front.height * 0.55; Y < front.height; Y += 0.25) {
      const pt = front.m.transformPoint(new DOMPoint(X, Y))
      const o = (Math.round(pt.y) * SIZE + Math.round(pt.x)) * 4
      const r = data.data[o]; const g = data.data[o + 1]; const b = data.data[o + 2]
      if (b > r * 0.92 && g > r * 0.85) emblem.push([X, Y])
    }
  }
  if (emblem.length) {
    const xs = emblem.map((e) => e[0]); const ys = emblem.map((e) => e[1])
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    const radius = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 3
    for (let X = cx - radius; X <= cx + radius; X += 0.2) {
      for (let Y = cy - radius; Y <= cy + radius; Y += 0.2) {
        const d = Math.hypot(X - cx, Y - cy) / radius
        if (d > 1) continue
        const to = front.m.transformPoint(new DOMPoint(X, Y))
        const from = front.m.transformPoint(new DOMPoint(X - radius * 1.7, Y - radius * 1.7))
        const ti = (Math.round(to.y) * SIZE + Math.round(to.x)) * 4
        const fi = (Math.round(from.y) * SIZE + Math.round(from.x)) * 4
        const a = d < 0.8 ? 1 : 1 - (d - 0.8) / 0.2
        for (let k = 0; k < 3; k += 1) {
          data.data[ti + k] = data.data[ti + k] * (1 - a) + data.data[fi + k] * a
          ormData.data[ti + k] = ormData.data[ti + k] * (1 - a) + ormData.data[fi + k] * a
        }
      }
    }
  }
  ctx(color).putImageData(data, 0, 0)
  ctx(orm).putImageData(ormData, 0, 0)

  const gold = makeCanvas()
  const g = ctx(gold)
  g.fillStyle = GOLD
  g.setTransform(front.m)
  g.textAlign = 'left'
  g.textBaseline = 'alphabetic'
  const { x0: bx, x1: bx1, y0: by } = front.box
  const words = book.title.split(' ')
  let titleSize = 11.5
  g.font = FONT(titleSize)
  const widest = Math.max(...words.map((word) => g.measureText(word).width))
  titleSize = Math.min(titleSize, (bx1 - bx - 24) / widest * titleSize)
  g.font = FONT(titleSize)
  words.forEach((word, line) => g.fillText(word, bx + 12, by + 28 + line * titleSize * 1.2))
  g.font = FONT(5.2)
  g.fillText('Dev Vyas', bx + 12, by + 28 + titleSize * 1.2 * words.length + 4)
  console.log(`experience front island ${Math.round(bx)}-${Math.round(bx1)} mm of ${Math.round(front.width)}, title ${titleSize.toFixed(1)}`)
  flake(g, book, front.width, front.height, 3000)
  g.setTransform(spine.m)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = FONT(Math.min(spine.width * 0.36, 8))
  g.fillText(book.title.toUpperCase(), (spine.box.x0 + spine.box.x1) / 2, (spine.box.y0 + spine.box.y1) / 2)
  flake(g, book, spine.length, spine.width, 1600)
  g.setTransform(1, 0, 0, 1, 0, 0)
  applyGold(color, orm, gold)
  const mask = coverage(geometry)
  return { size, front, frames: { front, spine }, parts: [{ name: 'binder', geometry, material: material({ color, orm, normal }) }], color, orm, mask }
}

/** Printed decorative-set books: a jacket designed in its print space (uv1), transferred onto
 *  the scan (uv), and composited with the scan's own wear, crease and page-block masks. */
async function printed(src, book, meshName, base, design) {
  const mesh = src.decorative.getObjectByName(meshName)
  const geometry = extract(mesh, 0.01)
  flipV(geometry)
  let size = orient([geometry], new THREE.Matrix4())
  const dir = `${CACHE}/decorative_book_set_01/${base}`
  const [diff, arm, nor, edge, block, crease] = await Promise.all(['diff', 'arm', 'nor_gl', 'mask01', 'mask02', 'mask03'].map((m) => loadImage(`${dir}_${m}.jpg`)))
  // Which texture channel is the scan layout varies within the set. In the scan layout the
  // covers sit below the page-block strip at the top of the texture; the jacket print layout
  // spans the full height. Make the scan layout 'uv' and the jacket 'uv1'.
  {
    const N = geometry.attributes.normal
    const inStrip = (name) => {
      const U = geometry.attributes[name]
      let n = 0
      let total = 0
      for (let i = 0; i < U.count; i += 1) {
        if (Math.abs(N.getX(i)) < 0.9) continue
        total += 1
        if (U.getY(i) < 0.28) n += 1
      }
      return n / Math.max(total, 1)
    }
    const [scan, jacket] = [inStrip('uv'), inStrip('uv1')]
    if (scan > jacket) {
      const swap = geometry.attributes.uv
      geometry.setAttribute('uv', geometry.attributes.uv1)
      geometry.setAttribute('uv1', swap)
    }
    console.log(`${book.id}: cover texels in page strip uv ${scan.toFixed(2)}, uv1 ${jacket.toFixed(2)}${scan > jacket ? ' (swapped)' : ''}`)
  }
  // Some books in the set stand reversed. The fore-edge is where the page block shows (mask02),
  // so if more of it faces +z than -z, turn the book round so the spine is at +z.
  {
    const blockMask = ctx(fromImage(block)).getImageData(0, 0, SIZE, SIZE).data
    const P = geometry.attributes.position
    const U = geometry.attributes.uv
    const { min, max } = geometry.boundingBox
    let plus = 0
    let minus = 0
    for (let i = 0; i < P.count; i += 1) {
      const z = P.getZ(i)
      const paper = blockMask[(Math.floor(clamp(U.getY(i)) * (SIZE - 1)) * SIZE + Math.floor(clamp(U.getX(i)) * (SIZE - 1))) * 4] > 128
      if (!paper) continue
      if (z > max.z - (max.z - min.z) * 0.05) plus += 1
      if (z < min.z + (max.z - min.z) * 0.05) minus += 1
    }
    if (plus > minus) size = orient([geometry], new THREE.Matrix4().makeRotationY(Math.PI))
    console.log(`${book.id}: page block +z ${plus}, -z ${minus}${plus > minus ? ' (turned round)' : ''}`)
  }
  const print = makeCanvas()
  const ink = makeCanvas()
  const gold = makeCanvas()
  const frames = { front: frame(geometry, 'front', 'uv1'), back: frame(geometry, 'back', 'uv1'), spine: frame(geometry, 'spine', 'uv1') }
  design(ctx(print), ctx(gold), frames)

  const printed = makeCanvas()
  transfer(print, geometry, 'uv1', 'uv', printed)
  const goldOnScan = makeCanvas()
  transfer(gold, geometry, 'uv1', 'uv', goldOnScan)
  void ink

  const color = fromImage(diff)
  const orm = fromImage(arm)
  const maps = [color, fromImage(edge), fromImage(block), fromImage(crease), printed].map((c) => ctx(c).getImageData(0, 0, SIZE, SIZE))
  const [base_, edgeData, blockData, creaseData, printData] = maps
  const ormData = ctx(orm).getImageData(0, 0, SIZE, SIZE)
  // Reference cloth brightness, so the print takes the cloth's grain and shading, not its tone.
  let sum = 0; let n = 0
  for (let p = 0; p < SIZE * SIZE; p += 13) { if (blockData.data[p * 4] < 128) { const o = p * 4; sum += base_.data[o] * 0.3 + base_.data[o + 1] * 0.59 + base_.data[o + 2] * 0.11; n += 1 } }
  const reference = sum / n
  for (let p = 0; p < SIZE * SIZE; p += 1) {
    const o = p * 4
    if (blockData.data[o] > 128 || printData.data[o + 3] < 8) continue
    const grain = clamp((base_.data[o] * 0.3 + base_.data[o + 1] * 0.59 + base_.data[o + 2] * 0.11) / reference, 0.55, 1.35)
    const worn = clamp((edgeData.data[o] / 255 - 0.55) / 0.35) * (0.3 + book.wear)
    const cracked = (creaseData.data[o] / 255) * (0.25 + book.wear) * 0.8
    for (let k = 0; k < 3; k += 1) {
      const inked = printData.data[o + k] * grain
      const scuffed = inked + (base_.data[o + k] * 1.08 - inked) * clamp(worn)
      base_.data[o + k] = clamp(scuffed + (235 - scuffed) * cracked, 0, 255)
    }
    ormData.data[o + 1] = ormData.data[o + 1] * (1 - design.gloss) + 120 * design.gloss
  }
  ctx(color).putImageData(base_, 0, 0)
  ctx(orm).putImageData(ormData, 0, 0)
  applyGold(color, orm, goldOnScan)
  const front = frame(geometry, 'front')
  const mask = coverage(geometry)
  return { size, front, frames: { front, ...Object.fromEntries(Object.entries(frames).map(([k, v]) => [`print-${k}`, v])) }, debugPrint: print, debugGold: gold, parts: [{ name: 'book', geometry, material: material({ color, orm, normal: fromImage(nor) }) }], color, orm, mask }
}

function projectsDesign(book) {
  const design = (p, g, { front, back, spine }) => {
    p.fillStyle = '#1d2b3f'
    p.fillRect(0, 0, SIZE, SIZE)
    g.fillStyle = GOLD
    g.strokeStyle = GOLD
    // Front: a gold-blocked title over a fine rule, the author at the foot.
    g.setTransform(front.m)
    g.textAlign = 'left'
    g.textBaseline = 'alphabetic'
    g.font = FONT(13)
    g.fillText(book.title, 16, 46)
    g.fillRect(16, 53, 34, 0.7)
    g.font = FONT(5.6)
    g.fillText('Dev Vyas', 16, front.height - 20)
    flake(g, book, front.width, front.height, 2200)
    // Spine: title down the spine, author at the foot.
    g.setTransform(spine.m)
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = FONT(Math.min(spine.width * 0.36, 9))
    g.fillText(book.title.toUpperCase(), spine.length * 0.38, 0)
    g.font = FONT(Math.min(spine.width * 0.22, 5))
    g.fillText('DEV VYAS', spine.length * 0.86, 0)
    g.fillRect(spine.length * 0.06, -spine.width * 0.32, 0.6, spine.width * 0.64)
    g.fillRect(spine.length * 0.94, -spine.width * 0.32, 0.6, spine.width * 0.64)
    flake(g, book, spine.length, spine.width, 900)
    g.setTransform(1, 0, 0, 1, 0, 0)
    void back
  }
  design.gloss = 0
  return design
}

function writingsDesign(book, posts) {
  const design = (p, g, { front, back, spine }) => {
    // A matte printed paperback: forest green field, a cream band, teal accent.
    p.fillStyle = '#20453a'
    p.fillRect(0, 0, SIZE, SIZE)
    p.setTransform(front.m)
    p.fillStyle = '#efe7d6'
    p.fillRect(0, front.height * 0.16, front.width, front.height * 0.3)
    p.fillStyle = '#1f706b'
    p.fillRect(0, front.height * 0.46, front.width, 1.6)
    p.fillStyle = '#1d1a16'
    p.font = FONT(15)
    p.textBaseline = 'alphabetic'
    p.fillText(book.title, 12, front.height * 0.16 + 26)
    p.font = FONT(4.6, 500)
    p.fillStyle = '#3b352d'
    p.fillText('Essays on harness engineering', 12, front.height * 0.16 + 36)
    p.fillText('and the systems between model calls', 12, front.height * 0.16 + 42)
    p.fillStyle = '#efe7d6'
    p.font = FONT(6)
    p.fillText('Dev Vyas', 12, front.height - 16)
    // Back: the posts so far, set like a contents list.
    p.setTransform(back.m)
    p.fillStyle = '#efe7d6'
    p.font = FONT(5, 600)
    p.fillText('In this volume', 14, 30)
    p.font = FONT(4.2, 400)
    posts.forEach((post, i) => p.fillText(post, 14, 40 + i * 7))
    p.fillStyle = '#1f706b'
    p.fillRect(14, 33, 22, 0.8)
    // Spine.
    p.setTransform(spine.m)
    p.fillStyle = '#efe7d6'
    p.textAlign = 'center'
    p.textBaseline = 'middle'
    p.font = FONT(Math.min(spine.width * 0.42, 9))
    p.fillText(book.title.toUpperCase(), spine.length * 0.36, 0)
    p.font = FONT(Math.min(spine.width * 0.26, 5), 500)
    p.fillText('DEV VYAS', spine.length * 0.85, 0)
    p.setTransform(1, 0, 0, 1, 0, 0)
    void g
  }
  design.gloss = 0.35
  return design
}

// ---------------------------------------------------------------- preview

async function previewOf(group, label) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setSize(700, 700)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#d9d2c6')
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  const key = new THREE.DirectionalLight(0xfff2df, 2.4)
  key.position.set(1, 2, 2)
  scene.add(key, new THREE.HemisphereLight(0xfff4e6, 0x484139, 0.6), group)
  const sheet = makeCanvas(1400, 720)
  const s = sheet.getContext('2d')
  for (const [i, pos] of [[0, [0.42, 0.06, 0.12]], [1, [0.12, 0.05, 0.42]]].entries()) {
    const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 10)
    camera.position.set(...pos[1])
    camera.lookAt(0, 0, 0)
    renderer.render(scene, camera)
    s.drawImage(renderer.domElement, i * 700, 20)
  }
  s.fillStyle = '#000'
  s.font = '16px monospace'
  s.fillText(label, 8, 16)
  renderer.dispose()
  return sheet.toDataURL('image/png').split(',')[1]
}

/** The finished colour map at half size with each face frame outlined (print frames are in the
 *  jacket's own layout, so they're drawn over the print instead). */
function atlasDebug(result) {
  const sheet = makeCanvas(result.debugPrint ? 2048 : 1024, 1024)
  const c = sheet.getContext('2d')
  c.drawImage(result.color, 0, 0, 1024, 1024)
  if (result.debugPrint) c.drawImage(result.debugPrint, 1024, 0, 1024, 1024)
  if (result.debugGold) c.drawImage(result.debugGold, 1024, 0, 1024, 1024)
  const colors = { front: 'red', back: 'blue', spine: 'lime' }
  for (const [name, f] of Object.entries(result.frames)) {
    const print = name.startsWith('print-')
    const kind = name.replace('print-', '')
    c.setTransform(new DOMMatrix().translate(print ? 1024 : 0, 0).scale(0.5).multiply(f.m))
    c.strokeStyle = colors[kind]
    c.lineWidth = 1.5
    if (kind === 'spine') c.strokeRect(0, -f.width / 2, f.length, f.width)
    else c.strokeRect(0, 0, f.width, f.height)
    c.setTransform(1, 0, 0, 1, 0, 0)
  }
  return sheet.toDataURL('image/png').split(',')[1]
}

// ---------------------------------------------------------------- entry

async function sources() {
  const gltf = new GLTFLoader()
  const encyclopedia = await gltf.loadAsync(`${CACHE}/book_encyclopedia_set_01/book_encyclopedia_set_01.gltf`)
  const binder = await gltf.loadAsync(`${CACHE}/binder_notebook/binder_notebook.gltf`)
  const decorative = await new FBXLoader().loadAsync(`${CACHE}/decorative_book_set_01/decorative_book_set_01.fbx`)
  decorative.updateMatrixWorld(true)
  return { encyclopedia, binder, decorative }
}

window.bakeBooks = async ({ preview = false, only } = {}) => {
  await document.fonts.load(FONT(40))
  await document.fonts.load(FONT(40, 500))
  await document.fonts.load(FONT(40, 400))
  const src = await sources()
  const books = [
    { id: 'experience', title: 'Work Experience', wear: 0.85, bake: (b) => experience(src, b) },
    { id: 'research', title: 'Research', wear: 0.6, dye: '#6e2620', bake: (b) => research(src, b) },
    { id: 'projects', title: 'Projects', wear: 0.38, bake: (b) => printed(src, b, 'book_hardcover_01_cover47', 'book_hardcover_01', projectsDesign(b)) },
    { id: 'writings', title: 'Writings', wear: 0.12, bake: (b) => printed(src, b, 'book_softcover_01_cover82', 'book_softcover_01', writingsDesign(b, ["Don't Touch Page One"])) },
  ]
  const files = {}
  const previews = {}
  const manifest = {}
  for (const book of books) {
    if (only && !only.includes(book.id)) continue
    console.log(`baking ${book.id}`)
    const result = await book.bake(book)
    const { glb, group } = await exportGlb(result.parts)
    files[`${book.id}.glb`] = glb
    files[`${book.id}-cover.jpg`] = jpeg(coverImage(result.color, result.front))
    manifest[book.id] = {
      model: `assets/models/books/${book.id}.glb`,
      cover: `assets/models/books/${book.id}-cover.jpg`,
      size: result.size.toArray().map((v) => +v.toFixed(5)),
      color: averageColor(result.color, result.orm, result.mask),
    }
    if (preview) previews[`atlas-${book.id}.png`] = atlasDebug(result)
    if (preview) previews[`preview-${book.id}.png`] = await previewOf(group, `${book.id} ${result.size.toArray().map((v) => (v * 1000).toFixed(0)).join('x')} mm`)
  }
  return { files, manifest, previews }
}
