import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { animate, onScroll } from 'animejs'
import 'animejs/adapters/three'

const SPECTRUM = [0xff4b4b, 0xff7a3c, 0xf2c14e, 0x3ddc97, 0x3ec6ff, 0x4d6bff, 0xb46bff]

function toonRamp() {
  const data = new Uint8Array([28, 118, 246])
  const map = new THREE.DataTexture(data, 3, 1, THREE.RedFormat)
  map.minFilter = THREE.NearestFilter
  map.magFilter = THREE.NearestFilter
  map.colorSpace = THREE.NoColorSpace
  map.needsUpdate = true
  return map
}

function markReady() {
  document.documentElement.dataset.webgl = '1'
  window.dispatchEvent(new Event('portfolio:webgl'))
}

function readTone() {
  const mark = window.innerHeight * 0.5
  let tone = 'dark'
  document.querySelectorAll('.chapter').forEach((section) => {
    const rect = section.getBoundingClientRect()
    if (rect.top <= mark && rect.bottom > mark) tone = section.dataset.tone || 'dark'
  })
  return tone
}

export default function Engine() {
  const host = useRef(null)

  useEffect(() => {
    const el = host.current
    if (!el) return undefined

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch {
      markReady()
      return undefined
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.background = 'transparent'
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 40)
    camera.position.set(0, 0.05, 7.4)

    const ramp = toonRamp()
    const sphereGeo = new THREE.SphereGeometry(1.46, 48, 32)
    const cageGeo = new THREE.IcosahedronGeometry(1.62, 1)
    const satGeo = new THREE.SphereGeometry(0.048, 12, 10)
    const ringGeo = new THREE.TorusGeometry(2.08, 0.014, 16, 180)
    const ring2Geo = new THREE.TorusGeometry(2.32, 0.006, 8, 140)

    const solidMat = new THREE.MeshToonMaterial({
      color: 0xd8d4ce,
      gradientMap: ramp,
      transparent: true,
      opacity: 0.05,
    })
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0x141312,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
    })
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xf6f4f2,
      wireframe: true,
      transparent: true,
      opacity: 0.92,
    })
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff4b4b })
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xf6f4f2,
      transparent: true,
      opacity: 0.38,
    })

    const solid = new THREE.Mesh(sphereGeo, solidMat)
    const shell = new THREE.Mesh(sphereGeo, shellMat)
    shell.scale.setScalar(1.035)
    const wire = new THREE.Mesh(cageGeo, wireMat)
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2.18
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat)
    ring2.rotation.x = Math.PI / 2.65
    ring2.rotation.y = 0.45

    const sats = new THREE.Group()
    const satMats = SPECTRUM.map((color) => new THREE.MeshBasicMaterial({ color }))
    satMats.forEach((material, index) => {
      const mesh = new THREE.Mesh(satGeo, material)
      const angle = (index / satMats.length) * Math.PI * 2
      mesh.position.set(Math.cos(angle) * 2.18, 0, Math.sin(angle) * 2.18)
      sats.add(mesh)
    })
    sats.rotation.x = Math.PI / 2.35

    const spun = new THREE.Group()
    spun.add(shell, solid, wire, ring, ring2, sats)
    spun.rotation.x = THREE.MathUtils.degToRad(14)

    const rig = new THREE.Group()
    rig.add(spun)
    scene.add(rig)

    scene.add(new THREE.AmbientLight(0xffffff, 0.28))
    const key = new THREE.DirectionalLight(0xfff4ec, 2.4)
    key.position.set(4.2, 5.4, 4)
    const fill = new THREE.DirectionalLight(0x9eb0ff, 0.55)
    fill.position.set(-5, -1.5, 2.2)
    scene.add(key, fill)

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scrollRoot = document.getElementById('scroll-root')
    const scroll = {
      target: scrollRoot || document.documentElement,
      enter: 'top top',
      leave: 'bottom bottom',
      sync: true,
    }

    const spin = animate(spun, {
      rotateY: reduce ? 28 : 680,
      rotateX: reduce ? 18 : 32,
      ease: 'linear',
      autoplay: onScroll(scroll),
    })

    const shade = { t: 0 }
    const shadeAnim = animate(shade, {
      t: 1,
      ease: 'linear',
      autoplay: onScroll(scroll),
    })

    const wireOnDark = new THREE.Color('#f6f4f2')
    const wireOnLight = new THREE.Color('#252423')
    let toneMix = 1
    let frame = 0
    const clock = new THREE.Clock()

    const layout = () => {
      const width = window.innerWidth
      const mobile = width < 760
      const compact = width < 1100
      spun.position.set(mobile ? 0 : 2.35, mobile ? 1.22 : 0.06, 0)
      spun.scale.setScalar(mobile ? 0.56 : compact ? 0.76 : 0.94)
      camera.aspect = width / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(width, window.innerHeight)
    }

    const render = () => {
      frame = requestAnimationFrame(render)
      const time = clock.getElapsedTime()
      if (!reduce) rig.rotation.y = time * 0.16
      else rig.rotation.y = 0.45

      const step = Math.min(1, Math.max(0, (shade.t - 0.02) / 0.24))
      const eased = step * step * (3 - 2 * step)
      solidMat.opacity = 0.04 + eased * 0.96
      wireMat.opacity = 0.92 - eased * 0.68
      shellMat.opacity = eased
      ring2Mat.opacity = 0.16 + (1 - eased) * 0.36
      sats.rotation.z = reduce ? 0.2 : time * 0.22

      const target = readTone() === 'light' ? 0 : 1
      toneMix += (target - toneMix) * 0.08
      wireMat.color.copy(wireOnLight).lerp(wireOnDark, toneMix)
      ring2Mat.color.copy(wireMat.color)

      renderer.render(scene, camera)
    }

    layout()
    render()
    markReady()
    window.addEventListener('resize', layout)

    return () => {
      cancelAnimationFrame(frame)
      spin.revert()
      shadeAnim.revert()
      window.removeEventListener('resize', layout)
      renderer.dispose()
      ;[sphereGeo, cageGeo, satGeo, ringGeo, ring2Geo].forEach((geo) => geo.dispose())
      ;[solidMat, shellMat, wireMat, ringMat, ring2Mat, ...satMats].forEach((mat) => mat.dispose())
      ramp.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={host} className="engine" aria-hidden="true" />
}
