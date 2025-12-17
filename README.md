# nekorush14.dev

Personal website and blog of nekorush14.

## Tech Stack

- [Angular](https://angular.dev)
- [Analogjs](https://analogjs.org) - Fullstack meta-framework for Angular
- [TailwindCSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)
- [Vitest](https://vitest.dev) - Testing framework
- [marked](https://marked.js.org) + [Shiki](https://shiki.style) - Markdown rendering

## Requirements

- Node.js >= 20.19.1

## Setup

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GA_MEASUREMENT_ID` | Google Analytics Measurement ID (G-XXXXXXXXXX) | No |

Get your GA Measurement ID from:
- Firebase Console > Project Settings > Integrations > Google Analytics
- Google Analytics > Admin > Data Streams > Web

## Development

```bash
npm start
```

Navigate to `http://localhost:5173/`. The application automatically reloads if you change any of the source files.

## Build

```bash
npm run build
```

Build artifacts are located in:

- Client: `dist/analog/public`
- Server: `dist/analog/server`

## Preview

```bash
npm run preview
```

## Test

```bash
npm run test
```

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── components/     # Shared components (navigation, cookie consent)
│   │   ├── models/         # Type definitions
│   │   └── services/       # Services (theme, cookie consent)
│   └── pages/              # Page components (Analogjs file-based routing)
│       ├── index.page.ts   # Home page
│       ├── privacy.page.ts # Privacy policy
│       └── blog/           # Blog pages
├── content/
│   └── blog/               # Blog posts (Markdown)
└── server/
    └── routes/api/         # API endpoints
```

## Deployment

### Firebase Hosting

This project is configured for Firebase Hosting with Google Analytics.

### GitHub Actions CI/CD

Set the following secrets in your repository (Settings > Secrets and variables > Actions):

| Secret | Description |
|--------|-------------|
| `VITE_GA_MEASUREMENT_ID` | Google Analytics Measurement ID |

Example workflow:

```yaml
- run: npm run build
  env:
    VITE_GA_MEASUREMENT_ID: ${{ secrets.VITE_GA_MEASUREMENT_ID }}
```

## LICENSE

This software is released under the MIT License, see LICENSE file.
