import { configurator, Modifier } from "@dnd-kit/abstract";
import { DragDropProvider, useDraggable } from "@dnd-kit/react";
import type { MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import "./day2.css";
import dayjs from "dayjs";
import { useStopwatch } from "react-timer-hook";
import useSound from "use-sound";
import IntroScreen from "~/components/IntroScreen";
import WinScreen from "~/components/WinScreen";
import { printTimer } from "~/utils/utils";
import dropSfx from "/sfx/drop.m4a?url";
import grabSfx from "/sfx/grab.m4a?url";
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

const TRAY = { left: 12.85, top: 14.16, width: 73.96 };
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
  {
    id: "ice-cream",
    src: "ice cream.png",
    width: 14.86,
  },
];

const INITIAL = initialData as Board;

const SOLUTIONS = solutionsData as Board[];

const WIN_TOL = 0.45;

const HOVER_SNAP_PCT = 8;

const REPEL_RADIUS = 7;
const REPEL_STRENGTH = 0.25;
const REPEL_MAX = 0.8;

const ENTER_MS = 750;
const EXIT_MS = 650;

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

function Bar() {
  return (
    <div className="w-full flex flex-col items-stretch h-[10vh]">
      <div className="h-[78%] bg-[#d9d9d9]" />
      <div className="h-[7%] bg-[#fff2f2]" />
      <div className="h-[15%] bg-[#918080]" />
    </div>
  );
}

function BarBG() {
  return (
    <div className="fixed inset-0 size-full flex flex-col justify-center items-stretch gap-[10vh]">
      <p className="text-white text-3xl italic w-full font-serif text-center absolute top-15">
        <strong>Hint:</strong> Items snap in place when you put them in the
        correct position
      </p>
      <Bar />
      <Bar />
      <Bar />
      <Bar />
    </div>
  );
}

function Game() {
  const navigate = useNavigate();
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
  // tray slide in on mount, slide out (rightward, same direction) on level exit
  const [stagePhase, setStagePhase] = useState<"enter" | "idle" | "exit">(
    "enter",
  );
  const { hours, minutes, seconds, pause } = useStopwatch({ autoStart: true });
  useEffect(() => {
    const t = setTimeout(() => setStagePhase("idle"), ENTER_MS);
    return () => clearTimeout(t);
  }, []);

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
  // dev mode: add ?dev=1 to the URL for the tweak panel (live x/y, editable
  // width, Copy button) with the hover-lock and repel disabled so items can
  // be dragged to exact spots — e.g. to capture alternate valid layouts.
  const [dev, setDev] = useState(false);
  const [widths, setWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(ITEMS.map((i) => [i.id, i.width])),
  );
  const [grabSound] = useSound(grabSfx);
  const [dropSound] = useSound(dropSfx);

  useEffect(() => {
    setDev(new URLSearchParams(window.location.search).has("dev"));
  }, []);

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
    dropSound();
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

  function printGameTimer() {
    pause();
    return printTimer(hours, minutes, seconds);
  }

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[url(/day2/bg.svg)] bg-cover">
      <BarBG />
      {isSolved && !finished && (
        <WinScreen
          day={2}
          time={printGameTimer()}
          winText="Bravo! You have stocked up energy for your next move. May your sharper mind and brighter spirit lead your path forward. After all, a well-fed wanderer is a formidable one. Now armed with the right nutrition, your last mission is to gain ample strength to get you through any physical challenges that may come your way."
        />
      )}

      {/* Aspect-locked stage: the reference photo is 1440x1024, so every
			    position above is that photo's own layout, just in %. Width picks
			    whichever of the viewport's dimensions is the binding constraint
			    (mirrors day3's height-driven version of the same trick). */}
      <div
        ref={stageRef}
        className={`day2-stage relative aspect-[1440/1024] ${
          stagePhase === "enter"
            ? "day2-stage-enter"
            : stagePhase === "exit"
              ? "day2-stage-exit"
              : ""
        }`}
        style={{ width: "min(100dvw, 140.63vh)" }}
      >
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
          onDragStart={() => {
            setDragActive(true);
            grabSound();
          }}
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
    </main>
  );
}

export default function Day2() {
  const [isIntroStage, setIsIntroStage] = useState(true);
  const unlockDate = dayjs("August 15, 2026, 7:00PM");
  const now = dayjs();

  if (now.isBefore(unlockDate)) {
    return <Navigate to="/" />;
  }

  return (
    <>
      {isIntroStage ? (
        <IntroScreen onStart={() => setIsIntroStage(false)}>
          <p className="font-serif text-center text-xl">
            As you continue to explore new landscapes, you realize that your
            satchel contains everything you require, except sustenance. It is
            tough to keep traveling on an empty stomach, but thankfully, you
            find a place to answer your needs. Step inside the Gonzaga
            Cafeteria, organize your meal, and watch out for any falling chairs!
          </p>
          <p className="font-serif text-center text-2xl italic">
            <strong>Hint:</strong> Items snap to their correct position.
          </p>
        </IntroScreen>
      ) : (
        <Game />
      )}
    </>
  );
}
