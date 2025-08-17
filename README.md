# playwright_is_located

Layout & viewport assertions for Playwright powered by `locator.boundingBox()`.

## Features

- Assert element visibility in the viewport (fully or partially)
- Check relative positioning (left, right, above, below) between elements
- Assert alignment (edges or centers) on x/y axes
- Compute visible area ratio and intersection area
- Works with Playwright's `Locator` API

## Install

```bash
npm i -D playwright_is_located @playwright/test
```

## Usage

Import the assertions in your Playwright test files:

```ts
import {
  isInViewport,
  relativePosition,
  areAligned,
  visibleAreaRatio,
  intersectionAreaRatio,
  inOrder,
  edgeDistance,
} from 'playwright_is_located';
```

### 1. Assert element is in the viewport

```ts
await expect(await isInViewport(locator)).toBe(true);

// With options:
await expect(await isInViewport(locator, { fullyVisible: true, padding: 8 })).toBe(true);
await expect(await isInViewport(locator, { threshold: 0.5 })).toBe(true); // at least 50% visible
```

### 2. Check relative position

```ts
// Is A to the left of B?
await expect(await relativePosition(firstLocator, secondLocator, 'left')).toBe(true);

// Is A below B with at least 10px gap and 80% horizontal overlap?
await expect(
  await relativePosition(firstLocator, secondLocator, 'below', { gap: 10, overlapRatio: 0.8 }),
).toBe(true);
```

### 3. Assert alignment

```ts
// Are A and B top/bottom edges aligned (x axis)?
await expect(
  await areAligned(firstLocator, secondLocator, { axis: 'x', mode: 'edges', tolerance: 2 }),
).toBe(true);

// Are A and B horizontally centered?
await expect(await areAligned(firstLocator, secondLocator, { axis: 'y', mode: 'centers' })).toBe(
  true,
);
```

### 4. Visible area ratio

```ts
const ratio = await visibleAreaRatio(locator);
expect(ratio).toBeGreaterThan(0.5); // at least 50% visible
```

### 5. Intersection area ratio

```ts
const overlap = await intersectionAreaRatio(firstLocator, secondLocator);
expect(overlap).toBeLessThan(0.2); // less than 20% of A is overlapped by B
```

### 6. Reading order

```ts
// Are locators in left-to-right order?
await expect(await inOrder([a, b, c], 'leftToRight')).toBe(true);
```

### 7. Edge distance

```ts
// Distance in px from right edge of A to left edge of B
const dist = await edgeDistance(firstLocator, secondLocator, 'left');
expect(dist).toBeGreaterThanOrEqual(0);
```

## API

See TypeScript types for all options and return values.

- `isInViewport(locator, options?)`
- `relativePosition(firstLocator, secondLocator, direction, options?)`
- `areAligned(firstLocator, secondLocator, options)`
- `visibleAreaRatio(locator)`
- `intersectionAreaRatio(firstLocator, secondLocator)`
- `inOrder(locators, order, tolerance?)`
- `edgeDistance(firstLocator, secondLocator, direction)`

## License

MIT
