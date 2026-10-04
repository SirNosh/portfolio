import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js'
import { advance } from '@react-three/fiber'
import { contact } from '../../app/siteData'
import { blendStudio, contactShadowMaterial, contactShadowTexture, createStudioEnvironment, isDarkTheme, watchTheme } from '../../lib/studio'
import { fromShelf, setDriven, stage } from '../../lib/stage'

function smooth(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1)
  return t * t * (3 - 2 * t)
}

// Zero velocity and acceleration at both ends: the glide starts and settles without a jolt.
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
    const restPosition = new THREE.Vector3()
    const restTarget = new THREE.Vector3()
    const lookAt = new THREE.Vector3()
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
    // One camera through one studio: the lid closes, then the camera glides across the floor to
    // the books. Overlapping the close and the glide keeps the move continuous.
    const direct = () => {
      const progress = THREE.MathUtils.clamp(travel, 0, 1)
      const close = smooth((progress - 0.04) / 0.34)
      const glide = smoother((progress - 0.3) / 0.66)
      const look = smoother((progress - 0.3) / 0.58)
      // No separate push-in: it would carry the laptop up and right just before the glide carries
      // it left. The glide's own dolly is the only camera travel, so motion never reverses.
      // The camera only settles low once the lid is low, so the rising-then-folding lid stays in frame.
      const heroY = THREE.MathUtils.lerp(0.78, -0.28, close * close)
      const heroX = (rig?.closedCenterX ?? 0) * close
      heroPosition.set(heroX, heroY + distance * 0.28, distance)
      heroTarget.set(heroX, heroY, -0.25)
      if (stage.rest) {
        fromShelf(stage.rest.position, restPosition)
        fromShelf(stage.rest.target, restTarget)
      } else {
        restPosition.copy(heroPosition)
        restTarget.copy(heroTarget)
      }
      // A gentle crane up and dolly back on the way, so the camera travels through the space.
      const arc = reduce.matches ? 0 : Math.sin(Math.PI * glide)
      stage.position.lerpVectors(heroPosition, restPosition, glide)
      stage.position.y += arc * 0.6
      stage.position.z += arc * 1.2
      // The view turns toward the books slightly ahead of the camera's travel.
      stage.target.lerpVectors(heroTarget, restTarget, look)
      stage.fov = THREE.MathUtils.lerp(32, stage.rest?.fov ?? 32, glide)
      stage.owner = glide >= 1 - 1e-4 ? 'shelf' : 'director'
      const arrived = glide >= 0.98
      if (shelf.inert === arrived) {
        shelf.inert = !arrived
        if (!arrived) window.dispatchEvent(new Event('portfolio:leave-shelf'))
      }
      document.documentElement.style.setProperty('--glide', glide.toFixed(4))
      camera.position.copy(stage.position)
      camera.lookAt(lookAt.copy(stage.target))
      if (camera.fov !== stage.fov) {
        camera.fov = stage.fov
        camera.updateProjectionMatrix()
      }
      if (!rig) return
      rig.hinge.rotation.x = close * 1.92
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
      rig.anchor.updateWorldMatrix(true, false)
      rig.anchor.matrixWorld.decompose(cssScreen.position, cssScreen.quaternion, cssScreen.scale)
      screenNormal.set(0, 0, 1).applyQuaternion(cssScreen.quaternion)
      screenToCamera.copy(camera.position).sub(cssScreen.position).normalize()
      cssScreen.visible = screenNormal.dot(screenToCamera) > 0.05 && close < 0.98
      screenEl.style.pointerEvents = cssScreen.visible ? 'auto' : 'none'
      screenEl.setAttribute('aria-hidden', String(!cssScreen.visible))
      screenEl.querySelectorAll('a').forEach((link) => { link.tabIndex = cssScreen.visible ? 0 : -1 })
      const signature = [...camera.position.toArray(), ...stage.target.toArray(), camera.fov, close, mix]
        .map((value) => value.toFixed(5)).join()
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
      // The yawed model's mass shifts right as the lid folds; the camera follows that centre so
      // the closed laptop holds still and the glide is the only sideways motion.
      rig.hinge.rotation.x = 1.92
      rig.laptop.updateMatrixWorld(true)
      rig.closedCenterX = new THREE.Box3().setFromObject(rig.laptop).getCenter(new THREE.Vector3()).x
      rig.hinge.rotation.x = 0
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
