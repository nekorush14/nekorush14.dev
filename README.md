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
│   ├── core/           # Core module (services, components, models)
│   └── pages/          # Page components
│       ├── index.page.ts
│       └── blog/
├── content/
│   └── blog/           # Blog posts (Markdown)
└── server/
    └── routes/api/     # API endpoints
```

## LICENSE

This software is released under the MIT License, see LICENSE file.
