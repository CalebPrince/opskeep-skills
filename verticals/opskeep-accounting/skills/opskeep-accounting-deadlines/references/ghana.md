# Ghana Clients: Obligation Areas to Confirm

A checklist of the areas a Ghana client's compliance calendar usually needs to cover,
and which body owns each. It deliberately has **no due dates, rates or thresholds**:
those depend on the entity, its registrations and the year, and change. Confirm each one
against the official source or a Ghana-qualified professional, then record it as a rule
version (below).

## Areas and Owning Bodies

| Area | Owning body | Confirm for this client |
|---|---|---|
| Corporate income tax (returns, provisional/instalment payments) | Ghana Revenue Authority (GRA) | entity type, year-end, filing basis |
| VAT and the levies charged with it (NHIL, GETFund and any current levy) | GRA | registration, scheme, return period |
| Withholding tax on payments to suppliers and others | GRA | which payment types apply |
| PAYE on employee pay | GRA | payroll exists, employee count |
| Social security contributions | Social Security and National Insurance Trust (SSNIT) | employees, tiers that apply |
| Annual returns and company filings | Office of the Registrar of Companies (ORC) | company type, incorporation date |
| Sector or regulator-specific filings | the relevant regulator | sector |

## Recording a Rule Version

For each confirmed obligation, record in the practice's deadline rules
(`opskeep-accounting-manage`):

- Area and client.
- Rule source (Act, GRA/SSNIT/ORC page or notice) and the date it was checked.
- Effective date of the rule.
- Due-date rule as written in the source (for example "by the last working day of the
  following month").
- Owner and review status (`configured`, `needs review`, `action needed`).

A rule with no source or no check date stays `needs review`, and every deadline computed
from it is labelled the same way.

## Rules

- Never fill a Ghana date, rate or threshold from memory.
- No skill files a return or makes a payment to GRA, SSNIT or ORC.
