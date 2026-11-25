"use client";
import { useEffect } from "react";
import { motion, reduceMotion } from "@/lib/ui/motion";
/** Decorative event feedback only: never intercepts input, remounts forms, or changes observations. */
export function InteractionEffects() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".balance-app");
    if (!root) return;
    const active = new Map<HTMLElement | SVGElement, Animation>();
    const frames = new Set<number>();
    const animate = (
      element: HTMLElement | SVGElement | null,
      keyframes: Keyframe[],
      duration = motion.change,
    ) => {
      if (
        !element ||
        !element.isConnected ||
        reduceMotion() ||
        document.hidden ||
        typeof element.animate !== "function"
      )
        return;
      active.get(element)?.cancel();
      let animation: Animation;
      try {
        animation = element.animate(keyframes, {
          duration,
          easing: motion.ease,
        });
      } catch {
        return;
      }
      active.set(element, animation);
      const clear = () => {
        if (active.get(element) === animation) active.delete(element);
      };
      animation.finished.then(clear, clear);
    };
    const reveal = (element: HTMLElement | null) =>
      animate(element, [
        { opacity: 0.68, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ]);
    const next = (fn: () => void) => {
      const frame = requestAnimationFrame(() => {
        frames.delete(frame);
        fn();
      });
      frames.add(frame);
    };
    const click = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest<HTMLButtonElement>("button");
      if (!button || button.disabled) return;
      if (event instanceof MouseEvent && event.detail === 0)
        animate(
          button,
          [{ filter: "brightness(1.18)" }, { filter: "brightness(1)" }],
          motion.quick,
        );
      if (
        button.closest(".mobile-nav,.mobile-more-menu") ||
        button.classList.contains("mobile-map-entry")
      ) {
        animate(
          button.querySelector("svg"),
          [
            { transform: "translateY(0)" },
            { transform: "translateY(-3px)", offset: 0.45 },
            { transform: "translateY(0)" },
          ],
          220,
        );
      }
      if (
        button.closest(".tab-strip") &&
        !button.closest(".energy-tools") &&
        button.getAttribute("aria-pressed") !== "true"
      )
        next(() => reveal(button.closest<HTMLElement>(".tool-view")));
    };
    const change = (event: Event) => {
      const field = event.target;
      if (!(
        field instanceof HTMLSelectElement || field instanceof HTMLInputElement
      ))
        return;
      if (
        field instanceof HTMLInputElement &&
        !["checkbox", "radio", "range"].includes(field.type)
      )
        return;
      animate(
        field,
        [
          { boxShadow: "0 0 0 3px #a4e9df55" },
          { boxShadow: "0 0 0 0px #a4e9df00" },
        ],
        240,
      );
      next(() => {
        if (field.getAttribute("aria-label") !== "Electricity region") {
          const pane = field.closest(".tool-view");
          pane
            ?.querySelectorAll<HTMLElement>(
              ".window-results,.annual-comparison,.annual-detail,.series-chart",
            )
            .forEach(reveal);
        }
      });
    };
    const visibility = () => {
      if (document.hidden || reduceMotion()) {
        active.forEach((a) => a.cancel());
        active.clear();
      }
    };
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    root.addEventListener("click", click, { passive: true });
    root.addEventListener("change", change, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    media.addEventListener("change", visibility);
    return () => {
      root.removeEventListener("click", click);
      root.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", visibility);
      frames.forEach(cancelAnimationFrame);
      active.forEach((a) => a.cancel());
    };
  }, []);
  return null;
}
