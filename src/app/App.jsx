import { useCallback, useEffect, useState } from 'react'
import { bindSprings } from '../animation/springs'
import { bindTravel } from '../animation/travel'
import Engine from '../components/Engine/Engine'
import Loader from '../components/Loader/Loader'
import Topbar from '../components/Topbar/Topbar'
import HeroSection from '../sections/HeroSection'
import BlackBoxSection from '../sections/BlackBoxSection'
import CausalResearchSection from '../sections/CausalResearchSection'
import NoshSection from '../sections/NoshSection'
import BmadMlSection from '../sections/BmadMlSection'
import ParallaxSection from '../sections/ParallaxSection'
import ResearchLineageSection from '../sections/ResearchLineageSection'
import ExperienceSection from '../sections/ExperienceSection'
import WritingSection from '../sections/WritingSection'
import ContactSection from '../sections/ContactSection'

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
      <Topbar />
      <main id="scroll-root">
        <HeroSection />
        <BlackBoxSection />
        <CausalResearchSection />
        <NoshSection />
        <BmadMlSection />
        <ParallaxSection />
        <ResearchLineageSection />
        <ExperienceSection />
        <WritingSection />
        <ContactSection />
      </main>
      <Engine />
      <div className="spectrum-slot" aria-hidden="true">
        <div className="spectrum" />
      </div>
      {booting ? <Loader onFinish={finish} /> : null}
    </div>
  )
}
