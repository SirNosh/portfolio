import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { contact } from '../../app/siteData'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function smooth(value) {
  const t = clamp(value, 0, 1)
  return t * t * (3 - 2 * t)
}

function markReady() {
  document.documentElement.dataset.webgl = '1'
  window.dispatchEvent(new Event('portfolio:webgl'))
}

function shelfReveal() {
  const shelf = document.getElementById('shelf')
  if (!shelf) return 0
  const top = shelf.getBoundingClientRect().top
  return clamp((window.innerHeight - top) / window.innerHeight, 0, 1)
}

function makeLaptop() {
  const width = 2.28
  const depth = 1.52
  const aluminum = new THREE.MeshStandardMaterial({
    color: 0xc8c6c2,
    metalness: 0.72,
    roughness: 0.28,
  })
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1918, roughness: 0.6, metalness: 0.1 })
  const key = new THREE.MeshStandardMaterial({ color: 0x2a2928, roughness: 0.72 })
  const glass = new THREE.MeshStandardMaterial({ color: 0x0c0c0b, roughness: 0.4 })

  const laptop = new THREE.Group()
  const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.075, depth), aluminum)
  base.position.y = 0.04
  const deck = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.012, depth * 0.62), key)
  deck.position.set(0, 0.084, 0.02)
  const pad = new THREE.Mesh(new THREE.BoxGeometry(width * 0.34, 0.01, depth * 0.22), aluminum)
  pad.position.set(0, 0.094, depth * 0.3)
  laptop.add(base, deck, pad)

  const rows = [14, 14, 13, 12, 10]
  rows.forEach((count, row) => {
    const kw = width * 0.048
    const kd = depth * 0.042
    const span = width * 0.78
    const gap = count > 1 ? (span - count * kw) / (count - 1) : 0
    const z = -depth * 0.22 + row * (kd + depth * 0.016)
    for (let i = 0; i < count; i += 1) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(kw, 0.014, kd), key)
      cap.position.set(-span / 2 + kw / 2 + i * (kw + gap), 0.096, z)
      laptop.add(cap)
    }
  })

  const lid = new THREE.Group()
  lid.position.set(0, 0.078, -depth / 2)
  const lidBody = new THREE.Mesh(new THREE.BoxGeometry(width, 0.055, depth), aluminum)
  lidBody.position.set(0, 0.028, depth / 2)
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(width * 0.96, 0.012, depth * 0.94), dark)
  bezel.position.set(0, -0.004, depth / 2)
  const display = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.008, 1.26), glass)
  display.position.set(0, -0.01, depth / 2 + 0.02)
  const notch = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.016, 0.06), dark)
  notch.position.set(0, -0.012, depth * 0.9)
  lid.add(lidBody, bezel, display, notch)

  const anchor = new THREE.Object3D()
  anchor.position.set(0, -0.02, depth / 2 + 0.02)
  anchor.rotation.x = Math.PI / 2
  anchor.scale.setScalar(2.02 / 640)
  lid.add(anchor)
  laptop.add(lid)

  return { laptop, lid, anchor, materials: [aluminum, dark, key, glass] }
}

function screenElement() {
  const el = document.createElement('div')
  el.className = 'laptop-screen'
  el.innerHTML = `
    <p class="screen-name">Dev Vyas</p>
    <p class="screen-role">Harness Engineering and Efficient ML Research</p>
    <p class="screen-links">
      <a href="${contact.github}" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="${contact.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
    </p>
  `
  return el
}

export default function Engine() {
  const host = useRef(null)
  const glHost = useRef(null)
  const cssHost = useRef(null)

  useEffect(() => {
    const el = host.current
    const glEl = glHost.current
    const cssEl = cssHost.current
    if (!el || !glEl || !cssEl) return undefined

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

    const narrowScreen = () => window.innerWidth < 760 && window.innerWidth <= window.innerHeight
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrowScreen() ? 2 : 1.75))
    renderer.setSize(glEl.clientWidth || window.innerWidth, glEl.clientHeight || window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.background = 'transparent'
    renderer.domElement.setAttribute('aria-hidden', 'true')
    glEl.appendChild(renderer.domElement)

    const cssRenderer = new CSS3DRenderer()
    cssRenderer.domElement.style.position = 'absolute'
    cssRenderer.domElement.style.inset = '0'
    cssRenderer.domElement.style.pointerEvents = 'none'
    cssEl.appendChild(cssRenderer.domElement)

    const scene = new THREE.Scene()
    const cssScene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40)

    const { laptop, lid, anchor, materials } = makeLaptop()
    scene.add(laptop)

    const screenEl = screenElement()
    const cssScreen = new CSS3DObject(screenEl)
    cssScene.add(cssScreen)

    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xfff4ec, 2.2)
    key.position.set(3.2, 5.2, 4.4)
    const fill = new THREE.DirectionalLight(0x9eb0ff, 0.4)
    fill.position.set(-4, 1.2, 2)
    scene.add(key, fill)

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const view = { z: 5.05, y: 0.46 }
    let frame = 0

    const layout = () => {
      const width = el.clientWidth || window.innerWidth
      const height = el.clientHeight || window.innerHeight
      const portrait = window.innerWidth <= window.innerHeight
      const mobile = window.innerWidth < 760 && portrait
      const landscapePhone = window.innerHeight < 520 && !portrait
      if (mobile) {
        laptop.position.set(0, 0.04, 0)
        laptop.scale.setScalar(0.5)
        laptop.rotation.y = -0.1
        view.z = 4.55
        view.y = 0.4
      } else if (landscapePhone) {
        laptop.position.set(0, 0.02, 0)
        laptop.scale.setScalar(0.84)
        laptop.rotation.y = -0.22
        view.z = 4.35
        view.y = 0.22
      } else {
        laptop.position.set(0, -0.06, 0)
        laptop.scale.setScalar(1.18)
        laptop.rotation.y = -0.32
        view.z = 5.05
        view.y = 0.46
      }
      camera.aspect = width / Math.max(height, 1)
      camera.position.set(0, view.y, view.z)
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 2 : 1.75))
      renderer.setSize(width, height, false)
      cssRenderer.setSize(width, height)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
    }

    const render = () => {
      frame = requestAnimationFrame(render)
      const reveal = shelfReveal()
      const closeT = reduce ? 0 : smooth((reveal - 0.05) / 0.48)
      const fade = reduce ? (reveal > 0.55 ? 0 : 1) : 1 - smooth((reveal - 0.5) / 0.4)

      lid.rotation.x = -1.94 * (1 - closeT) - 0.05 * closeT
      el.style.opacity = String(fade)
      el.style.visibility = fade < 0.03 ? 'hidden' : 'visible'

      const showScreen = fade > 0.35 && closeT < 0.7
      screenEl.style.opacity = showScreen ? String(1 - closeT * 0.4) : '0'
      screenEl.style.pointerEvents = showScreen ? 'auto' : 'none'
      screenEl.querySelectorAll('a').forEach((link) => {
        link.style.pointerEvents = showScreen ? 'auto' : 'none'
      })
      anchor.updateWorldMatrix(true, false)
      anchor.matrixWorld.decompose(cssScreen.position, cssScreen.quaternion, cssScreen.scale)

      camera.position.set(0, view.y, view.z)
      renderer.render(scene, camera)
      cssRenderer.render(cssScene, camera)
    }

    layout()
    render()
    markReady()
    const onResize = () => layout()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, { passive: true })
    window.visualViewport?.addEventListener('resize', onResize)
    const observed = new ResizeObserver(onResize)
    observed.observe(el)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
      observed.disconnect()
      renderer.dispose()
      cssRenderer.domElement.remove()
      materials.forEach((mat) => mat.dispose())
      if (renderer.domElement.parentNode) renderer.domElement.remove()
    }
  }, [])

  return (
    <div ref={host} className="engine">
      <div ref={glHost} className="engine-gl" />
      <div ref={cssHost} className="engine-css" />
    </div>
  )
}
