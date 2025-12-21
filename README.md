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

- Node.js >= 22.0.0

## Setup

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

| Variable                 | Description                                    | Required |
| ------------------------ | ---------------------------------------------- | -------- |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics Measurement ID (G-XXXXXXXXXX) | No       |

See [How to get these values](#how-to-get-these-values) for details.

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
│   │   ├── components/        # Shared components
│   │   │   ├── cookie-consent/    # Cookie consent banner and modal
│   │   │   └── navigation-rail/   # Navigation rail component
│   │   ├── models/            # Type definitions
│   │   └── services/          # Services (theme, cookie consent)
│   └── pages/                 # Page components (Analogjs file-based routing)
│       ├── index.page.ts          # Home page
│       ├── privacy.page.ts        # Privacy policy
│       └── blog/                  # Blog pages
│           ├── index.page.ts          # Blog list
│           └── [slug].page.ts         # Blog post detail (dynamic route)
├── content/
│   ├── assets/                # Static assets for blog posts
│   └── blog/                  # Blog posts (Markdown)
└── server/
    └── routes/api/v1/         # API endpoints
```

## Deployment

### Firebase Hosting

This project is configured for Firebase Hosting with Google Analytics.

### GitHub Actions CI/CD

Set the following secrets in your repository (Settings > Secrets and variables > Actions):

| Secret                     | Description                                    | Required |
| -------------------------- | ---------------------------------------------- | -------- |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON for deployment   | Yes      |
| `FIREBASE_PROJECT_ID`      | Firebase project ID                            | Yes      |
| `VITE_GA_MEASUREMENT_ID`   | Google Analytics Measurement ID (G-XXXXXXXXXX) | No       |

#### How to get these values

1. **FIREBASE_SERVICE_ACCOUNT**: Firebase Console > Project Settings > Service accounts > Generate new private key
2. **FIREBASE_PROJECT_ID**: Firebase Console > Project Settings > General > Project ID
3. **VITE_GA_MEASUREMENT_ID**: Google Analytics > Admin > Data Streams > Web

## License

This project uses a dual license:

| Content                    | License                                                           | File                                 |
| -------------------------- | ----------------------------------------------------------------- | ------------------------------------ |
| Source code                | [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) | [LICENSE](./LICENSE)                 |
| Documents (`src/content/`) | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) | [LICENSE-CONTENT](./LICENSE-CONTENT) |
