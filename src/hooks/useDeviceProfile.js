import { useEffect, useState } from 'react'

function readProfile() {
  const narrow = window.matchMedia('(max-width: 760px)').matches
  const fine = window.matchMedia('(pointer: fine)').matches
  return { mobile: narrow, fine: fine && !narrow }
}

export function useDeviceProfile() {
  const [profile, setProfile] = useState(readProfile)

  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 760px)')
    const fine = window.matchMedia('(pointer: fine)')
    const update = () => setProfile(readProfile())
    narrow.addEventListener('change', update)
    fine.addEventListener('change', update)
    return () => {
      narrow.removeEventListener('change', update)
      fine.removeEventListener('change', update)
    }
  }, [])

  return profile
}
