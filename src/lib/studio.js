import * as THREE from 'three'

// Shared photo-studio look for the laptop (Engine.jsx) and shelf (newsletter-bookshelf.tsx)
// renderers, so both scenes reflect the same softboxes and follow the same theme.

// Light/dark presets. ambient/key/fill/environment/exposure/shadow scale each scene's own
// tuned base values; rim and contact are absolute (light intensity, decal opacity).
export const STUDIO = {
  light: {
    ambient: 1, key: 1, fill: 1, rim: 0.35, environment: 1, exposure: 1,
    shadow: 1, contact: 0.5, shadowColor: new THREE.Color('#211a14'),
  },
  dark: {
    ambient: 0.4, key: 0.9, fill: 0.45, rim: 1.9, environment: 0.7, exposure: 0.95,
    shadow: 3.2, contact: 0.85, shadowColor: new THREE.Color('#000000'),
  },
}

const blended = { ...STUDIO.light, shadowColor: new THREE.Color() }

// mix: 0 = light, 1 = dark. Returns a shared object; read it, don't keep it.
export function blendStudio(mix) {
  const { light, dark } = STUDIO
  for (const key of Object.keys(light)) {
    if (key !== 'shadowColor') blended[key] = THREE.MathUtils.lerp(light[key], dark[key], mix)
  }
  blended.shadowColor.lerpColors(light.shadowColor, dark.shadowColor, mix)
  return blended
}

export function isDarkTheme() {
  return document.documentElement.dataset.background === 'dark'
}

export function watchTheme(callback) {
  const observer = new MutationObserver(() => callback(isDarkTheme()))
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-background'] })
  return () => observer.disconnect()
}

// Procedural softbox studio baked to an environment map. Emissive panels above 1.0
// act as area lights for PMREM, as in three's RoomEnvironment. The caller disposes it.
export function createStudioEnvironment(renderer) {
  const room = new THREE.Scene()
  const disposables = []
  const add = (geometry, color, position, scale = 1) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(scale), side: THREE.DoubleSide })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(...position)
    disposables.push(geometry, material)
    room.add(mesh)
    return mesh
  }
  // Neutral grey cyclorama: metals take their tone from it, so it must not tint them.
  const shell = add(new THREE.BoxGeometry(26, 14, 26), '#7c7b79', [0, 6, 0])
  shell.material.side = THREE.BackSide
  add(new THREE.PlaneGeometry(26, 26), '#8d8a86', [0, -0.98, 0]).rotation.x = -Math.PI / 2
  // Key softbox upper-left-front, matching the key DirectionalLight at (-3, 7, 5).
  add(new THREE.PlaneGeometry(7, 4.5), '#fff6ec', [-6.5, 7.5, 6.5], 16).lookAt(0, 0.8, 0)
  // Tall strip behind-right: the long edge highlight on aluminium and book boards.
  add(new THREE.PlaneGeometry(1.4, 9), '#ffffff', [8, 4, -6], 12).lookAt(0, 0.8, 0)
  // Broad overhead fill.
  add(new THREE.PlaneGeometry(9, 9), '#fffaf3', [0, 12.5, 0], 4).lookAt(0, 0, 0)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const target = pmrem.fromScene(room, 0.035)
  pmrem.dispose()
  disposables.forEach((item) => item.dispose())
  return target
}

// One soft rounded-rectangle occlusion blob for use as an alphaMap (read from the green
// channel, so the falloff is drawn as white-on-black brightness). The shape fills the
// middle half of the texture: a decal scaled to 2x the footprint puts it on the footprint.
// The shape is drawn off-canvas and only its shadowBlur lands; ctx.filter lacks older Safari.
export function contactShadowTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  context.fillStyle = '#000'
  context.fillRect(0, 0, size, size)
  context.shadowColor = '#fff'
  context.shadowBlur = 34
  context.shadowOffsetX = size * 2
  context.beginPath()
  context.roundRect(size * 0.25 - size * 2, size * 0.25, size * 0.5, size * 0.5, size * 0.06)
  context.fill()
  return new THREE.CanvasTexture(canvas)
}

export function contactShadowMaterial(texture) {
  return new THREE.MeshBasicMaterial({
    color: '#000000',
    alphaMap: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  })
}
