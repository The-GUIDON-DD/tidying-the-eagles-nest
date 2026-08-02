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

export function clampToScreenPos(el: HTMLElement | null, pos: Pos) {
  if (!el) {
    return pos;
  }
  // only 50% of height/width should be out of screen;
  return {
    x: clamp(pos.x, {
      min: -window.innerWidth / 2,
      max: window.innerWidth / 2,
    }),
    y: clamp(pos.y, {
      min: -window.innerHeight / 2,
      max: window.innerHeight / 2,
    }),
    z: pos.z,
  };
}
