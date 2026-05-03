# Contributing

Thanks for your interest in contributing to Cloudflare Multi-Agent.

## Quick start

```bash
git clone https://github.com/Logos-Flux/cloudflare-multiagent.git
cd cloudflare-multiagent
npm install
cp .env.example .env   # fill in your Cloudflare credentials
npm test               # see KNOWN_ISSUES.md — some tests currently fail
```

## Reporting issues

- Check [open issues](https://github.com/Logos-Flux/cloudflare-multiagent/issues) and `KNOWN_ISSUES.md` first.
- Include reproduction steps, expected vs. actual behavior, and your `wrangler` / Node version.
- For security-sensitive reports, follow `SECURITY.md` instead — do not file a public issue.

## Pull requests

- Branch from `main`. Use a descriptive branch name (`fix/text-gen-env-types`, `docs/quickstart`, etc.).
- Keep PRs focused — one logical change per PR.
- Include or update tests for any behavior change.
- Run `npm run typecheck` and `npm test` before submitting; note any pre-existing failures from `KNOWN_ISSUES.md` separately from new ones you introduce.
- Update `CHANGELOG.md` under an `## [Unreleased]` section.
- Sign your commits if possible.

## Roadmap to v1.0.0

The current `v0.1.x` line is a public preview. The path to `v1.0.0` is documented in `KNOWN_ISSUES.md` — type-check cleanup, ESLint config, and fixing the 13 known test failures. Help on any of these is welcome.

## Code style

- TypeScript strict mode is the goal (currently aspirational — see `KNOWN_ISSUES.md`).
- `npm run format` runs Prettier across `**/*.{ts,tsx,json,md}`.
- No ESLint config yet; once one lands, `npm run lint` will be required for PRs.

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
