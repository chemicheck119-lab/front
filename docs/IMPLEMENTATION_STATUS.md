# Chemicheck 119 Implementation Status

Last reviewed: 2026-09-20

## Active Frontend Route

`/main` now mounts the integrated field-response workspace in `src/pages/IntegratedMainPage.tsx`.
The workspace shares one incident state across:

- incident analysis
- official evidence and substance candidates
- two-CAS confirmation and cancellation
- operations-agent workflow
- map context and responder location presentation
- field tools
- structured response record save
- contest/replay intake when `VITE_ENABLE_PRESENTATION_SCENARIO=true`

The existing onboarding tour is retained and targets only controls that exist before analysis. It is not a substitute for operator training.

## Implemented In This Repository

- Auth-aware `/main` route guard when `VITE_ENABLE_AUTH=true`
- Fail-closed live station catalog behavior when the authoritative catalog is unavailable
- Incident analysis request and fail-closed error display
- Substance discovery and candidate handoff into incident context
- CAS confirmation/cancellation and reanalysis
- Official evidence and grounded response presentation
- Structured outcome validation and record save request
- Replay intake to establish an incident ID in presentation scenarios
- GPS browser-state presentation and map rendering when provider configuration exists
- Existing public landing, features, public-data, and trends pages

## Requires BFF/Backend Work

These cannot be completed by this repository alone:

- Production incident creation for an inbound phone call
- Phone transcript SSE registration and authorization for a real incident ID
- Phone-number routing settings and webhook/status callback management
- Durable record listing and record detail retrieval
- Durable confirmation persistence and cancellation behavior
- Movement/ETA provider and route refresh endpoint
- Station-scoped session issuance, roles, and authorization policy
- Authoritative station catalog availability

The current OpenAPI contract contains record save but does not contain a record list/detail operation. `/records` therefore remains an empty-state shell until the BFF exposes a query contract.

## Requires AI/STT Service Work

- Audio ingress from the telephony provider
- Interim/final transcript event production
- Transcript quality and provenance signals
- No raw-audio retention enforcement
- Candidate extraction and evidence retrieval behind the BFF
- No automatic substance confirmation or autonomous risk decision

## Requires Infrastructure/Provider Work

- Firebase rewrites must target the deployed staging/production BFF
- Telephony webhook endpoint, secret storage, and allowlisted callback URLs
- STT provider credentials and timeout configuration
- Map provider client ID/style URL and attribution
- Movement/route provider credentials
- Production/demo data-mode separation

## Known Limits

- The frontend uses the configured dispatch-center phone; it does not invent an operational phone number in live mode.
- Public charts and validation metrics are presentation content, not live incident statistics.
- Map and route UI fail closed when no provider or validated location is available.
- The frontend cannot make a live phone transcript appear without a backend incident ID and authorized SSE stream.

## Validation

Run:

```sh
corepack pnpm check
```

This validates the BFF contract, TypeScript, tests, and production/staging/demo builds.
