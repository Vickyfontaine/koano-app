# KNOWN ISSUES (logged, not fixed)

Logged during the demo-kit v2 build (2026-09-27). Do not fix as part of the demo work; captured here so they are not lost.

## 1. EPA contamination: an attempted-and-failed call is classified `live`-omission instead of `fetch_failed`

**Where:** `lib/providers/real/epa-superfund.ts` (~lines 164-179).

**What:** On any failure, including a call that WAS attempted and returned an HTTP error (observed 502 and 429), the provider returns `data: null` tagged `provenance: 'live'` with a coverage note, under the omission rule. The verdict rollup (`weakestProvenance` in `lib/providers/provenance.ts`, applied in `lib/agents/synthesis.ts`) then correctly computes `overall_provenance: 'live'`, because the input it sees is `live`.

**Why it matters:** Under the §06 five-state taxonomy, an attempted-and-failed call should be `fetch_failed` (transient, worth a retry), which is distinct from a `live` omission (a keyless/unseeded source that could not be attempted). Today a transient EPA outage is indistinguishable from a legitimate omission, and it never surfaces as a `fetch_failed` caveat on the verdict. This is a **classification** issue in the provider, NOT a rollup bug (the rollup arithmetic is correct). EPA contributes no signal to the score either way (its data is null), so a corrected `fetch_failed` would add a provenance caveat, not change the verdict, unless the risk agent cites the EPA source.

**Suggested fix (later):** In the provider, distinguish "attempted and failed" (network/HTTP error after a real request → `fetch_failed`) from "could not attempt" (missing optional token / unseeded store → `live` omission). Keep omission-as-live only for the latter.

## 2. Screening memo prints "Year built 0" for a vacant lot

**Where:** `lib/documents/builders/site-screening.ts:433`.

**What:** The envelope row is built as:
```
['Year built / building class', `${f.yearBuilt ?? '—'} / ${f.buildingClass ?? '—'}`]
```
For a vacant lot, `f.yearBuilt` is `0`. `0 ?? '—'` evaluates to `0` (nullish coalescing does not treat `0` as absent), so the memo displays **"0 / V1"** instead of "—" or "vacant". Confirmed on 1800 Park Avenue (a vacant C4-7 lot, built FAR 0).

**Suggested fix (later):** Treat `0` as absent for year-built, e.g. `f.yearBuilt ? f.yearBuilt : '—'` (or `'vacant'`). The demo-kit `verdict.json` shows the intended "vacant / V1" so the demo does not reproduce the bug.

## 3. Documents carry a KOANO brand mark, contradicting the no-KOANO-branding decision for the CMA

**Where:** `lib/documents/render/pdf.tsx:262` (a "KOANO" wordmark top-right on every PDF) and `:455` (a "KOANO recommendation" banner on verdict-style docs).

**What:** The product decision (VO line "Ready to send, with your name on it.") is that a client-ready document, the CMA in particular, carries no KOANO branding. The letterhead already auto-fills the preparer's identity on the left (`getLetterhead`), but every PDF also stamps a KOANO wordmark top-right, so the CMA is co-branded rather than fully white-label. Confirmed on the generated CMA (fictional "Sample Agent / Sample Realty" on the left, "KOANO" top-right).

**Suggested fix (later):** Make the KOANO mark conditional on an empty letterhead (show it only when no preparer identity is set), or add an explicit white-label flag for client-facing document types (CMA, client neighborhood report, net sheet). No code change now.
