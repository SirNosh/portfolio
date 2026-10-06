import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js'
import { advance } from '@react-three/fiber'
import { contact } from '../../app/siteData'
import { blendStudio, contactShadowMaterial, contactShadowTexture, createStudioEnvironment, isDarkTheme, watchTheme } from '../../lib/studio'
import { setDriven, stage } from '../../lib/stage'

function smooth(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1)
  return t * t * (3 - 2 * t)
}

// Zero velocity and acceleration at both ends: motion starts and settles without a jolt.
function smoother(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function markReady() {
  document.documentElement.dataset.webgl = '1'
  window.dispatchEvent(new Event('portfolio:webgl'))
}

function disposeModel(model) {
  const materials = new Set()
  const textures = new Set()
  model.traverse((node) => {
    node.geometry?.dispose()
    if (node.material) {
      const list = Array.isArray(node.material) ? node.material : [node.material]
      list.forEach((material) => materials.add(material))
    }
  })
  materials.forEach((material) => {
    Object.values(material).forEach((value) => { if (value?.isTexture) textures.add(value) })
    material.dispose()
  })
  textures.forEach((texture) => texture.dispose())
}

function makeLaptop(model) {
  // Preserve the supplied model's authored materials and proportions.
  model.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(model)
  const scale = 2.9 / bounds.getSize(new THREE.Vector3()).x
  model.scale.setScalar(scale)
  model.position.y = -bounds.min.y * scale - 0.075
  const laptop = new THREE.Group()
  laptop.add(model)

  // The complete lid, display, bezel, and camera in the supplied GLB.
  const lid = model.getObjectByName('RcexTyyhpuJYATQ')
  const hinge = new THREE.Group()
  hinge.position.set(0, -10.9, 0.2)
  lid.parent.add(hinge)
  model.updateMatrixWorld(true)
  hinge.attach(lid)

  const display = model.getObjectByName('tfTbkkzhxqpKRgC')
  display.material.emissive.set(0x000000)
  const anchor = new THREE.Object3D()
  anchor.position.set(0, -15.13736, -10.5298)
  anchor.rotation.x = -1.9208
  anchor.scale.setScalar(30.075 / 960)
  display.parent.add(anchor)
  model.traverse((node) => {
    if (node.isMesh) { node.castShadow = true; node.receiveShadow = true }
  })
  return { laptop, hinge, anchor }
}

// The display is 960 x 624 CSS3D pixels. Photo rect inside the Photos window (display aspect),
// and the full display it grows into.
const PHOTO = { x0: 74, y0: 72, x1: 886, y1: 600 }
const DISPLAY = { x0: 0, y0: 0, x1: 960, y1: 624 }
const lerpRect = (a, b, t) => ({ x0: a.x0 + (b.x0 - a.x0) * t, y0: a.y0 + (b.y0 - a.y0) * t, x1: a.x1 + (b.x1 - a.x1) * t, y1: a.y1 + (b.y1 - a.y1) * t })
const scaleRect = (r, k) => {
  const cx = (r.x0 + r.x1) / 2
  const cy = (r.y0 + r.y1) / 2
  return { x0: cx + (r.x0 - cx) * k, y0: cy + (r.y0 - cy) * k, x1: cx + (r.x1 - cx) * k, y1: cy + (r.y1 - cy) * k }
}
// Clip outline of a rect: chamfered corners and the camera notch (depth 0 = flat top edge). Always
// 12 points, so the photo's outline and the display's interpolate cleanly.
function outline(r, notch) {
  const k = (r.x1 - r.x0) / 960
  const c = 5 * k
  const cx = (r.x0 + r.x1) / 2
  return [[r.x0 + c, r.y0], [cx - 58 * k, r.y0], [cx - 58 * k, r.y0 + notch], [cx + 58 * k, r.y0 + notch], [cx + 58 * k, r.y0],
    [r.x1 - c, r.y0], [r.x1, r.y0 + c], [r.x1, r.y1 - c], [r.x1 - c, r.y1], [r.x0 + c, r.y1], [r.x0, r.y1 - c], [r.x0, r.y0 + c]]
}

const TERMINAL_ICON = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="14" fill="#1b1d1c" stroke="#3a3d3b" stroke-width="2"/><path d="M16 22l10 9-10 9" fill="none" stroke="#e9e4da" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 42h16" stroke="#5cb8ae" stroke-width="4" stroke-linecap="round"/></svg>`
const PHOTOS_ICON = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="14" fill="#f3efe7" stroke="#d8d1c4" stroke-width="2"/><circle cx="44" cy="20" r="6" fill="#e2a64a"/><path d="M8 50l16-18 10 11 8-8 14 15z" fill="#1f706b"/><path d="M8 50l16-18 10 11z" fill="#2c8a82"/></svg>`

function screenElement() {
  const el = document.createElement('div')
  el.className = 'laptop-screen'
  el.innerHTML = `
    <p class="screen-name">Dev Vyas</p>
    <p class="screen-role">Harness Engineering and Efficient ML Research</p>
    <p class="screen-links">
      <a href="${contact.github}" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
      <a href="${contact.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>
    </p>
    <div class="screen-window" aria-hidden="true">
      <div class="window-bar"><i></i><i></i><i></i><span>library.jpg</span></div>
    </div>
    <div class="screen-switcher" aria-hidden="true">
      <div class="switcher-apps">
        <div class="switcher-app">${TERMINAL_ICON}</div>
        <div class="switcher-app">${PHOTOS_ICON}</div>
      </div>
      <p class="switcher-label"><span>Terminal</span><span>Photos</span></p>
    </div>
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
    el.style.opacity = ''
    el.style.visibility = ''
    let renderer
    let failed = false
    // Without the laptop, the shelf runs its own loop and camera, as a static page.
    const fail = () => { failed = true; setDriven(false); el.classList.add('has-error'); markReady() }
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      fail()
      return undefined
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.VSMShadowMap
    renderer.domElement.setAttribute('aria-hidden', 'true')
    glEl.appendChild(renderer.domElement)
    const cssRenderer = new CSS3DRenderer()
    cssEl.appendChild(cssRenderer.domElement)
    const scene = new THREE.Scene()
    const cssScene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40)
    const environment = createStudioEnvironment(renderer)
    scene.environment = environment.texture
    const hemisphere = new THREE.HemisphereLight(0xfff4e6, 0x484139, 1.1)
    scene.add(hemisphere)
    const key = new THREE.DirectionalLight(0xfff2df, 3)
    key.position.set(-3, 7, 5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 })
    key.shadow.normalBias = 0.015
    key.shadow.bias = -0.0001
    key.shadow.radius = 6
    key.shadow.blurSamples = 12
    scene.add(key)
    // Back-right rim: separates the dark chassis from the dark backdrop.
    const rim = new THREE.DirectionalLight(0xfff6ec, 0)
    rim.position.set(4, 3.5, -5)
    scene.add(rim)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x211a14, opacity: 0.14 }))
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.015
    ground.receiveShadow = true
    scene.add(ground)
    // Soft occlusion under the base, where the cast shadow alone looks pasted on.
    const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), contactShadowMaterial(contactShadowTexture()))
    contactShadow.rotation.set(-Math.PI / 2, 0, 0, 'YXZ')
    contactShadow.position.y = -0.01
    scene.add(contactShadow)

    const screenEl = screenElement()
    const cssScreen = new CSS3DObject(screenEl)
    cssScreen.visible = false
    cssScene.add(cssScreen)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let rig
    let frame = 0
    let disposed = false
    let travel = 0
    let targetTravel = 0
    let darkTarget = isDarkTheme() ? 1 : 0
    let mix = darkTarget
    let distance = 5.4
    const clock = new THREE.Clock()
    const stopTheme = watchTheme((dark) => { darkTarget = dark ? 1 : 0 })
    const heroPosition = new THREE.Vector3()
    const heroTarget = new THREE.Vector3()
    const lookAt = new THREE.Vector3()
    const screenCenter = new THREE.Vector3()
    const screenUp = new THREE.Vector3()
    const corner = new THREE.Vector3()
    const endPosition = new THREE.Vector3()
    const endQuaternion = new THREE.Quaternion()
    const endInverse = new THREE.Quaternion()
    const restQuaternion = new THREE.Quaternion()
    const relative = new THREE.Vector3()
    const basis = new THREE.Matrix4()
    const worldUp = new THREE.Vector3(0, 1, 0)
    // Last rendered state: the laptop canvas only redraws when something it shows changed.
    const drawn = { signature: '', dirty: true }
    const screenNormal = new THREE.Vector3()
    const screenToCamera = new THREE.Vector3()
    const reel = document.getElementById('between')
    const shelf = document.getElementById('shelf')
    const onScroll = () => {
      targetTravel = window.scrollY / Math.max(1, (reel.offsetHeight - window.innerHeight) / 1.2)
    }
    const layout = () => {
      const width = el.clientWidth
      const height = el.clientHeight
      camera.aspect = width / Math.max(height, 1)
      distance = Math.max(5.4, 2.9 / (2 * Math.tan(THREE.MathUtils.degToRad(16)) * camera.aspect * 0.78))
      camera.updateProjectionMatrix()
      drawn.dirty = true
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      renderer.setSize(width, height, false)
      cssRenderer.setSize(width, height)
      onScroll()
    }
    const render = (now = performance.now()) => {
      frame = requestAnimationFrame(render)
      // Exponential damping can't overshoot, so a long frame just lands closer to the target.
      const dt = clock.getDelta()
      // Ease toward the scroll position: a wheel notch arrives as a single 100 px jump.
      travel = reduce.matches || Math.abs(targetTravel - travel) < 1e-4 ? targetTravel : THREE.MathUtils.damp(travel, targetTravel, 7, dt)
      mix = reduce.matches ? darkTarget : THREE.MathUtils.damp(mix, darkTarget, 8, dt)
      if (failed) return
      direct()
      // The shelf renders in this same tick from the pose just published (frameloop "never").
      advance(now / 1000)
    }
    const screenWindow = screenEl.querySelector('.screen-window')
    const switcher = screenEl.querySelector('.screen-switcher')
    const windowCenter = new THREE.Vector3()
    const windowEnd = new THREE.Vector3()
    // Command-Tab: the app switcher comes up over your name, the selection moves from Terminal to
    // Photos, and a Photos window opens on a picture of the library taken from exactly where the
    // camera is headed. The photo goes full screen and the camera dives into it. The photo is the
    // shelf canvas clipped to the photo's projected outline and drawn from this camera mapped
    // through it, so it holds still like a print, then opens into real depth as you go in.
    const direct = () => {
      const progress = THREE.MathUtils.clamp(travel, 0, 1)
      const summon = smooth((progress - 0.04) / 0.04)
      const release = smooth((progress - 0.145) / 0.015)
      const switched = progress >= 0.11
      // The window snaps open just as the switcher lets go, as on a real Mac: no cross-fade.
      const open = smoother((progress - 0.155) / 0.025)
      // Opaque almost at once; the scale carries the motion, so nothing shows through it.
      const shown = Math.min(1, open * 5)
      const expand = smoother((progress - 0.23) / 0.13)
      const dive = smoother((progress - 0.27) / 0.67)
      const look = smoother((progress - 0.24) / 0.45)
      heroPosition.set(0, 0.78 + distance * 0.28, distance)
      heroTarget.set(0, 0.78, -0.25)
      if (!rig) {
        camera.position.copy(heroPosition)
        camera.lookAt(heroTarget)
        return
      }
      // The display's frame in world space: the CSS3D anchor, +z facing the viewer, 1 unit = 1 px.
      rig.anchor.updateWorldMatrix(true, false)
      const frameMatrix = rig.anchor.matrixWorld
      screenCenter.setFromMatrixPosition(frameMatrix)
      screenUp.set(0, 1, 0).transformDirection(frameMatrix)
      screenNormal.set(0, 0, 1).transformDirection(frameMatrix)
      const pixel = corner.set(1, 0, 0).applyMatrix4(frameMatrix).distanceTo(screenCenter)
      const restFov = stage.rest?.fov ?? 35
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(restFov / 2))
      // Square-on distance at which a rect on the display just covers the viewport, or (contain)
      // just fits inside it. The photo is framed to contain the library's resting view, so on a
      // tall phone it isn't a wide shot with tiny books; it blends to cover by the dive's end.
      const fitDistance = (r, contain = false) => {
        const byHeight = ((r.y1 - r.y0) / 2) * pixel / tanHalf
        const byWidth = ((r.x1 - r.x0) / 2) * pixel / (tanHalf * camera.aspect)
        return (contain ? Math.max(byHeight, byWidth) : Math.min(byHeight, byWidth)) * 0.96
      }
      const endDistance = fitDistance(DISPLAY)
      endPosition.copy(screenCenter).addScaledVector(screenNormal, endDistance)
      camera.position.lerpVectors(heroPosition, endPosition, dive)
      lookAt.lerpVectors(heroTarget, screenCenter, look)
      camera.up.copy(worldUp).lerp(screenUp, dive).normalize()
      camera.lookAt(lookAt)
      const fov = THREE.MathUtils.lerp(32, restFov, dive)
      if (camera.fov !== fov) {
        camera.fov = fov
        camera.updateProjectionMatrix()
      }
      camera.updateMatrixWorld()

      // The photo: a rect on the display that opens with the window and grows to the full display.
      const photo = scaleRect(lerpRect(PHOTO, DISPLAY, expand), 0.88 + 0.12 * open)
      // The view maps the pose that would frame the photo square-on onto the shelf's resting pose,
      // so the photo always shows the library's resting composition; as the photo grows to the
      // display this becomes the dive's own end pose, and the camera arrives exactly at rest.
      if (stage.rest) {
        windowCenter.set((photo.x0 + photo.x1) / 2 - 480, 312 - (photo.y0 + photo.y1) / 2, 0).applyMatrix4(frameMatrix)
        // Blended over the dive rather than the expand, so the camera's approach outpaces the
        // reframing and the books only ever grow.
        const windowDistance = THREE.MathUtils.lerp(fitDistance(photo, true), fitDistance(photo), dive)
        windowEnd.copy(windowCenter).addScaledVector(screenNormal, windowDistance)
        endQuaternion.setFromRotationMatrix(basis.lookAt(windowEnd, windowCenter, screenUp))
        endInverse.copy(endQuaternion).invert()
        restQuaternion.setFromRotationMatrix(basis.lookAt(stage.rest.position, stage.rest.target, worldUp))
        // The books start on the glass plane, so the photo is a flat print of the resting view;
        // pulling that plane back toward the camera over the dive brings real depth in.
        const depth = THREE.MathUtils.lerp(1, 0.6, smooth(dive / 0.8))
        const scale = depth * stage.rest.position.distanceTo(stage.rest.target) / windowDistance
        relative.copy(camera.position).sub(windowEnd).applyQuaternion(endInverse).multiplyScalar(scale)
        stage.shelfPosition.copy(relative).applyQuaternion(restQuaternion).add(stage.rest.position)
        stage.shelfQuaternion.copy(restQuaternion).multiply(endInverse).multiply(camera.quaternion)
        stage.fov = fov
      }
      stage.owner = dive >= 1 - 1e-4 ? 'shelf' : 'director'
      const arrived = dive >= 0.98
      if (shelf.inert === arrived) {
        shelf.inert = !arrived
        if (!arrived) window.dispatchEvent(new Event('portfolio:leave-shelf'))
      }

      if (stage.owner === 'shelf') {
        shelf.style.clipPath = 'none'
      } else {
        const width = el.clientWidth
        const height = el.clientHeight
        // The notch grows in as the photo fills the display, then retracts as you pass the glass.
        const notch = 25 * expand * (1 - smooth((dive - 0.7) / 0.3))
        shelf.style.clipPath = `polygon(${outline(photo, notch).map(([x, y]) => {
          corner.set(x - 480, 312 - y, 0).applyMatrix4(frameMatrix).project(camera)
          return `${(((corner.x + 1) / 2) * width).toFixed(1)}px ${(((1 - corner.y) / 2) * height).toFixed(1)}px`
        }).join(',')})`
      }
      shelf.style.opacity = stage.owner === 'shelf' ? '1' : shown.toFixed(3)
      shelf.style.setProperty('--glass', (shown * (1 - smooth((dive - 0.55) / 0.4))).toFixed(3))

      // The screen's own UI: the switcher, then the Photos window around the photo.
      switcher.style.opacity = (summon * (1 - release)).toFixed(3)
      switcher.style.transform = `translate(-50%, -50%) scale(${(0.96 + 0.04 * summon).toFixed(4)})`
      switcher.classList.toggle('is-photos', switched)
      const chrome = 1 - expand
      screenWindow.style.opacity = shown.toFixed(3)
      screenWindow.style.left = `${photo.x0 - 12 * chrome}px`
      screenWindow.style.top = `${photo.y0 - 38 * chrome}px`
      screenWindow.style.width = `${photo.x1 - photo.x0 + 24 * chrome}px`
      screenWindow.style.height = `${photo.y1 - photo.y0 + 50 * chrome}px`
      screenWindow.style.borderRadius = `${12 * chrome}px`
      screenWindow.style.setProperty('--chrome', chrome.toFixed(3))

      const studio = blendStudio(mix)
      hemisphere.intensity = 1.1 * studio.ambient
      key.intensity = 3 * studio.key
      rim.intensity = studio.rim
      scene.environmentIntensity = 0.8 * studio.environment
      renderer.toneMappingExposure = 1.15 * studio.exposure
      ground.material.color.copy(studio.shadowColor)
      ground.material.opacity = 0.14 * studio.shadow
      contactShadow.material.opacity = studio.contact
      contactShadow.scale.set(1.45 * 4, 1.04 * 4, 1)
      contactShadow.rotation.y = -0.22
      frameMatrix.decompose(cssScreen.position, cssScreen.quaternion, cssScreen.scale)
      screenToCamera.copy(camera.position).sub(cssScreen.position).normalize()
      cssScreen.visible = screenNormal.dot(screenToCamera) > 0.05 && expand < 0.999
      // Your links stay usable until the switcher comes up.
      const live = cssScreen.visible && summon < 0.5
      screenEl.style.pointerEvents = live ? 'auto' : 'none'
      screenEl.setAttribute('aria-hidden', String(!live))
      screenEl.querySelectorAll('a').forEach((link) => { link.tabIndex = live ? 0 : -1 })
      const signature = [...camera.position.toArray(), ...camera.quaternion.toArray(), camera.fov, mix, summon, release, switched, open, expand]
        .map((value) => Number(value).toFixed(5)).join()
      if (drawn.dirty || signature !== drawn.signature) {
        drawn.signature = signature
        drawn.dirty = false
        renderer.render(scene, camera)
        cssRenderer.render(cssScene, camera)
      }
    }
    new GLTFLoader().load(`${import.meta.env.BASE_URL}assets/models/macbook-pro-m5.glb`, ({ scene: model }) => {
      if (disposed) { disposeModel(model); return }
      rig = makeLaptop(model)
      rig.laptop.quaternion.setFromEuler(new THREE.Euler(0, -0.22, 0))
      rig.laptop.position.y = 0.075
      scene.add(rig.laptop)
      drawn.dirty = true
      // Compile shaders and draw a frame before the loader lets go: the first frame of this
      // model blocks the main thread, and would otherwise swallow the loader's exit animation.
      renderer.compileAsync(scene, camera).catch(() => {}).finally(() => {
        requestAnimationFrame(() => requestAnimationFrame(() => { if (!disposed) markReady() }))
      })
    }, ({ loaded }) => {
      window.dispatchEvent(new CustomEvent('portfolio:progress', { detail: Math.min(loaded / import.meta.env.MODEL_BYTES, 1) }))
    }, fail)
    layout()
    render()
    window.addEventListener('scroll', onScroll, { passive: true })
    const observer = new ResizeObserver(layout)
    observer.observe(el)
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      observer.disconnect()
      stopTheme()
      shelf.inert = false
      disposeModel(scene)
      environment.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      cssRenderer.domElement.remove()
    }
  }, [])

  return (
    <div ref={host} className="engine">
      <div ref={glHost} className="engine-gl" />
      <div ref={cssHost} className="engine-css" />
      <div className="engine-fallback screen-fallback">
        <p className="screen-name">Dev Vyas</p>
        <p className="screen-role">Harness Engineering and Efficient ML Research</p>
        <p className="screen-links">
          <a href={contact.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </p>
      </div>
    </div>
  )
}
