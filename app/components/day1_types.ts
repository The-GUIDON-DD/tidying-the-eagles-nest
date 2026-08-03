export interface Pos {
  x: number;
  y: number;
  z: number;
}

export interface ItemData {
  name: string;
  image: string;
  width: number | string;
  initialRotate?: string;
  initialPos: Pos;
  correctZ?: number;
}

export interface ItemState {
  [itemName: string]: Pos;
}
