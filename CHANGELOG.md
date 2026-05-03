# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-03

Initial public preview release.

### Added

- Multi-agent platform on Cloudflare Workers with hierarchical Organization → Instance → Project model
- Image generation worker with Ideogram provider adapter
- Text generation worker with OpenAI and Anthropic provider support, plus a dynamic provider adapter driven by Config Service
- R2 storage manager with per-instance/per-project path scoping
- Rate limiter with Durable Objects backend
- Auth/key-manager service with encrypted credential storage
- Admin panel, monitoring dashboard, and text/image testing GUIs
- Database schema and seed data for instances, projects, and API keys
- Deployment scripts for single-instance and multi-instance setups
- Documentation: deployment guide, custom domain setup, automation guide, API reference

### Known limitations

See [`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md) — type checks and a subset of tests fail in this preview. Production deploys via `wrangler deploy` work because Cloudflare's bundler does not enforce `tsc`.
