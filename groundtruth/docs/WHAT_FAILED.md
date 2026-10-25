# What failed

| Date | Failure | Root cause | Fix / outcome |
| --- | --- | --- | --- |
| 2026-10-18 | Unanswerable question returned a cited answer | Hash-vector collisions and common terms produced a weak match | Added meaningful-term evidence check; regression test now passes. |
| 2026-10-18 | Initial test import failed | Application package was not configured for pytest | Added package configuration and test Python path; tests pass. |
| 2026-10-18 | Docker validation unavailable | Docker CLI is not installed in the workspace | Docker files are present but unexecuted; do not claim container validation. |

The fixture evaluation is also a known limitation, not a success claim: it is synthetic,
repetitive, and too small to establish public-corpus quality or a release threshold.
