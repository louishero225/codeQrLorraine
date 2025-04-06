import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Enregistrement du service worker pour la fonctionnalité hors ligne
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Une nouvelle version est disponible. Mettre à jour?')) {
      updateSW()
    }
  },
  onOfflineReady() {
    console.log('L\'application est prête à fonctionner hors ligne')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
