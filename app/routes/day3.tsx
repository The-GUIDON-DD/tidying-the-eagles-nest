import { DragDropProvider, useDraggable } from "@dnd-kit/react";
import { useEffect, useRef, useState } from "react";
import solutionsData from "./day3.solutions.json";

export function meta() {
  return [
    { title: "Day 3 - Locker" },
    { name: "description", content: "Tidy the gym locker." },
  ];
}

type Pos = { left: number; top: number };
type Item = {
  id: string;
  src: string;
  width: number; // % of stage width; height follows the image's aspect ratio
  startRotate?: number;
};
// One full valid layout: item id -> resting spot, % of the 1440x1024 stage.
type Board = Record<string, Pos>;

// Filenames have spaces; encodeURI turns them into %20 while leaving "/" alone.
const asset = (file: string) => encodeURI(`/day3/${file}`);

const MIDDLE_LOCKER_FRAMES = [
  "middle locker (1).png",
  "middle locker (2) slightly open.png",
  "middle locker (3) fully open.png",
] as const;
const RIGHT_LOCKER_FRAMES = [
  "right locker (1).png",
  "right locker (2) slightly open.png",
  "right locker (3) fully open.png",
] as const;

// Back -> front (array order = z-order). All units are % of the stage.
const ITEMS: Item[] = [
  { id: "towel", src: "towel.png", width: 7.569 },
  { id: "shirt-top", src: "shirt top.png", width: 10.694 },
  { id: "shirt-middle", src: "shirt middle.png", width: 11.042 },
  { id: "shirt-bottom", src: "shirt bottom.png", width: 11.042 },
  { id: "sneaker-l", src: "sneakers left.png", width: 9.236 },
  {
    id: "sneaker-r",
    src: "sneakers right.png",
    width: 9.236,
    startRotate: 270,
  },
  { id: "bag", src: "gym bag.png", width: 17.083 },
  { id: "mat", src: "yoga mat.png", width: 5 },
  { id: "arnis-l", src: "arnis stick left.png", width: 1.111 },
  { id: "arnis-r", src: "arnis stick right.png", width: 1.111 },
  { id: "racket", src: "tennis racket.png", width: 7.708 },
  { id: "barbell", src: "barbell.png", width: 3.819, startRotate: 90 },
  { id: "jug", src: "water jug.png", width: 3.889 },
  { id: "kettlebell", src: "kettlebell.png", width: 6.389 },
];

// Every valid layout — none is more "correct" than another.
const SOLUTIONS = solutionsData as Board[];
const INTERCHANGEABLE: readonly (readonly string[])[] = [
  ["sneaker-l", "sneaker-r"],
  ["arnis-l", "arnis-r"],
];

// Day 3 - (2): the supplied messy arrangement across the two open lockers.
const START_POSITIONS: Board = {
  towel: { left: 53.119, top: 30.371 },
  "shirt-top": { left: 43.186, top: 75.488 },
  "shirt-middle": { left: 65.259, top: 79.199 },
  "shirt-bottom": { left: 43.259, top: 78.809 },
  "sneaker-l": { left: 66.289, top: 65.625 },
  "sneaker-r": { left: 47.232, top: 23.73 },
  bag: { left: 65.994, top: 50.684 },
  mat: { left: 40.905, top: 21.387 },
  "arnis-l": { left: 41.64, top: 53.711 },
  "arnis-r": { left: 46.79, top: 22.656 },
  racket: { left: 52.162, top: 54.395 },
  barbell: { left: 68.79, top: 68.75 },
  jug: { left: 48.483, top: 36.23 },
  kettlebell: { left: 77.105, top: 68.262 },
};

const SNAP = 5; // % distance within which an item clicks into its home slot
const WIN_TOL = 0.6; // % tolerance for the solved check

const REPEL_RADIUS = 9; // % gap under which a nearby idle item gets nudged
const REPEL_STRENGTH = 0.1; // nudge magnitude per % of overlap
const REPEL_MAX = 0.4; // % cap on a single nudge step
const LOCKER_X_SCALE = 24.722 / 23.333;

// The stage-% range that keeps an item inside the viewport (positions are
// stage-%, so we fold in the stage's on-screen offset (rect)). `h` is the
// item's actual rendered height, stage-%, read from the live DOM node.
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

// Keep an item's visible content within the SCREEN (not the stage) so it can be
// dragged out into the side margins but never lost off the viewport edge.
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

const defaultPositions = (): Record<string, Pos> =>
  Object.fromEntries(
    ITEMS.map((i) => [i.id, START_POSITIONS[i.id] ?? { left: 0, top: 0 }]),
  );

const defaultRotations = (): Record<string, number> =>
  Object.fromEntries(ITEMS.map((i) => [i.id, i.startRotate ?? 0]));

const hasFinalRotation = (item: Item, rotation: number) => {
  const normalized = ((rotation % 360) + 360) % 360;
  return (
    normalized === 0 ||
    (["mat", "arnis-l", "arnis-r", "barbell"].includes(item.id) &&
      normalized === 180)
  );
};

const hasSlotRotation = (item: Item, targetId: string, rotation: number) => {
  const normalized = ((rotation % 360) + 360) % 360;
  if (item.id.startsWith("sneaker-") && targetId.startsWith("sneaker-")) {
    return normalized === (item.id === targetId ? 0 : 180);
  }
  return hasFinalRotation(item, rotation);
};

const equivalentIds = (id: string): readonly string[] =>
  INTERCHANGEABLE.find((group) => group.includes(id)) ?? [id];

const validSlots = (id: string): { targetId: string; pos: Pos }[] =>
  SOLUTIONS.flatMap((board) =>
    equivalentIds(id).flatMap((equivalentId) =>
      board[equivalentId]
        ? [{ targetId: equivalentId, pos: board[equivalentId] }]
        : [],
    ),
  );

const isAt = (p: Pos, slot: Pos, tolerance = WIN_TOL) =>
  Math.abs(p.left - slot.left) < tolerance &&
  Math.abs(p.top - slot.top) < tolerance;

function boardMatches(
  board: Board,
  positions: Record<string, Pos>,
  rotations: Record<string, number>,
): boolean {
  const interchangeableIds = INTERCHANGEABLE.flat();
  const itemMatchesSlot = (itemId: string, targetId: string) => {
    const item = ITEMS.find((candidate) => candidate.id === itemId);
    return (
      item &&
      isAt(positions[itemId], board[targetId]) &&
      hasSlotRotation(item, targetId, rotations[itemId] ?? 0)
    );
  };
  return (
    ITEMS.every(
      (item) =>
        interchangeableIds.includes(item.id) ||
        itemMatchesSlot(item.id, item.id),
    ) &&
    INTERCHANGEABLE.every(
      ([a, b]) =>
        (itemMatchesSlot(a, a) && itemMatchesSlot(b, b)) ||
        (itemMatchesSlot(a, b) && itemMatchesSlot(b, a)),
    )
  );
}

// True if an item is resting in a valid interchangeable slot and orientation.
function isSettled(item: Item, p: Pos, rotation: number): boolean {
  return validSlots(item.id).some(
    (slot) =>
      isAt(p, slot.pos) && hasSlotRotation(item, slot.targetId, rotation),
  );
}

function DraggableItem({
  item,
  pos,
  rotation,
  dragActive,
  registerNode,
  onRotate,
}: {
  item: Item;
  pos: Pos;
  rotation: number;
  dragActive: boolean;
  registerNode: (id: string, node: HTMLButtonElement | null) => void;
  onRotate: (id: string) => void;
}) {
  const { ref, isDragging, isDropping } = useDraggable({ id: item.id });
  const lastTap = useRef(0);
  const transform = `rotate(${rotation}deg)`;
  const active = isDragging || isDropping;
  const handleTap = () => {
    const now = performance.now();
    if (lastTap.current > 0 && now - lastTap.current <= 320) {
      lastTap.current = 0;
      onRotate(item.id);
      return;
    }
    lastTap.current = now;
  };
  return (
    <button
      type="button"
      ref={(node) => {
        ref(node);
        registerNode(item.id, node);
      }}
      className="absolute cursor-grab active:cursor-grabbing"
      style={{
        left: `${pos.left}%`,
        top: `${pos.top}%`,
        width: `${item.width}%`,
        touchAction: "none", // let dnd-kit own the gesture on touch screens
        zIndex: active ? 50 : 1,
        // Glide only when some OTHER item is being dragged (so repel pushes ease).
        // Never on the dragged/dropped item, else it slides in from its old spot.
        transition:
          dragActive && !active
            ? "left 120ms ease-out, top 120ms ease-out"
            : "none",
      }}
      aria-label={`${item.id.replaceAll("-", " ")}. Double tap to rotate.`}
      onClick={handleTap}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key.toLowerCase() === "r") {
          event.preventDefault();
          onRotate(item.id);
        }
      }}
    >
      {/* Keep drag growth and locker-width correction on separate wrappers
			    so neither fights the item's rotation transform. */}
      <div className="day3-grow w-full">
        <div
          className="w-full"
          style={{
            transform: `scaleX(${LOCKER_X_SCALE})`,
            transformOrigin: "left center",
          }}
        >
          <img
            src={asset(item.src)}
            alt=""
            draggable={false}
            className="w-full select-none"
            style={{ transform }}
          />
        </div>
      </div>
    </button>
  );
}

export default function Day3() {
  const stageRef = useRef<HTMLDivElement>(null);
  // Actual rendered <img> nodes, so item height can be read from the DOM
  // (real aspect ratio) instead of a hand-maintained ASPECT table.
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const registerNode = (id: string, node: HTMLButtonElement | null) => {
    itemRefs.current[id] = node;
  };
  const heightPct = (id: string, rect: DOMRect) => {
    const h = itemRefs.current[id]?.getBoundingClientRect().height ?? 0;
    return (h / rect.height) * 100;
  };
  const [pos, setPos] = useState<Record<string, Pos>>(defaultPositions);
  const [rotations, setRotations] =
    useState<Record<string, number>>(defaultRotations);
  const [playing, setPlaying] = useState(false);
  const [dragActive, setDragActive] = useState(false); // some item is being dragged
  const [finished, setFinished] = useState(false); // win popup dismissed
  const [introFrame, setIntroFrame] = useState(0);
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    [
      ...MIDDLE_LOCKER_FRAMES,
      ...RIGHT_LOCKER_FRAMES,
      ...ITEMS.map((i) => i.src),
    ].forEach((file) => {
      const image = new Image();
      image.src = asset(file);
    });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIntroFrame(2);
      setIntroDone(true);
      return;
    }
    const slightlyOpen = window.setTimeout(() => setIntroFrame(1), 500);
    const fullyOpen = window.setTimeout(() => setIntroFrame(2), 800);
    const interactive = window.setTimeout(() => setIntroDone(true), 1400);
    return () => {
      window.clearTimeout(slightlyOpen);
      window.clearTimeout(fullyOpen);
      window.clearTimeout(interactive);
    };
  }, []);

  const isSolved = SOLUTIONS.some((board) =>
    boardMatches(board, pos, rotations),
  );

  function rotateItem(id: string) {
    setPlaying(true);
    setFinished(false);
    setRotations((prev) => ({
      ...prev,
      [id]: ((prev[id] ?? 0) + 90) % 360,
    }));
  }

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
    const item = ITEMS.find((candidate) => candidate.id === id);
    if (!item) return;

    setPos((prev) => {
      let left = prev[id].left + (operation.transform.x / rect.width) * 100;
      let top = prev[id].top + (operation.transform.y / rect.height) * 100;
      // Snap only when both the position and slot-specific orientation are valid.
      const hit = validSlots(id).find(
        (slot) =>
          isAt({ left, top }, slot.pos, SNAP) &&
          hasSlotRotation(item, slot.targetId, rotations[id] ?? 0) &&
          !equivalentIds(id).some(
            (otherId) => otherId !== id && isAt(prev[otherId], slot.pos),
          ),
      );
      if (hit) {
        left = hit.pos.left;
        top = hit.pos.top;
      }
      // keep on-screen (can roam the side margins, not off the viewport edge)
      return {
        ...prev,
        [id]: clampToScreen(left, top, item.width, heightPct(id, rect), rect),
      };
    });
  }

  // Magnetic repel: while dragging, gently push nearby idle items away so they
  // read as solid objects, not stacking stickers.
  function handleDragMove(event: {
    operation: {
      source: { id: string | number } | null;
      transform: { x: number; y: number };
    };
  }) {
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
        // don't disturb an item already snapped in a valid spot
        if (isSettled(it, o, rotations[it.id] ?? 0)) continue;
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
            it.width,
            heightPct(it.id, rect),
            rect,
          );
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#7c62c6]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.38]"
        style={{
          backgroundImage: `url("${asset("middle locker (1).png")}")`,
          backgroundPosition:
            "calc(50% + min(0.764vw, 1.074dvh)) calc(50% - min(1.146vw, 1.611dvh))",
          backgroundSize: "min(24.722vw, 34.753dvh) min(50vw, 70.313dvh)",
        }}
      />

      {playing && isSolved && !finished && (
        <div className="day3-backdrop absolute inset-0 z-65 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div
            className="day3-pop w-full max-w-xl bg-[#FFFBE6] px-8 py-8 text-center text-black shadow-2xl sm:px-12 sm:py-10"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            <h2 className="text-3xl font-extrabold sm:text-4xl">Excellent!</h2>
            <p className="mt-5 text-base leading-8 sm:text-lg sm:leading-9">
              Now with both a strong mind and enduring body, you are sure to win
              against any physical trials fate puts in your way, be it long
              E-Jeep queues, unexpected heavy lifting, multiple flights of
              stairs, or the occasional run from Bellarmine to SEC Building.
            </p>
            <button
              type="button"
              onClick={() => setFinished(true)}
              className="mt-8 rounded-xl bg-[#9d9d9d] px-10 py-3 text-lg transition hover:bg-[#8b8b8b]"
            >
              Finish
            </button>
          </div>
        </div>
      )}

      {/* Aspect-locked to the supplied 1440x1024 Day 3 artwork. */}
      <div
        ref={stageRef}
        className="relative aspect-[45/32]"
        style={{ width: "min(100vw, 140.625dvh)" }}
      >
        <img
          src={asset("left locker.png")}
          alt=""
          draggable={false}
          className="absolute left-[13.681%] top-[13.281%] h-[73.438%] w-[24.722%] select-none"
        />

        <div className="absolute left-[38.403%] top-[13.281%] h-[70.215%] w-[24.722%]">
          <img
            src={asset(MIDDLE_LOCKER_FRAMES[introFrame])}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
          />
          {introDone && (
            <>
              <div className="absolute left-[6.548%] top-[2.503%] h-[50.487%] w-[87.202%] bg-[#583F99]" />
              <div className="absolute left-[6.548%] top-[2.503%] h-[1.947%] w-[87.202%] bg-[#443175]" />
              <div className="absolute left-[6.548%] top-[2.503%] h-[50.487%] w-[4.167%] bg-[#443175]" />
              <div className="absolute left-[6.548%] top-[56.05%] h-[41.17%] w-[87.202%] bg-[#583F99]" />
              <div className="absolute left-[6.548%] top-[56.05%] h-[41.17%] w-[2.976%] bg-[#443175]" />
            </>
          )}
        </div>

        <div className="absolute left-[63.125%] top-[13.281%] h-[73.438%] w-[24.722%] overflow-hidden">
          <img
            src={asset(RIGHT_LOCKER_FRAMES[introFrame])}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
          />
          {introDone && (
            <>
              <div className="absolute left-[5.95%] top-[50%] h-[43.5%] w-[80.06%] bg-[#583F99]" />
              <div className="absolute left-[5.952%] top-[50%] h-[43%] w-[0.298%] bg-[#7C63BF]" />
              <div className="absolute left-[6.25%] top-[50%] h-[43%] w-[0.298%] bg-[#594491]" />
              <div className="absolute left-[6.548%] top-[50%] h-[43%] w-[3.571%] bg-[#443175]" />
              <div className="absolute left-[10.119%] top-[50%] h-[43%] w-[0.595%] bg-[#49347E]" />
            </>
          )}
        </div>

        {/* draggable items */}
        {introDone && (
          <DragDropProvider
            onDragStart={() => {
              setPlaying(true);
              setDragActive(true);
            }}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <div>
              {ITEMS.map((item) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  pos={pos[item.id]}
                  rotation={rotations[item.id] ?? 0}
                  dragActive={dragActive}
                  registerNode={registerNode}
                  onRotate={rotateItem}
                />
              ))}
            </div>
          </DragDropProvider>
        )}
      </div>
    </main>
  );
}
