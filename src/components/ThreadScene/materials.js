import {
  BackSide,
  ClampToEdgeWrapping,
  Color,
  DataTexture,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  RGBAFormat,
  SRGBColorSpace,
} from 'three'

let ramp

export function celRamp() {
  if (ramp) return ramp
  const data = new Uint8Array([
    22, 20, 18, 255,
    108, 102, 96, 255,
    236, 228, 216, 255,
  ])
  ramp = new DataTexture(data, 3, 1, RGBAFormat)
  ramp.magFilter = NearestFilter
  ramp.minFilter = NearestFilter
  ramp.wrapS = ClampToEdgeWrapping
  ramp.wrapT = ClampToEdgeWrapping
  ramp.generateMipmaps = false
  ramp.colorSpace = SRGBColorSpace
  ramp.needsUpdate = true
  return ramp
}

export function celMaterial(hex, opacity = 1) {
  const material = new MeshToonMaterial({
    color: new Color(hex),
    gradientMap: celRamp(),
    flatShading: true,
  })
  if (opacity < 1) {
    material.transparent = true
    material.opacity = opacity
  }
  return material
}

export function inkMaterial() {
  return new MeshBasicMaterial({
    color: new Color('#1a140f'),
    side: BackSide,
  })
}
