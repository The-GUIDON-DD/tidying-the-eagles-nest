import type { ItemData, ItemState, Pos } from "~/components/day1_types";
import { vhToPx, vwToPx } from "../utils/utils";

export const CORRECT_ORDER = {
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

export const CORRECT_POSITION = {
  twobytwo: { x: vwToPx("8vw"), y: vhToPx("-7vh") },
  umbrella: { x: 0, y: vwToPx("5vw") },
  waterbottle: { x: 0, y: vwToPx("-5vw") },
};

export const ITEMS: ItemData[] = [
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

export function defaultItemPositions() {
  const itemPositions: ItemState = {};
  for (const itemData of ITEMS) {
    itemPositions[itemData.name] = itemData.initialPos;
  }
  return itemPositions;
}

export const defaultPos: Pos = { x: 0, y: 0, z: 0 };
