# Lipi feature map

Features marked PARTIAL carry live proof only for their ticked sub-features, dated in the `Last live proof` column (2026-10-02 at `815ceda`, 2026-10-10 at `71b665e` or `37e892b`). Rows without any date were not exercised. Canonical problems, hypotheses and gaps: [docs/verification/verification-issues.md](../../../../docs/verification/verification-issues.md). Harness recipes: [../SKILL.md](../SKILL.md). Browser driving uses `chrome-devtools-axi` per the harness.

| Feature                             | File                                                       | Status  | Last live proof      | Ledger                           |
| ----------------------------------- | ---------------------------------------------------------- | ------- | -------------------- | -------------------------------- |
| Authentication and session          | [auth-session.md](auth-session.md)                         | PARTIAL | 2026-10-10 @ 71b665e | LIP-V002, V003, V004, V007, V014 |
| Anonymous access and route gating   | [access-control-anonymous.md](access-control-anonymous.md) | PARTIAL | 2026-10-10 @ 37e892b | LIP-V004, V005, V008             |
| Workspaces, roles and invites       | [workspaces-roles-invites.md](workspaces-roles-invites.md) | PARTIAL | 2026-10-10 @ 71b665e | LIP-V005, V008, V011, V019       |
| Documents, page tree and editor     | [documents-editor.md](documents-editor.md)                 | PARTIAL | 2026-10-10 @ 71b665e | LIP-V009, V010, V013             |
| Trash and search                    | [trash-search.md](trash-search.md)                         | PARTIAL | 2026-10-10 @ 37e892b | LIP-V010                         |
| Realtime collaboration and presence | [realtime-collaboration.md](realtime-collaboration.md)     | PARTIAL | 2026-10-10 @ 71b665e | LIP-V009, V016                   |
| Pricing and Stripe billing          | [billing-pricing.md](billing-pricing.md)                   | PARTIAL | 2026-10-10 @ 37e892b | LIP-V011                         |
| Image and logo uploads              | [uploads.md](uploads.md)                                   | PARTIAL | 2026-10-10 @ 37e892b | LIP-V010, V018                   |
| Lobby, legal pages and footer       | [lobby-legal-public.md](lobby-legal-public.md)             | PARTIAL | 2026-10-10 @ 37e892b | LIP-V006, V013                   |
| UI quality pass                     | [ui-quality.md](ui-quality.md)                             | PARTIAL | 2026-10-02 @ 815ceda | LIP-V013                         |

Not mapped as features: the data layer, quota math and token signing have unit tests only (`bun run test`) and are covered through the features above.

Prior browser proofs (not new verification): the Playwright specs in `tests/e2e/` (`auth-workspace`, `documents-editor`, `collaboration`, `stripe-checkout`) are cited in `docs/requirements/requirements.md` and `docs/TODO.md`. They were produced before this task and were not re-run here.
