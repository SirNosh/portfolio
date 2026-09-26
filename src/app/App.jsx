import { useCallback, useEffect, useState } from 'react'
import { bindSprings } from '../animation/springs'
import { bindTravel } from '../animation/travel'
import Engine from '../components/Engine/Engine'
import Loader from '../components/Loader/Loader'
import Shelf from '../components/Shelf/Shelf'

export default function App() {
  const [booting, setBooting] = useState(true)
  const finish = useCallback(() => setBooting(false), [])

  useEffect(() => {
    const root = document.getElementById('top')
    const stopSprings = bindSprings(root)
    const stopTravel = bindTravel(root)
    return () => {
      stopSprings()
      stopTravel()
    }
  }, [])

  return (
    <div id="top" className="site">
      <div className="field" aria-hidden="true">
        <div className="field-grid" />
        <div className="field-wash" />
        <div className="field-drift" />
      </div>
      <main id="scroll-root">
        <section id="between" className="reel" aria-hidden="true" />
        <Shelf />
      </main>
      <Engine />
      {booting ? <Loader onFinish={finish} /> : null}
    </div>
  )
}
