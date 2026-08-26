# Development and local smoke testing

## Prerequisites

- Node.js 22.19+ or 24+
- pnpm 11
- DeepSeek Harness 0.1.1-rc.2
- Sleev CLI 1.7.7 for a real gateway test

Install and verify Sleev without starting an account flow:

```powershell
npm install --global sleev@1.7.7
sleev --version
sleev gateway status
```

Account and machine setup are interactive and deliberately remain a user
action:

```powershell
sleev auth login
sleev setup
sleev gateway status
```

The default local gateway address is `http://127.0.0.1:17321`; an
OpenAI-compatible DSH route uses `http://127.0.0.1:17321/v1` as its base URL.

## DSH profile

Build before adding or restarting the profile:

```powershell
pnpm check
dsh plugin --profile web add /absolute/path/to/dsh-sleev
```

The current DSH web bundle disables shared-module HMR. Changes to this package
therefore require a host restart. Changes under the `llm-pi-ai` section of
`$DSH_HOME/settings.yaml` are independently hot-reloaded by DSH settings.

## Compatibility caveat

Sleev currently documents harness ids for several first-party integrations but
not DeepSeek Harness. The sample uses `sleev-harness: pi` because the supported
DSH adapter is `llm-pi-ai`; treat it as an experimental compatibility value.
Keep it easy to override, and verify tools, streaming, and usage on every Sleev
upgrade until Sleev publishes a native DSH identifier.

Do not consider the wire spike complete until a configured account passes a
real request with tool calls and a provider `usage` chunk.
