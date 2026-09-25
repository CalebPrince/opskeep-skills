# GUI — interface handoff

Status: DRAFT  
Owner: TBD  
Last reviewed: YYYY-MM-DD  
Applies to: web/mobile/desktop/operator interface (replace as applicable)

This document is tool-agnostic. It specifies user-visible behavior and consumed contracts, not a framework, vendor, or implementation agent.

## Experience intent

Describe users, jobs, tone, information hierarchy, supported devices/input methods, constraints, and explicit non-goals.

## Capability matrix

Allowed status values: `WORKING`, `PARTIAL`, `MOCK ONLY`, `NOT BUILT`.

| Capability | Route/surface | Roles | Backend contract | Status | States covered | Evidence | Limitation/next step |
|---|---|---|---|---|---|---|---|
| View items | `/items` | member, admin | `GET /v1/items` | NOT BUILT | loading, empty, error, success | NOT_YET_BUILT | Confirm pagination contract |
| Create item | `/items/new` | admin | `POST /v1/items` | MOCK ONLY | default, validation, submitting, success | Prototype link | Not connected; authorization unverified |

## Route and screen inventory

| Route/screen | Purpose | Entry/navigation | Allowed roles | Primary actions | Data/contracts | Responsive/accessibility acceptance | Exclusions |
|---|---|---|---|---|---|---|---|
| `/items` | Find and inspect items | Main navigation | member, admin | search, filter, open | ItemSummary; list endpoint | One-column under compact breakpoint; keyboard-operable rows | No inline editing |

For every screen, define loading, empty, recoverable error, terminal error, success, disabled, unauthorized, forbidden, and session-expired behavior where relevant. Say `NOT APPLICABLE` with a reason when a state cannot occur.

## Backend contracts consumed by the UI

For each endpoint, event, upload, or realtime channel, record owner, method/topic, request fields, response fields, error model, pagination, idempotency, rate-limit behavior, authorization rule, and audit event. Link the authoritative schema; do not redefine it here.

### Example contract reference

| Operation | Request | Success | Expected errors | UI behavior | Contract owner |
|---|---|---|---|---|---|
| List items | cursor, query, status | items, next_cursor | 401, 403, 429, 5xx | Re-authenticate; permission explanation; retry timing; safe retry | Backend team |

## UI-relevant data models

| Model/field | Type/format | Required | Classification | Display/edit rule | Validation owner | Redaction/fallback |
|---|---|---|---|---|---|---|
| Item.name | text | yes | INTERNAL | display and edit for admin | Server authoritative; client assists | `Untitled` display fallback |

Never include secret values or sensitive production samples.

## Authentication and permissions

Document sign-in/out, session refresh/expiry, account recovery, step-up authentication, role/capability mapping, tenant/workspace selection, unauthorized/forbidden behavior, and which actions require confirmation. Hiding a control is not authorization; the server remains authoritative.

## Sample interfaces

### 1. Application shell

- Skip link, semantic regions, primary navigation, page title, global status/alert region, account/session menu.
- Compact layouts collapse navigation without hiding the current location or critical actions.
- Global feedback never replaces field-level or action-level errors.

### 2. Collection screen

- Header: title, short context, role-allowed primary action.
- Controls: labeled search/filter/sort; active-filter summary and clear action.
- Content: skeleton while loading; purposeful empty state; accessible list/table; continuation or pagination.
- Failure: preserve user input, explain impact, and offer safe retry only when the operation is retryable.

### 3. Detail/form screen

- Stable title and breadcrumbs/back path; grouped fields with visible labels and help/error association.
- Client validation assists; server validation is authoritative and maps to fields or a summary.
- During save, prevent accidental duplicate submission without trapping navigation indefinitely.
- On success, provide confirmation and the resulting state. Destructive actions state impact and require the approved confirmation pattern.

Replace these samples with project-specific annotated wireframes, content examples, or acceptance notes. A sample does not imply `WORKING`.

## Design and interface tokens

These neutral examples are starting values, not approved brand facts. Replace or explicitly approve them. Record tokens by semantic role so any implementation can map them to its platform.

```yaml
color:
  canvas: "#FFFFFF"
  surface: "#F7F8FA"
  text: "#171A21"
  text_muted: "#5D6573"
  border: "#D8DCE3"
  accent: "#2457D6"
  accent_text: "#FFFFFF"
  success: "#18794E"
  warning: "#946200"
  danger: "#C32F27"
  focus: "#6E56CF"
typography:
  family_body: "system-ui, sans-serif"
  family_mono: "ui-monospace, monospace"
  size: { xs: "0.75rem", sm: "0.875rem", md: "1rem", lg: "1.25rem", xl: "1.75rem" }
  line_height: { compact: 1.25, body: 1.5, relaxed: 1.7 }
space: { 0: "0", 1: "0.25rem", 2: "0.5rem", 3: "0.75rem", 4: "1rem", 6: "1.5rem", 8: "2rem", 12: "3rem" }
radius: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem", pill: "999px" }
border_width: { default: "1px", strong: "2px" }
elevation: { raised: "0 1px 3px rgba(16,24,40,.12)", overlay: "0 12px 32px rgba(16,24,40,.20)" }
motion:
  duration: { fast: "120ms", normal: "200ms", slow: "320ms" }
  easing: { standard: "cubic-bezier(.2,0,0,1)", exit: "cubic-bezier(.4,0,1,1)" }
breakpoint: { compact: "40rem", wide: "64rem" }
focus:
  ring: "0 0 0 3px color-mix(in srgb, #6E56CF 35%, transparent)"
  offset: "2px"
control:
  min_target: "2.75rem"
  disabled_opacity: 0.55
```

Define hover, active, selected, disabled, read-only, invalid, busy, success, and focus-visible behavior for interactive components. Do not communicate status by color alone. Honor reduced-motion preferences and preserve focus visibility at all supported contrast modes.

## Responsive and accessibility requirements

- Name supported viewport ranges, zoom/reflow expectation, pointer and keyboard behavior, content priority, and overflow rules.
- Use semantic structure and accessible names; maintain logical reading/focus order; return focus after dialogs; announce asynchronous status appropriately.
- Define contrast, target size, captions/transcripts, localization, text expansion, and reduced-motion requirements relevant to the product.
- Record the target accessibility standard and test/evidence plan; do not claim conformance before verification.

## Analytics, audit, and privacy

List approved product analytics and server audit events, consent requirements, prohibited fields, retention, and owners. UI telemetry must not include secrets or sensitive field values.

## Hard boundaries for implementers

Implementers may refine presentation and local interaction details within approved tokens and contracts. They must not silently change backend endpoints/events, server validation, business or financial rules, authentication/authorization, data classification/retention, audit requirements, security controls/gates, infrastructure, or approval state. Client checks never replace server enforcement.

Any needed boundary change must be proposed with the old rule, new rule, reason, impact, affected artifacts/IDs, and approver. Continue only within unaffected approved scope.
