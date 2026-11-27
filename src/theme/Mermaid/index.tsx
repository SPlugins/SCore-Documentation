/**
 * Wraps the default Docusaurus Mermaid component with zoom / pan controls.
 *
 * - Drag to pan (mouse, pen or one finger horizontally).
 * - Ctrl/Cmd + scroll (or trackpad pinch) to zoom inline; plain scroll zooms in fullscreen.
 * - Two-finger pinch to zoom in fullscreen on touch devices.
 * - Toolbar: zoom out, zoom level, zoom in, reset/fit, fullscreen.
 */
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import Mermaid from '@theme-original/Mermaid';
import type MermaidType from '@theme/Mermaid';
import type {WrapperProps} from '@docusaurus/types';
import styles from './styles.module.css';

type Props = WrapperProps<typeof MermaidType>;
type View = {s: number; x: number; y: number};
type Point = {x: number; y: number};

const MIN_SCALE = 0.2;
const MAX_SCALE = 8;
const BUTTON_STEP = 1.25;
const DRAG_THRESHOLD = 4;
const IDENTITY: View = {s: 1, x: 0, y: 0};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Turns `inline code` inside node / edge labels into <code> elements.
 * This replaces Mermaid's own markdown-string syntax ("`**bold**`");
 * use <b>/<i> for bold/italic instead. Needs securityLevel 'loose' (set in config).
 */
const inlineCodeToHtml = (text: string) =>
  text.replace(/`([^`\n"]+)`/g, (_, code: string) => `<code>${escapeHtml(code)}</code>`);

export default function MermaidWrapper(props: Props): ReactNode {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(IDENTITY);
  const [fullscreen, setFullscreen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const fullscreenRef = useRef(fullscreen);
  fullscreenRef.current = fullscreen;

  // Gesture state lives in refs so pointer handlers don't re-bind every frame.
  const pointers = useRef(new Map<number, Point>());
  const dragStart = useRef<Point | null>(null);
  const moved = useRef(false);
  const pinchDist = useRef<number | null>(null);
  const suppressClick = useRef(false);

  /** Zoom by `factor`, keeping the point (cx, cy) in viewport coords fixed. */
  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setView((v) => {
      const s = clamp(v.s * factor, MIN_SCALE, MAX_SCALE);
      const k = s / v.s;
      return {s, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k};
    });
  }, []);

  const zoomFromCenter = useCallback(
    (factor: number) => {
      const vp = viewportRef.current;
      if (!vp) return;
      zoomAt(factor, vp.clientWidth / 2, vp.clientHeight / 2);
    },
    [zoomAt],
  );

  /** Inline: back to the natural size. Fullscreen: fit the diagram to the screen. */
  const fit = useCallback(() => {
    const vp = viewportRef.current;
    const stage = stageRef.current;
    if (!fullscreenRef.current || !vp || !stage) {
      setView(IDENTITY);
      return;
    }
    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    const w = stage.offsetWidth; // layout size, unaffected by the transform
    const h = stage.offsetHeight;
    if (!w || !h) {
      setView(IDENTITY);
      return;
    }
    const s = clamp(Math.min(1, (vh - 32) / h), MIN_SCALE, MAX_SCALE);
    setView({s, x: (vw - w * s) / 2, y: Math.max(16, (vh - h * s) / 2)});
  }, []);

  // Wheel zoom needs a non-passive listener to be able to preventDefault.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return undefined;
    const onWheel = (e: WheelEvent) => {
      if (!fullscreenRef.current && !e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const rect = vp.getBoundingClientRect();
      zoomAt(Math.exp(-delta * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };
    vp.addEventListener('wheel', onWheel, {passive: false});
    return () => vp.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // Fullscreen: fit on open, Esc to close, lock page scroll. Reset on close.
  useEffect(() => {
    if (!fullscreen) {
      setView(IDENTITY);
      return undefined;
    }
    const raf = requestAnimationFrame(fit);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen, fit]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointers.current.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (pointers.current.size === 1) {
      dragStart.current = {x: e.clientX, y: e.clientY};
      moved.current = false;
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = {x: e.clientX, y: e.clientY};
    pointers.current.set(e.pointerId, cur);
    const vp = viewportRef.current;
    if (!vp) return;

    if (pointers.current.size === 1) {
      const start = dragStart.current;
      if (!moved.current) {
        if (!start || Math.hypot(cur.x - start.x, cur.y - start.y) < DRAG_THRESHOLD) {
          return;
        }
        moved.current = true;
        setDragging(true);
        vp.setPointerCapture(e.pointerId);
      }
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      setView((v) => ({...v, x: v.x + dx, y: v.y + dy}));
      return;
    }

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = vp.getBoundingClientRect();
      const mid = {x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top};
      if (pinchDist.current) zoomAt(dist / pinchDist.current, mid.x, mid.y);
      pinchDist.current = dist;
      moved.current = true;
    }
  };

  const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = null;
    if (pointers.current.size === 1) {
      // Continue panning with the remaining finger from where it is now.
      const [rest] = [...pointers.current.values()];
      dragStart.current = rest;
    }
    if (pointers.current.size === 0) {
      if (moved.current) {
        // A drag shouldn't also count as a click on a linked node.
        suppressClick.current = true;
        setTimeout(() => {
          suppressClick.current = false;
        }, 0);
      }
      dragStart.current = null;
      moved.current = false;
      setDragging(false);
    }
  };

  const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
  };

  const wrapperClass = [styles.wrapper, fullscreen && styles.fullscreen]
    .filter(Boolean)
    .join(' ');
  const viewportClass = [styles.viewport, dragging && styles.dragging]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      <div className={styles.toolbar} role="toolbar" aria-label="Diagram zoom controls">
        <span className={styles.hint}>
          {fullscreen ? 'Scroll to zoom · drag to pan · Esc to close' : 'Ctrl + scroll to zoom · drag to pan'}
        </span>
        <button
          type="button"
          className={styles.button}
          onClick={() => zoomFromCenter(1 / BUTTON_STEP)}
          aria-label="Zoom out"
          title="Zoom out">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.zoomLabel}`}
          onClick={fit}
          aria-label="Reset zoom"
          title="Reset zoom">
          {Math.round(view.s * 100)}%
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => zoomFromCenter(BUTTON_STEP)}
          aria-label="Zoom in"
          title="Zoom in">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10M8 3v10" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => setFullscreen((f) => !f)}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}>
          {fullscreen ? (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />
            </svg>
          )}
        </button>
      </div>

      <div
        ref={viewportRef}
        className={viewportClass}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={onClickCapture}>
        <div
          ref={stageRef}
          className={styles.stage}
          style={{transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`}}>
          <Mermaid {...props} value={inlineCodeToHtml(props.value)} />
        </div>
      </div>
    </div>
  );
}
