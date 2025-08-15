import { expect, test } from '@playwright/test';

import { isInViewport, visibleAreaRatio } from '../src/main';

test.use({ viewport: { width: 800, height: 600 } });

test.describe('viewport visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(`
      <style>
        html,body { margin:0; }
        #full { width:120px; height:80px; background:#555; }
        #hidden { width:80px; height:40px; display:none; }
        #half { position:absolute; top:20px; left:calc(100vw - 50px); width:100px; height:60px; background:#c33; }
      </style>
      <div id="full"></div>
      <div id="hidden"></div>
      <div id="half"></div>
    `);
  });

  test('fully visible element (fullyVisible=true)', async ({ page }) => {
    const full = page.locator('#full');
    await test.step('element is fully inside viewport', async () => {
      expect(await isInViewport(full, { fullyVisible: true })).toBe(true);
    });
  });

  test('partially visible element meets threshold', async ({ page }) => {
    const half = page.locator('#half');
    await test.step('visible area ratio is > 0.45', async () => {
      const ratio = await visibleAreaRatio(half);
      expect(ratio).toBeGreaterThan(0.45);
    });
    await test.step('threshold of 0.45 passes', async () => {
      expect(await isInViewport(half, { threshold: 0.45 })).toBe(true);
    });
  });

  test('hidden element returns false', async ({ page }) => {
    const hidden = page.locator('#hidden');
    expect(await isInViewport(hidden)).toBe(false);
  });

  test('padding safe-area shrinks effective viewport', async ({ page }) => {
    const full = page.locator('#full');
    expect(await isInViewport(full, { padding: 5000 })).toBe(false);
  });
});
