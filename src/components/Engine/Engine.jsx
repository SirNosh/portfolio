import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { contact } from '../../app/siteData'

const BOOKS = [
  { id: 'experience', title: 'Work Experience', color: '#8d735c', ink: '#f7f3ec', width: 0.48 },
  { id: 'research', title: 'Research', color: '#9a3d3d', ink: '#f7f3ec', width: 0.44 },
  { id: 'projects', title: 'Projects', color: '#efe6d4', ink: '#2c2824', width: 0.42 },
  { id: 'writings', title: 'Writings', color: '#3f6d60', ink: '#f7f3ec', width: 0.5 },
]

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

function readTone(host) {
  const narrow = window.innerWidth < 760
  const stageBottom = host?.getBoundingClientRect().bottom ?? 0
  const mark = narrow && stageBottom > 0 ? stageBottom - 4 : window.innerHeight * 0.45
  let tone = 'dark'
  document.querySelectorAll('.chapter').forEach((section) => {
    const rect = section.getBoundingClientRect()
    if (rect.top <= mark && rect.bottom > mark) tone = section.dataset.tone || 'dark'
  })
  return tone
}

function heroProgress() {
  const hero = document.getElementById('between')
  if (!hero) return 0
  const rect = hero.getBoundingClientRect()
  const span = Math.max(1, hero.offsetHeight - window.innerHeight)
  return clamp(-rect.top / span, 0, 1)
}

function bookFocus(id) {
  const nodes = document.querySelectorAll(`[data-book="${id}"]`)
  let best = 0
  nodes.forEach((el) => {
    const rect = el.getBoundingClientRect()
    const mid = (rect.top + rect.bottom) / 2
    const dist = Math.abs(mid - window.innerHeight * 0.42)
    const near = clamp(1 - dist / (window.innerHeight * 0.7), 0, 1)
    const covering = rect.top < window.innerHeight * 0.62 && rect.bottom > window.innerHeight * 0.22
    best = Math.max(best, covering ? Math.max(near, 0.92) : near)
  })
  return best
}

function paintLabel(title, color, ink, planeW, planeH) {
  const canvas = document.createElement('canvas')
  const width = 1024
  const height = Math.max(256, Math.round(width * (planeH / planeW)))
  canvas.width = width
  canvas.height = height
  const draw = () => {
    const g = canvas.getContext('2d')
    g.clearRect(0, 0, width, height)
    g.fillStyle = color
    g.fillRect(0, 0, width, height)
    g.fillStyle = ink
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const words = title.split(' ')
    const size = words.length === 1 ? 92 : 78
    g.font = `600 ${size}px Barlow, sans-serif`
    if (words.length === 1) g.fillText(title, width / 2, height / 2)
    else {
      g.fillText(words[0], width / 2, height / 2 - size * 0.7)
      g.fillText(words.slice(1).join(' '), width / 2, height / 2 + size * 0.7)
    }
  }
  draw()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  document.fonts?.ready?.then(() => {
    draw()
    texture.needsUpdate = true
  })
  return texture
}

function setFade(root, opacity) {
  const transparent = opacity < 0.995
  root.traverse((obj) => {
    const mats = obj.material ? [].concat(obj.material) : []
    mats.forEach((mat) => {
      if (mat.userData.baseOpacity == null) mat.userData.baseOpacity = mat.opacity
      const next = mat.userData.baseOpacity * opacity
      if (mat.transparent !== transparent) {
        mat.transparent = transparent
        mat.depthWrite = !transparent
        mat.needsUpdate = true
      }
      mat.opacity = next
    })
  })
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

function makeBook(spec, x) {
  const height = 1.42
  const depth = 0.96
  const coverMat = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.62, metalness: 0.04 })
  const pageMat = new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.9 })
  const labelW = spec.width * 0.84
  const labelH = height * 0.46
  const labelMap = paintLabel(spec.title, spec.color, spec.ink, labelW, labelH)
  const labelMat = new THREE.MeshBasicMaterial({ map: labelMap })

  const book = new THREE.Group()
  book.position.set(x, height / 2, 0)
  const block = new THREE.Mesh(new THREE.BoxGeometry(spec.width * 0.9, height * 0.94, depth * 0.9), pageMat)
  const back = new THREE.Mesh(new THREE.BoxGeometry(spec.width, height, 0.03), coverMat)
  back.position.z = -depth / 2
  const spine = new THREE.Mesh(new THREE.BoxGeometry(spec.width, height, 0.04), coverMat)
  spine.position.x = -spec.width / 2

  const hinge = new THREE.Group()
  hinge.position.set(-spec.width / 2, 0, depth / 2)
  const front = new THREE.Mesh(new THREE.BoxGeometry(spec.width, height, 0.028), coverMat)
  front.position.x = spec.width / 2
  const label = new THREE.Mesh(new THREE.PlaneGeometry(labelW, labelH), labelMat)
  label.position.set(spec.width / 2, 0, 0.02)
  hinge.add(front, label)

  const pages = [0, 1, 2].map((index) => {
    const page = new THREE.Mesh(new THREE.BoxGeometry(spec.width * 0.86, height * 0.9, 0.012), pageMat)
    const fold = new THREE.Group()
    fold.position.set(-spec.width * 0.36, 0, depth * 0.28)
    page.position.x = spec.width * 0.4
    fold.add(page)
    fold.userData.fan = 0.22 + index * 0.16
    return fold
  })

  book.add(block, back, spine, hinge, ...pages)
  return { book, hinge, pages, materials: [coverMat, pageMat, labelMat], texture: labelMap }
}

function makeShelf() {
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a5c45, roughness: 0.72 })
  const shelf = new THREE.Group()
  const plank = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 1.2), wood)
  plank.position.y = -0.04
  const rail = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.7, 0.05), wood)
  rail.position.set(0, 0.7, -0.55)
  shelf.add(plank, rail)

  let cursor = -1.15
  const books = BOOKS.map((spec) => {
    const made = makeBook(spec, cursor + spec.width / 2)
    made.book.rotation.y = spec.id === 'projects' ? 0.08 : -0.04
    shelf.add(made.book)
    cursor += spec.width + 0.18
    return made
  })
  return { shelf, books, materials: [wood, ...books.flatMap((item) => item.materials)], textures: books.map((item) => item.texture) }
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
    camera.position.set(0, 0.42, 7.8)

    const { laptop, lid, anchor, materials: laptopMats } = makeLaptop()
    const { shelf, books, materials: shelfMats, textures } = makeShelf()
    scene.add(laptop, shelf)

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
    const opens = BOOKS.map(() => 0)
    const view = { z: 7.8, y: 0.42 }
    let frame = 0

    const layout = () => {
      const width = el.clientWidth || window.innerWidth
      const height = el.clientHeight || window.innerHeight
      const portrait = window.innerWidth <= window.innerHeight
      const mobile = window.innerWidth < 760 && portrait
      const landscapePhone = window.innerHeight < 520 && !portrait
      if (mobile) {
        laptop.position.set(0, 0.28, 0)
        laptop.scale.setScalar(0.74)
        laptop.rotation.y = -0.1
        shelf.position.set(0, 0.16, 0)
        shelf.scale.setScalar(0.52)
        shelf.rotation.y = -0.1
        view.z = 3.4
        view.y = 0.46
      } else if (landscapePhone) {
        laptop.position.set(2.02, 0.1, 0)
        laptop.scale.setScalar(0.74)
        laptop.rotation.y = -0.28
        shelf.position.set(1.9, 0.02, 0)
        shelf.scale.setScalar(0.52)
        shelf.rotation.y = -0.16
        view.z = 5.5
        view.y = 0.3
      } else {
        laptop.position.set(1.95, -0.05, 0)
        laptop.scale.setScalar(0.9)
        laptop.rotation.y = -0.38
        shelf.position.set(1.22, -0.02, 0)
        shelf.scale.setScalar(0.96)
        shelf.rotation.y = -0.08
        view.z = 7.8
        view.y = 0.42
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
      const progress = heroProgress()
      const closeT = reduce ? 1 : smooth((progress - 0.2) / 0.36)
      const shelfT = reduce ? (progress > 0.55 ? 1 : 0) : smooth((progress - 0.56) / 0.26)
      const laptopFade = 1 - shelfT

      lid.rotation.x = -1.94 * (1 - closeT) - 0.05 * closeT
      laptop.visible = laptopFade > 0.04
      shelf.visible = shelfT > 0.04
      setFade(laptop, laptopFade)
      setFade(shelf, shelfT)

      books.forEach((item, index) => {
        const target = reduce || shelfT < 0.35 ? 0 : bookFocus(BOOKS[index].id) * shelfT
        opens[index] += (target - opens[index]) * (reduce ? 1 : 0.08)
        item.hinge.rotation.y = -opens[index] * 2.15
        item.pages.forEach((page) => {
          page.rotation.y = -opens[index] * page.userData.fan
          page.visible = opens[index] > 0.04
        })
      })

      const showScreen = !reduce && closeT < 0.72 && shelfT < 0.2
      screenEl.style.opacity = showScreen ? String(1 - closeT * 0.35) : '0'
      screenEl.style.pointerEvents = showScreen ? 'auto' : 'none'
      screenEl.querySelectorAll('a').forEach((link) => {
        link.style.pointerEvents = showScreen ? 'auto' : 'none'
      })
      anchor.updateWorldMatrix(true, false)
      anchor.matrixWorld.decompose(cssScreen.position, cssScreen.quaternion, cssScreen.scale)

      const lightStage = readTone(el) === 'light'
      if (el.classList.contains('is-light') !== lightStage) el.classList.toggle('is-light', lightStage)

      camera.position.set(0, view.y, view.z)
      renderer.render(scene, camera)
      cssRenderer.render(cssScene, camera)
    }

    layout()
    render()
    markReady()
    const onResize = () => layout()
    window.addEventListener('resize', onResize)
    window.visualViewport?.addEventListener('resize', onResize)
    const observed = new ResizeObserver(onResize)
    observed.observe(el)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
      observed.disconnect()
      renderer.dispose()
      cssRenderer.domElement.remove()
      ;[...laptopMats, ...shelfMats].forEach((mat) => mat.dispose())
      textures.forEach((tex) => tex.dispose())
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
