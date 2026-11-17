import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export type ReorderPayload = {
  kind: "reorder";
  instructionId: number;
  fromSlot: string;
  fromIndex: number;
};

export type DragPayload =
  | { kind: "palette"; commandId: string }
  | ReorderPayload;

export interface DropTarget {
  slot: string;
  index: number;
}

export interface DragView {
  payload: DragPayload;
  label: string;
  color: string;
  x: number;
  y: number;
  over: DropTarget | null;
}

interface DragOptions {
  disabled: boolean;
  canDrop: (payload: DragPayload, slot: string) => boolean;
  onTap: (commandId: string) => void;
  onDropPalette: (commandId: string, target: DropTarget) => void;
  onDropReorder: (payload: ReorderPayload, target: DropTarget) => void;
}

const DRAG_THRESHOLD = 8;

/** Indeks sisip di dalam sebuah slot, berdasarkan posisi vertikal pointer. */
function indexWithin(slotEl: HTMLElement, y: number): number {
  const items = Array.from(slotEl.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.hasAttribute("data-queue-item"),
  );
  for (const [index, item] of items.entries()) {
    const head = item.querySelector<HTMLElement>(":scope > [data-item-head]") ?? item;
    const rect = head.getBoundingClientRect();
    if (y < rect.top + rect.height / 2) return index;
  }
  return items.length;
}

/** Slot terdalam di bawah pointer (slot bersarang berada di atas induknya). */
function dropTargetAt(x: number, y: number): DropTarget | null {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el instanceof HTMLElement && el.dataset.slot) {
      return { slot: el.dataset.slot, index: indexWithin(el, y) };
    }
  }
  return null;
}

/** Drag and drop berbasis Pointer Events, berfungsi untuk mouse, pen, dan sentuhan. */
export function useCommandDrag(options: DragOptions) {
  const [view, setView] = useState<DragView | null>(null);
  const optionsRef = useRef(options);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const startDrag = useCallback(
    (
      e: ReactPointerEvent<HTMLElement>,
      payload: DragPayload,
      label: string,
      color: string,
    ): void => {
      if (optionsRef.current.disabled || e.button !== 0) return;
      const { pointerId, clientX: startX, clientY: startY } = e;
      let dragging = false;

      function allowedTarget(x: number, y: number): DropTarget | null {
        const target = dropTargetAt(x, y);
        if (!target) return null;
        return optionsRef.current.canDrop(payload, target.slot) ? target : null;
      }

      function cleanup(): void {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        cleanupRef.current = null;
      }

      function onMove(ev: PointerEvent): void {
        if (ev.pointerId !== pointerId) return;
        if (!dragging) {
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) {
            return;
          }
          dragging = true;
        }
        setView({
          payload,
          label,
          color,
          x: ev.clientX,
          y: ev.clientY,
          over: allowedTarget(ev.clientX, ev.clientY),
        });
      }

      function onUp(ev: PointerEvent): void {
        if (ev.pointerId !== pointerId) return;
        cleanup();
        setView(null);
        const opts = optionsRef.current;

        if (!dragging) {
          if (payload.kind === "palette") opts.onTap(payload.commandId);
          return;
        }
        const target = allowedTarget(ev.clientX, ev.clientY);
        if (!target) return;
        if (payload.kind === "palette") opts.onDropPalette(payload.commandId, target);
        else opts.onDropReorder(payload, target);
      }

      function onCancel(ev: PointerEvent): void {
        if (ev.pointerId !== pointerId) return;
        cleanup();
        setView(null);
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      cleanupRef.current = cleanup;
    },
    [],
  );

  return { view, startDrag };
}