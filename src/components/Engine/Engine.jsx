import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createTimeline, onScroll } from 'animejs'
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

    const narrowScreen = () => window.innerWidth < 760
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrowScreen() ? 2 : 1.75))
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
    const farGeo = new THREE.IcosahedronGeometry(1.72, 0)
    const haloGeo = new THREE.TorusGeometry(1.96, 0.005, 8, 96)
    const dustCount = 28
    const dustGeo = new THREE.BufferGeometry()
    const dustPositions = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i += 1) {
      const angle = (i / dustCount) * Math.PI * 2
      const radius = i % 2 === 0 ? 1.15 : 1.48
      dustPositions[i * 3] = Math.cos(angle) * radius
      dustPositions[i * 3 + 1] = Math.sin(angle * 2.1) * 0.82
      dustPositions[i * 3 + 2] = -0.7 - (i % 5) * 0.48
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))

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
    const farMat = new THREE.MeshBasicMaterial({
      color: 0xf6f4f2,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    })
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf6f4f2,
      transparent: true,
      opacity: 0.14,
    })
    const dustMat = new THREE.PointsMaterial({
      color: 0xf6f4f2,
      size: 0.032,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
      depthWrite: false,
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
    const satHome = []
    satMats.forEach((material, index) => {
      const mesh = new THREE.Mesh(satGeo, material)
      const angle = (index / satMats.length) * Math.PI * 2
      mesh.position.set(Math.cos(angle) * 1.9, 0, Math.sin(angle) * 1.9)
      sats.add(mesh)
      satHome.push({ mesh, angle })
    })
    sats.rotation.x = Math.PI / 2.35

    const body = new THREE.Group()
    body.add(shell, solid)
    body.rotation.x = THREE.MathUtils.degToRad(12)
    const cage = new THREE.Group()
    cage.add(wire)
    const ringRig = new THREE.Group()
    ringRig.add(ring)
    const ring2Rig = new THREE.Group()
    ring2Rig.add(ring2)
    const orbit = new THREE.Group()
    orbit.add(sats)

    const far = new THREE.Mesh(farGeo, farMat)
    far.position.z = -3.1
    const halo = new THREE.Mesh(haloGeo, haloMat)
    halo.position.z = -1.7
    halo.rotation.x = Math.PI / 2.4
    const dust = new THREE.Points(dustGeo, dustMat)
    const depth = new THREE.Group()
    depth.add(far, halo, dust)

    const pulse = new THREE.Group()
    pulse.add(body, cage, ringRig, ring2Rig, orbit)
    const spinner = new THREE.Group()
    spinner.add(pulse)
    const rig = new THREE.Group()
    rig.add(spinner, depth)
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

    const shade = { t: 0 }
    const spread = { r: 1.9 }
    const flight = { dolly: 0, rise: 0, sway: 0, yaw: 0, roll: 0 }
    let timeline = null

    if (reduce) {
      shade.t = 1
      spread.r = 2.15
      body.rotation.y = THREE.MathUtils.degToRad(28)
      body.rotation.x = THREE.MathUtils.degToRad(16)
      cage.rotation.y = THREE.MathUtils.degToRad(-18)
    } else {
      timeline = createTimeline({
        defaults: { ease: 'linear' },
        autoplay: onScroll(scroll),
      })
      timeline
        .add(body, { rotateY: 80, rotateX: 24, duration: 240 }, 0)
        .add(cage, { rotateY: -150, rotateZ: 28, duration: 420 }, 0)
        .add(ringRig, { rotateZ: 70, duration: 360 }, 0)
        .add(ring2Rig, { rotateZ: -50, duration: 360 }, 0)
        .add(shade, { t: 0.12, duration: 240 }, 0)
        .add(body, { rotateY: 250, rotateX: 6, duration: 280 }, 240)
        .add(shade, { t: 1, duration: 280 }, 240)
        .add(ringRig, { rotateZ: 190, rotateX: 16, duration: 420 }, 280)
        .add(spread, { r: 2.42, duration: 320 }, 460)
        .add(orbit, { rotateY: 160, duration: 540 }, 460)
        .add(body, { rotateY: 520, rotateX: 32, duration: 280 }, 520)
        .add(cage, { rotateY: -30, rotateZ: -12, duration: 480 }, 520)
        .add(pulse, { scale: 1.03, duration: 220 }, 560)
        .add(body, { rotateY: 680, rotateX: 14, duration: 200 }, 800)
        .add(spread, { r: 2.12, duration: 200 }, 800)
        .add(pulse, { scale: 1, duration: 200 }, 800)
        .add(ring2Rig, { rotateZ: -140, duration: 400 }, 600)
        .add(flight, { dolly: 0.28, rise: 0.1, sway: -0.08, yaw: -1.8, roll: 0.9, duration: 280 }, 0)
        .add(flight, { dolly: 0.52, rise: -0.05, sway: 0.09, yaw: 2.2, roll: -0.7, duration: 320 }, 280)
        .add(flight, { dolly: 0.34, rise: 0.12, sway: -0.03, yaw: 0.4, roll: 0.28, duration: 400 }, 600)
    }

    const wireOnDark = new THREE.Color('#f6f4f2')
    const wireOnLight = new THREE.Color('#252423')
    let toneMix = 1
    let frame = 0
    const clock = new THREE.Clock()

    const layout = () => {
      const width = el.clientWidth || window.innerWidth
      const height = el.clientHeight || window.innerHeight
      const portrait = window.innerWidth <= window.innerHeight
      const mobile = window.innerWidth < 760 && portrait
      const landscapePhone = window.innerHeight < 520 && !portrait
      const compact = window.innerWidth < 1100
      if (mobile) {
        rig.position.set(0, -0.02, 0)
        rig.scale.setScalar(width < 420 ? 0.8 : 0.88)
      } else if (landscapePhone) {
        rig.position.set(2.35, 0, 0)
        rig.scale.setScalar(0.48)
      } else {
        rig.position.set(2.35, 0.06, 0)
        rig.scale.setScalar(compact ? 0.76 : 0.94)
      }
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 2 : 1.75))
      renderer.setSize(width, height, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
    }

    const render = () => {
      frame = requestAnimationFrame(render)
      const time = clock.getElapsedTime()
      if (!reduce) spinner.rotation.y = time * 0.12
      else spinner.rotation.y = 0.45

      const portrait = window.innerWidth <= window.innerHeight
      const mobile = window.innerWidth < 760 && portrait
      const landscapePhone = window.innerHeight < 520 && !portrait
      const amp = mobile ? 0.4 : landscapePhone ? 0.22 : 1
      const swayAmp = landscapePhone ? 0.12 : amp
      camera.position.set(
        flight.sway * swayAmp,
        0.05 + flight.rise * amp,
        7.4 - flight.dolly * (mobile ? 0.55 : landscapePhone ? 0.4 : 1),
      )
      camera.rotation.set(
        THREE.MathUtils.degToRad(flight.rise * -3.5 * amp),
        THREE.MathUtils.degToRad(flight.yaw * amp),
        THREE.MathUtils.degToRad(flight.roll * (landscapePhone ? 0.25 : amp)),
      )
      depth.position.set(flight.sway * -0.55 * amp, flight.rise * 0.45 * amp, 0)
      depth.rotation.y = THREE.MathUtils.degToRad(flight.yaw * 1.6 * amp)
      depth.rotation.z = THREE.MathUtils.degToRad(flight.roll * -0.7 * amp)
      if (!reduce) {
        far.rotation.y = time * 0.08
        halo.rotation.z = time * -0.1
        dust.rotation.y = time * 0.045
      }
      key.position.set(4.2 + flight.sway * 2.4 * amp, 5.4 + flight.rise * 1.8 * amp, 4)

      const mix = Math.min(1, Math.max(0, shade.t))
      const eased = mix * mix * (3 - 2 * mix)
      solidMat.opacity = 0.04 + eased * 0.96
      wireMat.opacity = 0.92 - eased * 0.68
      shellMat.opacity = eased
      ring2Mat.opacity = 0.16 + (1 - eased) * 0.36
      if (!reduce) sats.rotation.z = time * 0.35
      satHome.forEach(({ mesh, angle }) => {
        mesh.position.set(Math.cos(angle) * spread.r, 0, Math.sin(angle) * spread.r)
      })

      const lightStage = readTone(el) === 'light'
      if (el.classList.contains('is-light') !== lightStage) el.classList.toggle('is-light', lightStage)
      const target = lightStage ? 0 : 1
      toneMix += (target - toneMix) * 0.08
      wireMat.color.copy(wireOnLight).lerp(wireOnDark, toneMix)
      ring2Mat.color.copy(wireMat.color)
      farMat.color.copy(wireMat.color)
      haloMat.color.copy(wireMat.color)
      dustMat.color.copy(wireMat.color)

      renderer.render(scene, camera)
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
      timeline?.revert()
      window.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
      observed.disconnect()
      renderer.dispose()
      ;[sphereGeo, cageGeo, satGeo, ringGeo, ring2Geo, farGeo, haloGeo, dustGeo].forEach((geo) => geo.dispose())
      ;[solidMat, shellMat, wireMat, ringMat, ring2Mat, farMat, haloMat, dustMat, ...satMats].forEach((mat) => mat.dispose())
      ramp.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={host} className="engine" aria-hidden="true" />
}
