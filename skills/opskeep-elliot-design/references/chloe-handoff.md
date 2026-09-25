# Optional Chloe monitoring handoff

Chloe means an optional monitoring/drift-detection service or agent that consumes an approved baseline; it is not part of Opskeep Elliot and must not be improvised if absent.

## Contract

Export or maintain `monitoring.handoff` in the baseline with:

- provider (`CHLOE`, another named system, or `NONE`), owner, and `configuration_status` (`NOT_CONFIGURED`, `PLANNED`, `CONFIGURED`, `VERIFIED`);
- project ID, baseline version, record digest, approval scope, environments, and handoff time;
- measurable signals, source, detection/query reference, severity, threshold, route, and runbook;
- material-drift rules mapped to components, boundaries, identities, controls, and gates;
- credential scope: read-only where possible, no unrestricted infrastructure credentials;
- acknowledgement and last verification evidence.

Chloe may observe, alert, and open a reassessment request. It cannot grant approval, change the baseline, silently accept drift, or authorize destructive remediation. Material drift routes back to Opskeep Elliot and the owner and suspends affected approval when policy requires.

## Fallback

When Chloe is absent, preserve the contract and assign each required signal to the existing observability/on-call owner. Set `provider: NONE` and `configuration_status: NOT_CONFIGURED` if no system exists. Identify which required controls remain `PLANNED` or `UNRESOLVED`; do not claim monitoring coverage. Lack of the name Chloe is not itself a blocker—lack of a required monitored signal, owner, or acceptable plan may be.
