import { expect, test } from '@playwright/test';

import { edgeDistance, intersectionAreaRatio, relativePosition } from '../src/main';

test.use({ viewport: { width: 800, height: 600 } });

test.describe('relative positions & distances', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(`
      <style>
        html,body { margin:0; }
        .row { position:relative; padding:20px; }
        #A, #B, #C { width:80px; height:50px; background:#777; display:inline-block; }
        #B { margin-left:30px; }
        #stack { position:relative; margin:20px; }
        #top { width:80px; height:40px; background:#0af; }
        #bottom { width:80px; height:40px; background:#0a0; margin-top:30px; }
        #ov1 { position:absolute; left:20px; top:220px; width:80px; height:80px; background:#555; }
        #ov2 { position:absolute; left:60px; top:250px; width:80px; height:80px; background:#444; }
      </style>
      <div class="row"><div id="A"></div><div id="B"></div><div id="C"></div></div>
      <div id="stack"><div id="top"></div><div id="bottom"></div></div>
      <div id="ov1"></div><div id="ov2"></div>
    `);
  });

  test('A is left of B with min gap and vertical overlap', async ({ page }) => {
    const A = page.locator('#A'),
      B = page.locator('#B');
    expect(await relativePosition(A, B, 'left', { gap: 10, overlapRatio: 0.9, tolerance: 1 })).toBe(
      true,
    );
  });

  test('B is not left of A (ordering fails)', async ({ page }) => {
    const A = page.locator('#A'),
      B = page.locator('#B');
    expect(await relativePosition(B, A, 'left')).toBe(false);
  });

  test('above/below with overlap requirement', async ({ page }) => {
    const T = page.locator('#top'),
      Bt = page.locator('#bottom');
    expect(await relativePosition(T, Bt, 'above', { overlapRatio: 1 })).toBe(true);
    expect(await relativePosition(Bt, T, 'below', { overlapRatio: 1 })).toBe(true);
  });

  test('edgeDistance sign & magnitude', async ({ page }) => {
    const A = page.locator('#A'),
      B = page.locator('#B');
    const dAB = await edgeDistance(A, B, 'left'); // > 0: right(A) -> left(B)
    const dBA = await edgeDistance(B, A, 'left'); // < 0: since B is right of A
    expect(dAB).toBeGreaterThan(0);
    expect(dBA as number).toBeLessThan(0);
  });

  test('intersection area ratio > 0 for overlapping squares', async ({ page }) => {
    const o1 = page.locator('#ov1'),
      o2 = page.locator('#ov2');
    const r = await intersectionAreaRatio(o1, o2);
    expect(r).toBeGreaterThan(0);
  });
});
