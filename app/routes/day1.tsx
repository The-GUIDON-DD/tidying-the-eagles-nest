"use client";
import { Feedback } from "@dnd-kit/dom";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import { type Ref, useRef, useState } from "react";
import { useStopwatch } from "react-timer-hook";
import { set, values } from "remeda";
import {
  centerOfElement,
  clampToScreenPos,
  distBetweenElements,
  vhToPx,
  vwToPx,
} from "~/utils/utils";
import type { ItemData, ItemState, Pos } from "../components/day1_types";

const REPEL_RADIUS = 175; // % gap under which a nearby idle item gets nudged
const REPEL_STRENGTH = 7; // nudge magnitude per % of overlap

const CORRECT_ORDER = {
  laptop: 1,
  a4: 2,
  notebook: 3,
  bluebook: 4,
  map: 5,
  pencilcase: 6,
  wallet: 7,
};

const ITEMS: ItemData[] = [
  {
    name: "laptop",
    image: "/day1/Laptop.svg",
    width: "100%",
    initialRotate: "15deg",
    initialPos: { x: vwToPx("-30vw"), y: vhToPx("20vh"), z: 1 },
  },
  {
    name: "a4",
    image: "/day1/A4.svg",
    width: "90%",
    initialRotate: "15deg",
    initialPos: { x: vwToPx("20vw"), y: vhToPx("-20vh"), z: 0 },
  },
  {
    name: "notebook",
    image: "/day1/Notebook.svg",
    width: "80%",
    initialRotate: "97deg",
    initialPos: { x: vwToPx("30vw"), y: vhToPx("35vh"), z: 2 },
  },
  {
    name: "bluebook",
    image: "/day1/Bluebook.svg",
    width: "70%",
    initialRotate: "75deg",
    initialPos: { x: vwToPx("35vw"), y: vhToPx("-10vh"), z: 3 },
  },
  {
    name: "map",
    image: "/day1/Map.svg",
    width: "60%",
    initialRotate: "-6deg",
    initialPos: { x: vwToPx("-25vw"), y: vhToPx("18vh"), z: 6 },
  },
  {
    name: "pencilcase",
    image: "/day1/Pencil Case.svg",
    width: "50%",
    initialRotate: "-8deg",
    initialPos: { x: vwToPx("-25vw"), y: vhToPx("-28vh"), z: 4 },
  },
  {
    name: "wallet",
    image: "/day1/Wallet.svg",
    width: "43%",
    initialRotate: "7deg",
    initialPos: { x: vwToPx("-20vw"), y: vhToPx("-12vh"), z: 4 },
  },
];

function defaultItemPositions() {
  const itemPositions: ItemState = {};
  for (const itemData of ITEMS) {
    itemPositions[itemData.name] = itemData.initialPos;
  }
  return itemPositions;
}

function withinSnappingPosition(width: number, height: number, pos: Pos) {
  return Math.abs(pos.x) <= width / 4 && Math.abs(pos.y) <= height / 4;
}

enum LayerDirection {
  DOWN,
  UP,
}

function DraggableItem({
  itemData,
  itemPos,
  withinSnappingPosition,
  isFocusedItem,
  enableFocus,
}: {
  itemData: ItemData;
  itemPos: Pos;
  withinSnappingPosition: () => boolean;
  isFocusedItem: boolean;
  enableFocus: () => void;
}) {
  const { ref: dragRef } = useDraggable({ id: `day1-${itemData.name}` });
  const { ref: dropRef } = useDroppable({ id: `day1-${itemData.name}` });
  const elRef: Ref<HTMLElement | null> = useRef(null);
  const clampedPosition = elRef?.current
    ? clampToScreenPos(elRef.current, itemPos)
    : itemPos;

  return (
    <button
      type="button"
      ref={(node) => {
        elRef.current = node;
        dragRef(node);
        dropRef(node);
      }}
      id={`day1-${itemData.name}`}
      className="row-start-1 row-span-1 col-start-1 col-span-1 duration-350 origin-center"
      style={{
        width: itemData.width,
        transformStyle: "preserve-3d",
        rotate: withinSnappingPosition() ? "0deg" : itemData.initialRotate,
        translate: withinSnappingPosition()
          ? "0px 0px"
          : `${clampedPosition.x}px ${clampedPosition.y}px`,
        filter: `${isFocusedItem ? "drop-shadow(0 0 16px #00bfff)" : ""}`,
        zIndex: clampedPosition.z,
      }}
      onClick={enableFocus}
      onKeyDown={(event) => {
        if (event.key === "Enter") enableFocus();
      }} // a11y compliance
    >
      <img alt={itemData.name} src={itemData.image} className="w-full" />
    </button>
  );
}

function getItemNameFromID(itemName: string) {
  return itemName.substring("day1-".length);
}

export default function Level1() {
  const MAX_SCREEN_SIZE =
    "w-screen h-screen max-w-screen min-w-screen max-h-screen min-h-screen";
  const [itemPositions, setItemPositions] = useState(defaultItemPositions());
  const [itemWinState, setItemWinState] = useState(
    Object.fromEntries(ITEMS.map(({ name }) => [name, false])),
  );
  const [focusedItem, setFocusedItem] = useState("");
  const { hours, minutes, seconds } = useStopwatch({ autoStart: true });

  function snapItem(item: string) {
    if (
      itemPositions[item].z ===
      CORRECT_ORDER[item as keyof typeof CORRECT_ORDER]
    ) {
      setItemWinState(set(itemWinState, item, true));
    }
    setItemPosition(item, { x: 0, y: 0, z: itemPositions[item].z });
  }

  function printTimer() {
    if (hours > 0) {
      return `${hours}:${minutes}:${seconds}`;
    }
    return `${minutes}:${seconds}`;
  }

  function setItemPosition(itemName: string, itemPos: Pos) {
    if (itemName in itemPositions) {
      setItemPositions(set(itemPositions, itemName, itemPos));
    }
  }

  function isItemInWinnableState(itemPos: Pos, itemEl: HTMLElement | null) {
    return withinSnappingPosition(
      itemEl?.offsetWidth || 0,
      itemEl?.offsetHeight || 0,
      itemPos,
    );
  }

  function translateItem(item: string, diff: Pos) {
    setItemPosition(item, {
      x: itemPositions[item].x + diff.x,
      y: itemPositions[item].y + diff.y,
      z: itemPositions[item].z + diff.z,
    });
  }

  function switchLayers(dir: LayerDirection) {
    if (!(focusedItem in itemPositions)) {
      return;
    }

    const newZ =
      dir === LayerDirection.DOWN
        ? Math.max(itemPositions[focusedItem].z - 1, 0)
        : Math.min(itemPositions[focusedItem].z + 1, ITEMS.length);

    if (newZ === CORRECT_ORDER[focusedItem as keyof typeof CORRECT_ORDER]) {
      setItemWinState(set(itemWinState, focusedItem, true));
      setFocusedItem("");
    }
    setItemPosition(focusedItem, {
      ...itemPositions[focusedItem],
      z: newZ,
    });
  }

  function gameWon() {
    return values(itemWinState).every((x: boolean) => x);
  }

  return (
    <main
      className={`${MAX_SCREEN_SIZE} overflow-clip bg-radial from-[#ffad6f] to-[#bd5d44] grid grid-cols-1 grid-rows-1 place-items-center py-[10%] px-[20%]`}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") {
          switchLayers(LayerDirection.DOWN);
        } else if (event.key === "ArrowUp") {
          switchLayers(LayerDirection.UP);
        }
      }}
    >
      <DragDropProvider
        onBeforeDragStart={(event) => {
          if (!event.operation.source) {
            return; // no item being dragged
          }
          setFocusedItem(""); // clear focused item;
          const dragItem = getItemNameFromID(
            event.operation.source.id as string,
          );
          // disable drag if the item is already solved
          if (itemWinState[dragItem]) {
            event.preventDefault();
          }
        }}
        onDragMove={({ operation }) => {
          const { source, position } = operation;
          if (!source || !position || !operation) {
            return;
          }
          const dragEl = document.getElementById(source.id as string);
          if (!dragEl) {
            return;
          }
          const dragItem = getItemNameFromID(source.id as string);

          for (const item in itemPositions) {
            // skip solved items & held object
            if (
              (itemPositions[item].x === 0 && itemPositions[item].y === 0) ||
              item === dragItem
            ) {
              continue;
            }
            const itemEl = document.getElementById(`day1-${item}`);
            if (!itemEl) {
              continue;
            }

            const dist = distBetweenElements(dragEl, itemEl);
            const itemCenter = centerOfElement(itemEl);

            // distance from center of item to pointer
            // position.current is position of pointer
            const dx = itemCenter.x - position.current.x;
            const dy = itemCenter.y - position.current.y;
            if (dist > 0.001 && dist < REPEL_RADIUS) {
              // got this formula from claude
              const push = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
              translateItem(item, {
                x: (dx / dist) * push,
                y: (dy / dist) * push,
                z: 0,
              });
            }
          }
        }}
        onDragEnd={({ operation }) => {
          /* Prevents items snapping back to their old position after drag */
          if (!operation.source) {
            return;
          }
          // Name of item being dragged
          const dragItem = getItemNameFromID(operation.source.id as string);
          const newPosition: Pos = {
            x: itemPositions[dragItem].x + operation.transform.x,
            y: itemPositions[dragItem].y + operation.transform.y,
            z: itemPositions[dragItem].z,
          };

          const dragEl = document.getElementById(operation.source.id as string);

          if (isItemInWinnableState(newPosition, dragEl)) {
            snapItem(dragItem);
          } else {
            setItemPosition(dragItem, newPosition); // update current position
            setFocusedItem(dragItem); // set focused item to last dragged
          }
        }}
        plugins={(defaults) => [
          ...defaults,
          Feedback.configure({ dropAnimation: null }),
        ]}
      >
        {ITEMS.map((item) => {
          return (
            <DraggableItem
              key={item.name}
              itemData={item}
              itemPos={itemPositions[item.name]}
              isFocusedItem={item.name === focusedItem}
              enableFocus={() => setFocusedItem(item.name)}
              withinSnappingPosition={() => {
                const el = document.getElementById(`day1-${item.name}`);
                const width = el?.offsetWidth || 0;
                const height = el?.offsetHeight || 0;
                return withinSnappingPosition(
                  width,
                  height,
                  itemPositions[item.name],
                );
              }}
            />
          );
        })}
      </DragDropProvider>
    </main>
  );
}
