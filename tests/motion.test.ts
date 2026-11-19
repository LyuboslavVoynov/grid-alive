import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dismissWithMotion, motion } from "../src/lib/ui/motion";
function fixture() {
  let finish!: () => void, reject!: (error: Error) => void;
  const finished = new Promise<void>((yes, no) => {
    finish = yes;
    reject = no;
  });
  const animation = {
    finished,
    cancel: vi.fn(() => reject(Error("cancelled"))),
  };
  const element = { animate: vi.fn(() => animation) } as unknown as HTMLElement;
  return { element, animation, finish };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("document", { hidden: false });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("dismiss transitions", () => {
  it("finishes once after animation, never twice when the safety timer would expire", async () => {
    const { element, finish } = fixture(),
      done = vi.fn();
    dismissWithMotion(element, done);
    expect(done).not.toHaveBeenCalled();
    finish();
    await Promise.resolve();
    expect(done).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(1000);
    expect(done).toHaveBeenCalledOnce();
  });
  it("cannot close a replacement tool after cancellation, including an already queued completion", async () => {
    const { element, finish, animation } = fixture(),
      done = vi.fn();
    const cancel = dismissWithMotion(element, done);
    finish();
    cancel();
    await Promise.resolve();
    vi.advanceTimersByTime(1000);
    expect(animation.cancel).toHaveBeenCalledOnce();
    expect(done).not.toHaveBeenCalled();
  });
  it("releases the modal when a browser fails to settle its animation promise", () => {
    const { element } = fixture(),
      done = vi.fn();
    dismissWithMotion(element, done);
    vi.advanceTimersByTime(motion.exit + 79);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledOnce();
  });
  it("closes immediately without animation under reduced motion or an unavailable animation API", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { element } = fixture(),
      done = vi.fn();
    dismissWithMotion(element, done);
    expect(done).toHaveBeenCalledOnce();
    expect(element.animate).not.toHaveBeenCalled();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    dismissWithMotion({} as HTMLElement, done);
    expect(done).toHaveBeenCalledTimes(2);
  });
  it("does not leave the page locked if animation creation throws or the document is hidden", () => {
    const element = {
        animate: () => {
          throw Error("unavailable");
        },
      } as unknown as HTMLElement,
      done = vi.fn();
    dismissWithMotion(element, done);
    expect(done).toHaveBeenCalledOnce();
    vi.stubGlobal("document", { hidden: true });
    const f = fixture();
    dismissWithMotion(f.element, done);
    expect(done).toHaveBeenCalledTimes(2);
    expect(f.element.animate).not.toHaveBeenCalled();
  });
});
