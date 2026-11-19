"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { dismissWithMotion } from "@/lib/ui/motion";
export function ToolDialog({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    heading = useRef<HTMLHeadingElement>(null);
  const [present, setPresent] = useState(false);
  const committed = useRef({ title, children });
  const opener = useRef<HTMLElement | null>(null),
    overflow = useRef<string | null>(null),
    cancelExit = useRef<(() => void) | null>(null);
  // Retain the last committed view only while it exits; forms are never remounted to animate a change.
  useLayoutEffect(() => {
    if (open) committed.current = { title, children };
  }, [open, title, children]);
  const view = open ? { title, children } : committed.current;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    cancelExit.current?.();
    cancelExit.current = null;
    if (open) {
      if (!dialog.open) {
        opener.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        overflow.current = document.body.style.overflow;
        dialog.showModal();
        document.body.style.overflow = "hidden";
      }
      delete dialog.dataset.closing;
      setPresent(true);
    } else if (dialog.open) {
      dialog.dataset.closing = "true";
      cancelExit.current = dismissWithMotion(dialog, () => {
        dialog.close();
        delete dialog.dataset.closing;
        if (overflow.current !== null)
          document.body.style.overflow = overflow.current;
        overflow.current = null;
        const target = opener.current?.isConnected
          ? opener.current
          : document.querySelector<HTMLElement>(
              '[aria-label="Electricity region"]',
            );
        target?.focus({ preventScroll: true });
        opener.current = null;
        setPresent(false);
      });
    }
    return () => {
      cancelExit.current?.();
      cancelExit.current = null;
    };
  }, [open]);
  useEffect(() => {
    if (open) {
      ref.current?.scrollTo({ top: 0 });
      heading.current?.focus({ preventScroll: true });
    }
  }, [open, title]);
  useEffect(
    () => () => {
      cancelExit.current?.();
      ref.current?.close();
      if (overflow.current !== null)
        document.body.style.overflow = overflow.current;
      opener.current?.focus({ preventScroll: true });
    },
    [],
  );
  return (
    <dialog
      ref={ref}
      className="tool-dialog"
      aria-labelledby="tool-heading"
      onCancel={(e) => {
        e.preventDefault();
        if (open) onClose();
      }}
      onClickCapture={(e) => {
        if (!open) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget || !open) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          onClose();
      }}
    >
      <div className="tool-heading">
        <div>
          <p className="eyebrow">GRID / ALIVE</p>
          <h1 id="tool-heading" ref={heading} tabIndex={-1}>
            {view.title}
          </h1>
        </div>
        <button
          className="dialog-close"
          onClick={onClose}
          aria-label="Close pop-up"
        >
          Close ×
        </button>
      </div>
      <div className="tool-content workspace">
        {(open || present) && (
          <div className="tool-view" key={view.title}>
            {view.children}
          </div>
        )}
      </div>
    </dialog>
  );
}
