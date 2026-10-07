/**
 * Paints the pixel grid onto a 2D context at the given scale.
 * Shared by the editor canvas, live preview strip, and image export.
 *
 * @param background - Optional color painted beneath the pixels
 *   ("transparent" is treated as no background)
 */
export function paintPixels(
  ctx: CanvasRenderingContext2D,
  pixels: string[][],
  scale: number,
  background?: string,
) {
  const size = pixels.length;
  if (background && background !== "transparent") {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size * scale, size * scale);
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = pixels[y][x];
      if (color === "transparent") continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}
