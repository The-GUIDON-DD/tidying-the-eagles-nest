import { useDraggable } from "@dnd-kit/react";
import { useRef } from "react";

type Pos = { left: number; top: number };
type Item = {
  id: string;
  src: string;
  width: number; // % of stage width; height follows the image's aspect ratio
  startRotate?: number;
};

export default function DraggableItem({
  item,
  pos,
  rotation,
  rotationEnabled = true,
  dragActive,
  registerNode,
  onRotate,
}: {
  item: Item;
  pos: Pos;
  rotation: number;
  rotationEnabled: boolean;
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
      onKeyDown={
        rotationEnabled
          ? (event) => {
              if (event.key === "Enter" || event.key.toLowerCase() === "r") {
                event.preventDefault();
                onRotate(item.id);
              }
            }
          : () => {}
      }
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
