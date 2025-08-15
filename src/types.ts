export interface ViewportSize {
  readonly width: number;
  readonly height: number;
}
export type ViewportSizeOrNull = ViewportSize | null;

export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PageLike {
  // Playwright returns `{ width, height } | null` (sync). We also accept a Promise for flexibility.
  viewportSize(): ViewportSizeOrNull | Promise<ViewportSizeOrNull>;
}

export interface LocatorLike {
  boundingBox(): Promise<BoundingBox | null>;
  page?(): PageLike | undefined;
  scrollIntoViewIfNeeded?(options?: { timeout?: number }): Promise<void>;
}

/** Physical directions (post-logical mapping). */
export type Direction = 'left' | 'right' | 'above' | 'below';

/** Reading-order sequences. */
export type Order = 'leftToRight' | 'rightToLeft' | 'topToBottom' | 'bottomToTop';

/** Number in [0,1]. Validated at runtime by helpers. */
export type Ratio01 = number;
/** Non-negative pixels. */
export type Pixels = number;

/**
 * Visibility options for `isInViewport()`.
 */
export function assertRatio01(v: number, label = 'ratio'): asserts v is Ratio01 {
  if (!(v >= 0 && v <= 1)) throw new Error(`${label} must be between 0 and 1. Received ${v}`);
}
/**
 * Checks if an element is in the viewport with optional visibility constraints.
 */
export function assertNonNegative(v: number, label = 'value'): asserts v is Pixels {
  if (v < 0) throw new Error(`${label} must be >= 0. Received ${v}`);
}
