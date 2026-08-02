"use client";
import { Feedback } from "@dnd-kit/dom";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import { type Ref, useRef, useState } from "react";
import { useStopwatch } from "react-timer-hook";
import { clamp, set, values } from "remeda";
import type { ItemData, ItemState, Pos } from "../components/day1_types";

const REPEL_RADIUS = 100; // % gap under which a nearby idle item gets nudged
const REPEL_STRENGTH = 10; // nudge magnitude per % of overlap

function vhToPx(vh: string) {
  const percent = parseInt(vh.split("vh")[0]) * 0.01;
  return Math.ceil(percent * window.innerHeight);
}

function vwToPx(vw: string) {
  const percent = parseInt(vw.split("vh")[0]) * 0.01;
  return Math.ceil(percent * window.innerWidth);
}

function clampToScreenPos(el: HTMLElement | null, pos: Pos) {
  if (!el) {
    return pos;
  }
  // get global coordinates of element
  const rect = el.getBoundingClientRect();
  // only 50% of height/width should be out of screen;
  const maxX = window.innerWidth - rect.width / 2;
  const minX = -(rect.width / 2);
  const maxY = window.innerHeight - rect.height / 2;
  const minY = -(rect.height / 2);

  return {
    x: clamp(pos.x, { min: minX, max: maxX }),
    y: clamp(pos.y, { min: minY, max: maxY }),
    z: pos.z,
  };
}

const ITEMS: ItemData[] = [
  {
    name: "laptop",
    image: "/day1/Laptop.svg",
    width: "100%",
    initialRotate: "15deg",
    initialPos: { x: vwToPx("-30vw"), y: vhToPx("20vh"), z: 1 },
    correctZ: 0,
  },
  {
    name: "a4",
    image: "/day1/A4.svg",
    width: "90%",
    initialRotate: "15deg",
    initialPos: { x: vwToPx("20vw"), y: vhToPx("-20vh"), z: 0 },
    correctZ: 1,
  },
  {
    name: "notebook",
    image: "/day1/Notebook.svg",
    width: "80%",
    initialRotate: "97deg",
    initialPos: { x: vwToPx("30vw"), y: vhToPx("35vh"), z: 2 },
    correctZ: 2,
  },
  {
    name: "bluebook",
    image: "/day1/Bluebook.svg",
    width: "70%",
    initialRotate: "75deg",
    initialPos: { x: vwToPx("35vw"), y: vhToPx("-10vh"), z: 3 },
    correctZ: 3,
  },
  {
    name: "map",
    image: "/day1/Map.svg",
    width: "60%",
    initialRotate: "-6deg",
    initialPos: { x: vwToPx("-25vw"), y: vhToPx("18vh"), z: 6 },
    correctZ: 4,
  },
  {
    name: "pencilcase",
    image: "/day1/Pencil Case.svg",
    width: "50%",
    initialRotate: "-8deg",
    initialPos: { x: vwToPx("-25vw"), y: vhToPx("-28vh"), z: 4 },
    correctZ: 5,
  },
  {
    name: "wallet",
    image: "/day1/Wallet.svg",
    width: "43%",
    initialRotate: "7deg",
    initialPos: { x: vwToPx("-20vw"), y: vhToPx("-12vh"), z: 4 },
    correctZ: 6,
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

function DraggableItem({
  itemData,
  itemPos,
  withinSnappingPosition,
}: {
  itemData: ItemData;
  itemPos: Pos;
  withinSnappingPosition: () => boolean;
}) {
  const { ref: dragRef } = useDraggable({ id: `day1-${itemData.name}` });
  const { ref: dropRef } = useDroppable({ id: `day1-${itemData.name}` });
  const elRef: Ref<HTMLElement | null> = useRef(null);
  const clampedPosition =
    elRef && elRef.current ? clampToScreenPos(elRef.current, itemPos) : itemPos;
  return (
    <div
      ref={(node) => {
        elRef.current = node;
        dragRef(node);
        dropRef(node);
      }}
      id={`day1-${itemData.name}`}
      className="row-start-1 row-span-1 col-start-1 col-span-1 duration-500 origin-center"
      style={{
        width: itemData.width,
        transformStyle: "preserve-3d",
        rotate: withinSnappingPosition() ? "0deg" : itemData.initialRotate,
        translate: withinSnappingPosition()
          ? "0px 0px"
          : `${clampedPosition.x}px ${clampedPosition.y}px`,
        zIndex: clampedPosition.z,
      }}
    >
      <img alt={itemData.name} src={itemData.image} className="w-full" />
    </div>
  );
}

function getItemNameFromID(itemName: string) {
  return itemName.substring("day1-".length);
}

function isSolved(pos: Pos) {
  return pos.x === 0 && pos.y === 0;
}

export default function Level1() {
  const MAX_SCREEN_SIZE =
    "w-screen h-screen max-w-screen min-w-screen max-h-screen min-h-screen";
  const [itemPositions, setItemPositions] = useState(defaultItemPositions());
  const [itemWinState, setItemWinState] = useState(
    Object.fromEntries(ITEMS.map(({ name }) => [name, false])),
  );
  const { hours, minutes, seconds } = useStopwatch({ autoStart: true });

  function solveItem(item: string) {
    setItemPosition(item, { x: 0, y: 0, z: 0 });
    setItemWinState(set(itemWinState, item, true));
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

  function centerOfElement(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      z: 0,
    };
  }

  function distBetweenElements(el1: HTMLElement, el2: HTMLElement) {
    const { x: x1, y: y1 } = centerOfElement(el1);
    const { x: x2, y: y2 } = centerOfElement(el2);
    return Math.hypot(x1 - x2, y1 - y2);
  }

  function translateItem(item: string, diff: Pos) {
    setItemPosition(item, {
      x: itemPositions[item].x + diff.x,
      y: itemPositions[item].y + diff.y,
      z: itemPositions[item].z + diff.z,
    });
  }

  function gameWon() {
    return values(itemWinState).every((x: boolean) => x);
  }

  return (
    <main
      className={`${MAX_SCREEN_SIZE} overflow-clip bg-radial from-[#ffad6f] to-[#bd5d44] grid grid-cols-1 grid-rows-1 place-items-center py-[10%] px-[20%]`}
    >
      <DragDropProvider
        onBeforeDragStart={(event) => {
          if (!event.operation.source) {
            return; // no item being dragged
          }
          const dragItem = getItemNameFromID(
            event.operation.source.id as string,
          );
          // disable drag if the item is already solved
          if (isSolved(itemPositions[dragItem])) {
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
            // skip solved items
            if (itemPositions[item].x === 0 && itemPositions[item].y === 0) {
              continue;
            }
            if (item === dragItem) {
              continue;
            } // don't repel held object
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
            z: 50,
          };

          const dragEl = document.getElementById(operation.source.id as string);

          if (isItemInWinnableState(itemPositions[dragItem], dragEl)) {
            solveItem(dragItem);
          } else {
            setItemPosition(dragItem, newPosition); // update current position
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
