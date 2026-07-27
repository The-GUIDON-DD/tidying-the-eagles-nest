import { configurator, Modifier } from "@dnd-kit/abstract";
import { DragDropProvider, useDraggable } from "@dnd-kit/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import initialData from "./day2.initial.json";
import solutionsData from "./day2.solutions.json";

export function meta() {
  return [
    { title: "Day 2 — Tray" },
    { name: "description", content: "Tidy the food tray." },
  ];
}

type Pos = { left: number; top: number };
type Item = {
  id: string;
  src: string;
  width: number;
  flipX?: boolean;
  flipY?: boolean;
  rotate?: number;
};
type FixedItem = Item & Pos;
type Board = Record<string, Pos>;

const asset = (file: string) => encodeURI(`/day2/${file}`);

const TRAY = { left: 12.85, top: 14.16, width: 73.26 };
const PLATE = { left: 33.26, top: 22.9, width: 32.85 };

const FIXED: FixedItem[] = [
  { id: "chicken", src: "chicken.png", left: 40.76, top: 25.0, width: 22.22 },
  { id: "rice", src: "rice.png", left: 48.26, top: 39.94, width: 9.65 },
  { id: "veg", src: "veg.png", left: 55.0, top: 47.66, width: 7.22 },
  {
    id: "handkerchief",
    src: "handkerchief.png",
    left: 29.03,
    top: 20.41,
    width: 14.24,
  },
  { id: "tissue", src: "tissue.png", left: 67.36, top: 47.85, width: 8.19 },
  { id: "fork", src: "fork.png", left: 71.18, top: 48.34, width: 2.92 },
  {
    id: "ice-cream",
    src: "ice cream.png",
    left: 18.47,
    top: 51.95,
    width: 14.86,
  },
];

const ITEMS: Item[] = [
  { id: "soup", src: "soup.png", width: 24.86 },
  { id: "banana", src: "banana.png", width: 23.75, rotate: 147.5 },
  { id: "coffee", src: "coffee.png", width: 12.57 },
  { id: "cucumber-1", src: "cucumber 1.png", width: 6.11 },
  { id: "tomato-1", src: "tomato1.png", width: 6.32 },
  { id: "cucumber-2", src: "cucumber 2.png", width: 6.25 },
  { id: "tomato-2", src: "tomato2.png", width: 4.58 },
  { id: "cucumber-3", src: "cucumber 3.png", width: 4.79 },
  { id: "sauce", src: "sauce.png", width: 6.25 },
  { id: "calamansi", src: "calamansi.png", width: 1.81 },
  { id: "calamansi-sliced", src: "sliced calamansi.png", width: 4.38 },
  { id: "chili-a", src: "chili2.png", width: 6.81, flipX: true },
  { id: "chili-b", src: "chili2.png", width: 6.81, flipY: true },
];

const INITIAL = initialData as Board;

const SOLUTIONS = solutionsData as Board[];

const WIN_TOL = 0.45;

const HOVER_SNAP_PCT = 3.2;

const REPEL_RADIUS = 7;
const REPEL_STRENGTH = 0.25;
const REPEL_MAX = 0.8;

const SHUFFLE_TRIES = 40;
const SHUFFLE_MAX_OVERLAP = 0.12;

function screenBounds(width: number, h: number, rect: DOMRect) {
  const vw = typeof window !== "undefined" ? window.innerWidth : rect.width;
  const vh = typeof window !== "undefined" ? window.innerHeight : rect.height;
  return {
    minLeft: -(rect.left * 100) / rect.width,
    maxLeft: ((vw - rect.left) * 100) / rect.width - width,
    minTop: -(rect.top * 100) / rect.height,
    maxTop: ((vh - rect.top) * 100) / rect.height - h,
  };
}

function clampToScreen(
  left: number,
  top: number,
  width: number,
  h: number,
  rect: DOMRect,
): Pos {
  const b = screenBounds(width, h, rect);
  return {
    left: Math.min(b.maxLeft, Math.max(b.minLeft, left)),
    top: Math.min(b.maxTop, Math.max(b.minTop, top)),
  };
}

type Box = { x0: number; x1: number; y0: number; y1: number };

function contentPxBox(
  left: number,
  top: number,
  width: number,
  h: number,
  rect: DOMRect,
): Box {
  const pxW = (width / 100) * rect.width;
  const pxH = (h / 100) * rect.height;
  const x = (left / 100) * rect.width;
  const y = (top / 100) * rect.height;
  return { x0: x, x1: x + pxW, y0: y, y1: y + pxH };
}

function overlapFrac(a: Box, b: Box): number {
  const ix = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
  const iy = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const inter = ix * iy;
  if (inter <= 0) return 0;
  const areaA = (a.x1 - a.x0) * (a.y1 - a.y0);
  const areaB = (b.x1 - b.x0) * (b.y1 - b.y0);
  return inter / Math.min(areaA, areaB);
}

const defaultPositions = (): Record<string, Pos> =>
  Object.fromEntries(
    ITEMS.map((i) => [i.id, INITIAL[i.id] ?? { left: 0, top: 0 }]),
  );

function isSettled(id: string, p: Pos): boolean {
  return SOLUTIONS.some((board) => {
    const s = board[id];
    return (
      s &&
      Math.abs(p.left - s.left) < WIN_TOL &&
      Math.abs(p.top - s.top) < WIN_TOL
    );
  });
}

type SnapOptions = {
  get: () => { dx: number; dy: number; tolerance: number };
  onLock?: (locked: boolean) => void;
};
class SnapToTarget extends Modifier<any, SnapOptions> {
  apply({ transform }: { transform: { x: number; y: number } }) {
    const opts = this.options;
    if (!opts) return transform;
    const { dx, dy, tolerance } = opts.get();
    const locked = Math.hypot(transform.x - dx, transform.y - dy) < tolerance;
    opts.onLock?.(locked);
    return locked ? { x: dx, y: dy } : transform;
  }
}
// biome-ignore lint/suspicious/noExplicitAny: matches the library's own configurator pattern
(SnapToTarget as any).configure = configurator(SnapToTarget);

function DraggableItem({
  item,
  pos,
  width,
  dragActive,
  registerNode,
  snap,
  atRest,
  dev,
}: {
  item: Item;
  pos: Pos;
  width: number;
  dragActive: boolean;
  registerNode: (id: string, node: HTMLDivElement | null) => void;
  snap: { dx: number; dy: number; tolerance: number };
  atRest: boolean;
  dev: boolean;
}) {
  // Always holds the latest snap target without forcing DraggableItem (or
  // dnd-kit's internal draggable instance) to re-render/re-init on change.
  const snapRef = useRef(snap);
  snapRef.current = snap;
  // True the instant the hover-lock engages mid-drag (not just after drop) —
  // lets rotate-on-lock items (e.g. the banana) turn as they lock in, rather
  // than snapping to their final angle only once released.
  const [dragLocked, setDragLocked] = useState(false);
  const modifiers = useMemo(
    () =>
      dev
        ? []
        : [
            SnapToTarget.configure({
              get: () => snapRef.current,
              onLock: (locked: boolean) =>
                setDragLocked((prev) => (prev === locked ? prev : locked)),
            }),
          ],
    [dev],
  );
  const { ref, isDragging, isDropping } = useDraggable({
    id: item.id,
    modifiers,
  });
  useEffect(() => {
    if (isDragging) setDragLocked(false);
  }, [isDragging]);
  const rotated = dragLocked || atRest;
  const transform = `scaleX(${item.flipX ? -1 : 1}) scaleY(${item.flipY ? -1 : 1}) rotate(${rotated ? (item.rotate ?? 0) : 0}deg)`;
  const active = isDragging || isDropping;
  return (
    <div
      ref={(node) => {
        ref(node);
        registerNode(item.id, node);
      }}
      className="absolute cursor-grab active:cursor-grabbing"
      style={{
        left: `${pos.left}%`,
        top: `${pos.top}%`,
        width: `${width}%`,
        touchAction: "none",
        zIndex: active ? 50 : 1,
        transition:
          dragActive && !active
            ? "left 120ms ease-out, top 120ms ease-out"
            : "none",
      }}
    >
      <div className="day2-grow w-full">
        <img
          src={asset(item.src)}
          alt=""
          draggable={false}
          className="w-full select-none"
          style={{ transform, transition: "transform 260ms ease" }}
        />
      </div>
    </div>
  );
}

export default function Day2() {
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const registerNode = (id: string, node: HTMLDivElement | null) => {
    itemRefs.current[id] = node;
  };
  const heightPct = (id: string, rect: DOMRect) => {
    const h = itemRefs.current[id]?.getBoundingClientRect().height ?? 0;
    return (h / rect.height) * 100;
  };
  const [pos, setPos] = useState<Record<string, Pos>>(defaultPositions);
  const [dragActive, setDragActive] = useState(false);
  const [finished, setFinished] = useState(false);
  // dev mode: add ?dev=1 to the URL for the tweak panel (live x/y, editable
  // width, Copy button) with the hover-lock and repel disabled so items can
  // be dragged to exact spots — e.g. to capture alternate valid layouts.
  const [dev, setDev] = useState(false);
  const [widths, setWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(ITEMS.map((i) => [i.id, i.width])),
  );
  useEffect(() => {
    setDev(new URLSearchParams(window.location.search).has("dev"));
  }, []);

  const round = (n: number) => Math.round(n * 10) / 10;

  function copyValues() {
    const lines = ITEMS.map((it) => {
      const p = pos[it.id];
      return `    "${it.id}": { "left": ${round(p.left)}, "top": ${round(p.top)} },`;
    }).join("\n");
    navigator.clipboard?.writeText(`  {\n${lines}\n  },`);
  }

  const isSolved = SOLUTIONS.some((board) =>
    ITEMS.every((i) => {
      const s = board[i.id];
      return (
        s &&
        Math.abs(pos[i.id].left - s.left) < WIN_TOL &&
        Math.abs(pos[i.id].top - s.top) < WIN_TOL
      );
    }),
  );

  function handleDragEnd(event: {
    operation: {
      source: { id: string | number } | null;
      transform: { x: number; y: number };
    };
    canceled: boolean;
  }) {
    setDragActive(false);
    const { operation, canceled } = event;
    const source = operation.source;
    const rect = stageRef.current?.getBoundingClientRect();
    if (canceled || !source || !rect) return;

    const id = String(source.id);
    if (!ITEMS.some((i) => i.id === id)) return;

    setPos((prev) => {
      // The transform here already reflects SnapToTarget's hover-lock, so
      // releasing anywhere within the lock radius lands exactly on target.
      const left = prev[id].left + (operation.transform.x / rect.width) * 100;
      const top = prev[id].top + (operation.transform.y / rect.height) * 100;
      return {
        ...prev,
        [id]: clampToScreen(left, top, widths[id], heightPct(id, rect), rect),
      };
    });
  }

  // Magnetic repel: while dragging, gently push nearby idle items away so they
  // read as solid objects, not stacking stickers. Off in dev for exact placing.
  function handleDragMove(event: {
    operation: {
      source: { id: string | number } | null;
      transform: { x: number; y: number };
    };
  }) {
    if (dev) return;
    const src = event.operation.source;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!src || !rect) return;
    const id = String(src.id);
    const base = pos[id];
    if (!base) return;
    const dx = base.left + (event.operation.transform.x / rect.width) * 100;
    const dy = base.top + (event.operation.transform.y / rect.height) * 100;
    setPos((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const it of ITEMS) {
        if (it.id === id) continue;
        const o = prev[it.id];
        if (isSettled(it.id, o)) continue;
        const vx = o.left - dx;
        const vy = o.top - dy;
        const dist = Math.hypot(vx, vy);
        if (dist > 0.001 && dist < REPEL_RADIUS) {
          const push = Math.min(
            REPEL_MAX,
            (REPEL_RADIUS - dist) * REPEL_STRENGTH,
          );
          next[it.id] = clampToScreen(
            o.left + (vx / dist) * push,
            o.top + (vy / dist) * push,
            widths[it.id],
            heightPct(it.id, rect),
            rect,
          );
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  function shuffle() {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setFinished(false);

    const area = (i: Item) => widths[i.id] * heightPct(i.id, rect);
    const order = [...ITEMS].sort((a, b) => area(b) - area(a));
    const placed: Box[] = [];
    const next: Record<string, Pos> = {};

    for (const item of order) {
      const w = widths[item.id];
      const h = heightPct(item.id, rect);
      const bnd = screenBounds(w, h, rect);
      let best: Pos | null = null;
      let bestBox: Box | null = null;
      let bestOverlap = Infinity;
      for (let n = 0; n < SHUFFLE_TRIES; n++) {
        const left = bnd.minLeft + Math.random() * (bnd.maxLeft - bnd.minLeft);
        const top = bnd.minTop + Math.random() * (bnd.maxTop - bnd.minTop);
        const box = contentPxBox(left, top, w, h, rect);
        const ov = placed.reduce((m, p) => Math.max(m, overlapFrac(box, p)), 0);
        if (ov < bestOverlap) {
          best = { left, top };
          bestBox = box;
          bestOverlap = ov;
        }
        if (ov <= SHUFFLE_MAX_OVERLAP) break;
      }
      if (best && bestBox) {
        placed.push(bestBox);
        next[item.id] = best;
      }
    }
    setPos(next);
  }

  function snapFor(id: string): { dx: number; dy: number; tolerance: number } {
    const rect = stageRef.current?.getBoundingClientRect();
    const target = SOLUTIONS[0]?.[id];
    const base = pos[id];
    if (!rect || !target || !base) return { dx: 0, dy: 0, tolerance: 0 };
    return {
      dx: ((target.left - base.left) / 100) * rect.width,
      dy: ((target.top - base.top) / 100) * rect.height,
      tolerance: (HOVER_SNAP_PCT / 100) * rect.width,
    };
  }

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#4a86a8]">
      {dev && (
        <div className="absolute left-3 top-3 z-[60] flex gap-2">
          <button
            type="button"
            onClick={shuffle}
            className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/30"
          >
            Shuffle
          </button>
          <button
            type="button"
            onClick={() => setPos(defaultPositions())}
            className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/30"
          >
            Reset
          </button>
        </div>
      )}

      {isSolved && !finished && (
        <div className="day2-backdrop absolute inset-0 z-65 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div
            className="day2-pop w-full max-w-xl bg-[#FFFBE6] px-8 py-8 text-center text-black shadow-2xl sm:px-12 sm:py-10"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            <h2 className="text-3xl font-extrabold sm:text-4xl">Bravo!</h2>
            <p className="mt-5 text-base leading-8 sm:text-lg sm:leading-9">
              You have stocked up energy for your next move. May your sharper
              mind and brighter spirit lead your path forward. After all, a
              well-fed wanderer is a formidable one. Now armed with the right
              nutrition, your last mission is to gain ample strength to get you
              through any physical challenges that may come your way.
            </p>
            <Link
              to="/day3"
              onClick={() => setFinished(true)}
              className="mt-8 inline-block rounded-xl bg-[#9d9d9d] px-10 py-3 text-lg transition hover:bg-[#8b8b8b]"
            >
              Next Level ↓
            </Link>
          </div>
        </div>
      )}

      {/* Aspect-locked stage: the reference photo is 1440x1024, so every
			    position above is that photo's own layout, just in %. Width picks
			    whichever of the viewport's dimensions is the binding constraint
			    (mirrors day3's height-driven version of the same trick). */}
      <div
        ref={stageRef}
        className="day2-stage relative aspect-[1440/1024]"
        style={{ width: "min(100dvw, 140.63vh)" }}
      >
        {/* tabletop behind the tray */}
        <div className="day2-tabletop absolute inset-0" />

        {/* the tray itself */}
        <img
          src={asset("tray.png")}
          alt=""
          draggable={false}
          className="absolute select-none"
          style={{
            left: `${TRAY.left}%`,
            top: `${TRAY.top}%`,
            width: `${TRAY.width}%`,
          }}
        />

        {/* the plate */}
        <img
          src={asset("plate.png")}
          alt=""
          draggable={false}
          className="absolute select-none"
          style={{
            left: `${PLATE.left}%`,
            top: `${PLATE.top}%`,
            width: `${PLATE.width}%`,
          }}
        />

        {/* already-tidy items: fixed in place, never draggable */}
        {FIXED.map((f) => (
          <img
            key={f.id}
            src={asset(f.src)}
            alt=""
            draggable={false}
            className="absolute select-none"
            style={{
              left: `${f.left}%`,
              top: `${f.top}%`,
              width: `${f.width}%`,
            }}
          />
        ))}

        {/* draggable items */}
        <DragDropProvider
          onDragStart={() => setDragActive(true)}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          {ITEMS.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              pos={pos[item.id]}
              width={widths[item.id]}
              dragActive={dragActive}
              registerNode={registerNode}
              snap={snapFor(item.id)}
              atRest={isSettled(item.id, pos[item.id])}
              dev={dev}
            />
          ))}
        </DragDropProvider>
      </div>

      {dev && (
        <div className="fixed right-2 top-2 z-[70] max-h-[96dvh] w-64 overflow-auto rounded-lg bg-black/75 p-2 font-mono text-[11px] leading-tight text-white shadow-xl backdrop-blur">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-semibold text-emerald-300">
              dev · drag to fit
            </span>
            <button
              type="button"
              onClick={copyValues}
              className="rounded bg-emerald-500/80 px-2 py-0.5 font-semibold hover:bg-emerald-500"
            >
              Copy
            </button>
          </div>
          {ITEMS.map((it) => (
            <div
              key={it.id}
              className="mb-1 flex items-center gap-1.5 border-b border-white/10 pb-1"
            >
              <span className="w-20 shrink-0 truncate text-sky-300">
                {it.id}
              </span>
              <span className="w-16 shrink-0 tabular-nums text-white/70">
                {round(pos[it.id].left)},{round(pos[it.id].top)}
              </span>
              <label className="ml-auto flex items-center gap-1">
                w
                <input
                  type="number"
                  step={0.5}
                  value={widths[it.id]}
                  onChange={(e) =>
                    setWidths((w) => ({
                      ...w,
                      [it.id]: Number(e.target.value),
                    }))
                  }
                  className="w-14 rounded bg-white/10 px-1 py-0.5 text-white outline-none focus:bg-white/20"
                />
              </label>
            </div>
          ))}
          <p className="mt-1 text-white/50">x,y = image corner (% of stage)</p>
        </div>
      )}
    </main>
  );
}
