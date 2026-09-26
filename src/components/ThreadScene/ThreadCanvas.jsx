import { useEffect, useRef } from 'react'
import { animate, spring } from 'animejs'
import 'animejs/adapters/three'
import {
  AmbientLight,
  CatmullRomCurve3,
  DirectionalLight,
  Group,
  IcosahedronGeometry,
  Mesh,
  OrthographicCamera,
  Scene,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'
import { branches } from '../../app/siteData'
import { celMaterial, inkMaterial } from './materials'

const MAIN = '#8d3a2c'

function deduped(points) {
  const vectors = []
  points.forEach((point) => {
    const next = new Vector3(point.x, point.y, point.z || 0)
    const prev = vectors[vectors.length - 1]
    if (prev && prev.distanceTo(next) < 4) return
    vectors.push(next)
  })
  return vectors
}

export default function ThreadCanvas() {
  const host = useRef(null)

  useEffect(() => {
    const node = host.current
    if (!node) return undefined

    const mobile = window.matchMedia('(max-width: 760px)').matches
    let renderer
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: !mobile,
        powerPreference: mobile ? 'low-power' : 'high-performance',
      })
    } catch {
      renderer = null
    }

    const signal = () => {
      document.documentElement.dataset.webgl = '1'
      window.dispatchEvent(new Event('portfolio:webgl'))
    }

    if (!renderer || !renderer.getContext()) {
      signal()
      return undefined
    }

    const scene = new Scene()
    const camera = new OrthographicCamera(-1, 1, 1, -1, -800, 800)
    camera.position.z = 40
    const group = new Group()
    scene.add(group)

    scene.add(new AmbientLight(0xfff6ea, 0.42))
    const key = new DirectionalLight(0xfffaf4, 1.55)
    key.position.set(-120, 180, 240)
    scene.add(key)
    const fill = new DirectionalLight(0xd7c4a4, 0.45)
    fill.position.set(160, -80, 120)
    scene.add(fill)

    renderer.outputColorSpace = SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.className = 'thread-canvas'
    node.appendChild(renderer.domElement)

    const offsets = new Map()
    const knots = new Map()
    const materials = new Map()
    const ink = inkMaterial()
    let spin
    let release
    let drag = null
    let raf = 0
    let dirty = true
    let lastY = Number.NaN
    let disposed = false

    const materialFor = (color, opacity = 1) => {
      const keyName = `${color}:${opacity}`
      if (!materials.has(keyName)) materials.set(keyName, celMaterial(color, opacity))
      return materials.get(keyName)
    }

    const measure = (el, withOffset) => {
      const rect = el.getBoundingClientRect()
      const off = withOffset ? offsets.get(el.dataset.pin) || { x: 0, y: 0 } : { x: 0, y: 0 }
      const docX = rect.left + rect.width / 2 + off.x
      const docY = rect.top + window.scrollY + rect.height / 2 + off.y
      return {
        docX,
        docY,
        x: docX - window.innerWidth / 2,
        y: -docY + window.innerHeight / 2,
        z: 0,
      }
    }

    const addThread = (points, color, opacity, closed, radius) => {
      const vectors = deduped(points)
      if (vectors.length < (closed ? 3 : 2)) return
      const curve = new CatmullRomCurve3(vectors, closed, 'centripetal', 0.42)
      const segments = Math.min(mobile ? 96 : 180, Math.max(closed ? 24 : 12, vectors.length * 8))
      const geometry = new TubeGeometry(curve, segments, radius, mobile ? 4 : 5, closed)
      const mesh = new Mesh(geometry, materialFor(color, opacity))
      mesh.userData.tube = true
      group.add(mesh)
    }

    const syncKnot = (el) => {
      const id = el.dataset.pin
      const hero = el.dataset.knot === 'hero'
      const point = measure(el, true)
      let mesh = knots.get(id)
      if (!mesh) {
        const geometry = new IcosahedronGeometry(hero ? 16 : 11, 0)
        mesh = new Mesh(geometry, materialFor(MAIN, 1))
        const shell = new Mesh(geometry, ink)
        shell.scale.setScalar(1.18)
        mesh.add(shell)
        group.add(mesh)
        knots.set(id, mesh)
        if (hero && !spin) {
          try {
            spin = animate(mesh, {
              rotateZ: [-16, 16],
              duration: 3200,
              loop: true,
              alternate: true,
              ease: 'inOut(2)',
            })
          } catch {
            spin = null
          }
        }
      }
      mesh.position.set(point.x, point.y, hero ? 8 : 5)
    }

    const rebuild = () => {
      group.children.filter((child) => child.userData.tube).forEach((mesh) => {
        group.remove(mesh)
        mesh.geometry.dispose()
      })

      const main = [...node.ownerDocument.querySelectorAll('[data-thread="main"]')]
        .map((el) => ({ ...measure(el, true), sortY: measure(el, false).docY }))
        .sort((a, b) => a.sortY - b.sortY)
      addThread(main, MAIN, 1, false, 6.2)

      const stitches = new Map()
      node.ownerDocument.querySelectorAll('[data-thread="stitch"]').forEach((el) => {
        const key = el.dataset.group || 'stitch'
        const bucket = stitches.get(key) || []
        bucket.push(measure(el, true))
        stitches.set(key, bucket)
      })
      stitches.forEach((points) => {
        points.sort((a, b) => a.docY - b.docY)
        addThread(points, MAIN, 1, false, 6.4)
      })

      branches.forEach((branch) => {
        const points = branch.pins
          .map((id) => node.ownerDocument.querySelector(`[data-pin="${id}"]`))
          .filter(Boolean)
          .map((el) => measure(el, true))
        addThread(points, branch.color, branch.opacity ?? 1, Boolean(branch.closed), branch.id === 'recur' ? 3.2 : 3.4)
      })

      node.ownerDocument.querySelectorAll('[data-knot]').forEach(syncKnot)
      dirty = true
    }

    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const ratio = Math.min(window.devicePixelRatio || 1, mobile ? 1.35 : 1.75)
      renderer.setPixelRatio(ratio)
      renderer.setSize(width, height, false)
      camera.left = -width / 2
      camera.right = width / 2
      camera.top = height / 2
      camera.bottom = -height / 2
      camera.updateProjectionMatrix()
      rebuild()
    }

    const render = () => {
      group.position.y = window.scrollY
      renderer.render(scene, camera)
    }

    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (disposed || document.hidden) return
      const y = window.scrollY
      if (!dirty && y === lastY) return
      lastY = y
      dirty = false
      render()
    }

    const canDrag = () => window.matchMedia('(pointer: fine) and (min-width: 761px)').matches

    const clampOffset = (el, x, y) => {
      const reach = Math.hypot(x, y)
      const max = 72
      if (reach > max) {
        x = (x / reach) * max
        y = (y / reach) * max
      }
      const rect = el.getBoundingClientRect()
      const originX = rect.left + rect.width / 2
      const originY = rect.top + rect.height / 2
      let vx = originX + x
      let vy = originY + y
      node.ownerDocument.querySelectorAll('[data-copy]').forEach((copy) => {
        const box = copy.getBoundingClientRect()
        const left = box.left - 8
        const right = box.right + 8
        const top = box.top - 8
        const bottom = box.bottom + 8
        if (vx <= left || vx >= right || vy <= top || vy >= bottom) return
        const cx = (left + right) / 2
        const cy = (top + bottom) / 2
        if (Math.abs(vx - cx) > Math.abs(vy - cy)) vx = vx > cx ? right : left
        else vy = vy > cy ? bottom : top
      })
      return { x: vx - originX, y: vy - originY }
    }

    const onDown = (event) => {
      const pin = event.target.closest?.('[data-drag]')
      if (!pin || !canDrag() || event.button) return
      release?.revert()
      release = null
      drag = {
        id: pin.dataset.pin,
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        base: { ...(offsets.get(pin.dataset.pin) || { x: 0, y: 0 }) },
        moved: false,
        pin,
      }
    }

    const onMove = (event) => {
      if (!drag || event.pointerId !== drag.pointer) return
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y
      if (Math.hypot(dx, dy) > 3) drag.moved = true
      if (!drag.moved) return
      offsets.set(drag.id, clampOffset(drag.pin, drag.base.x + dx, drag.base.y + dy))
      rebuild()
      render()
    }

    const onUp = (event) => {
      if (!drag || event.pointerId !== drag.pointer) return
      const { id, moved, pin } = drag
      drag = null
      if (moved) pin.dataset.dragged = '1'
      const from = offsets.get(id) || { x: 0, y: 0 }
      if (!moved || (Math.abs(from.x) < 0.5 && Math.abs(from.y) < 0.5)) {
        offsets.delete(id)
        return
      }
      const proxy = { x: from.x, y: from.y }
      release = animate(proxy, {
        x: 0,
        y: 0,
        ease: spring({ bounce: 0.2, duration: 460 }),
        onUpdate: () => {
          offsets.set(id, { x: proxy.x, y: proxy.y })
          rebuild()
          render()
        },
        onComplete: () => {
          offsets.delete(id)
          rebuild()
        },
      })
    }

    resize()
    render()
    signal()
    raf = requestAnimationFrame(frame)

    window.addEventListener('resize', resize)
    window.addEventListener('portfolio:remeasure', resize)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('portfolio:remeasure', resize)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      spin?.revert()
      release?.revert()
      group.traverse((child) => {
        if (child.geometry && child.parent === group) child.geometry.dispose()
      })
      materials.forEach((material) => material.dispose())
      ink.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={host} className="thread-host" aria-hidden="true" />
}
