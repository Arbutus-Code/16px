<script lang="ts">
  import {
    editorState,
    loadPixelsFromImageData,
    pushUndo,
  } from "./stores.svelte";
  import { paintPixels } from "./render";

  type ExportFormat = "png" | "svg" | "jpg" | "webp" | "gif";

  let fileInput: HTMLInputElement;
  let showExportDialog = $state(false);
  let exportFormat = $state<ExportFormat>("png");
  let exportScale = $state(8);
  let exportBgColor = $state("#000000");
  let exportTransparent = $state(true);

  const ACCEPT_FORMATS = ".png,.jpg,.jpeg,.gif,.svg,.heic,.heif,.avif,.webp";
  const EXPORT_FORMATS: ExportFormat[] = ["png", "svg", "jpg", "webp", "gif"];
  const MIME_TYPES: Partial<Record<ExportFormat, string>> = {
    png: "image/png",
    jpg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
  };
  // jpg has no alpha channel; everything else can carry transparency.
  const TRANSPARENT_FORMATS = new Set<ExportFormat>([
    "png",
    "svg",
    "webp",
    "gif",
  ]);

  async function onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      pushUndo();
      const size = editorState.gridSize;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, size, size);
      loadPixelsFromImageData(ctx.getImageData(0, 0, size, size), size);
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      alert(
        "Could not load image. The format may not be supported by your browser.",
      );
      URL.revokeObjectURL(url);
    };

    img.src = url;
    input.value = "";
  }

  function generateSVG(): string {
    const size = editorState.gridSize;
    let rects = "";
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const color = editorState.pixels[y][x];
        if (color !== "transparent") {
          rects += `  <rect x="${x}" y="${y}" width="1" height="1" fill="${color}" />\n`;
        }
      }
    }
    const bgRect = exportTransparent
      ? ""
      : `  <rect width="${size}" height="${size}" fill="${exportBgColor}" />\n`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">\n${bgRect}${rects}</svg>`;
  }

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    const baseName = `16px-${editorState.gridSize}x${editorState.gridSize}-${Date.now()}`;

    if (exportFormat === "svg") {
      download(
        new Blob([generateSVG()], { type: "image/svg+xml" }),
        `${baseName}.svg`,
      );
    } else {
      const size = editorState.gridSize;
      const canvas = document.createElement("canvas");
      canvas.width = size * exportScale;
      canvas.height = size * exportScale;
      paintPixels(
        canvas.getContext("2d")!,
        editorState.pixels,
        exportScale,
        exportTransparent ? undefined : exportBgColor,
      );
      canvas.toBlob(
        (blob) => blob && download(blob, `${baseName}.${exportFormat}`),
        MIME_TYPES[exportFormat],
        0.95,
      );
    }

    showExportDialog = false;
  }

  $effect(() => {
    if (!TRANSPARENT_FORMATS.has(exportFormat)) {
      exportTransparent = false;
    }
  });
</script>

<div class="flex flex-col gap-2">
  <input
    bind:this={fileInput}
    type="file"
    accept={ACCEPT_FORMATS}
    onchange={onFileSelected}
    class="hidden"
    aria-label="Import image file"
  />

  <button
    class="w-full px-3 py-2 text-xs uppercase tracking-wider border border-accent-secondary/50 text-accent-secondary hover:bg-accent-secondary/10 rounded"
    onclick={() => fileInput.click()}
  >
    Import Image
  </button>

  <button
    class="w-full px-3 py-2 text-xs uppercase tracking-wider border border-success/50 text-success hover:bg-success/10 rounded"
    onclick={() => (showExportDialog = !showExportDialog)}
    aria-expanded={showExportDialog}
  >
    Export / Save
  </button>

  {#if showExportDialog}
    <div
      class="border border-border-bright bg-bg-panel p-3 flex flex-col gap-3 rounded"
      role="region"
      aria-label="Export settings"
    >
      <span class="text-xs text-text-dim uppercase tracking-wider">
        Export Settings
      </span>

      <div>
        <span class="text-xs text-text-dim uppercase block mb-1">Format</span>
        <div class="grid grid-cols-5 gap-1">
          {#each EXPORT_FORMATS as fmt}
            <button
              class="px-1 py-1 text-xs uppercase border font-mono rounded {exportFormat ===
              fmt
                ? 'border-success bg-success/20 text-success'
                : 'border-border text-text-dim hover:border-border-bright'}"
              onclick={() => (exportFormat = fmt)}
              aria-pressed={exportFormat === fmt}
            >
              {fmt}
            </button>
          {/each}
        </div>
      </div>

      {#if exportFormat !== "svg"}
        <div>
          <span class="text-xs text-text-dim uppercase block mb-1">
            Scale: {exportScale}x ({editorState.gridSize * exportScale}px)
          </span>
          <input
            type="range"
            min="1"
            max="32"
            value={exportScale}
            oninput={(e) =>
              (exportScale = parseInt((e.target as HTMLInputElement).value))}
            class="w-full accent-success"
            aria-label="Export scale"
          />
        </div>
      {/if}

      {#if TRANSPARENT_FORMATS.has(exportFormat)}
        <label
          class="flex items-center gap-2 text-xs text-text-dim cursor-pointer"
        >
          <input
            type="checkbox"
            bind:checked={exportTransparent}
            class="accent-success"
            aria-label="Transparent background"
          />
          Transparent background
        </label>
      {/if}

      {#if !exportTransparent}
        <div class="flex items-center gap-2">
          <span class="text-xs text-text-dim uppercase">BG Color</span>
          <input
            type="color"
            bind:value={exportBgColor}
            class="w-6 h-6 bg-bg-input border border-border cursor-pointer"
            aria-label="Export background color"
          />
          <span class="text-xs text-text-dim font-mono">{exportBgColor}</span>
        </div>
      {/if}

      <button
        class="w-full px-3 py-2 text-xs uppercase tracking-wider bg-success text-bg font-bold hover:opacity-90 rounded"
        onclick={handleExport}
      >
        Download
      </button>
    </div>
  {/if}
</div>
