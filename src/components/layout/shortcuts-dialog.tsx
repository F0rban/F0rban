"use client";

import { useUiStore } from "@/lib/store/ui";
import { ALL_NAV_ITEMS } from "@/lib/navigation";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

interface Shortcut {
  keys: string[];
  label: string;
}

const GLOBAL: Shortcut[] = [
  { keys: ["⌘", "K"], label: "Open the command palette" },
  { keys: ["/"], label: "Focus the search field on this page" },
  { keys: ["N"], label: "New prompt" },
  { keys: ["["], label: "Collapse or expand the sidebar" },
  { keys: ["?"], label: "Show this sheet" },
  { keys: ["Esc"], label: "Close whatever is open" },
];

const PALETTE: Shortcut[] = [
  { keys: ["↑", "↓"], label: "Move between results" },
  { keys: ["↵"], label: "Open the highlighted result" },
  { keys: [">"], label: "Switch to commands only" },
];

function Row({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between gap-6 py-1.5">
      <span className="text-[12.5px] text-ink-2">{shortcut.label}</span>
      <span className="flex shrink-0 items-center gap-1">
        {shortcut.keys.map((key, i) => (
          <Kbd key={`${key}-${i}`}>{key}</Kbd>
        ))}
      </span>
    </div>
  );
}

function Section({ title, items }: { title: string; items: Shortcut[] }) {
  return (
    <section>
      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-4">
        {title}
      </h3>
      <div className="divide-y divide-line-subtle">
        {items.map((shortcut) => (
          <Row key={shortcut.label} shortcut={shortcut} />
        ))}
      </div>
    </section>
  );
}

export function ShortcutsDialog() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const setOpen = useUiStore((s) => s.setShortcutsOpen);

  const navigation: Shortcut[] = ALL_NAV_ITEMS.filter((item) => item.shortcut).map((item) => ({
    keys: item.shortcut!.split(" ").map((k) => k.toUpperCase()),
    label: `Go to ${item.label}`,
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Two-key sequences like G then P work anywhere outside a text field.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-6 sm:grid-cols-2">
          <Section title="Global" items={GLOBAL} />
          <Section title="Navigation" items={navigation} />
          <Section title="Command palette" items={PALETTE} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
