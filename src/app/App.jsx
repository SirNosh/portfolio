import { useCallback, useEffect, useState } from 'react'
import ThreadCanvas from '../components/ThreadScene/ThreadCanvas'
import Loader from '../components/Loader/Loader'
import ProgressRail from '../components/ProgressRail/ProgressRail'
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
import { bindScrollMotion } from '../animation/scrollMotion'
import { bindLoop } from '../animation/loopScroll'

export default function App() {
  const [booting, setBooting] = useState(true)
  const finish = useCallback(() => setBooting(false), [])

  useEffect(() => {
    const root = document.getElementById('top')
    const stopMotion = bindScrollMotion(root)
    const stopLoop = bindLoop()
    return () => {
      stopMotion()
      stopLoop()
    }
  }, [])

  return (
    <div id="top" className="workspace">
      <ThreadCanvas />
      <ProgressRail />
      <main>
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
        <HeroSection loop />
      </main>
      {booting ? <Loader onFinish={finish} /> : null}
    </div>
  )
}
