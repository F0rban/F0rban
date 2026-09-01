# Product strategy

The honest account of why this product changed shape, and what it is now.

## The critique that caused the pivot

V1 was an "AI Command Center": a cockpit for tools, models, prompts, projects and
spend. It was well built and it failed its own test.

**Why would anyone open it daily?** They would not. Spend barely moves day to
day. Prompts are better served by a snippet manager one keystroke away. A model
comparison is a twice-a-year consultation. There was no answer, and that is
damning.

**What problem did it solve?** It organised. Organisers are a graveyard
category: the marginal value of another place to put things is *negative*,
because it is another place to maintain.

**Against the alternatives.** Notion wins on sharing, mobile and adoption.
ChatGPT and Claude Projects hold your files *and run the model* — V1 copied text
to a clipboard so you could paste it into theirs. It was a peripheral to someone
else's core.

**What compounded after 30 days?** Almost nothing. Prompts are portable text; a
tool list is twenty rows. The one thing that could compound — evidence about what
actually works — was the one thing it was not collecting.

**What was cut.** Workflows was the most impressive-looking page and did nothing:
a diagram that executed nothing, scheduled nothing, connected nothing. It existed
because the brief asked for it. Tools as a browsable catalogue was data entry
with no payoff, and became a tab under Spend. Projects lost its top-level slot and
became a dimension.

## The directions considered

| | Verdict |
|---|---|
| **A · AI Operating System** | This was V1. Too vague to be sharp about anything. Rejected. |
| **B · Cost Intelligence** | Real pain, but for a solo user the savings are ~$30/mo — you will not pay $12 to save $30, and your card statement is free. Needs API ingestion to be credible. Strong for teams, but that is a slower, sales-led product. |
| **C · Workflow Intelligence** | The compounding property is right. Dies on data collection: how does it know what task you did and whether it went well? |
| **D · Prompt Intelligence** | Also compounds. Narrow market, and Braintrust, PromptLayer and Promptfoo are further along with developers. |
| **E · AI Workspace** | A restatement of A. Rejected. |
| **F · Stack Optimizer** | A feature, not a product. |
| **G · Bench** | **Chosen.** C and D fused, anchored on the one thing that kills both: the cost of collecting the data. |

## The wedge

C and D both fail at data collection. Bench's answer is to make collection
*cheaper than not collecting*:

1. The user action is one they already take — they are about to use a model.
2. The only extra work is running it twice and clicking the better answer, on an
   output they had to read anyway.
3. Because the answer is judged blind, one click is worth something. A rating
   made while looking at the price is not.

That is the whole design. Everything else is derived.

## The loop

```
USER ACTION   Run a task that matters as a duel rather than a guess.
     ↓
VALUE         The answer you needed, plus the alternatives beside it.
     ↓
DATA          One click records task type, winner, cost delta, latency, reason.
     ↓
INSIGHT       "Sonnet beats Opus on code review 9–2. Routing it saves $7/mo."
              "Classification is level across 12 tries — take the cheap one, $41/mo."
     ↓
USER ACTION   Change the routing. Bench keeps testing whether it still holds.
```

The last arrow is what makes it compound rather than plateau: a settled verdict
is not final, and reversal detection surfaces the moment the record turns.

## Killer feature

**The routing table** (Verdicts).

- Hard to reproduce by hand — you would need a spreadsheet of blind comparisons.
- Only exists because of accumulated data, and sharpens with every duel.
- Produces a dollar figure derived from *your* evidence, not a generic benchmark.
- No provider will ever build it: its main output is sometimes "use the other
  one", which is structurally impossible for a first-party tool.

## Being honest about small numbers

The temptation in a product like this is to overclaim. Nine results is not proof.
So confidence is an exact binomial against a coin flip, and there are four
states, one of which is "not enough yet". A verdict that has not settled is kept
out of the routing table entirely, and the UI says why in a sentence rather than
a p-value.

The most valuable state is the least intuitive one: **no difference**. Enough
attempts to have found a gap, and none appeared. That is a result, and it is
where most of the money is — the cheap model only has to be *not worse*.

The corpus also contains a recommendation that **costs more** than it saves
(summarisation), and two where the expensive model is confirmed correct. A tool
that only ever says "go cheaper" is a cost-cutter, not an instrument.

## The aha moment

First run is not a welcome screen. It is a real blind comparison: two genuine
answers to the same code review, shown without names. The user picks, and the
reveal — *"you picked B; that was Haiku, five times cheaper than the one you
passed over"* — makes the entire argument in about twenty seconds, before any
setup.

## Retention

Weekly, not daily, and the product should not pretend otherwise. The return
triggers are:

- **Unjudged duels.** A queue with a one-click action, surfaced first everywhere.
- **A verdict settling.** The moment a lean becomes a rule.
- **A reversal.** The model you standardised on losing its last six.

## Monetisation

The reason someone pays is that the output is a number they can act on, and the
ledger is an asset they would lose.

| Tier | Price | What it is for |
|---|---|---|
| **Free** | £0 | Unlimited manual duels, 25 recorded verdicts, one routing table. Enough to prove value; capped so the ledger builds pressure. |
| **Pro** | $19/mo | Unlimited history, provider-connected duels, usage ingestion, routing export, weekly digest. |
| **Team** | $12/seat/mo, min 3 | Shared ledger, per-project verdicts, policy export, an audit trail for model choices. |

$19 is defensible only if the tool demonstrably finds more than that — which is
exactly the number on the Verdicts page. In the seeded example it is $69/month.

## The three real weaknesses

1. **Data collection is still the whole risk.** If people will not run duels
   there is no product. Everything is built to make it cheap, and it is still the
   thing most likely to kill this.
2. **Small-sample statistics.** Even with the honest framing, a settled verdict
   rests on ~11 results judged by one person who knew what they were hoping for.
   Blindness helps; it does not make it science.
3. **The savings number depends on volumes the user estimates.** Until usage
   ingestion lands, the headline figure is only as good as a number typed into
   Settings.
