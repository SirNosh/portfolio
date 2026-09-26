import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import './styles/typography.css'
import './styles/chapters.css'
import './styles/responsive.css'
import App from './app/App.jsx'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
