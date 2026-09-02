# Autonomous progress — Bench

Checkpoint file for unattended work. If you are a new session: read this, then
`git log --oneline -15`, then continue from **Next action**. Do not redo the audit.

## Morning report (overnight session, 2026-09-01 → 02)

Eight commits on `claude/ai-command-center-gelf0i`, each one green on
typecheck, lint and the full suite before push. GitHub Pages redeploys on every
push: https://f0rban.github.io/F0rban/.

**What is different when you open it**

1. *Honest evidence.* Every duel carries `sample`. The app says "worked example"
   everywhere until your first own duel, which replaces the example (announced
   on the form and in the toast). Judging the two open sample duels is practice
   and is labelled as such. A fresh record inherits none of the example's
   habits: untouched volume profiles reset to "not set".
2. *The reveal.* After a verdict the judging screen says what the click meant:
   what you picked and what it cost against what it beat, what it did to this
   kind of work's record (8–2 → 9–2, Leaning → Strong evidence), what it means
   for routing, then the way out — judge the next open duel, run another of the
   same kind, read the verdicts. `d` starts a duel from anywhere.
3. *Today is calm.* Three cards instead of seven: the queue, what the evidence
   learned, one line on how settled the record is with the kinds of work
   closest to a verdict. No activity feed, no spend tile, no sidebar budget
   gauge. It never says "$0": a record that has not started, one with nothing
   to change, and one waiting on volumes are three different sentences.
4. *Routing explains itself.* Labels scale with evidence (Early signal ·
   Leaning · Strong evidence · No difference; "No evidence yet" for zero).
   Every row carries a one-sentence reason: who is ahead, by how much, how
   likely that is luck, whether price decided.
5. *Verdicts without volumes stay on the table* under "Use these" instead of
   silently disappearing — the state a real user's first settled verdict lands
   in.
6. *Provider seam.* `lib/providers/{pricing,runner,registry}.ts`: one place a
   run is priced (was six copies), a `DuelRunner` interface with the manual
   runner as the only implementation, a registry that hands out an API runner
   once one is registered. Entries record `source`; manual costs are labelled
   "est.". No network calls.
7. *Branding.* Everything says Bench; workflow-era text is gone; `?status=
   pending` lands on the queue.

**Numbers**: 313 → 357 tests (26 files). Typecheck, lint, knip clean. Normal
build and static export build both pass.

**Final gate** (against the exported site served the way GitHub Pages serves
it, `trailingSlash: true`, `/F0rban` base path): axe — 0 WCAG 2.1 AA
violations across 12 routes × 2 themes; responsive — 0 horizontal overflow
across 8 widths × 12 routes; browser console clean and no failed requests on
`/`, `/verdicts/`, `/duels/`, `/duels/d-pending-0/`, `/models/`,
`/duels/new/?task=…` (including the root-route prefetch that used to 404).

**Not done / deliberately left**: Projects, Tools and Spend analytics are
untouched secondary pages (out of the loop, not removed). No real provider
calls. The two flaky-under-load test timeouts were fixed by cheaper queries,
not by raising timeouts.

**Recommended next**: (1) a first real `DuelRunner` behind a key in Settings;
(2) usage ingestion so volumes stop being typed; (3) then, and only then,
watch whether anyone runs a fifth duel.

## Current state

- Branch: `claude/ai-command-center-gelf0i` (deploys to GitHub Pages on push:
  https://f0rban.github.io/F0rban/ — Pages source = GitHub Actions, env
  `github-pages` has no branch restriction).
- Last commit at audit time: `a0cdea9 chore(deploy): drop Pages auto-enablement`.
- Baseline at audit: 313 tests, typecheck/lint clean, a11y 0, responsive 0.

## Objective in progress

Overnight session: make Bench genuinely usable without adding features.
Priority: core loop > UX simplicity > reveal > routing > persistence >
provider seam > polish.

## Audit (Phase 0) — findings

**Solid, keep:** verdict engine (exact binomial, 4 states, equivalence rule,
reversal detection, 30 tests); blind mechanic (hash-shuffled order, no
name/price pre-verdict, tested); domain model; single `mutate()` write path;
`WorkspaceAdapter` seam; OKLCH tokens; record marks (tally/bar/form); story-spec
seed corpus; onboarding sample duel.

**Harms the value prop (fix first):**
1. Today headline says "Your own results say you are overpaying by $69" while
   `usingSampleData` is true. Same "your" wording on Verdicts, Spend, Today card
   titles, footer. Banner says sample; headline contradicts it.
2. Judging a seeded pending duel or starting a real duel mixes sample and own
   evidence in one record with no distinction.
3. Reveal after judging is thin (name + reason + price spread) and there is no
   "next" action — the loop does not close on screen.
4. Today is 7 cards + banner (activity feed, spend tile, latest verdicts, settled
   meter…). Reads as a generic analytics dashboard.
5. Sidebar carries a budget meter (V1 leftover, duplicates Spend).

**Inconsistencies / stale:** "AI Command Center" in metadata, aria-labels,
settings About, export filename; "workflow run animation" text; hardcoded
"70 duels" (corpus is 72 incl. 2 pending); palette advertises `D` hotkey that is
not registered; `/duels?status=pending` param ignored by the page.

**Routing:** engine is honest; labels could match evidence strength better
("Early signal / Leaning / Strong evidence / No difference"); rows lack a
one-line "why". Leans appear in "Your call" with "wins" wording.

**Providers:** no abstraction at all; `costPerRun` duplicated in 3 places.

**Purely demonstrative:** Projects, Tools, Spend analytics — out of the loop,
left in place as secondary (not removed, not prioritised).

## Plan (cycles)

1. Honest evidence: `sample` flag on Duel, `WORKSPACE_VERSION` 2, first own
   duel clears sample corpus (announced), `evidenceMode()` helper, conditional
   wording everywhere, computed counts. — **done** (319 tests)
2. Reveal + loop closure on judging screen; `d` hotkey (Today moved to `g t`). — **done**
3. Calm Today; remove sidebar budget meter. — **done** (a11y/responsive sweep
   was still running at commit time; result recorded in the next commit)
4. Confidence labels + "why this" line. — **done** (`confidenceLabel`,
   `explainVerdict`, `chanceSentence` moved to the lib; a11y + responsive after
   cycle 3 were both clean)
5. Branding/stale-text sweep. — **done** (metadata, palette, settings, seed
   prompt, package.json → Bench 0.2.0; `/duels?status=pending` wired; reveal
   rises in; docs de-workflowed)
6. Provider seam (`DuelRunner`, registry, `priceRun`). — **done**
   (`src/lib/providers/{pricing,runner,registry}.ts`; six copies of the cost
   arithmetic collapsed into `priceRun`; entries carry `source`, judging screen
   labels manual costs "est."; documented in docs/architecture.md)
7. Quality gate, screenshots, docs, push. — **done** (found and fixed: settled
   verdicts without volumes vanished; example habits leaked into a fresh
   record; static-export bailouts on the duel pages; `/F0rban.txt` prefetch
   404 → `trailingSlash: true`)
8. Remove the last static-export bailouts (Models, Prompts, Tools, Projects)
   with `useInitialSearchParam`; no `Suspense` wrapper left in `src/app`. —
   **done** (export verified: zero bailout markers in any page, clean console
   and no failed requests on the four pages and their deep links, a11y 0,
   responsive 0)

## Decisions taken

- Sample corpus is a read-only worked example. Judging its two open duels is
  practice and stays in example mode. Starting the first *own* duel switches
  the workspace to the own record (sample duels removed, stated on the form and
  in the toast; Settings can restore the sample).
- Verdict maths unchanged; only labels and explanations change. Reversal flag
  already covers recency; no recency weighting added to the recommendation.
- Version bump wipes prototype localStorage; acceptable (no real users yet).

## Known problems

- Sandbox cannot reach `f0rban.github.io` (egress). Verify Pages via the
  Actions run status, not by fetching the site.
- **Static export + `useSearchParams`.** Calling `useSearchParams` during the
  static prerender bails the whole route out to client rendering: the exported
  HTML has an empty `<div id="main">` with `BAILOUT_TO_CLIENT_SIDE_RENDERING`,
  so the first paint is emptier. **Resolved everywhere** (cycle 8): every page
  that reads a query parameter now uses `useInitialSearchParam` (reads after
  mount), no route in the export carries a bailout marker, and no page needs a
  `Suspense` wrapper for it. The rule is in docs/architecture.md; the only
  place `useSearchParams` still appears is the test double. Node/Vercel-style
  hosting was never affected.
- **Static export + `basePath` needs `trailingSlash: true`.** Without it the
  client prefetches the root route as `/F0rban.txt` (a 404 on every page load
  and a hard navigation when clicking Today), and a folder of dynamic pages such
  as `duels/` can shadow its sibling `duels.html` on a naive static server. The
  export branch of `next.config.ts` now sets `trailingSlash: true`, so every
  route is `x/index.html` + `x/index.txt`. A local test server for the export
  must serve `dir/index.html` and 301 a directory URL without its slash, the
  way GitHub Pages does. An earlier local sweep used a resolver that served the
  404 page for `/duels` and `/projects`; those results were discarded and the
  sweeps re-run.

## Tests / build status

After cycle 3: 335 tests green, typecheck clean, lint clean. Today verified
visually at 1440 dark/light and 390 mobile (model names truncate beside the
money column; cards no longer stretch to match). a11y + responsive sweep was
running when cycle 3 was committed — see the next commit for the result.
Dev server: `npx next dev -p 3000` (log in /tmp/dev.log).

Cycle 3 removed `features/dashboard/activity-feed.tsx` (no longer imported)
and the `formatTime` / `activityBucket` date helpers that only it used.

## Next action

The overnight plan is complete (cycles 1–8). If you are picking this up:

1. **A first real `DuelRunner`.** Add a key field in Settings (kept in
   `localStorage`, never in the workspace export), implement
   `AnthropicRunner` in `src/lib/providers/` (`kind: "api"`, `supports` →
   `anthropic`), call `registerRunner` when a key exists, flip
   `CONNECTABLE[0].available`. The duel form already goes through
   `runnerFor`; entries already carry `source: "api"`, so the judging screen
   will label those costs as measured on its own.
2. **Usage ingestion** so `TaskProfile.runsPerMonth` stops being typed: same
   seam, read from the provider's usage endpoint into the profile.
3. Only then: watch whether anyone runs a fifth duel.

Keep the gate: `npm run typecheck && npm run lint && npm run test`, both
builds, `npm run a11y` and `npm run responsive` against the export served like
Pages (directory index + 301 without slash), `npx knip`.

(Cycles 5 and 6 below are kept for reference — both done.)

Cycle 5 — branding and stale text, exact locations:
- `src/components/layout/topbar.tsx:75` fallback "Command Center" → "Bench"
- `src/components/command/command-palette.tsx:228` export filename;
  `:300` description mentions workflows
- `src/hooks/use-page-title.ts:15` document.title suffix
- `src/app/globals.css:6` header comment; `:364` "workflow canvas" comment
- `src/app/settings/page.tsx:75` filename, `:101` import error, `:223`
  "workflow run animation", `:304` About paragraph
- `src/app/layout.tsx` metadata (title, template, applicationName, authors,
  openGraph, keywords "workflows")
- `src/lib/data/seed/prompts.ts:267` default value describing the old product
- `src/lib/data/types.ts:2` header comment; `package.json` name
- Wire `?status=pending` on `/duels` (Today's "more waiting" link and
  attention.ts already emit it): read `useSearchParams` inside a Suspense
  boundary like `duels/new/page.tsx` does.

Cycle 6 — provider seam: `src/lib/providers/pricing.ts` with
`priceRun(model, tokensIn, tokensOut)` replacing the six copies (duels/new ×2,
task-volumes, seed/duels `entryFor`, verdicts.ts `costPerRun`, spend.ts
`estimateCost`); `src/lib/providers/runner.ts` with the `DuelRunner` interface,
`ManualRunner`, and a registry keyed by `ProviderId` (`available: false` for
anthropic/openai/google until keys exist). No network calls.
