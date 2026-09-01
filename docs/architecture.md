# Architecture

Short notes on the decisions that shaped this codebase, and why.

## The verdict engine

`lib/analytics/verdicts.ts` is the product. It turns duel records into routing
decisions, and the hard part is not counting wins — it is being honest about how
much a count of nine proves.

Confidence comes from an exact binomial: the probability of the leader's record
arising from two equal models. Exact rather than approximate because n is small
enough that the table is free, and there are no heuristics to explain when they
produce something odd.

Two rules are worth calling out because the obvious implementation is wrong:

**Equivalence is a finding, not a failure.** When there have been enough tries to
find a difference and none appeared, that is a result: take the cheaper model.
Most of the money lives here, because the cheap one only has to be *not worse*.

**But "not significant" must not swallow real signal.** A 7–3 record with a
six-win streak is a lean, not a tie. So an equivalence also requires the leader
to hold at most 60% of decisive results. Without that guard, the engine routed
work to the model that was losing.

Reversal detection compares the recent six results against everything before
them, so a leader that has quietly been overtaken surfaces even while its
lifetime record still looks fine.

## The one rule: data never lives in components

Everything flows through a single seam:

```
seed data ─┐
           ├─→ WorkspaceAdapter ──→ Zustand store ──→ selectors ──→ components
storage  ──┘                             │
                                         └─→ debounced persist
```

`WorkspaceAdapter` (`src/lib/data/adapter.ts`) has three methods — `load`,
`save`, `clear` — and one implementation today (`LocalStorageAdapter`). Swapping
in Supabase or Postgres means writing a second implementation and calling
`setAdapter`; no component changes, because no component knows where a workspace
comes from. `MemoryAdapter` is the same interface and is what the tests use.

The store has exactly one write path: `mutate(transform, log?)`. It applies a
pure transform, appends an activity event, and schedules a debounced persist.
That is why the dashboard's timeline shows real user actions in the same shape
as seeded history — there is no second code path that could diverge.

## Evidence mode: the example and the record never mix

Every duel carries `sample: boolean`. The seed corpus is marked; anything the
user starts is not. `evidenceMode()` in `lib/analytics/evidence.ts` reads the
workspace's `usingSampleData` flag and is the single switch behind every
sentence that says "your" — Today, Verdicts, Spend, the banner and onboarding
all say "worked example" until the record is actually the user's.

The transition is one-way and deliberate: the first duel a user *starts*
removes every sample row (`withoutSampleEvidence`), announced on the form and
in the toast. Judging the two open sample duels does not — that is practice,
and the judging screen labels it. `clearSampleEvidence` drops only sample rows,
so an imported mix is handled too. `WORKSPACE_VERSION` went to 2 for this;
older prototype workspaces are dropped rather than migrated.

## The provider seam

Bench does not call any provider yet, and the code is arranged so that adding
one is an implementation, not a rewrite.

- `lib/providers/pricing.ts` is the one place a run is priced (`priceRun`,
  `priceRunRounded`, `estimateLatency`). The duel form, the seed corpus, the
  routing table, the settings total and the model calculator all go through
  it — there used to be six copies of the same arithmetic.
- `lib/providers/runner.ts` defines `DuelRunner`: given a model, a prompt and
  an expected token shape, produce one duel entry (output, tokens, latency,
  cost, and where those numbers came from). `ManualRunner` is the only
  implementation and returns a priced estimate the user completes by hand.
- `lib/providers/registry.ts` maps a provider to its runner. `runnerFor()`
  returns a connected API runner when one is registered for that provider and
  the manual runner otherwise; `CONNECTABLE` lists the three providers Bench
  intends to drive directly, all `available: false` today.

The duel form asks the registry for each model's runner and stores whatever it
returns, so an Anthropic, OpenAI or Gemini runner is a class that implements
two methods plus a call to `registerRunner`. Entries carry `source`, which is
why the judging screen labels a manual entry's cost "est." — the number is a
catalogue estimate until a provider measures it.

## Why the seed corpus is a story spec

The duel corpus is not 72 literal records. Each task type declares its matchup
and an ordered list of outcomes, and the duels are generated from that. Ordering
carries meaning: it is what lets the corpus contain a reversal, which is the
behaviour that proves the ledger is live rather than a static benchmark.

The corpus deliberately contains every shape the product must handle — an
expensive default losing, an equivalence on the highest-volume task, a
confirmation that the expensive model is right, a recommendation that costs more
than it saves, a lean short of confidence, and an honest "two results is not
evidence".

## Why the rest of the seed data is generated, not written

The hand-written content (16 tools, 14 models, 12 prompts, 6 projects) is real
prose, because "Lorem ipsum" makes a product demo feel like a template. But 400 days of spend and a 64-event timeline are generated from a
seeded PRNG (`src/lib/data/seed/generate.ts`), relative to the day the app is
opened.

That buys two things: the app always shows roughly thirteen months of live-looking
history, and a given reference date always produces the same workspace — which is
what makes the financial tests assertable rather than approximate.

Model prices and capability scores are illustrative snapshot values. They are
plausible, they are labelled as seed data in the code and in Settings, and no
provider API is ever called.

## Analytics as pure functions

Everything financial lives in `src/lib/analytics/` as pure functions over arrays.
Two decisions there are worth calling out because the obvious implementation is
wrong:

**Month-end forecast.** Naively extrapolating spend-per-day is badly wrong early
in the month, because subscriptions bill on fixed dates and are not evenly
spread. `forecastMonthEnd` takes month-to-date, adds the trailing 14-day *usage*
rate for the remaining days, and separately adds subscription renewals that
billed last month on a day that has not yet passed this month.

**Month-to-date delta.** Comparing a partial month to a whole one is the classic
dashboard lie — on the 3rd it always reads "down 90%". `monthToDatePace` compares
day 1..N of this month to day 1..N of the previous one, and reports no delta at
all when the prior base is under five dollars, because ordinary variation on a
tiny base looks like a crisis.

## Search: two different jobs, two different algorithms

`fuzzyMatch` does scored subsequence matching and returns the matched character
positions, so the command palette can highlight rather than merely rank. Its job
is ordering.

List pages use `matchesQuery`, which requires every whitespace-separated token to
appear as a substring. Its job is *exclusion*, and subsequence matching excludes
almost nothing — typing "cursor" left 14 of 16 tools on screen before this split
existed. Fuzzy scoring is still used on those pages, but only to order what
survived the filter.

## Charts are hand-written SVG

Six charts did not justify a general-purpose charting engine in the bundle, and
every charting library fights the design system on typography and spacing. The
charts in `src/components/charts/` measure their container with a
`ResizeObserver` and render at real pixel sizes, rather than scaling a viewBox —
which would make axis labels a different size in every chart.

Two details worth keeping: the donut is drawn as stroked arcs so segment gaps
stay a constant pixel width at any radius, and the area chart uses monotone cubic
interpolation, which smooths without the overshoot that would make a value appear
to dip below zero.

## Rendering model

The App Router shell is static. Every data-bearing view is a client component
that reads the hydrated store, because the workspace lives in the browser. The
`ready` flag from `useWorkspace` is a genuine loading state — the skeletons key
off real hydration, not a simulated delay.

Detail routes set the top-bar breadcrumb and document title through the UI store,
since a client route cannot use Next's static `metadata`.

A page that only needs a query parameter for its *initial* state (`/duels?status=
pending`, `/duels/new?task=…`) reads it after mount through
`useInitialSearchParam` rather than `useSearchParams`. Calling the latter during
the static prerender bails the whole route out to client-side rendering — the
exported HTML then holds an empty shell for the page body and React logs a
recoverable hydration error on load. Reading on mount costs one extra render and
keeps the header and skeleton in the HTML. Models and Prompts still use
`useSearchParams` for their selection sync and carry that bailout; the same
recipe applies when they are next touched.

## Theming

Tokens are defined once in `src/app/globals.css` as OKLCH custom properties, and
mapped into Tailwind through `@theme inline`. Light and dark are two separate
palettes rather than an inversion: light gets real soft shadows, dark leans on
hairlines plus a faint top highlight.

A blocking script in `<head>` applies the stored theme before first paint, so a
reload never flashes the wrong one. The workspace preference is the source of
truth once hydrated; the standalone `acc.theme` key exists only so that script
can read it synchronously.

Density and reduced-motion preferences become attributes on the document root, so
one CSS rule covers every component rather than threading props through the tree.

## Testing strategy

Pure logic is tested directly and heavily: ranges, series bucketing, breakdowns,
forecasting, budget state, cost estimation, fuzzy scoring, template rendering and
variable reconciliation, and every store mutation.

UI tests cover behaviour a user would notice: the palette's keyboard model and
grouping, filling in and copying a prompt, filtering and editing tools, the model
comparison and its cost calculator, and navigation state.

`next/navigation` is aliased to a controllable double in `vitest.config.mts`, so
component tests need no per-file hoisted mock.

Accessibility is checked separately by `npm run a11y`, which runs axe over every
route in both themes and exits non-zero on any violation.

## What this is not

There is no server, no authentication and no provider integration. Duels are run
by hand — you paste the answers, or just record who won — and costs are computed
from the catalogue prices, never from a request Bench made. Those are the honest
edges of a prototype, and they are the same edges the code is structured to
remove later.
