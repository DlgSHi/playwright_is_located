import { area, bottom, clampVisible, intersect, overlapRatio1D, right } from './geometry';
import type {
  BoundingBox,
  Direction,
  LocatorLike,
  Order,
  PageLike,
  Pixels,
  Ratio01,
} from './types';
import { assertNonNegative, assertRatio01 } from './types';

const ge = (a: number, b: number, tol = 0): boolean => a + tol >= b;
const le = (a: number, b: number, tol = 0): boolean => a <= b + tol;
const within = (v: number, t: number, tol = 0): boolean => Math.abs(v - t) <= tol;

/** Options for viewport checks. */
export interface IsInViewportOptions {
  /** Require element fully inside viewport (ignores `threshold`). Default: false. */
  readonly fullyVisible?: boolean;
  /** Minimum visible area fraction [0..1]. Default: 0. */
  readonly threshold?: Ratio01;
  /** Safe padding (px) inset from viewport to treat as usable area. Default: 0. */
  readonly padding?: Pixels;
  /** Auto scroll before measuring (if supported). Default: false. */
  readonly scrollIntoView?: boolean;
}

/** Options for relative positioning. */
export interface RelativeOptions {
  /** Required overlap on orthogonal axis [0..1]. Default: 0. */
  readonly overlapRatio?: Ratio01;
  /** Minimum gap (px) along the primary axis. Default: 0. */
  readonly gap?: Pixels;
  /** Pixel tolerance for comparisons. Default: 0. */
  readonly tolerance?: Pixels;
  /** Logical start/end mapping for bidi. */
  readonly logical?: 'start' | 'end';
  /** Writing direction used for logical mapping. Default: 'ltr'. */
  readonly writingDirection?: 'ltr' | 'rtl';
}

/** Options for alignment checks. */
export interface AlignOptions {
  /** Axis to align: 'x' compares top/bottom; 'y' compares left/right. */
  readonly axis: 'x' | 'y';
  /** Compare edges or centers. */
  readonly mode: 'edges' | 'centers';
  /** Pixel tolerance for equality. Default: 1. */
  readonly tolerance?: Pixels;
}

/** @internal map logical direction to physical */
function mapLogical(direction: Direction, opts?: RelativeOptions): Direction {
  if (!opts?.logical) return direction;
  const writing = opts.writingDirection ?? 'ltr';

  switch (direction) {
    case 'left':
    case 'right': {
      switch (opts.logical) {
        case 'start':
          return writing === 'rtl' ? 'right' : 'left';
        case 'end':
          return writing === 'rtl' ? 'left' : 'right';
        default:
          return direction;
      }
    }
    case 'above':
    case 'below':
    default:
      return direction;
  }
}

/**
 * Check if a locator is in the viewport.
 *
 * Uses Playwright's `locator.boundingBox()` and `page().viewportSize()` only.
 *
 * @param locator Locator-like object (Playwright Locator at runtime).
 * @param options Visibility rules and behavior.
 * @returns True if the element fulfills the visibility constraints.
 */
export async function isInViewport(
  locator: LocatorLike,
  options: IsInViewportOptions = {},
): Promise<boolean> {
  const {
    fullyVisible = false,
    threshold = 0 as Ratio01,
    padding = 0 as Pixels,
    scrollIntoView = false,
  } = options;

  if (scrollIntoView && locator.scrollIntoViewIfNeeded) {
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 5000 });
    } catch {
      return false;
    }
  }

  const box = await locator.boundingBox();
  if (!box || area(box) <= 0) return false;

  const page: PageLike | undefined = locator.page?.();
  const viewport = page ? await Promise.resolve(page.viewportSize()) : null;
  if (!viewport) return false;

  assertNonNegative(padding, 'padding');
  if (!fullyVisible) assertRatio01(threshold, 'threshold');

  const vpW = viewport.width - padding * 2;
  const vpH = viewport.height - padding * 2;
  if (vpW <= 0 || vpH <= 0) return false;
  const shifted: BoundingBox = {
    x: box.x - padding,
    y: box.y - padding,
    width: box.width,
    height: box.height,
  };
  const visible = clampVisible(vpW, vpH, shifted);

  if (fullyVisible) {
    return (
      box.x >= padding &&
      box.y >= padding &&
      right(box) <= viewport.width - padding &&
      bottom(box) <= viewport.height - padding
    );
  }

  const ratio = area(visible) / area(box);
  return ratio >= threshold;
}

/**
 * Visible area fraction (0..1) of the element in the viewport.
 */
export async function visibleAreaRatio(locator: LocatorLike): Promise<Ratio01> {
  const box = await locator.boundingBox();
  const page = locator.page?.();
  const viewport = page ? await Promise.resolve(page.viewportSize()) : null;
  if (!box || !viewport || area(box) === 0) return 0 as Ratio01;
  const vis = clampVisible(viewport.width, viewport.height, box);
  return Math.min(1, Math.max(0, area(vis) / area(box))) as Ratio01;
}

/**
 * Check relative position of two locators.
 *
 * @param firstElement First (subject) locator.
 * @param secondElement Second (reference) locator.
 * @param direction 'left'|'right'|'above'|'below'
 * @param options gap / overlap / tolerance / logical mapping
 * @returns True if relation holds.
 */
export async function relativePosition(
  firstElement: LocatorLike,
  secondElement: LocatorLike,
  direction: Direction,
  options: RelativeOptions = {},
): Promise<boolean> {
  const tol = options.tolerance ?? 0;
  if (options.gap !== undefined) assertNonNegative(options.gap, 'gap');
  if (options.overlapRatio !== undefined) assertRatio01(options.overlapRatio, 'overlapRatio');

  const [A, B] = await Promise.all([firstElement.boundingBox(), secondElement.boundingBox()]);
  if (!A || !B) return false;

  const gap = options.gap ?? 0;
  const needOv = options.overlapRatio ?? 0;
  const dir = mapLogical(direction, options);

  switch (dir) {
    case 'left': {
      const ordering = le(right(A), B.x - gap, tol);
      const vOv = overlapRatio1D(A.y, bottom(A), B.y, bottom(B));
      return ordering && vOv + tol >= needOv;
    }
    case 'right': {
      const ordering = ge(A.x, right(B) + gap, -tol);
      const vOv = overlapRatio1D(A.y, bottom(A), B.y, bottom(B));
      return ordering && vOv + tol >= needOv;
    }
    case 'above': {
      const ordering = le(bottom(A), B.y - gap, tol);
      const hOv = overlapRatio1D(A.x, right(A), B.x, right(B));
      return ordering && hOv + tol >= needOv;
    }
    case 'below': {
      const ordering = ge(A.y, bottom(B) + gap, -tol);
      const hOv = overlapRatio1D(A.x, right(A), B.x, right(B));
      return ordering && hOv + tol >= needOv;
    }
    default:
      return false;
  }
}

/**
 * True if boxes are aligned by edges or centers on a given axis.
 */
export async function areAligned(
  firstElement: LocatorLike,
  secondElement: LocatorLike,
  options: AlignOptions,
): Promise<boolean> {
  const { axis, mode, tolerance = 1 } = options;
  const [A, B] = await Promise.all([firstElement.boundingBox(), secondElement.boundingBox()]);
  if (!A || !B) return false;

  switch (axis) {
    case 'x':
      return mode === 'edges'
        ? within(A.y, B.y, tolerance) && within(bottom(A), bottom(B), tolerance)
        : within(A.y + A.height / 2, B.y + B.height / 2, tolerance);
    case 'y':
      return mode === 'edges'
        ? within(A.x, B.x, tolerance) && within(right(A), right(B), tolerance)
        : within(A.x + A.width / 2, B.x + B.width / 2, tolerance);
    default:
      return false;
  }
}

/**
 * Signed edge distance (px) from A to B in given direction.
 * Negative means overlap or inverted ordering. Null if boxes missing.
 */
export async function edgeDistance(
  firstElement: LocatorLike,
  secondElement: LocatorLike,
  direction: Direction,
): Promise<number | null> {
  const [A, B] = await Promise.all([firstElement.boundingBox(), secondElement.boundingBox()]);
  if (!A || !B) return null;

  switch (direction) {
    case 'left':
      return B.x - right(A);
    case 'right':
      return A.x - right(B);
    case 'above':
      return B.y - bottom(A);
    case 'below':
      return A.y - bottom(B);
    default:
      return null;
  }
}

/**
 * True if locators appear in the given reading order within tolerance.
 */
export async function inOrder(
  locators: readonly LocatorLike[],
  order: Order,
  tolerance: Pixels = 0,
): Promise<boolean> {
  const boxes = await Promise.all(locators.map((l) => l.boundingBox()));
  if (boxes.some((b): b is null => b === null)) return false;
  const b = boxes as BoundingBox[];

  switch (order) {
    case 'leftToRight':
      for (let i = 1; i < b.length; i++)
        if (!le(right(b[i - 1] as BoundingBox), (b[i] as BoundingBox).x, tolerance)) return false;
      return true;
    case 'rightToLeft':
      for (let i = 1; i < b.length; i++)
        if (!ge((b[i - 1] as BoundingBox).x, right(b[i] as BoundingBox), -tolerance)) return false;
      return true;
    case 'topToBottom':
      for (let i = 1; i < b.length; i++)
        if (!le(bottom(b[i - 1] as BoundingBox), (b[i] as BoundingBox).y, tolerance)) return false;
      return true;
    case 'bottomToTop':
      for (let i = 1; i < b.length; i++)
        if (!ge((b[i - 1] as BoundingBox).y, bottom(b[i] as BoundingBox), -tolerance)) return false;
      return true;
    default:
      return false;
  }
}

/**
 * Overlap area (A∩B) divided by area(A). 0..1.
 */
export async function intersectionAreaRatio(
  firstElement: LocatorLike,
  secondElement: LocatorLike,
): Promise<Ratio01> {
  const [A, B] = await Promise.all([firstElement.boundingBox(), secondElement.boundingBox()]);
  if (!A || !B || area(A) === 0) return 0 as Ratio01;
  return Math.min(1, Math.max(0, area(intersect(A, B)) / area(A))) as Ratio01;
}
