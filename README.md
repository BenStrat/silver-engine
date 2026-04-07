# Silver Engine Monorepo Bootstrap

This repository is now bootstrapped to match the architecture in `codex.md` for the Web QA Triage MVP.

## Included structure

```txt
/apps
  /web
  /widget
  /api
  /worker

/packages
  /ui
  /types
  /db
  /auth
  /capture
  /linear
  /ai
  /config
```

## Quick start

1. Install pnpm (if needed):
   ```bash
   corepack enable
   corepack prepare pnpm@10.0.0 --activate
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Validate workspace wiring:
   ```bash
   pnpm build
   pnpm lint
   pnpm test
   pnpm typecheck
   ```

## Notes

- The root uses Turbo (`turbo.json`) and a pnpm workspace (`pnpm-workspace.yaml`).
- Each app/package currently has placeholder scripts so the workspace can execute end-to-end checks immediately.
- `tsconfig.base.json` includes starter path aliases for shared package usage.

## Deployment shape

- `apps/api` is a Vercel Functions app with API routes in `api/` and a small static landing page in `public/`.
- `apps/web` is a static placeholder for the internal dashboard until the real Next.js app is added.
- `apps/widget` is a static placeholder for the embeddable widget, including a browser-deliverable script entrypoint.
- `apps/worker` is a minimal trigger-oriented worker placeholder. It is Vercel-compatible for lightweight function or cron-style entrypoints, but a real queue worker may later move to dedicated infrastructure.

When creating Vercel projects in this monorepo, point each project at its app folder as the Root Directory.

## Next implementation steps

- Replace placeholder scripts with real app/package commands.
- Add Next.js app in `apps/web` and widget code in `apps/widget`.
- Add Prisma schema and database package setup in `packages/db`.
- Add Zod contract definitions in `packages/types`.
