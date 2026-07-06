# TuboGest ERP — Project Conventions

## Commands

### Backend
- `npm run dev` — Start dev server with hot reload (tsx watch)
- `npm run build` — Compile TypeScript to dist/
- `npm run typecheck` — Type-check without emitting
- `npm run lint` — Lint with ESLint

### Frontend
- `npm run dev` — Next.js dev server
- `npm run build` — Production build
- `npm run typecheck` — Type-check with tsc --noEmit
- `npm run lint` — Next.js lint

## Architecture

### Backend
- ESM modules (`"type": "module"`, imports with `.js` extension)
- Modular by domain: `src/modules/{domain}/`
- Layers per module: `routes.ts` → `*.controller.ts` → `*.service.ts` → `*.model.ts`
- Shared middleware in `src/middleware/`
- Environment config in `src/config/env.ts`

### Frontend
- Next.js 16 App Router (`src/app/`)
- Features in `src/features/{feature}/` (colocated: components, hooks, utils)
- Shared components in `src/components/`
- API client in `src/lib/api.ts`
- Types in `src/lib/types.ts`

## Code Style
- TypeScript strict mode
- No semicolons
- Single quotes for strings
- No commented-out code
- No console.log in production code (use proper logging)
- Hooks: prefix with `use`, custom hooks in feature folders

## Git
- Commits in Spanish or English (consistent)
- Prefix: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- Verify with `npm run typecheck` before committing
