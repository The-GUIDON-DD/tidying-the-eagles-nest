# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Router 8.0.0 full-stack application template with:
- Server-side rendering (SSR) enabled by default
- TypeScript with strict mode
- TailwindCSS for styling
- Biome for linting and formatting
- Lefthook for git hooks

## Development Commands

```bash
# Install dependencies
npm install

# Start development server with HMR
npm run dev

# Build for production
npm run build

# Run the production server
npm run start

# Type check and generate route types
npm run typecheck
```

## Code Formatting

Uses Biome for linting and formatting:
```bash
# Format code
npx biome format --write .

# Check for linting issues
npx biome check .
```

## Project Structure

```
app/
├── app.css           # Global TailwindCSS styles
├── root.tsx          # Root layout, error boundary, and links
├── routes/
│   └── home.tsx      # Home page route
│   └── +types/       # Route type definitions (auto-generated)
├── welcome/
│   └── welcome.tsx   # Welcome component
└── components/
    └── Envelope.tsx  # Envelope component (currently empty)

public/
├── envelope/
│   ├── envelope.svg
│   ├── flap_closed.svg
│   └── flap_open.svg
└── favicon.ico

react-router.config.ts  # SSR configuration (ssr: true)
vite.config.ts          # Vite config with Tailwind and React Router plugins
tsconfig.json           # TypeScript config with path aliases (~/* -> ./app/*)
biome.json              # Biome linter/formatter config
```

## Key Files

- `app/routes.ts` - Route definitions using React Router's new route convention
- `app/root.tsx` - Root layout with HTML structure, error handling, and scroll restoration
- `app/app.css` - TailwindCSS import with custom theme

## Dependencies

- `@react-router/*` v8.0.0 - React Router framework
- `@dnd-kit/react` - Drag and drop utilities
- `animejs` - Animation library
- `react` v19 - React framework

## Git Hooks

Lefthook runs on pre-commit and pre-push:
- **Pre-commit**: Biome check and format on staged files
- **Pre-push**: Biome check on files to be pushed

```bash
# Run lefthook manually
npx lefthook run pre-commit
```

## Docker Deployment

Uses multi-stage Docker build with Node 24-alpine:
```bash
docker build -t my-app .
docker run -p 3000:3000 my-app
```