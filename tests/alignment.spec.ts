import { expect, test } from '@playwright/test';

import { areAligned, inOrder } from '../src/main';

test.use({ viewport: { width: 800, height: 600 } });

test.describe('alignment & sequence order', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(`
      <style>
        html,body { margin:0; }
        .row { display:flex; gap:2px; padding:2px; align-items:flex-start; }
        .row > div { width:60px; height:30px; background:#888; }
        #A { height:30px; }
        #B { height:31px; } /* slight mismatch to test tolerance */
        #C { height:30px; }
        .grid { display:flex; gap:4px; padding:4px; }
        .grid > div { width:20px; height:20px; background:#aaa; }
      </style>
      <div class="row"><div id="A"></div><div id="B"></div><div id="C"></div></div>
      <div class="grid"><div id="g1"></div><div id="g2"></div><div id="g3"></div><div id="g4"></div></div>
    `);
  });

  test('aligned by edges and by centers (tolerance applied)', async ({ page }) => {
    const A = page.locator('#A'),
      B = page.locator('#B');
    expect(await areAligned(A, B, { axis: 'x', mode: 'edges', tolerance: 2 })).toBe(true);
    expect(await areAligned(A, B, { axis: 'x', mode: 'centers', tolerance: 2 })).toBe(true);
  });

  test('inOrder leftToRight for a sequence', async ({ page }) => {
    const g1 = page.locator('#g1'),
      g2 = page.locator('#g2'),
      g3 = page.locator('#g3'),
      g4 = page.locator('#g4');
    expect(await inOrder([g1, g2, g3, g4], 'leftToRight', 1)).toBe(true);
    expect(await inOrder([g4, g3, g2, g1], 'leftToRight', 1)).toBe(false);
  });
});
