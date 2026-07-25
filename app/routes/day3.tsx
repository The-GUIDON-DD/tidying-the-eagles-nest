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
// `solved.left/top` target each PNG's *visible* content, not its canvas:
// several assets sit in the lower-middle of a transparent square, so the
// corner is offset so the opaque pixels land in the right shelf.
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

const solvedPositions = (): Record<string, Pos> =>
	Object.fromEntries(ITEMS.map((i) => [i.id, i.solved]));

function DraggableItem({
	item,
	pos,
	width,
}: {
	item: Item;
	pos: Pos;
	width: number;
}) {
	const { ref, isDragging } = useDraggable({ id: item.id });
	const flip = `scaleX(${item.flipX ? -1 : 1}) scaleY(${item.flipY ? -1 : 1})`;
	return (
		<div
			ref={ref}
			className="absolute cursor-grab active:cursor-grabbing"
			style={{
				left: `${pos.left}%`,
				top: `${pos.top}%`,
				width: `${width}%`,
				touchAction: "none", // let dnd-kit own the gesture on touch screens
				zIndex: isDragging ? 50 : 1,
			}}
		>
			{/* flip lives on the img so it survives dnd-kit driving the outer div */}
			<img
				src={asset(item.src)}
				alt=""
				draggable={false}
				className="w-full select-none"
				style={{ transform: flip !== "scaleX(1) scaleY(1)" ? flip : undefined }}
			/>
		</div>
	);
}

export default function Day3() {
	const stageRef = useRef<HTMLDivElement>(null);
	const [pos, setPos] = useState<Record<string, Pos>>(solvedPositions);
	const [playing, setPlaying] = useState(false);
	// dev overlay: add ?ref=1 to the URL to superimpose the reference at 30%,
	// show a tweak panel, and disable snapping so items place freely.
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
			return { ...prev, [id]: { left, top } };
		});
	}

	function shuffle() {
		setPlaying(true);
		setPos(
			Object.fromEntries(
				ITEMS.map((i) => [
					i.id,
					{ left: 8 + Math.random() * 58, top: 6 + Math.random() * 74 },
				]),
			),
		);
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
				<DragDropProvider onDragEnd={handleDragEnd}>
					{ITEMS.map((item) => (
						<DraggableItem
							key={item.id}
							item={item}
							pos={pos[item.id]}
							width={widths[item.id]}
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

			{/* dev-only tweak panel: live x/y, editable width, snap disabled */}
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
