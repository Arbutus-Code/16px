<script lang="ts">
  import {
    editorState,
    renderTick,
    setPixel,
    setPixelSilent,
    getPixel,
    floodFill,
    hexToRgba,
    pushUndo,
    undo,
    redo,
  } from "./stores.svelte";

  let canvasEl: HTMLCanvasElement;
  let wrapperEl: HTMLDivElement;
  let isDrawing = false;
  let lastCell: { x: number; y: number } | null = null;

  const CANVAS_RENDER_SIZE = 512;

  function getCellFromEvent(e: MouseEvent): { x: number; y: number } | null {
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width;
    const scaleY = canvasEl.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
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
      const color = getPixel(x, y);
      if (color !== "transparent") {
        if (color.startsWith("rgba")) {
          const match = color.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
          if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            editorState.currentColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
            editorState.currentAlpha = parseFloat(match[4]);
          }
        } else {
          editorState.currentColor = color;
          editorState.currentAlpha = 1;
        }
      }
      editorState.tool = "pen";
    }
  }

  function onMouseDown(e: MouseEvent) {
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (!cell) return;
    pushUndo();
    isDrawing = true;
    lastCell = cell;
    applyTool(cell.x, cell.y);
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDrawing) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;
    if (lastCell && cell.x === lastCell.x && cell.y === lastCell.y) return;

    if (
      lastCell &&
      (editorState.tool === "pen" || editorState.tool === "eraser")
    ) {
      const dx = Math.abs(cell.x - lastCell.x);
      const dy = Math.abs(cell.y - lastCell.y);
      const sx = lastCell.x < cell.x ? 1 : -1;
      const sy = lastCell.y < cell.y ? 1 : -1;
      let err = dx - dy;
      let cx = lastCell.x;
      let cy = lastCell.y;
      const color = getActiveColor();
      while (true) {
        setPixelSilent(cx, cy, color);
        if (cx === cell.x && cy === cell.y) break;
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
      setPixel(cell.x, cell.y, color);
    }
    lastCell = cell;
  }

  function onMouseUp() {
    isDrawing = false;
    lastCell = null;
  }

  function getTouchCell(e: TouchEvent): { x: number; y: number } | null {
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch || !canvasEl) return null;
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width;
    const scaleY = canvasEl.height / rect.height;
    const px = (touch.clientX - rect.left) * scaleX;
    const py = (touch.clientY - rect.top) * scaleY;
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

  function onTouchStart(e: TouchEvent) {
    e.preventDefault();
    const cell = getTouchCell(e);
    if (!cell) return;
    pushUndo();
    isDrawing = true;
    lastCell = cell;
    applyTool(cell.x, cell.y);
  }

  function onTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (!isDrawing) return;
    const cell = getTouchCell(e);
    if (!cell) return;
    if (lastCell && cell.x === lastCell.x && cell.y === lastCell.y) return;

    if (
      lastCell &&
      (editorState.tool === "pen" || editorState.tool === "eraser")
    ) {
      const dx = Math.abs(cell.x - lastCell.x);
      const dy = Math.abs(cell.y - lastCell.y);
      const sx = lastCell.x < cell.x ? 1 : -1;
      const sy = lastCell.y < cell.y ? 1 : -1;
      let err = dx - dy;
      let cx = lastCell.x;
      let cy = lastCell.y;
      const color = getActiveColor();
      while (true) {
        setPixelSilent(cx, cy, color);
        if (cx === cell.x && cy === cell.y) break;
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
      setPixel(cell.x, cell.y, color);
    }
    lastCell = cell;
  }

  function onTouchEnd() {
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
    const totalPx = CANVAS_RENDER_SIZE;
    canvasEl.width = totalPx;
    canvasEl.height = totalPx;
    const cellSize = totalPx / size;

    ctx.clearRect(0, 0, totalPx, totalPx);

    drawCheckerboard(ctx, size, cellSize);

    if (editorState.bgColor && editorState.bgColor !== "transparent") {
      ctx.fillStyle = editorState.bgColor;
      ctx.fillRect(0, 0, totalPx, totalPx);
    }

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const color = editorState.pixels[y][x];
        if (color !== "transparent") {
          ctx.fillStyle = color;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    if (editorState.showGrid && cellSize >= 4) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= size; i++) {
        const pos = Math.round(i * cellSize) + 0.5;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, totalPx);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(totalPx, pos);
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
  onmouseup={onMouseUp}
  onmousemove={onMouseMove}
  onkeydown={onKeyDown}
/>

<div class="flex items-center justify-center" bind:this={wrapperEl}>
  <canvas
    bind:this={canvasEl}
    class="border border-border cursor-crosshair select-none max-w-full touch-none"
    style="width: min(100%, 512px); height: auto; aspect-ratio: 1 / 1; image-rendering: pixelated;"
    onmousedown={onMouseDown}
    ontouchstart={onTouchStart}
    ontouchmove={onTouchMove}
    ontouchend={onTouchEnd}
    tabindex="0"
    aria-label="Pixel art canvas - {editorState.gridSize}x{editorState.gridSize} grid"
  ></canvas>
</div>
