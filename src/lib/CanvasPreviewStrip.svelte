<script lang="ts">
  import { editorState, renderTick } from "./stores.svelte";
  import { paintPixels } from "./render";

  const SCALES = [1, 2, 4];
  let canvasEls: (HTMLCanvasElement | undefined)[] = $state([]);

  $effect(() => {
    renderTick.value;
    editorState.gridSize;
    editorState.bgColor;
    for (const [i, scale] of SCALES.entries()) {
      const canvas = canvasEls[i];
      if (!canvas) continue;
      canvas.width = editorState.gridSize * scale;
      canvas.height = editorState.gridSize * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) paintPixels(ctx, editorState.pixels, scale, editorState.bgColor);
    }
  });
</script>

<div
  class="hidden lg:block w-full border-t border-border pt-4"
  aria-hidden="true"
>
  <div class="flex items-center justify-between mb-2">
    <span class="text-xs text-text-dim uppercase tracking-wider">
      Live Preview
    </span>
    <span class="text-xs text-text-dim font-mono">
      {editorState.gridSize}x{editorState.gridSize}
    </span>
  </div>

  <div class="flex items-start gap-4">
    {#each SCALES as scale, i}
      <div class="flex flex-col items-center gap-1">
        <span class="text-xs text-text-dim uppercase tracking-wider">
          {scale}x
        </span>
        <div class="border border-border p-1 bg-bg-input rounded">
          <canvas
            bind:this={canvasEls[i]}
            class="block"
            style="width: {editorState.gridSize *
              scale}px; height: {editorState.gridSize *
              scale}px; image-rendering: pixelated;"
          ></canvas>
        </div>
      </div>
    {/each}
  </div>
</div>
