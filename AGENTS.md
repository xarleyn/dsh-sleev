# Repository instructions

## Development workflow

- Keep changes scoped to the current implementation milestone.
- Create a Git commit after each meaningful, verified milestone instead of
  accumulating the whole feature in one large commit.
- Run the checks appropriate to the milestone before committing; for ordinary
  TypeScript changes, prefer `pnpm check`.
- Use concise conventional commit subjects that describe the delivered outcome.
- Do not rewrite or squash earlier milestone commits unless the user asks.

## Architecture invariants

- Never mutate DSH `GenerateOptions` or downstream `StreamChunk` objects.
- Never serialize prompts, request headers, credentials, or secret values into
  telemetry.
- Keep Sleev-specific transport details isolated from generic observation and
  aggregation code.
- Keep native DSH compaction distinct from external gateway optimization.
