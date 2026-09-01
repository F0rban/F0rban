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
3. Calm Today; remove sidebar budget meter. — **in progress**
4. Confidence labels + "why this" line.
5. Branding/stale-text sweep.
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

After cycle 2: 329 tests green, typecheck clean, lint clean. The duels-list
test that timed out twice under load now queries list items instead of
computing 72 accessible link names. Build/a11y/responsive re-run after cycle 3
(layout changes) and in cycle 7.

Visual check done on `/duels/d-code-review-1` (cheaper winner) and
`/duels/d-classification-1` (tie): reveal reads "You picked X, blind." → price
line → record 8–2 → 9–2 → confidence Leaning → Settled → routing swap + $/mo →
next-duel buttons. Dev server: `npx next dev -p 3000` (log in /tmp/dev.log).

## Next action

Cycle 3 — rewrite `src/app/page.tsx` (Today) around three questions:
1. *What can I do now* — pending queue (max 3 rows) with "Judge", plus the
   primary "Run a duel" in the header. Empty queue → one calm line + button.
2. *What has Bench learned* — keep the headline card (mode-aware wording), then
   ONE list: top 3 actionable routing changes + any reversal. No separate
   "latest verdicts", no activity feed, no spend tile.
3. *Does it change how I work* — one line: "N of M kinds of work settled ·
   $X/mo already avoidable" linking to /verdicts; unsettled task types as
   inline "run one" links (max 3).
Also: remove `BudgetMeter` from `src/components/layout/sidebar.tsx` (and now-
unused imports); add `src/app/today.test.tsx` (example vs own wording, queue
rows, CTA present, no "Activity" heading); run a11y + responsive afterwards.
