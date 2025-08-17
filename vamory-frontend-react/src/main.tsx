import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Auth0Provider } from '@auth0/auth0-react'

const domain = 'auth.vamory.vadaevri.com'
const clientId = 'i6TPTqOQidbyNxEMAhcId4bijbVQ4Xdl'
const redirectUri = import.meta.env.VITE_REDIRECT_URL || 'https://vamory.vadaevri.com'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
                     authorizationParams={{
                 redirect_uri: redirectUri,
                 audience: 'https://api.vamory.vadaevri.com/',
                 scope: 'openid profile email picture'
               }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>,
)
