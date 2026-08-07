"use client";
import { Feedback } from "@dnd-kit/dom";
import {
  DragDropProvider,
  type DragMoveEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import { animate } from "animejs";
import { type Ref, useRef, useState } from "react";
import { useStopwatch } from "react-timer-hook";
import { firstBy, values } from "remeda";
import useSound from "use-sound";
import IntroScreen from "~/components/IntroScreen";
import WinScreen from "~/components/WinScreen";
import {
  centerOfElement,
  clampToScreenPos,
  distBetweenElements,
  isOverlapping,
} from "~/utils/utils";
import drop from "/sfx/drop.m4a?url";
import grabSfx from "/sfx/grab.m4a?url";
import repel1 from "/sfx/repel1.m4a?url";
import {
  CheckLayers,
  type ItemData,
  LayerDirection,
  type Pos,
} from "../components/day1_types";
import {
  CORRECT_ORDER,
  CORRECT_POSITION,
  defaultItemPositions,
  defaultPos,
  ITEMS,
} from "./day1_data";

const REPEL_RADIUS = 175; // % gap under which a nearby idle item gets nudged
const REPEL_STRENGTH = 10; // nudge magnitude per % of overlap
const MAX_SCREEN_SIZE =
  "w-screen h-screen max-w-screen min-w-screen max-h-screen min-h-screen";

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

function DraggableItem({
  itemData,
  itemPos,
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
      onClick={enableFocus}
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

const ALL_ITEM_IDs = ITEMS.map((itemData) => `day1-${itemData.name}`);

function getIntersectingItems(itemID: string) {
  const allItems = ALL_ITEM_IDs.filter((item) => item !== itemID);
  const itemEl = document.getElementById(itemID);
  if (!itemEl) {
    return [];
  }

  const overlapping = allItems.filter((ID) => {
    const otherEl = document.getElementById(ID);
    if (!otherEl) {
      return false;
    }
    return isOverlapping(itemEl, otherEl);
  });

  return overlapping.map(getItemNameFromID);
}

export default function Level1() {
  const [itemPositions, setItemPositions] = useState(defaultItemPositions());
  const [itemWinState, setItemWinState] = useState(
    Object.fromEntries(ITEMS.map(({ name }) => [name, false])),
  );
  const [focusedItem, setFocusedItem] = useState("");
  const [isIntroStage, setIsIntroStage] = useState(true);
  const { hours, minutes, seconds, pause } = useStopwatch({ autoStart: true });
  const [playRepel, { stop: stopRepelSound }] = useSound(repel1);
  const [grabSound] = useSound(grabSfx);
  const [dropSound] = useSound(drop);

  function setItemPosition(itemName: string, itemPos: Pos) {
    const itemEl = document.getElementById(`day1-${itemName}`);
    if (!itemEl) return;
    setItemPositions((prev) => ({
      ...prev,
      [itemName]: clampToScreenPos(
        itemEl.offsetWidth,
        itemEl.offsetHeight,
        itemPos,
      ),
    }));
    setItemWinState((prev) => ({
      ...prev,
      [itemName]: isWinnablePosition(itemName, itemPos),
    }));
  }

  function grabAnimation(dragId: string) {
    animate(`#${dragId}-img`, {
      rotate: [1, 1.1, 1],
      duration: 400,
      ease: "inOutExpo",
    });
    animate(`#${dragId}-img`, {
      rotate: [-2, 2, -1.5, 0],
      duration: 400,
      ease: "inOutSine",
    });
    grabSound();
  }
  function getOverlappingItemsAboveOrBelow(
    itemName: string,
    checkLayers: CheckLayers,
  ) {
    const overlapping = getIntersectingItems(`day1-${itemName}`);
    switch (checkLayers) {
      case CheckLayers.ABOVE: {
        return overlapping.filter(
          (other) => itemPositions[other].z > itemPositions[itemName].z,
        );
      }
      case CheckLayers.BELOW: {
        return overlapping.filter(
          (other) => itemPositions[other].z < itemPositions[itemName].z,
        );
      }
      default: {
        return overlapping;
      }
    }
  }

  function getNearestObjectAboveOrBelow(
    itemName: string,
    checkLayers: CheckLayers,
  ) {
    const overlappingLayers = getOverlappingItemsAboveOrBelow(
      itemName,
      checkLayers,
    );

    if (overlappingLayers.length < 1) {
      return null;
    }

    switch (checkLayers) {
      case CheckLayers.ABOVE:
        return firstBy(overlappingLayers, [
          (other) => itemPositions[other].z,
          "asc",
        ]);
      case CheckLayers.BELOW:
        return firstBy(overlappingLayers, [
          (other) => itemPositions[other].z,
          "desc",
        ]);
      default:
        return null;
    }
  }

  function snapItem(item: string) {
    setItemPosition(item, getSnapPosition(item));
  }

  function repelObjectsWhileDragged(event: DragMoveEvent) {
    const { source, position } = event.operation;
    if (!source || !position || !event.operation) {
      return;
    }

    const dragEl = document.getElementById(source.id as string);
    if (!dragEl) {
      return;
    }
    const dragItem = getItemNameFromID(source.id as string);

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
        const push =
          (1 - dist / REPEL_RADIUS) *
          (item === "twobytwo" ? 0.05 : REPEL_STRENGTH);
        translateItem(item, {
          x: (dx / dist) * push,
          y: (dy / dist) * push,
          z: 0,
        });
      }
    }
  }

  function switchItemLayers(item1: string, item2: string) {
    const savedPositions = { ...itemPositions };
    const canSameLayer =
      (item1 === "waterbottle" || item1 === "umbrella") &&
      (item2 === "waterbottle" || item2 === "umbrella");
    const itemPos1 = {
      ...savedPositions[item1],
      z: savedPositions[item2].z,
    };
    const itemPos2 = {
      ...savedPositions[item2],
      z: canSameLayer ? savedPositions[item2].z : savedPositions[item1].z,
    };
    setItemPosition(item1, itemPos1);
    setItemPosition(item2, itemPos2);
    stopRepelSound();
    playRepel();
  }

  function getSnapPosition(item: string) {
    if (item in CORRECT_POSITION) {
      return {
        ...CORRECT_POSITION[item as keyof typeof CORRECT_POSITION],
        z: itemPositions[item].z,
      };
    }
    return { ...defaultPos, z: itemPositions[item].z };
  }

  function printTimer() {
    pause();
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

  function isItemInSnappableState(
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
    const swappableLayer =
      dir === LayerDirection.DOWN
        ? getNearestObjectAboveOrBelow(focusedItem, CheckLayers.BELOW)
        : getNearestObjectAboveOrBelow(focusedItem, CheckLayers.ABOVE);

    if (swappableLayer) {
      switchItemLayers(focusedItem, swappableLayer);
    }
  }

  function gameWon() {
    return values(itemWinState).every((x: boolean) => x);
  }

  return (
    <>
      {isIntroStage ? (
        <IntroScreen onStart={() => setIsIntroStage(false)} />
      ) : (
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
                  grabAnimation(dragId as string);
                }
              }}
              onDragMove={(event) => repelObjectsWhileDragged(event)}
              onDragEnd={({ operation }) => {
                /* Prevents items snapping back to their old position after drag */
                if (!operation.source) {
                  return;
                }
                // Name of item being dragged
                const dragItem = getItemNameFromID(
                  operation.source.id as string,
                );
                const newPosition: Pos = {
                  x: itemPositions[dragItem].x + operation.transform.x,
                  y: itemPositions[dragItem].y + operation.transform.y,
                  z: itemPositions[dragItem].z,
                };

                const dragEl = document.getElementById(
                  operation.source.id as string,
                );

                if (isItemInSnappableState(dragItem, newPosition, dragEl)) {
                  snapItem(dragItem);
                } else {
                  setItemPosition(dragItem, newPosition); // update current position
                }
                setFocusedItem((_prev) => dragItem);
                dropSound();
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
                        getSnapPosition(item.name),
                      );
                    }}
                  />
                );
              })}
            </DragDropProvider>
          </main>
          {gameWon() && <WinScreen time={printTimer()} />}
        </>
      )}
    </>
  );
}
