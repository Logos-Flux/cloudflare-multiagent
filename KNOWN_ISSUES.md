# Known Issues

This is a `v0.1.0` preview release. The runtime code is functional but the project has known quality-gate issues that will be addressed before `v1.0.0`.

## TypeScript

`npm run typecheck` reports approximately 220 errors, primarily:

- Catch-block `errorData` / `body` typed as `unknown` and accessed without narrowing (`workers/shared/provider-adapters/*`, `workers/shared/rate-limiter/limiter.ts`)
- Unused parameters and imports (`ideogram-adapter.ts`, `r2-manager/storage.ts`, several worker files)
- Missing members on the generated `Env` interface in `workers/text-gen/` (`DB`, `PROVIDER_KEYS`, `ENCRYPTION_KEY`) — `worker-configuration.d.ts` needs regeneration via `wrangler types`
- Missing exports in `workers/text-gen/types.ts` (`AuthResult`, `TextGenerationResult`, `GenerateOptions`, `PromptTemplate`)

The code runs because `tsc` is not part of the deploy path (`wrangler deploy` transpiles via esbuild without strict type enforcement).

## Tests

`npm test` reports 13 failing of 417 tests. The failures are in:

- `tests/logging/storage.test.ts` — `deleteOlderThan` cutoff date calculation
- `tests/provider-adapters/ideogram-adapter.test.ts` — multiple format/submit/status/poll cases
- `tests/r2-manager/storage.test.ts` — R2 public-URL fallback when no CDN is configured

## Lint

`npm run lint` does not run — the project has `eslint` in `devDependencies` and a `lint` script, but no `.eslintrc` / `eslint.config.js`. An ESLint config needs to be added.

## Roadmap to v1.0.0

1. Regenerate Cloudflare Worker types (`wrangler types`) and resolve the resulting `Env` interface gaps
2. Fix catch-block error narrowing across provider adapters and the rate limiter
3. Restore missing type exports in `workers/text-gen/types.ts`
4. Add an ESLint config and resolve any new findings
5. Triage and fix the 13 failing tests

Contributions welcome on any of the above — see `CONTRIBUTING.md`.
