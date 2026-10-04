import * as THREE from 'three'

// One camera for two renderers: the laptop (Engine.jsx, vanilla three) and the shelf
// (newsletter-bookshelf.tsx, R3F) draw from the same pose, so the glide between them reads as a
// single studio. Poses here are in laptop units.

// The shelf world sits beside the laptop on the same floor, scaled so a book stands about 0.8x
// the laptop's width (a 24 cm book next to a 31 cm laptop).
export const SHELF_OFFSET = new THREE.Vector3(9, 0, -0.6)
export const SHELF_SCALE = 0.62

export const stage = {
  // 'director' while Engine drives the glide; 'shelf' once the shelf's own camera takes over.
  owner: 'director',
  position: new THREE.Vector3(0, 2, 6),
  target: new THREE.Vector3(),
  fov: 32,
  // The shelf camera's resting pose (shelf units), published by its CameraRig.
  rest: null,
  // True while Engine's loop advances the shelf canvas (frameloop "never").
  driven: true,
}

const listeners = new Set()

export function subscribeDriven(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setDriven(driven) {
  stage.driven = driven
  listeners.forEach((listener) => listener())
}

export const toShelf = (point, out) => out.copy(point).sub(SHELF_OFFSET).divideScalar(SHELF_SCALE)
export const fromShelf = (point, out) => out.copy(point).multiplyScalar(SHELF_SCALE).add(SHELF_OFFSET)
