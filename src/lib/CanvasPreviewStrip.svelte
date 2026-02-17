<script lang="ts">
  import { editorState, renderTick } from "./stores.svelte";

  let preview1xEl: HTMLCanvasElement;
  let preview2xEl: HTMLCanvasElement;
  let preview4xEl: HTMLCanvasElement;

  function drawPreview(canvas: HTMLCanvasElement | undefined) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = editorState.gridSize;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    if (editorState.bgColor && editorState.bgColor !== "transparent") {
      ctx.fillStyle = editorState.bgColor;
      ctx.fillRect(0, 0, size, size);
    }

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const color = editorState.pixels[y][x];
        if (color === "transparent") continue;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function renderAllPreviews() {
    drawPreview(preview1xEl);
    drawPreview(preview2xEl);
    drawPreview(preview4xEl);
  }

  $effect(() => {
    renderTick.value;
    editorState.gridSize;
    editorState.bgColor;
    renderAllPreviews();
  });
</script>

<div
  class="hidden lg:block w-full border-t border-border pt-4"
  aria-hidden="true"
>
  <div class="flex items-center justify-between mb-2">
    <span class="text-xs text-text-dim uppercase tracking-wider"
      >Live Preview</span
    >
    <span class="text-xs text-text-dim font-mono"
      >{editorState.gridSize}x{editorState.gridSize}</span
    >
  </div>

  <div class="flex gap-4 overflow-x-auto pb-1">
    <div class="flex flex-col items-center gap-1 shrink-0">
      <span class="text-xs text-text-dim uppercase tracking-wider">1x</span>
      <div
        class="border border-border p-1 bg-bg-input"
        style="border-radius: 4px;"
      >
        <canvas
          bind:this={preview1xEl}
          class="block"
          style="width: {editorState.gridSize}px; height: {editorState.gridSize}px; image-rendering: pixelated;"
          aria-label="Live preview at 1x scale"
        ></canvas>
      </div>
    </div>

    <div class="flex flex-col items-center gap-1 shrink-0">
      <span class="text-xs text-text-dim uppercase tracking-wider">2x</span>
      <div
        class="border border-border p-1 bg-bg-input"
        style="border-radius: 4px;"
      >
        <canvas
          bind:this={preview2xEl}
          class="block"
          style="width: {editorState.gridSize *
            2}px; height: {editorState.gridSize *
            2}px; image-rendering: pixelated;"
          aria-label="Live preview at 2x scale"
        ></canvas>
      </div>
    </div>

    <div class="flex flex-col items-center gap-1 shrink-0">
      <span class="text-xs text-text-dim uppercase tracking-wider">4x</span>
      <div
        class="border border-border p-1 bg-bg-input"
        style="border-radius: 4px;"
      >
        <canvas
          bind:this={preview4xEl}
          class="block"
          style="width: {editorState.gridSize *
            4}px; height: {editorState.gridSize *
            4}px; image-rendering: pixelated;"
          aria-label="Live preview at 4x scale"
        ></canvas>
      </div>
    </div>
  </div>
</div>
