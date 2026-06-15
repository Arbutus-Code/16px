<script lang="ts">
  import PixelCanvas from "./PixelCanvas.svelte";
  import CanvasPreviewStrip from "./CanvasPreviewStrip.svelte";
  import ColorPicker from "./ColorPicker.svelte";
  import BackgroundControls from "./BackgroundControls.svelte";
  import Toolbar from "./Toolbar.svelte";
  import ImportExport from "./ImportExport.svelte";
  import ConsentBanner from "./ConsentBanner.svelte";
  import { editorState } from "./stores.svelte";

  let isMobileColorOverlayOpen = $state(false);

  function openMobileColorOverlay() {
    isMobileColorOverlayOpen = true;
  }

  function closeMobileColorOverlay() {
    isMobileColorOverlayOpen = false;
  }

  function handleWindowKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && isMobileColorOverlayOpen) {
      closeMobileColorOverlay();
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="h-screen bg-bg flex flex-col overflow-hidden">
  <header
    class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0"
  >
    <div class="flex items-center gap-3">
      <h1 class="text-lg font-bold text-text-bright tracking-tight font-mono">
        <span class="text-accent">16</span><span class="text-text-dim">px</span>
      </h1>
      <span
        class="text-xs text-text-dim uppercase tracking-widest hidden sm:inline"
        >Pixel Art Editor</span
      >
    </div>
    <div class="flex items-center gap-4 text-xs text-text-dim font-mono">
      <span aria-live="polite"
        >{editorState.gridSize}x{editorState.gridSize}</span
      >
      <span
        class="w-3 h-3 border border-border"
        style="background-color: {editorState.currentColor};"
        role="img"
        aria-label="Current color: {editorState.currentColor}"
      ></span>
    </div>
  </header>

  <main
    class="flex-1 flex flex-col lg:flex-row gap-0 overflow-y-auto lg:overflow-hidden min-h-0"
  >
    <aside
      role="region"
      aria-label="Drawing tools"
      class="w-full lg:w-64 xl:w-72 2xl:w-80 border-b lg:border-b-0 lg:border-r border-border p-5 lg:p-6 flex flex-col gap-6 order-2 lg:order-1 shrink-0 lg:min-w-[16rem] lg:overflow-y-auto lg:h-full"
    >
      <Toolbar onOpenColorOverlay={openMobileColorOverlay} />
      <div class="border-t border-border pt-5">
        <ImportExport />
      </div>
    </aside>

    <section
      id="main-canvas"
      aria-label="Canvas workspace"
      class="flex-1 flex flex-col items-center p-4 sm:p-8 lg:p-10 order-1 lg:order-2 bg-bg min-w-0 lg:overflow-y-auto lg:h-full"
      style="min-height: 540px;"
    >
      <div class="w-full max-w-[960px] flex flex-col items-center gap-6">
        <div class="flex-1 flex items-center justify-center w-full">
          <PixelCanvas />
        </div>
        <CanvasPreviewStrip />
      </div>
    </section>

    <aside
      aria-label="Color controls"
      class="w-full lg:w-64 xl:w-72 2xl:w-80 border-t lg:border-t-0 lg:border-l border-border p-5 lg:p-5 hidden lg:flex flex-col gap-6 order-3 shrink-0 lg:min-w-[16rem] lg:overflow-y-auto lg:h-full"
    >
      <ColorPicker />
      <div class="border-t border-border pt-5">
        <BackgroundControls />
      </div>
    </aside>
  </main>

  {#if isMobileColorOverlayOpen}
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Colour controls"
      class="lg:hidden fixed inset-0 z-50 bg-bg border-t border-border overflow-y-auto"
    >
      <div
        class="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border bg-bg"
      >
        <h2 class="text-sm uppercase tracking-wider text-text-dim">Colour</h2>
        <button
          class="px-3 py-1.5 text-xs uppercase tracking-wider border border-border text-text-dim hover:border-border-bright hover:text-text"
          style="border-radius: 4px;"
          onclick={closeMobileColorOverlay}
          aria-label="Close colour controls"
        >
          Close
        </button>
      </div>

      <div class="p-5 flex flex-col gap-6 items-center">
        <div class="w-[70%] max-w-[70%]">
          <span
            class="text-xs text-text-dim uppercase tracking-wider block mb-2"
            >Main Color</span
          >
          <ColorPicker />
        </div>

        <div class="w-[70%] max-w-[70%] border-t border-border pt-5">
          <BackgroundControls />
        </div>
      </div>
    </div>
  {/if}

  <footer
    class="shrink-0 border-t border-border px-4 py-2 flex items-center justify-center gap-3 text-[10px] text-text-dim font-mono"
  >
    <a
      href="/terms/"
      class="hover:text-text transition-colors no-underline text-text-dim"
      >Terms</a
    >
    <span class="text-border">·</span>
    <a
      href="/privacy/"
      class="hover:text-text transition-colors no-underline text-text-dim"
      >Privacy</a
    >
    <span class="text-border">·</span>
    <span
      >© {new Date().getFullYear()}
      <a
        href="https://arbutuscode.ca"
        class="hover:text-text transition-colors no-underline text-text-dim"
        target="_blank"
        rel="noopener noreferrer">Arbutus Code</a
      ></span
    >
  </footer>

  <ConsentBanner />
</div>
