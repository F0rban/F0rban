# Design notes

## Direction

The brief for the visual language was: professional software, developer tool,
premium AI product, modern macOS app, futuristic but sober. The interpretation
here is **instrument panel** — something you read at a glance and trust, not
something that performs at you.

Three consequences:

**No purple, no decorative gradients.** The AI-product default is a violet
gradient on everything, which reads as marketing rather than tooling. The signal
colour here is a warm copper-amber, used only where intent lives: primary
actions, focus rings, the active navigation marker, the accent series in charts.
Confirmation is a cool teal. Everything else is graphite.

**Borders carry the structure, not shadows.** In dark mode a card is a hairline
and a one-pixel top highlight. Shadows appear only where something genuinely
floats — dialogs, dropdowns, the palette. Light mode gets real soft shadows,
because on paper that is how depth reads.

**Light and dark are two designs.** Not an inversion. The dark canvas is a
near-black graphite with a slight cool cast; the light canvas is warm paper, not
white. Their accent, semantic and categorical palettes are separately tuned.

## Typography

Geist Sans for the interface, Geist Mono for anything numeric or code-like. The
mono is not decoration: every figure that can update — money, token counts,
latency, percentages, dates in tables — is set in tabular mono so nothing reflows
as values change. That single decision does more for the "instrument" feel than
any amount of styling.

Type sizes are deliberately smaller than a typical web app: 12.5px body in dense
lists, 13px in prose, 10.5px uppercase labels with wide tracking. Professional
tools are dense; density is what lets a page answer a question without scrolling.

## Colour system

Four surface levels, three hairline weights, a four-step ink ramp, six semantic
colours and an eight-colour categorical series — all in OKLCH so lightness can be
tuned independently of hue.

The constraint that shaped the ramps: **every ink step must clear WCAG AA (4.5:1)
against the lightest surface it can appear on**, and the categorical colours must
also clear it when used as text on a 12% tint of themselves (project codes,
category chips). That caps how faint the faintest step can be, which is tighter
than it looks — the first version of this palette failed on both counts, and the
retune made the light palette noticeably deeper and more saturated. It reads
better for it.

A provider keeps the same hue everywhere: its monogram tile, its slice of the
donut, its band in the stacked area chart. Projects pick their own colour from
the same eight-step palette at creation, and it follows them through charts,
codes and links.

## Provider marks

Typographic monograms, tinted from the categorical palette, rather than scraped
brand logos. They stay legible at 20px, work in both themes, and never render a
company's mark incorrectly. Tools from unlisted providers derive both their
monogram and their hue from their own name, so they stay distinguishable from
each other.

## Motion

Subtlety over spectacle, and no animation library — CSS only.

- Entrances are a 6px rise over 280–340ms on `--ease-out-quint`, staggered 35ms
  per child in lists.
- Hover states move one pixel and change a border colour. Nothing scales.
- The segmented control's active pill is a real element that slides between
  positions, so it reads as one control rather than four buttons.
- The only animation that draws attention to itself is the workflow run: edges
  flow, completed steps turn accent, pending steps dim. It is showing you
  something happening, which is the one case where motion is the message.

Both the OS `prefers-reduced-motion` setting and the in-app preference collapse
every duration to nothing.

## Layout

One container controls the app's rhythm: `PageContainer` sets max width and
padding, `PageHeader` sets the title block. Page titles sit on the canvas, not
inside a card, so the first card the eye lands on is content.

Mobile is a different design, not a narrower desktop. The five most-used
destinations move to a thumb-reachable bottom bar; the full navigation is a
slide-over. Master-detail views (Prompt Vault) become a list that drills into a
detail with a back button, rather than auto-selecting a record and hiding the
list. Dashboard KPI tiles become a 2×2 grid with supporting detail dropped. The
model comparison moves into a sheet behind a floating selection bar rather than
being squeezed into a column.

## Details worth noticing

- The command palette highlights the characters it matched, and previews the
  highlighted record — pricing, last use, a prompt's body — so it can answer a
  question without navigating.
- The prompt preview marks filled values green and unfilled placeholders amber,
  and copying leaves unfilled placeholders visible rather than blanking them.
- The budget bar carries a second marker for the month-end forecast, so you can
  see the projection against the ceiling in one glance.
- Cost-per-use turns amber above $1.50 — the number that actually decides whether
  a subscription survives.
- The spec table in the Model Lab highlights the winner in each row.
- Empty states use a faint dotted field and say what to do, not "No data".
