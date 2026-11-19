export const motion = {
  quick: 140,
  change: 180,
  enter: 240,
  exit: 180,
  ease: "cubic-bezier(.2,.8,.2,1)",
};
export function reduceMotion() {
  return (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
/** Keep native dialog focus/inert behaviour until the exit completes. Cancellation never closes a replacement tool. */
export function dismissWithMotion(
  element: HTMLElement,
  onDone: () => void,
): () => void {
  if (
    reduceMotion() ||
    typeof element.animate !== "function" ||
    document.hidden
  ) {
    onDone();
    return () => {};
  }
  let active = true;
  let animation: Animation;
  let timer: ReturnType<typeof setTimeout>;
  const finish = () => {
    if (!active) return;
    active = false;
    clearTimeout(timer);
    onDone();
  };
  try {
    const current =
      typeof getComputedStyle === "function" ? getComputedStyle(element) : null;
    animation = element.animate(
      [
        {
          opacity: current?.opacity ?? 1,
          transform: current?.transform ?? "translateY(0)",
        },
        {
          opacity: 0,
          transform: `translateY(${matchMedia("(max-width: 700px)").matches ? 32 : 10}px)`,
        },
      ],
      { duration: motion.exit, easing: motion.ease, fill: "forwards" },
    );
    // Finish even when a browser drops its animation completion event.
    timer = setTimeout(finish, motion.exit + 80);
    animation.finished.then(finish, finish);
  } catch {
    finish();
    return () => {};
  }
  return () => {
    active = false;
    clearTimeout(timer);
    animation.cancel();
  };
}
