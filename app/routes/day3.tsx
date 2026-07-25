import { DragDropProvider, useDraggable } from "@dnd-kit/react";
import { useEffect, useRef, useState } from "react";
import solutionsData from "./day3.solutions.json";

export function meta() {
	return [
		{ title: "Day 3 — Locker" },
		{ name: "description", content: "Tidy the gym locker." },
	];
}

type Pos = { left: number; top: number };
type Item = {
	id: string;
	src: string;
	width: number; // % of stage width; height follows the image's aspect ratio
	flipX?: boolean; // mirror left/right (reflect across the y-axis)
	flipY?: boolean; // mirror top/bottom (reflect across the x-axis)
};
// One full valid layout: item id -> resting spot, % of the 9:16 stage.
type Board = Record<string, Pos>;

// Filenames have spaces; encodeURI turns them into %20 while leaving "/" alone.
const asset = (file: string) => encodeURI(`/day3/${file}`);

// The 4 recessed compartments, top -> bottom, as % of the 9:16 stage.
const SHELVES = [
	{ top: 4.5, height: 16.75 },
	{ top: 23.9, height: 10.4 },
	{ top: 37.0, height: 19.6 },
	{ top: 59.5, height: 34.9 },
];

// Back -> front (array order = z-order). All units are % of the stage.
const ITEMS: Item[] = [
	{ id: "towel", src: "towel.png", width: 14.88 },
	{ id: "clothes", src: "clothes.png", width: 41.83 },
	{ id: "sneaker-l", src: "sneaker.png", width: 32.19 },
	{
		id: "sneaker-r",
		src: "sneaker.png",
		width: 32.19,
		flipX: true,
		flipY: true,
	},
	{ id: "bag", src: "gym bag.png", width: 55.37 },
	{ id: "mat", src: "yoga mat.png", width: 11.55 },
	{ id: "arnis", src: "arnis stick.png", width: 5.27 },
	{ id: "racket", src: "tennis racket.png", width: 25.35 },
	{ id: "barbell", src: "barbell.png", width: 11.01 },
	{ id: "jug", src: "water jug.png", width: 11.47 },
	{ id: "kettlebell", src: "weights.png", width: 18.9 },
];

// Every valid layout — none is more "correct" than another. Paste each
// ?dev=1 panel's "Copy" output here as one array entry.
const SOLUTIONS = solutionsData as Board[];

const SNAP = 5; // % distance within which an item clicks into its home slot
const WIN_TOL = 0.6; // % tolerance for the solved check

const REPEL_RADIUS = 16; // % gap under which a nearby idle item gets nudged
const REPEL_STRENGTH = 0.28; // nudge magnitude per % of overlap
const REPEL_MAX = 1.4; // % cap on a single nudge step

const SHUFFLE_TRIES = 40; // candidate spots tried per item when scattering
const SHUFFLE_MAX_OVERLAP = 0.12; // accept a spot once overlap is under ~12%

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

type Box = { x0: number; x1: number; y0: number; y1: number };

// The item's rectangle in viewport pixels (for overlap tests).
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

// Overlap of two content boxes as a fraction of the smaller box's area.
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
		ITEMS.map((i) => [i.id, SOLUTIONS[0]?.[i.id] ?? { left: 0, top: 0 }]),
	);

// True if item `id` is currently resting at one of its valid spots, in any layout.
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

function DraggableItem({
	item,
	pos,
	width,
	dragActive,
	registerNode,
}: {
	item: Item;
	pos: Pos;
	width: number;
	dragActive: boolean;
	registerNode: (id: string, node: HTMLDivElement | null) => void;
}) {
	const { ref, isDragging, isDropping } = useDraggable({ id: item.id });
	const flip = `scaleX(${item.flipX ? -1 : 1}) scaleY(${item.flipY ? -1 : 1})`;
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
				touchAction: "none", // let dnd-kit own the gesture on touch screens
				zIndex: active ? 50 : 1,
				// Glide only when some OTHER item is being dragged (so repel pushes ease).
				// Never on the dragged/dropped item, else it slides in from its old spot.
				transition:
					dragActive && !active
						? "left 120ms ease-out, top 120ms ease-out"
						: "none",
			}}
		>
			{/* .day3-grow is scaled while dragging via CSS (app.css) so the grow
          survives dnd-kit cloning the node into a popover overlay. Flip stays
          on the img so it does not fight dnd-kit's transform. */}
			<div className="day3-grow w-full">
				<img
					src={asset(item.src)}
					alt=""
					draggable={false}
					className="w-full select-none"
					style={{ transform: flip }}
				/>
			</div>
		</div>
	);
}

export default function Day3() {
	const stageRef = useRef<HTMLDivElement>(null);
	// Actual rendered <img> nodes, so item height can be read from the DOM
	// (real aspect ratio) instead of a hand-maintained ASPECT table.
	const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
	const registerNode = (id: string, node: HTMLDivElement | null) => {
		itemRefs.current[id] = node;
	};
	const heightPct = (id: string, rect: DOMRect) => {
		const h = itemRefs.current[id]?.getBoundingClientRect().height ?? 0;
		return (h / rect.height) * 100;
	};
	const [pos, setPos] = useState<Record<string, Pos>>(defaultPositions);
	const [playing, setPlaying] = useState(false);
	const [dragActive, setDragActive] = useState(false); // some item is being dragged
	// dev mode: add ?dev=1 to the URL for the tweak panel (live x/y, editable
	// width, Copy button) with snapping and repel disabled so items can be
	// dragged to exact spots — e.g. to capture alternate valid layouts.
	const [dev, setDev] = useState(false);
	const [widths, setWidths] = useState<Record<string, number>>(() =>
		Object.fromEntries(ITEMS.map((i) => [i.id, i.width])),
	);
	useEffect(() => {
		setDev(new URLSearchParams(window.location.search).has("dev"));
	}, []);

	const round = (n: number) => Math.round(n * 10) / 10;

	// Copies the current arrangement as one SOLUTIONS board entry.
	function copyValues() {
		const lines = ITEMS.map((it) => {
			const p = pos[it.id];
			return `    "${it.id}": { left: ${round(p.left)}, top: ${round(p.top)} },`;
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
			let left = prev[id].left + (operation.transform.x / rect.width) * 100;
			let top = prev[id].top + (operation.transform.y / rect.height) * 100;
			// soft-snap into a valid slot when released close to one (off in dev mode)
			if (!dev) {
				const hit = SOLUTIONS.map((b) => b[id]).find(
					(s) =>
						s && Math.abs(left - s.left) < SNAP && Math.abs(top - s.top) < SNAP,
				);
				if (hit) {
					left = hit.left;
					top = hit.top;
				}
			}
			// keep on-screen (can roam the side margins, not off the viewport edge)
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
				// don't disturb an item already snapped in a valid spot
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

	// Scatter items anywhere on the SCREEN (cabinet or side margins), trying to
	// keep overlaps low — some touching is fine, big pile-ups are not.
	function shuffle() {
		const rect = stageRef.current?.getBoundingClientRect();
		if (!rect) return;
		setPlaying(true);

		const area = (i: Item) => widths[i.id] * heightPct(i.id, rect);
		const order = [...ITEMS].sort((a, b) => area(b) - area(a)); // big ones first
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
				if (ov <= SHUFFLE_MAX_OVERLAP) break; // good enough, stop trying
			}
			if (best && bestBox) {
				placed.push(bestBox);
				next[item.id] = best;
			}
		}
		setPos(next);
	}

	return (
		<main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#7c62c6]">
			{/* controls live in the letterbox / over the frame, out of the way */}
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

			{playing && isSolved && (
				<div className="absolute top-4 z-[60] rounded-full bg-emerald-400/90 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg">
					✓ Tidied!
				</div>
			)}

			{/* Aspect-locked stage: height picks whichever of the viewport's
          dimensions is the binding constraint, so it never overflows either
          axis. aspect-ratio then derives the width. Same layout everywhere. */}
			<div
				ref={stageRef}
				className="relative aspect-[9/16]"
				style={{ height: "min(100dvh, 177.78vw)" }}
			>
				{/* neighbor-locker seams */}
				<div className="absolute inset-y-0 left-[13%] w-px bg-[#4d3a86]/60" />
				<div className="absolute inset-y-0 right-[13%] w-px bg-[#4d3a86]/60" />

				{/* recessed shelves */}
				{SHELVES.map((s) => (
					<div
						key={s.top}
						className="absolute left-[23%] w-[56%] bg-[#6a4dad]"
						style={{
							top: `${s.top}%`,
							height: `${s.height}%`,
							// hard-edged inner shadow: solid band on left + top, no blur
							boxShadow: "inset 7px 7px 0 rgba(0,0,0,.22)",
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
						/>
					))}
				</DragDropProvider>
			</div>

			{/* dev-only tweak panel (?dev=1): live x/y, editable width, snap + repel
			    disabled so items can be dragged to exact spots. */}
			{dev && (
				<div className="fixed right-2 top-2 z-[70] max-h-[96dvh] w-60 overflow-auto rounded-lg bg-black/75 p-2 font-mono text-[11px] leading-tight text-white shadow-xl backdrop-blur">
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
							<span className="w-14 shrink-0 truncate text-sky-300">
								{it.id}
							</span>
							<span className="w-14 shrink-0 tabular-nums text-white/70">
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
