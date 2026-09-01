# Autonomous progress — Bench

Checkpoint file for unattended work. If you are a new session: read this, then
`git log --oneline -15`, then continue from **Next action**. Do not redo the audit.

## Current state

- Branch: `claude/ai-command-center-gelf0i` (deploys to GitHub Pages on push:
  https://f0rban.github.io/F0rban/ — Pages source = GitHub Actions, env
  `github-pages` has no branch restriction).
- Last commit at audit time: `a0cdea9 chore(deploy): drop Pages auto-enablement`.
- Tests 313 green, typecheck/lint clean, a11y 0 violations, responsive 0 overflow.

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
5. Branding/stale-text sweep. — **in progress**
6. Provider seam (`DuelRunner`, registry, `priceRun`).
7. Quality gate, screenshots, docs, push.

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

## Tests / build status

After cycle 3: 335 tests green, typecheck clean, lint clean. Today verified
visually at 1440 dark/light and 390 mobile (model names truncate beside the
money column; cards no longer stretch to match). a11y + responsive sweep was
running when cycle 3 was committed — see the next commit for the result.
Dev server: `npx next dev -p 3000` (log in /tmp/dev.log).

Cycle 3 removed `features/dashboard/activity-feed.tsx` (no longer imported)
and the `formatTime` / `activityBucket` date helpers that only it used.

## Next action

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
