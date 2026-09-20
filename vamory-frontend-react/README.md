# Vamory frontend

Vamory is a React gallery client for browsing, organizing, sharing, searching, and managing media stored by the Vamory FastAPI backend.

Repository: [TDVamit/Vamory-frontend](https://github.com/TDVamit/Vamory-frontend)

## Product surface

- Public landing, pricing, FAQ, and contact pages.
- Auth0 login/logout with protected application routes and backend profile hydration.
- Gallery and folder views with upload, file actions, folder creation/editing, pagination, filtering, and storage usage charts.
- Public folder/file views for shared content, including download and thumbnail access.
- Storage-class conversion controls and conversion status UI for Standard-IA, Glacier Instant Retrieval, and Deep Archive workflows.
- Recycle bin, notifications, profile image management, Google Drive import, cost/exchange-rate views, and admin role controls.
- Face detection/detail pages and AI search controls backed by the API.

## Architecture

```text
Browser ── Auth0 React SDK ──> access token
   │
   └── Axios service layer ── bearer token + public token ──> Vamory FastAPI API
                                                                    │
                                                                    └── MongoDB + S3 + workers
```

The app uses React Router for public, protected, and shared-content routes. `src/services/api.ts` centralizes API calls, adds the stored bearer token to requests, and defaults the backend URL to `https://api.vamory.vadaevri.com` when no Vite override is provided.

## Technology

- React 19, TypeScript, Vite 7
- React Router 7 and Axios
- Auth0 React SDK and `jose`
- Tailwind CSS, PostCSS, Lucide React
- ESLint and TypeScript project builds

## Local development

### Prerequisites

- Node.js with npm
- A running Vamory backend or a reachable API environment
- An Auth0 application configured for the local callback/logout URLs

### Install and configure

The frontend application is in `vamory-frontend-react/`:

```bash
git clone https://github.com/TDVamit/Vamory-frontend.git
cd Vamory-frontend/vamory-frontend-react
npm ci
```

Create a local `.env` file. Do not commit it or place secrets in Vite variables; values prefixed with `VITE_` are exposed to the browser.

```dotenv
VITE_BACKEND_BASE_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
VITE_REDIRECT_URL=http://localhost:5173
```

Auth0 settings are read by the project’s existing Auth0 hook/configuration. Configure the corresponding Auth0 tenant, audience, client, and allowed callback/logout URLs in the environment or deployment configuration used by that setup. Keep provider secrets server-side.

### Run and validate

```bash
npm run dev       # http://localhost:5173
npm run build
npm run lint
npm run preview
```

The production build is emitted by Vite to `dist/`. The root repository also contains a lockfile, but the runnable package and scripts are under `vamory-frontend-react/`.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/home`, `/pricing`, `/contact`, `/faq` | Public | Marketing and information pages |
| `/gallery` | Authenticated | User gallery |
| `/folder/:folderId` | Authenticated | Folder contents and management |
| `/faces`, `/faces/:faceId` | Authenticated | Face detection and detail views |
| `/recycle-bin` | Authenticated | Deleted-file recovery/management |
| `/shared/folder`, `/shared/folder/:params` | Public link | Shared folder browsing |
| `/shared/file` | Public link | Shared file browsing |

## Current status and integration notes

- The default `master` branch contains the active application; a separate `temp` branch contains an earlier/minimal Vite state and is not the documented runtime.
- No automated test suite or deployment configuration is visible in the checked-in frontend tree. Use `npm run build` and `npm run lint` as baseline checks, then validate Auth0 and API flows against a configured backend.
- The UI depends on backend endpoints for uploads, sharing, public access, storage transitions, face features, AI search, notifications, and cost data; those features are unavailable without their corresponding backend integrations.
- The deployed domains referenced by the source are configuration defaults, not a verified live demo link. Use `VITE_BACKEND_BASE_URL` and deployment-specific Auth0 settings for each environment.

## Related project

The companion API is in [TDVamit/Vamory-backend](https://github.com/TDVamit/Vamory-backend).
