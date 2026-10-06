import * as THREE from 'three'

// One camera for two renderers: the laptop (Engine.jsx, vanilla three) drives it, and the shelf
// (newsletter-bookshelf.tsx, R3F) is drawn from it in the same frame. During the dive the shelf
// is seen through the laptop's display, so Engine publishes the shelf camera's pose already
// mapped through that window, in shelf units.

export const stage = {
  // 'director' while Engine drives the dive; 'shelf' once the shelf's own camera takes over.
  owner: 'director',
  shelfPosition: new THREE.Vector3(0, 3, 30),
  shelfQuaternion: new THREE.Quaternion(),
  fov: 35,
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
