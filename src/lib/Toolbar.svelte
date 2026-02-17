<script lang="ts">
  let {
    onOpenColorOverlay,
  }: {
    onOpenColorOverlay?: () => void;
  } = $props();

  import {
    editorState,
    clearCanvas,
    setGridSize,
    undo,
    redo,
    pushUndo,
  } from "./stores.svelte";
  import type { Tool } from "./stores.svelte";

  const tools: { id: Tool; label: string; icon: string }[] = [
    {
      id: "pen",
      label: "Pen",
      icon: "M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z M2 2l7.586 7.586",
    },
    {
      id: "eraser",
      label: "Eraser",
      icon: "M7 21h10 M5.5 13.5L9 17l6.5-6.5-7-7L5 7l.5 6.5z M2.5 10.5l4-4",
    },
    {
      id: "fill",
      label: "Fill",
      icon: "M19 11V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4 M12 12l4.5 4.5 M16 16l2 2 M2 12h4",
    },
    {
      id: "eyedropper",
      label: "Pick",
      icon: "M2 22l1-1h3l9-9 M3 21v-3l9-9 M14.5 5.5l4 4 M18 2l4 4-4.5 4.5-4-4L18 2z",
    },
  ];

  const sizes = [16, 32, 64, 128];

  function handleClear() {
    if (confirm("Clear the entire canvas?")) {
      pushUndo();
      clearCanvas();
    }
  }
</script>

<div class="flex flex-col gap-5">
  <div>
    <span
      class="text-xs text-text-dim uppercase tracking-wider block mb-1.5"
      id="tools-label">Tools</span
    >
    <div
      class="grid grid-cols-5 lg:grid-cols-4 gap-2"
      role="toolbar"
      aria-labelledby="tools-label"
    >
      {#each tools as tool}
        <button
          class="flex flex-col items-center gap-2 px-3 py-3 border text-xs {editorState.tool ===
          tool.id
            ? 'border-accent bg-accent/20 text-accent'
            : 'border-border text-text-dim hover:border-border-bright hover:text-text'}"
          style="border-radius: 4px;"
          onclick={() => (editorState.tool = tool.id)}
          aria-label="{tool.label} tool"
          aria-pressed={editorState.tool === tool.id}
          title={tool.label}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d={tool.icon} />
          </svg>
          <span class="text-xs uppercase tracking-wider">{tool.label}</span>
        </button>
      {/each}

      <button
        class="lg:hidden flex flex-col items-center gap-2 px-3 py-3 border text-xs border-border text-text-dim hover:border-border-bright hover:text-text"
        style="border-radius: 4px;"
        onclick={onOpenColorOverlay}
        aria-label="Open colour controls"
        title="Colour"
      >
        <span
          class="w-[18px] h-[18px] border border-border-bright"
          style="background-color: {editorState.currentColor}; border-radius: 3px;"
        ></span>
        <span class="text-xs uppercase tracking-wider">Colour</span>
      </button>
    </div>
  </div>

  <div>
    <span
      class="text-xs text-text-dim uppercase tracking-wider block mb-1.5"
      id="canvas-size-label">Canvas Size</span
    >
    <div
      class="grid grid-cols-4 gap-2"
      role="group"
      aria-labelledby="canvas-size-label"
    >
      {#each sizes as size}
        <button
          class="px-3 py-2 text-xs border font-mono {editorState.gridSize ===
          size
            ? 'border-accent-secondary bg-accent-secondary/20 text-accent-secondary'
            : 'border-border text-text-dim hover:border-border-bright'}"
          style="border-radius: 4px;"
          onclick={() => setGridSize(size)}
          aria-pressed={editorState.gridSize === size}
          aria-label="{size} by {size} pixels"
        >
          {size}
        </button>
      {/each}
    </div>
  </div>

  <div>
    <span
      class="text-xs text-text-dim uppercase tracking-wider block mb-1.5"
      id="history-label">History</span
    >
    <div
      class="grid grid-cols-2 gap-2"
      role="group"
      aria-labelledby="history-label"
    >
      <button
        class="px-3 py-2 text-xs border border-border text-text-dim hover:border-border-bright hover:text-text"
        style="border-radius: 4px;"
        onclick={undo}
        aria-label="Undo"
        title="Undo (Cmd+Z)"
      >
        Undo
      </button>
      <button
        class="px-3 py-2 text-xs border border-border text-text-dim hover:border-border-bright hover:text-text"
        style="border-radius: 4px;"
        onclick={redo}
        aria-label="Redo"
        title="Redo (Cmd+Shift+Z)"
      >
        Redo
      </button>
    </div>
  </div>

  <div class="flex items-center gap-2">
    <label class="flex items-center gap-2 text-xs text-text-dim cursor-pointer">
      <input
        type="checkbox"
        checked={editorState.showGrid}
        onchange={(e) =>
          (editorState.showGrid = (e.target as HTMLInputElement).checked)}
        class="accent-accent"
      />
      Show Grid
    </label>
  </div>

  <button
    class="w-full px-3 py-2.5 text-xs uppercase tracking-wider border border-accent/50 text-accent hover:bg-accent/10"
    style="border-radius: 4px;"
    onclick={handleClear}
  >
    Clear Canvas
  </button>
</div>
