/**
 * The pair shown during onboarding.
 *
 * Two real answers to the same small review task. The cheaper model's answer
 * is genuinely the better one for this reader — it leads with the defect that
 * loses money and stops. The expensive one is also correct, and buries the same
 * finding under four things nobody asked for. That is a real and common
 * difference, and it is the whole argument of the product in twenty seconds.
 */

export const SAMPLE_DIFF = `async function reserveSeat(eventId, userId) {
  const event = await db.events.findById(eventId);
  if (event.remaining <= 0) throw new SoldOut();
  await db.events.update(eventId, { remaining: event.remaining - 1 });
  return db.reservations.create({ eventId, userId });
}`;

export interface SampleAnswer {
  id: "a" | "b";
  modelId: string;
  modelName: string;
  inputPrice: number;
  outputPrice: number;
  latencyMs: number;
  cost: number;
  body: string;
}

export const SAMPLE_ANSWERS: SampleAnswer[] = [
  {
    id: "a",
    modelId: "m-claude-opus-45",
    modelName: "Claude Opus 4.5",
    inputPrice: 5,
    outputPrice: 25,
    latencyMs: 2100,
    cost: 0.0412,
    body: `Review of \`reserveSeat\`:

1. **Naming** — \`event\` shadows the DOM global in some bundler configs. Consider \`eventRecord\`.

2. **Error typing** — \`SoldOut\` is thrown but not imported in the shown scope. Verify the import exists.

3. **Race condition** — between \`findById\` and \`update\` another request can read the same \`remaining\` value. Two concurrent callers both see 1, both write 0, and two reservations are created for one seat. Use a conditional update or a transaction.

4. **Return value** — the function returns the reservation but not the updated event. Callers may need both.

5. **Observability** — consider logging the reservation id for traceability.

Overall the logic is readable and the happy path is correct. The concurrency issue in (3) is worth addressing before this sees production traffic.`,
  },
  {
    id: "b",
    modelId: "m-claude-haiku-45",
    modelName: "Claude Haiku 4.5",
    inputPrice: 1,
    outputPrice: 5,
    latencyMs: 610,
    cost: 0.0081,
    body: `**Oversells a seat under concurrency.**

Line 4. The read on line 2 and the write on line 4 are not atomic. Two requests arriving together both read \`remaining: 1\`, both pass the check, and both write \`0\` — two reservations, one seat.

Failing case: 2 concurrent calls, \`remaining = 1\`. Expected: one \`SoldOut\`. Actual: two reservations.

Fix — make the decrement conditional so the database enforces it:

\`\`\`js
const updated = await db.events.updateWhere(
  { id: eventId, remaining: { gt: 0 } },
  { remaining: { decrement: 1 } },
);
if (!updated) throw new SoldOut();
\`\`\`

Nothing else in the diff is a defect.`,
  },
];
