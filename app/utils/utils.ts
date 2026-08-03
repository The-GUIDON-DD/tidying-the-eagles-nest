import { clamp } from "remeda";
import type { Pos } from "~/components/day1_types";

export function centerOfElement(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    z: 0,
  };
}

export function distBetweenElements(el1: HTMLElement, el2: HTMLElement) {
  const { x: x1, y: y1 } = centerOfElement(el1);
  const { x: x2, y: y2 } = centerOfElement(el2);
  return Math.hypot(x1 - x2, y1 - y2);
}

export function vhToPx(vh: string) {
  const percent = parseInt(vh.split("vh")[0], 10) * 0.01;
  return Math.ceil(percent * window.innerHeight);
}

export function vwToPx(vw: string) {
  const percent = parseInt(vw.split("vh")[0], 10) * 0.01;
  return Math.ceil(percent * window.innerWidth);
}

export function clampToScreenPos(pos: Pos) {
  // only 25% of height/width should be out of screen;
  return {
    x: clamp(pos.x, {
      min: -window.innerWidth / 4,
      max: window.innerWidth / 4,
    }),
    y: clamp(pos.y, {
      min: -window.innerHeight / 4,
      max: window.innerHeight / 4,
    }),
    z: pos.z,
  };
}
