import { expect, test } from '@playwright/test';

import { relativePosition } from '../src/main';

test.use({ viewport: { width: 800, height: 600 } });

test.describe('logical directions (start/end) mapping', () => {
  test('LTR vs RTL mapping for logical "start"', async ({ page }) => {
    await page.setContent(`
      <style>
        html,body { margin:0; }
        #L { position:absolute; left:20px; top:40px; width:50px; height:30px; background:#333; }
        #R { position:absolute; left:120px; top:40px; width:50px; height:30px; background:#999; }
      </style>
      <div id="L"></div><div id="R"></div>
    `);
    const L = page.locator('#L'),
      R = page.locator('#R');

    // In LTR: logical "start" => physical "left"
    expect(
      await relativePosition(L, R, 'left', { logical: 'start', writingDirection: 'ltr' }),
    ).toBe(true);

    // In RTL: logical "start" => physical "right"
    expect(
      await relativePosition(L, R, 'left', { logical: 'start', writingDirection: 'rtl' }),
    ).toBe(false);
  });
});
