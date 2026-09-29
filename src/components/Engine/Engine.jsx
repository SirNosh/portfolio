import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js'
import { contact } from '../../app/siteData'

function smooth(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1)
  return t * t * (3 - 2 * t)
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
    const fail = () => { el.classList.add('has-error'); markReady() }
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
    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const environment = pmrem.fromScene(room, 0.04)
    scene.environment = environment.texture
    scene.environmentIntensity = 0.8
    room.dispose()
    pmrem.dispose()
    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x484139, 1.1))
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
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x211a14, opacity: 0.14 }))
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.015
    ground.receiveShadow = true
    scene.add(ground)

    const screenEl = screenElement()
    const cssScreen = new CSS3DObject(screenEl)
    cssScreen.visible = false
    cssScene.add(cssScreen)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let rig
    let frame = 0
    let disposed = false
    let progress = 0
    let distance = 5.4
    const startRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.22, 0))
    // Roll around the viewing axis: the front opening edge stays toward the
    // camera while the broad outer lid turns sideways, hiding its logo.
    const uprightRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2))
    const rotationMatrix = new THREE.Matrix4()
    const screenNormal = new THREE.Vector3()
    const screenToCamera = new THREE.Vector3()
    const reel = document.getElementById('between')
    const shelf = document.getElementById('shelf')
    const onScroll = () => {
      progress = THREE.MathUtils.clamp(window.scrollY / Math.max(1, reel.offsetHeight - window.innerHeight), 0, 1)
    }
    const layout = () => {
      const width = el.clientWidth
      const height = el.clientHeight
      camera.aspect = width / Math.max(height, 1)
      distance = Math.max(5.4, 2.9 / (2 * Math.tan(THREE.MathUtils.degToRad(16)) * camera.aspect * 0.78))
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      renderer.setSize(width, height, false)
      cssRenderer.setSize(width, height)
      onScroll()
    }
    const render = () => {
      frame = requestAnimationFrame(render)
      if (!rig) return
      const close = smooth((progress - 0.04) / 0.27)
      const zoom = reduce.matches ? 0 : smooth((progress - 0.29) / 0.17)
      const turn = reduce.matches ? 0 : smooth((progress - 0.44) / 0.27)
      const pan = smooth((progress - 0.72) / 0.28)
      rig.hinge.rotation.x = close * 1.92
      rig.laptop.quaternion.slerpQuaternions(startRotation, uprightRotation, turn)
      const scale = 1 - turn * 0.18
      rig.laptop.scale.setScalar(scale)
      // Keep the closed chassis resting on the surface throughout the quarter turn.
      const matrix = rotationMatrix.makeRotationFromQuaternion(rig.laptop.quaternion).elements
      rig.laptop.position.y = (Math.abs(matrix[1]) * 1.45 + Math.abs(matrix[5]) * 0.075 + Math.abs(matrix[9]) * 1.04) * scale
      const targetY = THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.78, -0.28, close), rig.laptop.position.y, turn)
      const fitDistance = rig.laptop.position.y * 2 / (2 * Math.tan(THREE.MathUtils.degToRad(16)) * 0.82)
      const cameraDistance = Math.max(distance * (1 - zoom * 0.18), fitDistance)
      camera.position.set(0, targetY + cameraDistance * 0.28 * (1 - turn), cameraDistance)
      camera.lookAt(0, targetY, -0.25 * (1 - turn))
      const rise = 64 * pan * (2 - pan)
      el.style.transform = `translate3d(${pan * 112}%, ${-rise}%, 0)`
      shelf.style.setProperty('--shelf-x', `${-(1 - pan) * 112}%`)
      shelf.inert = pan < 0.98
      rig.anchor.updateWorldMatrix(true, false)
      rig.anchor.matrixWorld.decompose(cssScreen.position, cssScreen.quaternion, cssScreen.scale)
      screenNormal.set(0, 0, 1).applyQuaternion(cssScreen.quaternion)
      screenToCamera.copy(camera.position).sub(cssScreen.position).normalize()
      cssScreen.visible = screenNormal.dot(screenToCamera) > 0.05 && close < 0.98 && pan < 1
      screenEl.style.pointerEvents = cssScreen.visible ? 'auto' : 'none'
      screenEl.setAttribute('aria-hidden', String(!cssScreen.visible))
      screenEl.querySelectorAll('a').forEach((link) => { link.tabIndex = cssScreen.visible ? 0 : -1 })
      if (pan < 1) {
        renderer.render(scene, camera)
        cssRenderer.render(cssScene, camera)
      }
    }
    new GLTFLoader().load(`${import.meta.env.BASE_URL}assets/models/macbook-pro-m5.glb`, ({ scene: model }) => {
      if (disposed) { disposeModel(model); return }
      rig = makeLaptop(model)
      scene.add(rig.laptop)
      markReady()
    }, undefined, fail)
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
