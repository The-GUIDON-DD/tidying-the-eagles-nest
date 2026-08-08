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

export function areaOfRect(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return rect.width * rect.height;
}

export function relativeAreaOfRect(el: HTMLElement) {
  const area = areaOfRect(el);
  const windowArea = window.innerHeight * window.innerWidth;
  return area / windowArea;
}

export function vhToPx(vh: string) {
  const percent = parseInt(vh.split("vh")[0], 10) * 0.01;
  return Math.ceil(percent * window.innerHeight);
}

export function vwToPx(vw: string) {
  const percent = parseInt(vw.split("vh")[0], 10) * 0.01;
  return Math.ceil(percent * window.innerWidth);
}

export function clampToScreenPos(width: number, height: number, pos: Pos) {
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

  return !(
    rect1.left > rect2.left + rect2.width ||
    rect1.left + rect1.width < rect2.left ||
    rect1.top > rect2.top + rect2.height ||
    rect1.top + rect1.height < rect2.top
  );
}
