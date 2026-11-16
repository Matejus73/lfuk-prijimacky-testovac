import { type RefObject, useEffect, useRef, useState } from 'react';
import { FoxIcon } from './Icons.tsx';

interface FoxCompanionProps {
  isActive: boolean;
  buttonRef: RefObject<HTMLButtonElement | null>;
  questionKey: string;
}

interface TargetBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  borderRadius: string;
}

const CURSOR_OFFSET_X = 28;
const CURSOR_OFFSET_Y = -20;
const PINNED_EXPAND_PX = 10;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function resolveFoxTarget(rawTarget: EventTarget | null): HTMLElement | null {
  if (!(rawTarget instanceof Element)) return null;
  if (rawTarget.closest('[data-fox-ignore]')) return null;
  const el = rawTarget.closest<HTMLElement>('[data-fox-target]');
  if (!el || el.closest('[inert]')) return null;
  return el;
}

function getTargetBox(el: HTMLElement, expand = 0): TargetBox | null {
  if (!el.isConnected || el.closest('[inert]')) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return null;

  const padX = el.dataset.foxPad === 'true' ? 6 : 0;
  const padY = el.dataset.foxPad === 'true' ? 4 : 0;

  let left = r.left - padX;
  let top = r.top - padY;
  let right = r.right + padX;
  let bottom = r.bottom + padY;

  let clippedTop = false;
  let clippedBottom = false;
  let clippedLeft = false;
  let clippedRight = false;

  let ancestor = el.parentElement;
  while (ancestor && ancestor !== document.body) {
    const style = getComputedStyle(ancestor);
    const hasScrollY = style.overflowY === 'auto' || style.overflowY === 'scroll';
    const hasScrollX = style.overflowX === 'auto' || style.overflowX === 'scroll';
    if (hasScrollY || hasScrollX) {
      const ar = ancestor.getBoundingClientRect();
      if (hasScrollX && ancestor.scrollWidth > ancestor.clientWidth + 1) {
        if (left < ar.left - 2) {
          left = ar.left;
          clippedLeft = true;
        }
        if (right > ar.right + 2) {
          right = ar.right;
          clippedRight = true;
        }
      }
      if (hasScrollY) {
        if (top < ar.top - 2) {
          top = ar.top;
          clippedTop = true;
        }
        if (bottom > ar.bottom + 2) {
          bottom = ar.bottom;
          clippedBottom = true;
        }
      }
    }
    ancestor = ancestor.parentElement;
  }

  if (right - left < 4 || bottom - top < 4) return null;

  if (expand > 0) {
    if (!clippedLeft) left -= expand;
    if (!clippedRight) right += expand;
    if (!clippedTop) top -= expand;
    if (!clippedBottom) bottom += expand;
  }

  const computedRadius = getComputedStyle(el).borderRadius;
  const baseRadius =
    computedRadius && computedRadius !== '0px' ? computedRadius : '8px';
  const borderRadius =
    expand > 0 ? `calc(${baseRadius} + ${expand.toFixed(2)}px)` : baseRadius;

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    borderRadius,
  };
}

function applyHighlightStyle(
  el: HTMLDivElement | null,
  box: TargetBox | null,
  immediate = false,
  borderWidthPx?: number,
) {
  if (!el) return;
  if (!box) {
    el.style.transition = immediate ? 'none' : '';
    el.style.opacity = '0';
    return;
  }
  el.style.transition = immediate ? 'none' : '';
  el.style.opacity = '1';
  el.style.transform = `translate3d(${box.left}px, ${box.top}px, 0)`;
  el.style.width = `${box.width}px`;
  el.style.height = `${box.height}px`;
  el.style.borderRadius = box.borderRadius;
  if (borderWidthPx !== undefined) {
    el.style.borderWidth = `${borderWidthPx.toFixed(2)}px`;
  }
}

export function FoxCompanion({ isActive, buttonRef, questionKey }: FoxCompanionProps) {
  const [isReturning, setIsReturning] = useState(false);
  const [prevActive, setPrevActive] = useState(isActive);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hoverHighlightRef = useRef<HTMLDivElement | null>(null);
  const pinnedHighlightRef = useRef<HTMLDivElement | null>(null);
  const hoveredElRef = useRef<HTMLElement | null>(null);
  const pinnedElRef = useRef<HTMLElement | null>(null);
  const activeRef = useRef(isActive);
  const wasActiveRef = useRef(false);
  const tickStepRef = useRef<(dt: number) => boolean>(() => false);

  if (isActive !== prevActive) {
    setPrevActive(isActive);
    if (!isActive && prevActive) {
      setIsReturning(true);
    } else if (isActive) {
      setIsReturning(false);
    }
  }

  const isVisible = isActive || isReturning;

  const stateRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    cursorX: 0,
    cursorY: 0,
    prevCursorX: 0,
    prevCursorY: 0,
    cursorVx: 0,
    cursorVy: 0,
    scale: 0,
    vScale: 0,
    tilt: 0,
    vTilt: 0,
    bobPhase: 0,
    hasCursor: false,
    pinExpand: 0,
    vPinExpand: 0,
    lastPinnedEl: null as HTMLElement | null,
  });

  useEffect(() => {
    activeRef.current = isActive;
    if (!isActive) {
      hoveredElRef.current = null;
      pinnedElRef.current = null;
    }
  }, [isActive]);

  useEffect(() => {
    if (pinnedElRef.current?.closest('.question-card')) {
      pinnedElRef.current = null;
    }
  }, [questionKey]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const s = stateRef.current;
      if (!s.hasCursor) {
        s.prevCursorX = event.clientX;
        s.prevCursorY = event.clientY;
        s.hasCursor = true;
      }
      s.cursorX = event.clientX;
      s.cursorY = event.clientY;

      if (activeRef.current) {
        const hit = document.elementFromPoint(event.clientX, event.clientY);
        hoveredElRef.current = resolveFoxTarget(hit);
      } else {
        hoveredElRef.current = null;
      }
    };

    const handleScroll = () => {
      if (!activeRef.current || !stateRef.current.hasCursor) return;
      const hit = document.elementFromPoint(
        stateRef.current.cursorX,
        stateRef.current.cursorY,
      );
      hoveredElRef.current = resolveFoxTarget(hit);
    };

    const handleClickCapture = (event: MouseEvent) => {
      if (!activeRef.current) return;
      if (
        event.target instanceof Node &&
        buttonRef.current?.contains(event.target)
      ) {
        return;
      }

      const target = resolveFoxTarget(event.target);
      if (target) {
        event.preventDefault();
        event.stopPropagation();
        pinnedElRef.current = pinnedElRef.current === target ? null : target;
        return;
      }

      if (
        pinnedElRef.current &&
        event.target instanceof Element &&
        !event.target.closest('button, a, input, select, textarea, [role="switch"]')
      ) {
        pinnedElRef.current = null;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && pinnedElRef.current) {
        pinnedElRef.current = null;
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('click', handleClickCapture, { capture: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('click', handleClickCapture, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [buttonRef]);

  useEffect(() => {
    tickStepRef.current = (dt: number) => {
      const s = stateRef.current;
      const rect = buttonRef.current?.getBoundingClientRect();
      const btn = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: 80, y: 120 };

      const rawCursorVx = dt > 0 ? (s.cursorX - s.prevCursorX) / dt : 0;
      const rawCursorVy = dt > 0 ? (s.cursorY - s.prevCursorY) / dt : 0;
      s.prevCursorX = s.cursorX;
      s.prevCursorY = s.cursorY;

      const velSmoothing = 1 - Math.exp(-16 * dt);
      s.cursorVx += (rawCursorVx - s.cursorVx) * velSmoothing;
      s.cursorVy += (rawCursorVy - s.cursorVy) * velSmoothing;

      s.bobPhase += dt * 3.4;

      if (pinnedElRef.current && (!pinnedElRef.current.isConnected || pinnedElRef.current.closest('[inert]'))) {
        pinnedElRef.current = null;
      }
      if (hoveredElRef.current && (!hoveredElRef.current.isConnected || hoveredElRef.current.closest('[inert]'))) {
        hoveredElRef.current = null;
      }

      if (activeRef.current && pinnedElRef.current) {
        if (pinnedElRef.current !== s.lastPinnedEl) {
          s.pinExpand = 0;
          s.vPinExpand = 0;
          s.lastPinnedEl = pinnedElRef.current;
        }
        const aExpand = (PINNED_EXPAND_PX - s.pinExpand) * 185 - s.vPinExpand * 16;
        s.vPinExpand += aExpand * dt;
        s.pinExpand = Math.max(0, s.pinExpand + s.vPinExpand * dt);
      } else {
        s.pinExpand = 0;
        s.vPinExpand = 0;
        s.lastPinnedEl = null;
      }

      const pinnedBox =
        activeRef.current && pinnedElRef.current
          ? getTargetBox(pinnedElRef.current, s.pinExpand)
          : null;
      const hoverBox =
        activeRef.current &&
        hoveredElRef.current &&
        hoveredElRef.current !== pinnedElRef.current
          ? getTargetBox(hoveredElRef.current)
          : null;

      const pinnedBorderWidth =
        2 + 2 * clamp(s.pinExpand / (PINNED_EXPAND_PX * 0.9), 0, 1);
      applyHighlightStyle(
        pinnedHighlightRef.current,
        pinnedBox,
        Boolean(pinnedBox),
        pinnedBorderWidth,
      );
      const hideHoverImmediately = Boolean(
        pinnedElRef.current && hoveredElRef.current === pinnedElRef.current,
      );
      hoverHighlightRef.current?.classList.toggle(
        'fox-target-highlight-hover',
        Boolean(pinnedBox),
      );
      applyHighlightStyle(hoverHighlightRef.current, hoverBox, hideHoverImmediately);

      if (activeRef.current) {
        let targetX: number;
        let targetY: number;
        let stiffness = 135;
        let damping = 17;
        let rawTilt: number;

        if (pinnedBox) {
          // Snap slightly up and right of the expanded top-right corner
          targetX = clamp(pinnedBox.right + 8, 18, window.innerWidth - 18);
          targetY = clamp(pinnedBox.top - 8, 18, window.innerHeight - 18) + Math.sin(s.bobPhase) * 1.5;
          stiffness = 230;
          damping = 21;
          rawTilt = s.vx * 0.035 + Math.sin(s.bobPhase * 0.85) * 1.6;
        } else if (hoverBox) {
          // Stick to the top edge and follow cursor horizontally along it without corner snapping
          const edgeX = clamp(s.cursorX, hoverBox.left, hoverBox.right);
          const velNudgeX = clamp(s.cursorVx * 0.018, -14, 14);
          const cursorPullY = clamp((s.cursorY - hoverBox.top) * 0.06, -5, 5);
          const velNudgeY = clamp(s.cursorVy * 0.01, -6, 6);

          targetX = clamp(edgeX + velNudgeX, 18, window.innerWidth - 18);
          targetY = clamp(
            hoverBox.top + cursorPullY + velNudgeY + Math.sin(s.bobPhase) * 1.5,
            18,
            window.innerHeight - 18,
          );
          stiffness = 195;
          damping = 19;
          rawTilt =
            s.vx * 0.048 +
            s.cursorVx * 0.016 -
            s.vy * 0.01 +
            Math.sin(s.bobPhase * 0.85) * 1.8;
        } else {
          const hoverBobY = Math.sin(s.bobPhase) * 3.5;
          const hoverBobX = Math.cos(s.bobPhase * 0.5) * 1.5;

          targetX = s.cursorX + CURSOR_OFFSET_X + hoverBobX;
          targetY = s.cursorY + CURSOR_OFFSET_Y + hoverBobY;
          rawTilt =
            s.vx * 0.055 +
            s.cursorVx * 0.015 -
            s.vy * 0.012 +
            Math.sin(s.bobPhase * 0.85) * 2.2;
        }

        const ax = (targetX - s.x) * stiffness - s.vx * damping;
        const ay = (targetY - s.y) * stiffness - s.vy * damping;

        s.vx += ax * dt;
        s.vy += ay * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        const scaleStiffness = 220;
        const scaleDamping = 18;
        const aScale = (1 - s.scale) * scaleStiffness - s.vScale * scaleDamping;
        s.vScale += aScale * dt;
        s.scale = Math.max(0, s.scale + s.vScale * dt);

        const targetTilt = clamp(rawTilt, -32, 32);
        const tiltStiffness = 190;
        const tiltDamping = 17;
        const aTilt = (targetTilt - s.tilt) * tiltStiffness - s.vTilt * tiltDamping;
        s.vTilt += aTilt * dt;
        s.tilt += s.vTilt * dt;
      } else {
        const returnStiffness = 260;
        const returnDamping = 22;
        const ax = (btn.x - s.x) * returnStiffness - s.vx * returnDamping;
        const ay = (btn.y - s.y) * returnStiffness - s.vy * returnDamping;

        s.vx += ax * dt;
        s.vy += ay * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        const dist = Math.hypot(btn.x - s.x, btn.y - s.y);
        const targetScale = dist < 48 ? 0.15 : 0.65;
        const aScale = (targetScale - s.scale) * 240 - s.vScale * 22;
        s.vScale += aScale * dt;
        s.scale = Math.max(0, s.scale + s.vScale * dt);

        const targetTilt = clamp(s.vx * 0.06, -35, 35);
        const aTilt = (targetTilt - s.tilt) * 200 - s.vTilt * 18;
        s.vTilt += aTilt * dt;
        s.tilt += s.vTilt * dt;

        if (dist < 6 && s.scale < 0.25) {
          wasActiveRef.current = false;
          setIsReturning(false);
          return false;
        }
      }

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) translate3d(-50%, -50%, 0) rotate(${s.tilt}deg) scale(${s.scale})`;
      }

      return true;
    };
  });

  useEffect(() => {
    if (!isVisible) return;

    let rafId = 0;
    let lastTime = performance.now();

    if (isActive && !wasActiveRef.current) {
      const rect = buttonRef.current?.getBoundingClientRect();
      const btn = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: 80, y: 120 };
      const s = stateRef.current;
      s.x = btn.x;
      s.y = btn.y;
      s.vx = 140;
      s.vy = -240;
      s.scale = 0.25;
      s.vScale = 6.5;
      s.tilt = -14;
      s.vTilt = 0;
      s.pinExpand = 0;
      s.vPinExpand = 0;
      s.lastPinnedEl = null;
      if (!s.hasCursor) {
        s.cursorX = btn.x;
        s.cursorY = btn.y;
        s.prevCursorX = btn.x;
        s.prevCursorY = btn.y;
        s.hasCursor = true;
      }
    }
    wasActiveRef.current = isActive;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!tickStepRef.current(dt)) return;
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [isVisible, isActive, buttonRef]);

  if (!isVisible) return null;

  return (
    <>
      {isActive && (
        <>
          <div
            ref={hoverHighlightRef}
            aria-hidden="true"
            className="fox-target-highlight"
            style={{ opacity: 0 }}
          />
          <div
            ref={pinnedHighlightRef}
            aria-hidden="true"
            className="fox-target-highlight fox-target-highlight-pinned"
            style={{ opacity: 0 }}
          />
        </>
      )}
      <div
        ref={containerRef}
        aria-hidden="true"
        className="fox-companion pointer-events-none fixed top-0 left-0 z-50 flex h-8 w-8 select-none items-center justify-center text-[var(--fox-orange)]"
      >
        <FoxIcon className="h-7 w-7 drop-shadow-md" />
      </div>
    </>
  );
}
