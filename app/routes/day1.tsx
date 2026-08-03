"use client";
import { Feedback } from "@dnd-kit/dom";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import { animate } from "animejs";
import { type Ref, useRef, useState } from "react";
import { useStopwatch } from "react-timer-hook";
import { set, values } from "remeda";
import WinScreen from "~/components/WinScreen";
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
const MAX_SCREEN_SIZE =
  "w-screen h-screen max-w-screen min-w-screen max-h-screen min-h-screen";

const CORRECT_ORDER = {
  laptop: 0,
  a4: 1,
  notebook: 2,
  bluebook: 3,
  map: 4,
  pencilcase: 6,
  wallet: 7,
  fan: 8,
  indexcard: 9,
  twobytwo: 10,
  umbrella: 5,
  waterbottle: 5,
};

const CORRECT_POSITION = {
  twobytwo: { x: vwToPx("-8vw"), y: vhToPx("-7vh") },
  umbrella: { x: 0, y: vwToPx("5vw") },
  waterbottle: { x: 0, y: vwToPx("-5vw") },
};

const ITEMS: ItemData[] = [
  {
    name: "laptop",
    image: "/day1/Laptop.svg",
    width: "100%",
    initialRotate: "15deg",
    initialPos: { x: vwToPx("-30vw"), y: vhToPx("20vh"), z: 0 },
  },
  {
    name: "a4",
    image: "/day1/A4.svg",
    width: "90%",
    initialRotate: "15deg",
    initialPos: { x: vwToPx("20vw"), y: vhToPx("-20vh"), z: 1 },
  },
  {
    name: "notebook",
    image: "/day1/Notebook.svg",
    width: "80%",
    initialRotate: "97deg",
    initialPos: { x: vwToPx("30vw"), y: vhToPx("35vh"), z: 3 },
  },
  {
    name: "bluebook",
    image: "/day1/Bluebook.svg",
    width: "70%",
    initialRotate: "75deg",
    initialPos: { x: vwToPx("35vw"), y: vhToPx("-10vh"), z: 4 },
  },
  {
    name: "map",
    image: "/day1/Map.svg",
    width: "60%",
    initialRotate: "-6deg",
    initialPos: { x: vwToPx("-25vw"), y: vhToPx("18vh"), z: 5 },
  },
  {
    name: "pencilcase",
    image: "/day1/Pencil Case.svg",
    width: "45%",
    initialRotate: "-8deg",
    initialPos: { x: vwToPx("-25vw"), y: vhToPx("-28vh"), z: 7 },
  },
  {
    name: "wallet",
    image: "/day1/Wallet.svg",
    width: "42%",
    initialRotate: "7deg",
    initialPos: { x: vwToPx("-20vw"), y: vhToPx("-12vh"), z: 8 },
  },
  {
    name: "fan",
    image: "/day1/Fan.svg",
    width: "40%",
    initialRotate: "80deg",
    initialPos: { x: vwToPx("-20vw"), y: vhToPx("40vh"), z: 2 },
  },
  {
    name: "indexcard",
    image: "/day1/IndexCard.svg",
    width: "38%",
    initialRotate: "10deg",
    initialPos: { x: vwToPx("20vw"), y: vhToPx("20vh"), z: 6 },
  },
  {
    name: "twobytwo",
    image: "/day1/2x2.svg",
    width: "10%",
    initialRotate: "-8deg",
    initialPos: { x: vwToPx("20vw"), y: vhToPx("20vh"), z: 9 },
  },
  {
    name: "umbrella",
    image: "/day1/Umbrella.svg",
    width: "50%",
    initialRotate: "-8deg",
    initialPos: { x: vwToPx("-20vw"), y: vhToPx("-30vh"), z: 10 },
  },
  {
    name: "waterbottle",
    image: "/day1/Waterbottle.svg",
    width: "50%",
    initialRotate: "70deg",
    initialPos: { x: vwToPx("30vw"), y: vhToPx("50vh"), z: 11 },
  },
];

function defaultItemPositions() {
  const itemPositions: ItemState = {};
  for (const itemData of ITEMS) {
    itemPositions[itemData.name] = itemData.initialPos;
  }
  return itemPositions;
}

const defaultPos: Pos = { x: 0, y: 0, z: 0 };
function withinSnappingPosition(
  width: number,
  height: number,
  pos: Pos,
  correctPos: Pos = defaultPos,
) {
  return (
    Math.abs(pos.x - correctPos.x) <= width / 4 &&
    Math.abs(pos.y - correctPos.y) <= height / 4
  );
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

  const correctPos = CORRECT_POSITION[
    itemData.name as keyof typeof CORRECT_POSITION
  ] || { x: 0, y: 0, z: 0 };

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
        rotate:
          correctPos.x === itemPos.x && correctPos.y === itemPos.y
            ? "0deg"
            : itemData.initialRotate,
        translate: `${itemPos.x}px ${itemPos.y}px`,
        filter: `${isFocusedItem ? "drop-shadow(0 0 16px #00bfff)" : ""}`,
        zIndex: itemPos.z,
      }}
      onClick={() => {
        if (withinSnappingPosition()) enableFocus();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") enableFocus();
      }} // a11y compliance
    >
      <img
        id={`day1-${itemData.name}-img`}
        alt={itemData.name}
        src={itemData.image}
        className="w-full"
      />
    </button>
  );
}

function getItemNameFromID(itemName: string) {
  return itemName.substring("day1-".length);
}

export default function Level1() {
  const [itemPositions, setItemPositions] = useState(defaultItemPositions());
  const [itemWinState, setItemWinState] = useState(
    Object.fromEntries(ITEMS.map(({ name }) => [name, false])),
  );
  const [focusedItem, setFocusedItem] = useState("");
  const { hours, minutes, seconds } = useStopwatch({ autoStart: true });

  function snapItem(item: string) {
    setItemPosition(item, getSnapPosition(item));
  }

  function getSnapPosition(item: string) {
    const correctZ = CORRECT_ORDER[item as keyof typeof CORRECT_ORDER];
    if (item in CORRECT_POSITION) {
      return {
        ...CORRECT_POSITION[item as keyof typeof CORRECT_POSITION],
        z: correctZ,
      };
    }
    return { ...defaultPos, z: correctZ };
  }

  function printTimer() {
    if (hours > 0) {
      return `${hours}:${minutes}:${seconds}`;
    }
    return `${minutes}:${seconds}`;
  }

  function isWinnablePosition(itemName: string, itemPos: Pos) {
    if (!(itemName in CORRECT_ORDER)) return false;
    const correctOrder = CORRECT_ORDER[itemName as keyof typeof CORRECT_ORDER];
    if (itemName in CORRECT_POSITION) {
      const correctPos =
        CORRECT_POSITION[itemName as keyof typeof CORRECT_POSITION];
      return (
        correctPos.x === itemPos.x &&
        correctPos.y === itemPos.y &&
        itemPos.z === correctOrder
      );
    } else {
      return itemPos.x === 0 && itemPos.y === 0 && itemPos.z === correctOrder;
    }
  }

  function setItemPosition(itemName: string, itemPos: Pos) {
    setItemPositions(set(itemPositions, itemName, itemPos));
    setItemWinState(
      set(itemWinState, itemName, isWinnablePosition(itemName, itemPos)),
    );
  }

  function isItemInWinnableState(
    item: string,
    itemPos: Pos,
    itemEl: HTMLElement | null,
  ) {
    return withinSnappingPosition(
      itemEl?.offsetWidth || 0,
      itemEl?.offsetHeight || 0,
      itemPos,
      getSnapPosition(item),
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
    // allow only if item is in snappable position
    const snapPos = getSnapPosition(focusedItem);
    if (
      !(focusedItem in itemPositions) ||
      !(
        itemPositions[focusedItem].x === snapPos.x &&
        itemPositions[focusedItem].y === snapPos.y
      )
    ) {
      return;
    }

    const newZ =
      dir === LayerDirection.DOWN
        ? Math.max(itemPositions[focusedItem].z - 1, 0)
        : Math.min(itemPositions[focusedItem].z + 1, ITEMS.length - 1);

    const itemWithSameZ = Object.keys(itemPositions).find(
      (item) => itemPositions[item].z === newZ,
    );

    if (itemWithSameZ) {
      // swap layers with any item that is on same layer
      setItemPosition(itemWithSameZ, {
        ...itemPositions[itemWithSameZ],
        z: itemPositions[focusedItem].z,
      });
    }
    setItemPosition(focusedItem, {
      ...itemPositions[focusedItem],
      z: newZ,
    });
  }

  function gameWon() {
    return values(itemWinState).every((x: boolean) => x);
  }

  function fixScale(el: HTMLElement | null) {
    if (el) {
      const rect = el.getBoundingClientRect();
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
    }
  }

  function resetScale(el: HTMLElement | null) {
    if (el) {
      el.style.width = "";
      el.style.height = "";
    }
  }

  return (
    <>
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
          onDragStart={(event) => {
            if (!event.operation.source) {
              return;
            }

            const dragId = event.operation.source.id;
            if (dragId) {
              animate(`#${dragId as string}-img`, {
                rotate: [1, 1.1, 1],
                duration: 400,
                ease: "inOutExpo",
              });
              animate(`#${dragId as string}-img`, {
                rotate: [-2, 2, -1.5, 0],
                duration: 400,
                ease: "inOutSine",
              });
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

            for (const item in itemPositions) {
              const snapPos = getSnapPosition(item);
              // skip solved items & held object
              if (
                (itemPositions[item].x === snapPos.x &&
                  itemPositions[item].y === snapPos.y) ||
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

            const dragEl = document.getElementById(
              operation.source.id as string,
            );

            if (isItemInWinnableState(dragItem, newPosition, dragEl)) {
              snapItem(dragItem);
            } else {
              setItemPosition(dragItem, clampToScreenPos(newPosition)); // update current position
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
                enableFocus={() => setFocusedItem("")}
                withinSnappingPosition={() => {
                  const el = document.getElementById(`day1-${item.name}`);
                  const width = el?.offsetWidth || 0;
                  const height = el?.offsetHeight || 0;
                  return withinSnappingPosition(
                    width,
                    height,
                    itemPositions[item.name],
                    getSnapPosition(item.name),
                  );
                }}
              />
            );
          })}
        </DragDropProvider>
      </main>
      {gameWon() && <WinScreen />}
    </>
  );
}
