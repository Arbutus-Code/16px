<script lang="ts">
  import {
    editorState,
    renderTick,
    setPixel,
    setPixelSilent,
    getPixel,
    floodFill,
    pushUndo,
    undo,
    redo,
  } from "./stores.svelte";
  import { hexToRgba, pixelToHexAlpha } from "./color";
  import { paintPixels } from "./render";

  interface Cell {
    x: number;
    y: number;
  }

  let canvasEl: HTMLCanvasElement;
  let isDrawing = false;
  let lastCell: Cell | null = null;

  const CANVAS_RENDER_SIZE = 512;

  function getCellFromEvent(e: PointerEvent): Cell | null {
    const rect = canvasEl.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * canvasEl.width;
    const py = ((e.clientY - rect.top) / rect.height) * canvasEl.height;
    const cellSize = canvasEl.width / editorState.gridSize;
    const x = Math.floor(px / cellSize);
    const y = Math.floor(py / cellSize);
    if (
      x >= 0 &&
      x < editorState.gridSize &&
      y >= 0 &&
      y < editorState.gridSize
    ) {
      return { x, y };
    }
    return null;
  }

  function getActiveColor(): string {
    if (editorState.tool === "eraser") return "transparent";
    return hexToRgba(editorState.currentColor, editorState.currentAlpha);
  }

  function applyTool(x: number, y: number) {
    const tool = editorState.tool;
    if (tool === "pen" || tool === "eraser") {
      setPixel(x, y, getActiveColor());
    } else if (tool === "fill") {
      floodFill(x, y, getActiveColor());
    } else if (tool === "eyedropper") {
      const picked = pixelToHexAlpha(getPixel(x, y));
      if (picked) {
        editorState.currentColor = picked.hex;
        editorState.currentAlpha = picked.alpha;
      }
      editorState.tool = "pen";
    }
  }

  /** Bresenham line so fast pointer strokes stay continuous. */
  function drawLine(from: Cell, to: Cell, color: string) {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const sx = from.x < to.x ? 1 : -1;
    const sy = from.y < to.y ? 1 : -1;
    let err = dx - dy;
    let cx = from.x;
    let cy = from.y;
    while (true) {
      setPixelSilent(cx, cy, color);
      if (cx === to.x && cy === to.y) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
    renderTick.value++;
  }

  function onPointerDown(e: PointerEvent) {
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (!cell) return;
    pushUndo();
    isDrawing = true;
    lastCell = cell;
    applyTool(cell.x, cell.y);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDrawing) return;
    const cell = getCellFromEvent(e);
    if (!cell || (lastCell && cell.x === lastCell.x && cell.y === lastCell.y))
      return;
    if (
      lastCell &&
      (editorState.tool === "pen" || editorState.tool === "eraser")
    ) {
      drawLine(lastCell, cell, getActiveColor());
    }
    lastCell = cell;
  }

  function onPointerUp() {
    isDrawing = false;
    lastCell = null;
  }

  function onKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const isInput =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;
    const isMeta = e.metaKey || e.ctrlKey;

    if (isMeta && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (isMeta && e.key === "z" && e.shiftKey) {
      e.preventDefault();
      redo();
    } else if (isMeta && e.key === "y") {
      e.preventDefault();
      redo();
    } else if (!isInput && !isMeta) {
      if (e.key === "b" || e.key === "p") {
        editorState.tool = "pen";
      } else if (e.key === "e") {
        editorState.tool = "eraser";
      } else if (e.key === "g") {
        editorState.tool = "fill";
      } else if (e.key === "i") {
        editorState.tool = "eyedropper";
      }
    }
  }

  function drawCheckerboard(
    ctx: CanvasRenderingContext2D,
    size: number,
    cellSize: number,
  ) {
    const checkSize = Math.max(2, cellSize / 4);
    for (let y = 0; y < size * cellSize; y += checkSize) {
      for (let x = 0; x < size * cellSize; x += checkSize) {
        const isLight = (x / checkSize + y / checkSize) % 2 === 0;
        ctx.fillStyle = isLight ? "#2a2a3e" : "#1a1a2e";
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }
  }

  function render() {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    const size = editorState.gridSize;
    canvasEl.width = CANVAS_RENDER_SIZE;
    canvasEl.height = CANVAS_RENDER_SIZE;
    const cellSize = CANVAS_RENDER_SIZE / size;

    ctx.clearRect(0, 0, CANVAS_RENDER_SIZE, CANVAS_RENDER_SIZE);
    drawCheckerboard(ctx, size, cellSize);
    paintPixels(ctx, editorState.pixels, cellSize, editorState.bgColor);

    if (editorState.showGrid && cellSize >= 4) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= size; i++) {
        const pos = Math.round(i * cellSize) + 0.5;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, CANVAS_RENDER_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(CANVAS_RENDER_SIZE, pos);
        ctx.stroke();
      }
    }
  }

  $effect(() => {
    renderTick.value;
    editorState.gridSize;
    editorState.bgColor;
    editorState.showGrid;
    render();
  });
</script>

<svelte:window
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
  onkeydown={onKeyDown}
/>

<canvas
  bind:this={canvasEl}
  class="border border-border cursor-crosshair select-none w-full max-w-[512px] h-auto aspect-square touch-none image-render-pixelated"
  onpointerdown={onPointerDown}
  tabindex="0"
  aria-label="Pixel art canvas - {editorState.gridSize}x{editorState.gridSize} grid"
></canvas>
