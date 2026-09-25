# Architecture

Status: DRAFT  
Owner: TBD  
Version: 0.1.0  
Last reviewed: YYYY-MM-DD

## Context and goals

Describe users, system purpose, constraints, quality attributes, assumptions, and non-goals.

## System context

Diagram or describe clients, services, stores, queues/jobs, external providers, administrative surfaces, and trust boundaries. Link stable `CMP-*`, `TB-*`, and `FLW-*` IDs where available.

## Components and ownership

| Component | Responsibility | Runtime/owner | Exposure | Data handled | Dependencies |
|---|---|---|---|---|---|
| Example web client | Presentation and approved client behavior | TBD | INTERNET | PUBLIC, user session metadata | Example API |

## Data flows and deployment

For each material flow, record source, destination, protocol, authentication, data classification, storage/retention, failure behavior, and observability. Describe environments, network boundaries, secret ownership, deployment identity, rollback, backup, and recovery.

## Interfaces and integrations

Link owned API/event schemas and third-party contracts. Identify timeouts, retries, idempotency, rate limits, and degradation behavior.

## Decisions and change triggers

| Decision ID | Decision | Rationale | Alternatives | Security impact | Status |
|---|---|---|---|---|---|
| DEC-001 | TBD | TBD | TBD | TBD | OPEN |

List changes that require this document and the security baseline to be reassessed.
