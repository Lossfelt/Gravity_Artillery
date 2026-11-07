import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/exo-2'
import './index.css'
import GravityArtilleryGame from './GravityArtilleryGame'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GravityArtilleryGame />
  </StrictMode>,
)
