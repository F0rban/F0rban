/** Short, sortable-ish ids. Prefixed so an id says what it points at. */
export function createId(prefix: string): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${time}${rand}`;
}
