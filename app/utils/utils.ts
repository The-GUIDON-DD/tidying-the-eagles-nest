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

export function clampToScreenPos(width, height, pos: Pos) {
  // only 25% of height/width should be out of screen;
  return {
    x: clamp(pos.x, {
      min: -window.innerWidth - width / 4,
      max: window.innerWidth - width * 0.75,
    }),
    y: clamp(pos.y, {
      min: -window.innerHeight - height / 4,
      max: window.innerHeight - height * 0.75,
    }),
    z: pos.z,
  };
}

export function isOverlapping(el1: HTMLElement, el2: HTMLElement) {
  const rect1 = el1.getBoundingClientRect();
  const rect2 = el2.getBoundingClientRect();

  // AABB Collision Check
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}
