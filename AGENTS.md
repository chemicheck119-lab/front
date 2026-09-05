# AGENTS.md

## Scope

These instructions apply to the entire frontend repository.

## Validation

- Run `corepack pnpm check` for code changes.
- Keep the checked-in BFF OpenAPI contract and generated types synchronized when an API contract changes.
- Do not weaken or bypass the existing CI, contract-drift, or safety-state tests.

## Code Review Rules

- Treat the two-CAS confirmation gate as a safety boundary. Flag any path that exposes compatibility or CAMEO results before the incident CAS and facility CAS have each been explicitly confirmed.
- Flag UI text that presents a suggested substance as confirmed, historical facility data as current inventory, or a CAMEO ordinal result as a probability or AI diagnosis.
- Flag implicit production fallback to demo fixtures, synthetic routes, synthetic confirmations, or local-only records. Demo data must remain visibly labeled and explicitly enabled.
- Flag direct browser calls to model providers or exposure of server secrets in `VITE_*` variables. Operational requests must go through the BFF.
- Flag FE/BFF contract drift, unsafe narrowing of error states, and behavior changes without proportional tests.
- Preserve fail-closed behavior: unavailable or unverified evidence must be shown as unavailable or requiring confirmation, never invented or silently treated as safe.

## Fix Guidance

- Prefer the smallest fix that preserves contracts and safety gates.
- When asked to fix a review finding, add or update a regression test and report any unverified operational assumption explicitly.
