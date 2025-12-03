import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ProjectProvider } from './context/ProjectContext.tsx'
import { DaemonStatusProvider } from './context/DaemonStatusContext.tsx'
import { DaemonDisconnectedOverlay } from './components/DaemonDisconnectedOverlay.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DaemonStatusProvider>
        <DaemonDisconnectedOverlay />
        <ProjectProvider>
          <App />
        </ProjectProvider>
      </DaemonStatusProvider>
    </BrowserRouter>
  </StrictMode>
)
