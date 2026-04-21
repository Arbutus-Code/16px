export type Tool = "pen" | "eraser" | "fill" | "eyedropper";

export interface EditorState {
  gridSize: number;
  pixels: string[][];
  currentColor: string;
  currentAlpha: number;
  tool: Tool;
  bgColor: string;
  showGrid: boolean;
}

function createPixelGrid(size: number): string[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "transparent"),
  );
}

function createEditorState(): EditorState {
  const gridSize = 16;
  return {
    gridSize,
    pixels: createPixelGrid(gridSize),
    currentColor: "#ff3e3e",
    currentAlpha: 1,
    tool: "pen",
    bgColor: "transparent",
    showGrid: true,
  };
}

export let editorState = $state<EditorState>(createEditorState());
export let renderTick = $state({ value: 0 });

function bumpRender() {
  renderTick.value++;
}

interface Snapshot {
  gridSize: number;
  pixels: string[][];
}

const undoStack: Snapshot[] = [];
const redoStack: Snapshot[] = [];
const MAX_UNDO = 50;

function clonePixels(pixels: string[][]): string[][] {
  return pixels.map((row) => [...row]);
}

function takeSnapshot(): Snapshot {
  return {
    gridSize: editorState.gridSize,
    pixels: clonePixels(editorState.pixels),
  };
}

function applySnapshot(snap: Snapshot) {
  editorState.gridSize = snap.gridSize;
  editorState.pixels = clonePixels(snap.pixels);
  bumpRender();
}

/**
 * Captures current canvas state and pushes it to the undo stack.
 * Clears the redo stack since a new action invalidates forward history.
 */
export function pushUndo() {
  undoStack.push(takeSnapshot());
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
}

/**
 * Restores the previous canvas state from the undo stack.
 * Pushes current state to redo stack to enable redo.
 */
export function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(takeSnapshot());
  applySnapshot(undoStack.pop()!);
}

/**
 * Restores the next canvas state from the redo stack.
 * Pushes current state to undo stack to maintain history.
 */
export function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(takeSnapshot());
  applySnapshot(redoStack.pop()!);
}

export function canUndo(): boolean {
  return undoStack.length > 0;
}

export function canRedo(): boolean {
  return redoStack.length > 0;
}

/**
 * Changes the canvas grid size while preserving existing pixel data.
 * Copies pixels from the old grid to the new grid (top-left aligned).
 * Creates an undo snapshot before resizing.
 *
 * @param size - New grid size in pixels (must be positive)
 */
export function setGridSize(size: number) {
  if (size === editorState.gridSize) return;
  pushUndo();
  const old = editorState.pixels;
  const newPixels = createPixelGrid(size);
  const copySize = Math.min(size, old.length);
  for (let y = 0; y < copySize; y++) {
    for (let x = 0; x < copySize; x++) {
      newPixels[y][x] = old[y][x];
    }
  }
  editorState.gridSize = size;
  editorState.pixels = newPixels;
  bumpRender();
}

export function clearCanvas() {
  editorState.pixels = createPixelGrid(editorState.gridSize);
  bumpRender();
}

export function setPixel(x: number, y: number, color: string) {
  if (
    x >= 0 &&
    x < editorState.gridSize &&
    y >= 0 &&
    y < editorState.gridSize
  ) {
    editorState.pixels[y][x] = color;
    bumpRender();
  }
}

export function setPixelSilent(x: number, y: number, color: string) {
  if (
    x >= 0 &&
    x < editorState.gridSize &&
    y >= 0 &&
    y < editorState.gridSize
  ) {
    editorState.pixels[y][x] = color;
  }
}

export function getPixel(x: number, y: number): string {
  if (
    x >= 0 &&
    x < editorState.gridSize &&
    y >= 0 &&
    y < editorState.gridSize
  ) {
    return editorState.pixels[y][x];
  }
  return "transparent";
}

/**
 * Fills a contiguous region with the specified color using iterative flood fill.
 * Replaces all connected pixels of the same color starting from (startX, startY).
 * Uses a stack-based approach to avoid recursion limits on large canvases.
 *
 * @param startX - X coordinate of the starting pixel
 * @param startY - Y coordinate of the starting pixel
 * @param fillColor - Color to apply to the filled region
 */
export function floodFill(startX: number, startY: number, fillColor: string) {
  const size = editorState.gridSize;
  const targetColor = editorState.pixels[startY][startX];
  if (targetColor === fillColor) return;

  const stack: [number, number][] = [[startX, startY]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    if (x < 0 || x >= size || y < 0 || y >= size) continue;
    if (editorState.pixels[y][x] !== targetColor) continue;

    visited.add(key);
    editorState.pixels[y][x] = fillColor;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  bumpRender();
}

/**
 * Imports pixel data from a Canvas ImageData object into the editor.
 * Converts RGBA values to hex colors (or rgba() for partial transparency).
 * Fully transparent pixels (alpha=0) become "transparent".
 *
 * @param imageData - Canvas ImageData containing RGBA pixel values
 * @param targetSize - Grid size to import (should match imageData dimensions)
 */
export function loadPixelsFromImageData(
  imageData: ImageData,
  targetSize: number,
) {
  const newPixels = createPixelGrid(targetSize);
  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const i = (y * imageData.width + x) * 4;
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];
      if (a === 0) {
        newPixels[y][x] = "transparent";
      } else if (a < 255) {
        const alpha = (a / 255).toFixed(2);
        newPixels[y][x] = `rgba(${r},${g},${b},${alpha})`;
      } else {
        newPixels[y][x] =
          `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      }
    }
  }
  editorState.gridSize = targetSize;
  editorState.pixels = newPixels;
  bumpRender();
}

/**
 * Converts a hex color to rgba format with the specified alpha value.
 * Returns the original hex if alpha is 1 or greater (no transparency needed).
 *
 * @param hex - Hex color string (format: #RRGGBB)
 * @param alpha - Alpha value between 0 and 1
 * @returns rgba() string or original hex if alpha >= 1
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (alpha >= 1) return hex;
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

export const DEFAULT_PALETTE = [
  "#000000",
  "#ffffff",
  "#ff3e3e",
  "#ff9e3e",
  "#ffe03e",
  "#3eff7e",
  "#3ec8ff",
  "#3e5eff",
  "#9e3eff",
  "#ff3ec8",
  "#00e5ff",
  "#ff6600",
  "#8b4513",
  "#808080",
  "#c0c0c0",
  "#1a1a2e",
];
