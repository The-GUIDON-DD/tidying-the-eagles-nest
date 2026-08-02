"use client";
import { Feedback } from "@dnd-kit/dom";
import { DragDropProvider, useDraggable } from "@dnd-kit/react";
import { useEffect, useRef, useState } from "react";
import type { ItemData, ItemState, Pos } from "../components/day1_types";

const SNAP = 5; // % distance within which an item clicks into its home slot
const WIN_TOL = 0.6; // % tolerance for the solved check

const REPEL_RADIUS = 9; // % gap under which a nearby idle item gets nudged
const REPEL_STRENGTH = 0.1; // nudge magnitude per % of overlap
const REPEL_MAX = 0.4; // % cap on a single nudge step

function vhToPx(vh: string) {
  const percent = parseInt(vh.split("vh")[0]) * 0.01;
  return Math.ceil(percent * window.innerHeight);
}

function vwToPx(vw: string) {
  const percent = parseInt(vw.split("vh")[0]) * 0.01;
  return Math.ceil(percent * window.innerWidth);
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

function DraggableItem({
  itemData,
  itemPos,
}: {
  itemData: ItemData;
  itemPos: Pos;
}) {
  const { ref: dragRef } = useDraggable({ id: `day1-${itemData.name}` });
  return (
    <img
      ref={dragRef}
      id={`day1-${itemData.name}`}
      alt={itemData.name}
      src={itemData.image}
      className="row-start-1 row-span-1 col-start-1 col-span-1 duration-500"
      style={{
        width: itemData.width,
        transformStyle: "preserve-3d",
        rotate: itemData.initialRotate,
        translate: `${itemPos.x}px ${itemPos.y}px`,
        zIndex: itemPos.z,
      }}
    />
  );
}

function getItemNameFromID(itemName: string) {
  return itemName.substring("day1-".length);
}

export default function Level1() {
  const MAX_SCREEN_SIZE =
    "w-screen h-screen max-w-screen min-w-screen max-h-screen min-h-screen";
  const [itemPositions, setItemPositions] = useState(defaultItemPositions());

  function setItemPosition(itemName: string, itemPos: Pos) {
    if (itemName in itemPositions) {
      const positions = { ...itemPositions };
      positions[itemName] = itemPos;
      setItemPositions(positions);
    }
  }

  return (
    <main
      className={`${MAX_SCREEN_SIZE} overflow-clip bg-radial from-[#ffad6f] to-[#bd5d44] grid grid-cols-1 grid-rows-1 place-items-center py-[10%] px-[20%]`}
    >
      <DragDropProvider
        onDragEnd={(event) => {
          /* Prevents items snapping back to their old position after drag */
          // Name of item being dragged
          if (!event.operation.source) {
            return;
          }
          const dragItem = getItemNameFromID(
            event.operation.source.id as string, // will remove this cast later
          );
          const newPosition: Pos = {
            x: itemPositions[dragItem].x + event.operation.transform.x,
            y: itemPositions[dragItem].y + event.operation.transform.y,
            z: 50,
          };
          setItemPosition(dragItem, newPosition);
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
            />
          );
        })}
      </DragDropProvider>
    </main>
  );
}
