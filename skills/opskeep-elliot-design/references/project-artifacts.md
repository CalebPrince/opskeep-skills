# Required project artifacts

Use these files as a coordinated project record. Copy the starters from `assets/project-artifacts/` into the project root and tailor their depth to the selected risk mode. Do not retain sample claims, routes, commands, or token values as project facts without review.

## Lifecycle

| Stage | Required state |
|---|---|
| Discovery | Create named drafts; record owner, version/status, known facts, unknowns, and links between artifacts. |
| Pre-build review | Complete architecture and security decisions at the selected risk depth. Define interface surfaces and contracts without claiming implementation. Use `NOT BUILT` or `MOCK ONLY` honestly. |
| Owner approval | Reconcile all four artifacts with the exact reviewed baseline. Explicit approval applies only to its recorded scope; document review does not bypass Elliot's approval boundary. |
| Implementation handoff | Hand off approved contracts, hard boundaries, owners, and acceptance/evidence expectations. Implementation can begin only when the security development lock permits it. |
| Build and verification | Update capability and control status from observed evidence. Keep proposals, implementation, and verification distinct. |
| Material change | Update affected artifacts, add the required change record, suspend affected approval when material, and obtain explicit reapproval. |
| Production promotion | Confirm documents match deployed behavior, required evidence exists, and every deployment gate passes. |

## Ownership and precedence

- `README.md` is the entry point. It links to the other artifacts and describes only commands and behavior that are actually available.
- `ARCHITECTURE.md` owns the system view and architectural decisions. Link decisions to relevant `DEC-*`, component, boundary, flow, and change IDs when they exist.
- `SECURITY.md` is the readable security view. `security-baseline.yaml` is authoritative for status, approval, scope, locks, controls, gates, and evidence IDs. Do not manually invent a second approval state.
- `GUI.md` owns the frontend handoff and UI capability truth. Backend behavior documented there is a consumed contract, not permission to change the backend.

Resolve contradictions before work crosses the affected gate. If reconciliation changes a trust boundary, identity, sensitive flow, control, gate, or approved decision, use Elliot's material-change process.

## GUI capability rules

Use exactly these labels:

- `WORKING`: implemented end to end in the named environment and supported by current evidence.
- `PARTIAL`: a useful subset works; list the missing path, limitation, or unverified portion.
- `MOCK ONLY`: visual or local simulation only; it is not connected to the real backend or production data path.
- `NOT BUILT`: no usable implementation exists.

Every capability row names the route/surface, allowed roles, backend dependency, state coverage, evidence, and limitation or next step. A screenshot can show visual implementation but cannot by itself prove authorization, persistence, validation, or end-to-end behavior.

The route/screen specification must include purpose, entry points, navigation, role visibility, primary actions, backend contracts, UI-relevant fields, validation ownership, state behavior, responsive behavior, accessibility acceptance, analytics/audit events where approved, and explicit exclusions.

## Interface and token samples

Provide enough samples to eliminate ambiguity without prescribing a specific framework. A good minimum is:

1. An application shell with navigation, page title, global feedback region, account/session affordance, and responsive collapse behavior.
2. A list/index screen with search or filters when needed, loading skeleton, empty state, row/item actions, pagination or continuation, and recoverable errors.
3. A detail or form screen with labels, help/error association, validation timing, save progress, success confirmation, destructive-action confirmation, and permission-denied behavior.

Tokens should express intent rather than library syntax: color roles, typography roles, spacing scale, radii, elevation, borders, motion durations/easing, breakpoints, focus indication, density, and component-state rules. Include light/dark/high-contrast behavior only when in scope. Token examples in the template are safe starting points, not a brand decision; replace or approve them explicitly.

## Hard interface boundary

The UI implementer may choose presentation composition and local interaction details within approved tokens and contracts. The UI implementer must not silently:

- add or weaken permissions, trust client-side authorization, or infer access from hidden controls;
- add endpoints, fields, mutations, webhooks, events, or storage behavior;
- change server validation, business/financial rules, audit requirements, retention/deletion, or data classification;
- bypass security gates, move secrets into clients, or weaken authentication/session behavior;
- reinterpret a mock as an implemented capability.

When the interface needs a contract or policy change, record the old rule, proposed rule, reason, impact, affected artifacts/IDs, and required approver. Continue only inside unaffected approved scope.
