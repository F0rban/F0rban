import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { useHotkey, type HotkeyOptions } from "./use-hotkey";

function Harness({
  combo,
  onFire,
  options,
}: {
  combo: string;
  onFire: () => void;
  options?: HotkeyOptions;
}) {
  useHotkey(combo, onFire, options);
  return (
    <div>
      <input aria-label="field" />
      <textarea aria-label="area" />
    </div>
  );
}

const press = (init: Partial<KeyboardEventInit> & { key: string }, target: Element | Window = window) =>
  fireEvent.keyDown(target, { bubbles: true, ...init });

describe("useHotkey", () => {
  it("fires on a plain key", () => {
    const onFire = vi.fn();
    render(<Harness combo="n" onFire={onFire} />);
    press({ key: "n" });
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it("fires on ctrl+key off Apple platforms", () => {
    const onFire = vi.fn();
    render(<Harness combo="mod+k" onFire={onFire} options={{ allowInInput: true }} />);
    press({ key: "k", ctrlKey: true });
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it("does not fire the modifier combo without the modifier", () => {
    const onFire = vi.fn();
    render(<Harness combo="mod+k" onFire={onFire} />);
    press({ key: "k" });
    expect(onFire).not.toHaveBeenCalled();
  });

  it('matches "?" even though the browser reports it with shift held', () => {
    // Shift and "/" produce key "?" — a combo of "shift+/" can never match.
    const onFire = vi.fn();
    render(<Harness combo="?" onFire={onFire} />);
    press({ key: "?", shiftKey: true });
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it('does not confuse "/" with "?"', () => {
    const slash = vi.fn();
    render(<Harness combo="/" onFire={slash} />);
    press({ key: "?", shiftKey: true });
    expect(slash).not.toHaveBeenCalled();
    press({ key: "/" });
    expect(slash).toHaveBeenCalledTimes(1);
  });

  it("fires a two-key sequence in order", () => {
    const onFire = vi.fn();
    render(<Harness combo="g p" onFire={onFire} />);
    press({ key: "g" });
    press({ key: "p" });
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it("resets a sequence when an unrelated key interrupts it", () => {
    const onFire = vi.fn();
    render(<Harness combo="g p" onFire={onFire} />);
    press({ key: "g" });
    press({ key: "x" });
    press({ key: "p" });
    expect(onFire).not.toHaveBeenCalled();
  });

  it("ignores keys typed into a field unless allowed", () => {
    const onFire = vi.fn();
    const { getByLabelText } = render(<Harness combo="n" onFire={onFire} />);
    press({ key: "n" }, getByLabelText("field"));
    press({ key: "n" }, getByLabelText("area"));
    expect(onFire).not.toHaveBeenCalled();
  });

  it("still fires inside a field when allowInInput is set", () => {
    const onFire = vi.fn();
    const { getByLabelText } = render(
      <Harness combo="mod+k" onFire={onFire} options={{ allowInInput: true }} />,
    );
    press({ key: "k", ctrlKey: true }, getByLabelText("field"));
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", () => {
    const onFire = vi.fn();
    render(<Harness combo="n" onFire={onFire} options={{ enabled: false }} />);
    press({ key: "n" });
    expect(onFire).not.toHaveBeenCalled();
  });

  it("unbinds on unmount", () => {
    const onFire = vi.fn();
    const { unmount } = render(<Harness combo="n" onFire={onFire} />);
    unmount();
    press({ key: "n" });
    expect(onFire).not.toHaveBeenCalled();
  });
});
