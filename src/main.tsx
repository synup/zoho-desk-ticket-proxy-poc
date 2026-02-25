import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installNetworkLogger } from './utils/networkLogger'
import { installErrorLogger } from './utils/errorLogger'
import './index.css'
import App from './App.tsx'

installNetworkLogger()
installErrorLogger()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
