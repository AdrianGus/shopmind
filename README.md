# ShopMind

Kobe Technical Challenge — Shopping Agent.

## Runtime

This project is pinned to Node.js 24 through `.nvmrc` and `package.json`:

```sh
nvm use 24
node --version
```

`node --version` should print `v24.x`. If you run `pnpm install` with Node.js
`v25.6.0`, pnpm warns with `Unsupported engine` because the project explicitly
supports `>=24 <25`.

## Setup

```sh
pnpm install
```

## Scripts

```sh
pnpm dev
pnpm check
pnpm build
pnpm start
```

- `pnpm dev` runs the TypeScript server with watch mode.
- `pnpm check` type-checks the project without emitting files.
- `pnpm build` compiles TypeScript ESM into `dist/`.
- `pnpm start` runs the compiled server from `dist/server.js`.

## API

### GET /health

Returns the service health status:

```json
{
  "status": "ok",
  "service": "shopmind",
  "environment": "development"
}
```

`POST /api/agent` will be implemented in the next phase of the challenge.
