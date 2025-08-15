import type { BoundingBox } from './types';

/**
 * Calculates the area of a bounding box.
 *
 * Returns 0 if width or height is negative.
 *
 * @param b - The bounding box with x, y, width, and height.
 * @returns The area (width × height), or 0 if width/height is negative.
 */
export function area(b: BoundingBox): number {
  return Math.max(0, b.width) * Math.max(0, b.height);
}

/**
 * Returns the x-coordinate of the right edge of a bounding box.
 *
 * @param b - The bounding box.
 * @returns The right edge (x + width).
 */
export function right(b: BoundingBox): number {
  return b.x + b.width;
}

/**
 * Returns the y-coordinate of the bottom edge of a bounding box.
 *
 * @param b - The bounding box.
 * @returns The bottom edge (y + height).
 */
export function bottom(b: BoundingBox): number {
  return b.y + b.height;
}

/**
 * Clamps a bounding box to the visible area of a viewport.
 *
 * Returns a new bounding box representing the intersection of the input box and the viewport.
 *
 * @param viewW - The viewport width.
 * @param viewH - The viewport height.
 * @param b - The bounding box to clamp.
 * @returns The clamped bounding box.
 */
export function clampVisible(viewW: number, viewH: number, b: BoundingBox): BoundingBox {
  const x1 = Math.max(0, b.x);
  const y1 = Math.max(0, b.y);
  const x2 = Math.min(right(b), Math.max(0, viewW));
  const y2 = Math.min(bottom(b), Math.max(0, viewH));
  return { x: x1, y: y1, width: Math.max(0, x2 - x1), height: Math.max(0, y2 - y1) };
}

/**
 * Calculates the length of overlap between two 1D intervals.
 *
 * @param a1 - Start of interval A.
 * @param a2 - End of interval A.
 * @param b1 - Start of interval B.
 * @param b2 - End of interval B.
 * @returns The length of overlap (0 if no overlap).
 */
export function overlapLen(a1: number, a2: number, b1: number, b2: number): number {
  return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
}

/**
 * Calculates the overlap ratio between two 1D intervals.
 *
 * Ratio is overlap length divided by the smaller interval length.
 *
 * @param a1 - Start of interval A.
 * @param a2 - End of interval A.
 * @param b1 - Start of interval B.
 * @param b2 - End of interval B.
 * @returns The overlap ratio (0 if no overlap).
 */
export function overlapRatio1D(a1: number, a2: number, b1: number, b2: number): number {
  const ov = overlapLen(a1, a2, b1, b2);
  const len = Math.min(a2 - a1, b2 - b1);
  return len > 0 ? ov / len : 0;
}

/**
 * Returns the intersection bounding box of two bounding boxes.
 *
 * The intersection is the overlapping area of both boxes.
 *
 * @param a - First bounding box.
 * @param b - Second bounding box.
 * @returns The intersection bounding box (width/height 0 if no overlap).
 */
export function intersect(a: BoundingBox, b: BoundingBox): BoundingBox {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(right(a), right(b));
  const y2 = Math.min(bottom(a), bottom(b));
  return { x: x1, y: y1, width: Math.max(0, x2 - x1), height: Math.max(0, y2 - y1) };
}
