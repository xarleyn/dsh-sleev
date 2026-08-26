# dsh-sleev

Early DeepSeek Harness integration for observing provider routes that pass
through the external Sleev context-optimization gateway.

The current M1 build is intentionally host-only. It does not rewrite prompts,
does not implement compaction, and does not route traffic by itself. Routing is
configured as a normal `@deepseek-ai/dsh-llm-pi-ai` provider profile; this
plugin observes matching route aliases at the `llm/stream` boundary.

## Current behavior

- observes exact routes and/or prefixes (default prefix: `sleev-`);
- classifies agent, compaction, session-title, and one-shot calls;
- yields every stream chunk unchanged;
- records provider usage and effective input token volume;
- retains a bounded secret-free in-memory history;
- logs one structured completion record per observed call.

## Development

```powershell
pnpm install
pnpm check
```

The package is already linked into the local DSH web profile. Add
`dsh-sleev` to that profile's `dsh.profile.bundles` list after the first build,
then restart the host if bundle HMR does not pick up a newly added bundle.

See [the sample settings](docs/sample-settings.yml) for known-provider and
custom-upstream `llm-pi-ai` routes, and [the development guide](docs/development.md)
for local installation and smoke testing.

Sleev does not currently document a native DeepSeek Harness identifier. The
sample's `sleev-harness: pi` value is an explicit experimental compatibility
choice, not a promise of first-party support. A real account-backed streaming,
tools, and usage smoke test remains required before calling the compatibility
spike complete.
