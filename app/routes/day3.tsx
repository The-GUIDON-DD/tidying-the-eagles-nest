import { useEffect, useRef, useState } from "react";
import { DragDropProvider, useDraggable } from "@dnd-kit/react";

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
	solved: Pos; // the correct resting spot, as % of the 9:16 stage
};

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
	{
		id: "towel",
		src: "towel.png",
		width: 17.5,
		solved: { left: 22.2, top: 5.3 },
	},
	{
		id: "clothes",
		src: "clothes.png",
		width: 44.5,
		solved: { left: 36, top: 0.8 },
	},
	{
		id: "sneaker-l",
		src: "sneaker.png",
		width: 37,
		solved: { left: 22, top: 17.6 },
	},
	{
		id: "sneaker-r",
		src: "sneaker.png",
		width: 37,
		flipX: true,
		flipY: true,
		solved: { left: 43.3, top: 20.5 },
	},
	{
		id: "bag",
		src: "gym bag.png",
		width: 56.5,
		solved: { left: 23.2, top: 29.6 },
	},
	{
		id: "mat",
		src: "yoga mat.png",
		width: 35,
		solved: { left: 13.4, top: 57.5 },
	},
	{
		id: "arnis",
		src: "arnis stick.png",
		width: 31,
		solved: { left: 22.3, top: 59.8 },
	},
	{
		id: "racket",
		src: "tennis racket.png",
		width: 32.5,
		solved: { left: 45.9, top: 58.7 },
	},
	{
		id: "barbell",
		src: "barbell.png",
		width: 34.4,
		solved: { left: 29.5, top: 60.1 },
	},
	{
		id: "jug",
		src: "water jug.png",
		width: 18.5,
		solved: { left: 62.8, top: 74.6 },
	},
	{
		id: "kettlebell",
		src: "weights.png",
		width: 27,
		solved: { left: 37, top: 79.3 },
	},
];

const SNAP = 5; // % distance within which an item clicks into its home slot
const WIN_TOL = 0.6; // % tolerance for the solved check

const REPEL_RADIUS = 16; // % gap under which a nearby idle item gets nudged
const REPEL_STRENGTH = 0.28; // nudge magnitude per % of overlap
const REPEL_MAX = 1.4; // % cap on a single nudge step

const SHUFFLE_TRIES = 40; // candidate spots tried per item when scattering
const SHUFFLE_MAX_OVERLAP = 0.12; // accept a spot once overlap is under ~12%

// Opaque bounding box per asset (fractions of the PNG), measured from alpha.
// Clips each item's hit area to its visible pixels, so transparent margins let
// clicks fall through to the item behind. Padded a touch to avoid cropping art.
const CONTENT: Record<string, { l: number; r: number; t: number; b: number }> =
	{
		"towel.png": { l: 0.1, r: 0.9, t: 0.02, b: 0.96 },
		"clothes.png": { l: 0.06, r: 0.95, t: 0.21, b: 0.79 },
		"sneaker.png": { l: 0.08, r: 0.9, t: 0.39, b: 0.79 },
		"gym bag.png": { l: 0.03, r: 0.96, t: 0.28, b: 0.82 },
		"yoga mat.png": { l: 0.35, r: 0.63, t: 0.07, b: 0.93 },
		"arnis stick.png": { l: 0.47, r: 0.59, t: 0.03, b: 0.97 },
		"barbell.png": { l: 0.36, r: 0.63, t: 0.02, b: 0.98 },
		"tennis racket.png": { l: 0.12, r: 0.85, t: 0.04, b: 0.96 },
		"water jug.png": { l: 0.2, r: 0.77, t: 0.06, b: 0.93 },
		"weights.png": { l: 0.17, r: 0.82, t: 0.02, b: 0.99 },
	};

// imgH / imgW per asset — used to compute an item's rendered height in stage %.
const ASPECT: Record<string, number> = {
	"towel.png": 1.625,
	"clothes.png": 1,
	"sneaker.png": 1,
	"gym bag.png": 1,
	"yoga mat.png": 2,
	"arnis stick.png": 2,
	"barbell.png": 1,
	"tennis racket.png": 2,
	"water jug.png": 2,
	"weights.png": 1,
};

// Opaque box for an item, mirrored to match its flips (fractions of the image).
function contentBox(item: Item) {
	const c = CONTENT[item.src] ?? { l: 0, r: 1, t: 0, b: 1 };
	let { l, r, t, b } = c;
	if (item.flipX) [l, r] = [1 - r, 1 - l];
	if (item.flipY) [t, b] = [1 - b, 1 - t];
	return { l, r, t, b };
}

// A clip-path inset matching the opaque box (padded a touch so art isn't cropped).
function contentClip(item: Item): string | undefined {
	if (!CONTENT[item.src]) return undefined;
	const { l, r, t, b } = contentBox(item);
	const pad = 0.025;
	const pct = (n: number) =>
		`${(Math.min(1, Math.max(0, n)) * 100).toFixed(1)}%`;
	return `inset(${pct(t - pad)} ${pct(1 - r - pad)} ${pct(1 - b - pad)} ${pct(l - pad)})`;
}

// The stage-% range that keeps an item's visible content inside the viewport.
// Positions are stage-%, so we fold in the stage's on-screen offset (rect).
function screenBounds(item: Item, width: number, rect: DOMRect) {
	const { l, r, t, b } = contentBox(item);
	const h = width * (ASPECT[item.src] ?? 1) * (9 / 16); // rendered height, stage %
	const vw = typeof window !== "undefined" ? window.innerWidth : rect.width;
	const vh = typeof window !== "undefined" ? window.innerHeight : rect.height;
	return {
		minLeft: -l * width - (rect.left * 100) / rect.width,
		maxLeft: ((vw - rect.left) * 100) / rect.width - r * width,
		minTop: -t * h - (rect.top * 100) / rect.height,
		maxTop: ((vh - rect.top) * 100) / rect.height - b * h,
	};
}

// Keep an item's visible content within the SCREEN (not the stage) so it can be
// dragged out into the side margins but never lost off the viewport edge.
function clampToScreen(
	item: Item,
	left: number,
	top: number,
	width: number,
	rect: DOMRect,
): Pos {
	const b = screenBounds(item, width, rect);
	return {
		left: Math.min(b.maxLeft, Math.max(b.minLeft, left)),
		top: Math.min(b.maxTop, Math.max(b.minTop, top)),
	};
}

type Box = { x0: number; x1: number; y0: number; y1: number };

// The item's visible-content rectangle in viewport pixels (for overlap tests).
function contentPxBox(
	item: Item,
	left: number,
	top: number,
	width: number,
	rect: DOMRect,
): Box {
	const { l, r, t, b } = contentBox(item);
	const pxW = (width / 100) * rect.width;
	const pxH = pxW * (ASPECT[item.src] ?? 1);
	const x = (left / 100) * rect.width;
	const y = (top / 100) * rect.height;
	return { x0: x + l * pxW, x1: x + r * pxW, y0: y + t * pxH, y1: y + b * pxH };
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

const solvedPositions = (): Record<string, Pos> =>
	Object.fromEntries(ITEMS.map((i) => [i.id, i.solved]));

function DraggableItem({
	item,
	pos,
	width,
	dragActive,
}: {
	item: Item;
	pos: Pos;
	width: number;
	dragActive: boolean;
}) {
	const { ref, isDragging, isDropping } = useDraggable({ id: item.id });
	const flip = `scaleX(${item.flipX ? -1 : 1}) scaleY(${item.flipY ? -1 : 1})`;
	const active = isDragging || isDropping;
	return (
		<div
			ref={ref}
			className="absolute cursor-grab active:cursor-grabbing"
			style={{
				left: `${pos.left}%`,
				top: `${pos.top}%`,
				width: `${width}%`,
				touchAction: "none", // let dnd-kit own the gesture on touch screens
				zIndex: active ? 50 : 1,
				// Tight hit area; CSS ([data-dnd-dragging]) unclips the drag clone.
				clipPath: contentClip(item),
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
	const [pos, setPos] = useState<Record<string, Pos>>(solvedPositions);
	const [playing, setPlaying] = useState(false);
	const [dragActive, setDragActive] = useState(false); // some item is being dragged
	// dev overlay: add ?ref=1 to the URL to superimpose the reference at 30%,
	// show a tweak panel, disable snapping and repel so items place freely.
	const [showRef, setShowRef] = useState(false);
	const [widths, setWidths] = useState<Record<string, number>>(() =>
		Object.fromEntries(ITEMS.map((i) => [i.id, i.width])),
	);
	useEffect(() => {
		setShowRef(new URLSearchParams(window.location.search).has("ref"));
	}, []);

	const round = (n: number) => Math.round(n * 10) / 10;

	function copyValues() {
		const lines = ITEMS.map((it) => {
			const p = pos[it.id];
			const flips = `${it.flipX ? " flipX: true," : ""}${it.flipY ? " flipY: true," : ""}`;
			return `  { id: "${it.id}", src: "${it.src}", width: ${round(widths[it.id])},${flips} solved: { left: ${round(p.left)}, top: ${round(p.top)} } },`;
		}).join("\n");
		navigator.clipboard?.writeText(lines);
	}

	const isSolved = ITEMS.every(
		(i) =>
			Math.abs(pos[i.id].left - i.solved.left) < WIN_TOL &&
			Math.abs(pos[i.id].top - i.solved.top) < WIN_TOL,
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
		const item = ITEMS.find((i) => i.id === id);
		if (!item) return;

		setPos((prev) => {
			let left = prev[id].left + (operation.transform.x / rect.width) * 100;
			let top = prev[id].top + (operation.transform.y / rect.height) * 100;
			// soft-snap into the home slot when released close to it (off in dev mode)
			if (
				!showRef &&
				Math.abs(left - item.solved.left) < SNAP &&
				Math.abs(top - item.solved.top) < SNAP
			) {
				left = item.solved.left;
				top = item.solved.top;
			}
			// keep on-screen (can roam the side margins, not off the viewport edge)
			return {
				...prev,
				[id]: clampToScreen(item, left, top, widths[id], rect),
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
		if (showRef) return;
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
				// don't disturb an item already snapped in its correct spot
				if (
					Math.abs(o.left - it.solved.left) < WIN_TOL &&
					Math.abs(o.top - it.solved.top) < WIN_TOL
				) {
					continue;
				}
				const vx = o.left - dx;
				const vy = o.top - dy;
				const dist = Math.hypot(vx, vy);
				if (dist > 0.001 && dist < REPEL_RADIUS) {
					const push = Math.min(
						REPEL_MAX,
						(REPEL_RADIUS - dist) * REPEL_STRENGTH,
					);
					next[it.id] = clampToScreen(
						it,
						o.left + (vx / dist) * push,
						o.top + (vy / dist) * push,
						widths[it.id],
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

		const area = (i: Item) =>
			widths[i.id] * widths[i.id] * (ASPECT[i.src] ?? 1);
		const order = [...ITEMS].sort((a, b) => area(b) - area(a)); // big ones first
		const placed: Box[] = [];
		const next: Record<string, Pos> = {};

		for (const item of order) {
			const w = widths[item.id];
			const bnd = screenBounds(item, w, rect);
			let best: Pos | null = null;
			let bestBox: Box | null = null;
			let bestOverlap = Infinity;
			for (let n = 0; n < SHUFFLE_TRIES; n++) {
				const left = bnd.minLeft + Math.random() * (bnd.maxLeft - bnd.minLeft);
				const top = bnd.minTop + Math.random() * (bnd.maxTop - bnd.minTop);
				const box = contentPxBox(item, left, top, w, rect);
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
					onClick={() => setPos(solvedPositions())}
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
						className="absolute left-[23%] w-[56%] rounded-md bg-[#6a4dad]"
						style={{
							top: `${s.top}%`,
							height: `${s.height}%`,
							boxShadow:
								"inset 0 6px 16px rgba(0,0,0,.35), 0 1px 0 rgba(255,255,255,.12)",
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
						/>
					))}
				</DragDropProvider>

				{/* dev-only reference overlay (?ref=1) for hand-fitting the layout */}
				{showRef && (
					<img
						src="/day3/reference.png"
						alt=""
						className="pointer-events-none absolute inset-0 z-40 h-full w-full opacity-30"
					/>
				)}
			</div>

			{/* dev-only tweak panel: live x/y, editable width, snap + repel disabled */}
			{showRef && (
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
