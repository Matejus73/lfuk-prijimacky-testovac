import { memo, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface FieldResizeHandleProps {
  onResize: (nextHeight: number) => void;
  onReset: () => void;
  ariaLabel: string;
}

export const FieldResizeHandle = memo(function FieldResizeHandle({
  onResize,
  onReset,
  ariaLabel,
}: FieldResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const rafIdRef = useRef<number | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startY: number;
    startHeight: number;
    minHeight: number;
    latestHeight: number;
    box: HTMLElement;
  } | null>(null);

  useEffect(
    () => () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    },
    [],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const handle = event.currentTarget;
    const box = handle.parentElement;
    if (!box) return;

    const prevInlineMinHeight = box.style.minHeight;
    box.style.minHeight = '';
    const baseMinHeight =
      Number.parseFloat(getComputedStyle(box).minHeight) || box.getBoundingClientRect().height;
    box.style.minHeight = prevInlineMinHeight;

    const startHeight = box.getBoundingClientRect().height;
    box.dataset.resizing = 'true';

    dragStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight,
      minHeight: baseMinHeight,
      latestHeight: Math.round(startHeight),
      box,
    };
    setIsDragging(true);
    handle.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaY = event.clientY - drag.startY;
    const nextHeight = Math.max(drag.minHeight, Math.round(drag.startHeight + deltaY));
    if (nextHeight === drag.latestHeight) return;

    drag.latestHeight = nextHeight;
    drag.box.style.minHeight = `${nextHeight}px`;

    if (rafIdRef.current === null) {
      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (dragStateRef.current) {
          onResize(dragStateRef.current.latestHeight);
        }
      });
    }
  };

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    delete drag.box.dataset.resizing;
    const finalHeight = drag.latestHeight;
    dragStateRef.current = null;
    setIsDragging(false);
    onResize(finalHeight);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={ariaLabel}
      title="Drag to resize (double-click to reset)"
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onReset();
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      className={`edit-field-resize-handle ${
        isDragging ? 'edit-field-resize-handle-dragging' : ''
      }`}
    >
      <svg
        viewBox="0 0 18 18"
        fill="none"
        className="edit-field-resize-icon"
        aria-hidden="true"
      >
        <path
          d="M15 4L4 15M15 9.5L9.5 15"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
});
