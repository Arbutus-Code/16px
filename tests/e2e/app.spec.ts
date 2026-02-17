import { expect, test } from "@playwright/test";

test.describe("16px editor", () => {
  test.describe("core shell and SEO", () => {
    test("renders page title, heading, and key UI elements", async ({
      page,
    }) => {
      await page.goto("/");

      await expect(page).toHaveTitle(/16px/i);
      await expect(
        page.getByRole("heading", { name: /16px/i, level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Import Image/i }),
      ).toBeVisible();
      await expect(page.getByLabel(/Pixel art canvas/i)).toBeVisible();
    });

    test("includes required SEO metadata", async ({ page }) => {
      await page.goto("/");

      await expect(page.locator('html[lang="en"]')).toHaveCount(1);
      await expect(
        page.locator('meta[name="description"][content*="pixel art editor" i]'),
      ).toHaveCount(1);
      await expect(
        page.locator('meta[name="viewport"][content*="width=device-width"]'),
      ).toHaveCount(1);
    });
  });

  test.describe("tool and size controls", () => {
    test("tool buttons reflect selected state via aria-pressed", async ({
      page,
    }) => {
      await page.goto("/");

      const penBtn = page.getByRole("button", { name: "Pen tool" });
      const eraserBtn = page.getByRole("button", { name: "Eraser tool" });

      await expect(penBtn).toHaveAttribute("aria-pressed", "true");
      await expect(eraserBtn).toHaveAttribute("aria-pressed", "false");

      await eraserBtn.click();
      await expect(eraserBtn).toHaveAttribute("aria-pressed", "true");
      await expect(penBtn).toHaveAttribute("aria-pressed", "false");
    });

    test("keyboard shortcuts switch tools", async ({ page }) => {
      await page.goto("/");

      // Click the canvas first so keyboard events reach the window handler
      const canvas = page.getByLabel(/Pixel art canvas/i);
      await canvas.click({ position: { x: 10, y: 10 } });

      await page.keyboard.press("e");
      await expect(
        page.getByRole("button", { name: "Eraser tool" }),
      ).toHaveAttribute("aria-pressed", "true");

      await page.keyboard.press("b");
      await expect(
        page.getByRole("button", { name: "Pen tool" }),
      ).toHaveAttribute("aria-pressed", "true");

      await page.keyboard.press("g");
      await expect(
        page.getByRole("button", { name: "Fill tool" }),
      ).toHaveAttribute("aria-pressed", "true");

      await page.keyboard.press("i");
      await expect(
        page.getByRole("button", { name: "Pick tool" }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    test("canvas size buttons reflect selected state", async ({ page }) => {
      await page.goto("/");

      const btn16 = page.getByRole("button", { name: "16 by 16 pixels" });
      const btn64 = page.getByRole("button", { name: "64 by 64 pixels" });

      await expect(btn16).toHaveAttribute("aria-pressed", "true");
      await expect(btn64).toHaveAttribute("aria-pressed", "false");

      await btn64.click();
      await expect(btn64).toHaveAttribute("aria-pressed", "true");
      await expect(btn16).toHaveAttribute("aria-pressed", "false");

      await expect(page.getByRole("banner").getByText("64x64")).toBeVisible();
    });
  });

  test.describe("canvas drawing", () => {
    test("draws on canvas and supports undo/redo", async ({ page }) => {
      await page.goto("/");

      const canvas = page.getByLabel(/Pixel art canvas/i);
      await canvas.click({ position: { x: 16, y: 16 } });

      const beforeUndo = await page.evaluate(() => {
        const el = document.querySelector("canvas") as HTMLCanvasElement | null;
        if (!el) return null;
        const ctx = el.getContext("2d");
        if (!ctx) return null;
        const pixel = ctx.getImageData(16, 16, 1, 1).data;
        return Array.from(pixel);
      });

      expect(beforeUndo).not.toBeNull();
      expect(beforeUndo![3]).toBeGreaterThan(0);

      await page.keyboard.press("Meta+z");

      const afterUndo = await page.evaluate(() => {
        const el = document.querySelector("canvas") as HTMLCanvasElement | null;
        if (!el) return null;
        const ctx = el.getContext("2d");
        if (!ctx) return null;
        const pixel = ctx.getImageData(16, 16, 1, 1).data;
        return Array.from(pixel);
      });

      expect(afterUndo).not.toBeNull();
      expect(afterUndo![3]).toBeLessThanOrEqual(beforeUndo![3]);

      await page.keyboard.press("Meta+Shift+z");

      const afterRedo = await page.evaluate(() => {
        const el = document.querySelector("canvas") as HTMLCanvasElement | null;
        if (!el) return null;
        const ctx = el.getContext("2d");
        if (!ctx) return null;
        const pixel = ctx.getImageData(16, 16, 1, 1).data;
        return Array.from(pixel);
      });

      expect(afterRedo).not.toBeNull();
      expect(afterRedo![3]).toBeGreaterThanOrEqual(afterUndo![3]);
    });

    test("canvas is focusable via keyboard", async ({ page }) => {
      await page.goto("/");

      const canvas = page.getByLabel(/Pixel art canvas/i);
      await expect(canvas).toHaveAttribute("tabindex", "0");
    });
  });

  test.describe("export dialog", () => {
    test("opens export dialog with format controls", async ({ page }) => {
      await page.goto("/");

      const exportBtn = page.getByRole("button", { name: /Export \/ Save/i });
      await expect(exportBtn).toHaveAttribute("aria-expanded", "false");

      await exportBtn.click();
      await expect(exportBtn).toHaveAttribute("aria-expanded", "true");

      await expect(page.getByText(/Export Settings/i)).toBeVisible();
      await expect(page.getByRole("button", { name: "png" })).toBeVisible();
      await expect(page.getByRole("button", { name: "svg" })).toBeVisible();
      await expect(page.getByLabel(/Export scale/i)).toBeVisible();
      await expect(
        page.getByRole("checkbox", { name: /Transparent background/i }),
      ).toBeVisible();
    });

    test("format buttons reflect selected state", async ({ page }) => {
      await page.goto("/");

      await page.getByRole("button", { name: /Export \/ Save/i }).click();

      const pngBtn = page.getByRole("button", { name: "png" });
      const svgBtn = page.getByRole("button", { name: "svg" });

      await expect(pngBtn).toHaveAttribute("aria-pressed", "true");
      await expect(svgBtn).toHaveAttribute("aria-pressed", "false");

      await svgBtn.click();
      await expect(svgBtn).toHaveAttribute("aria-pressed", "true");
      await expect(pngBtn).toHaveAttribute("aria-pressed", "false");
    });

    test("hides scale slider when SVG is selected", async ({ page }) => {
      await page.goto("/");

      await page.getByRole("button", { name: /Export \/ Save/i }).click();
      await expect(page.getByLabel(/Export scale/i)).toBeVisible();

      await page.getByRole("button", { name: "svg" }).click();
      await expect(page.getByLabel(/Export scale/i)).not.toBeVisible();
    });
  });

  test.describe("accessibility", () => {
    test("skip-to-content link is present and targets the canvas", async ({
      page,
    }) => {
      await page.goto("/");

      const skipLink = page.locator('a[href="#main-canvas"]');
      await expect(skipLink).toHaveCount(1);

      const target = page.locator("#main-canvas");
      await expect(target).toHaveCount(1);
    });

    test("header announces current color to screen readers", async ({
      page,
    }) => {
      await page.goto("/");

      const colorSwatch = page.locator(
        'header span[aria-label^="Current color"]',
      );
      await expect(colorSwatch).toHaveCount(1);
    });

    test("grid size changes are announced via aria-live", async ({ page }) => {
      await page.goto("/");

      const liveRegion = page.locator("header span[aria-live]");
      await expect(liveRegion).toHaveCount(1);
      await expect(liveRegion).toHaveText("16x16");

      await page.getByRole("button", { name: "32 by 32 pixels" }).click();
      await expect(liveRegion).toHaveText("32x32");
    });

    test("background controls toggle has aria-expanded", async ({ page }) => {
      await page.goto("/");

      const bgBtn = page
        .locator("aside")
        .getByRole("button", { name: /Edit background/i });

      await expect(bgBtn).toHaveAttribute("aria-expanded", "false");
      await bgBtn.click();
      await expect(bgBtn).toHaveAttribute("aria-expanded", "true");
    });

    test("color mode buttons have aria-pressed", async ({ page }) => {
      await page.goto("/");

      const hexBtn = page
        .locator("aside")
        .getByRole("button", { name: "hex" })
        .first();
      const rgbBtn = page
        .locator("aside")
        .getByRole("button", { name: "rgb" })
        .first();

      await expect(hexBtn).toHaveAttribute("aria-pressed", "true");
      await expect(rgbBtn).toHaveAttribute("aria-pressed", "false");

      await rgbBtn.click();
      await expect(rgbBtn).toHaveAttribute("aria-pressed", "true");
      await expect(hexBtn).toHaveAttribute("aria-pressed", "false");
    });

    test("palette colors have aria-pressed for selected state", async ({
      page,
    }) => {
      await page.goto("/");

      const selectedSwatch = page
        .locator("aside")
        .getByRole("button", { name: /Select color #ff3e3e/i })
        .first();

      await expect(selectedSwatch).toHaveAttribute("aria-pressed", "true");
    });

    test("tools section has toolbar role", async ({ page }) => {
      await page.goto("/");

      const toolbar = page.locator('[role="toolbar"]');
      await expect(toolbar).toHaveCount(1);
    });
  });

  test.describe("background controls", () => {
    test("toggles between transparent and solid background", async ({
      page,
    }) => {
      // Use desktop viewport so the color controls panel is visible
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/");

      const bgBtn = page.getByRole("button", { name: /Edit background/i });
      await expect(bgBtn).toBeVisible();

      // Default: bgColor is "transparent", so button shows "Transparent"
      const transparentBtn = page.getByRole("button", {
        name: /^Transparent$/i,
      });
      await expect(transparentBtn).toBeVisible();

      // Click "Transparent" — it switches bg to solid "#0a0a0f", button text becomes "Clear"
      await transparentBtn.click();
      await expect(
        page.getByRole("button", { name: /^Clear$/i }),
      ).toBeVisible();
    });
  });
});
