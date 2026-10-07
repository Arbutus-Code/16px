<script lang="ts">
  import { editorState, DEFAULT_PALETTE } from "./stores.svelte";
  import {
    hexToRgb,
    rgbToHex,
    rgbToHsl,
    hslToRgb,
    rgbToHsv,
    hsvToRgb,
  } from "./color";

  type ColorTarget = "current" | "background";
  type Mode = "hex" | "rgb" | "hsl";

  let { target = "current" }: { target?: ColorTarget } = $props();

  let hexInput = $state(editorState.currentColor);
  let mode = $state<Mode>("hex");
  let mixerEl: HTMLDivElement;
  let isDraggingMixer = false;
  let hue = $state(0);
  let saturation = $state(1);
  let value = $state(1);

  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));
  const clamp01 = (n: number) => clamp(n, 0, 1);

  function getSelectedColor(): string {
    if (target === "background") {
      return editorState.bgColor === "transparent"
        ? "#0a0a0f"
        : editorState.bgColor;
    }
    return editorState.currentColor;
  }

  function setSelectedColor(color: string) {
    if (target === "background") {
      editorState.bgColor = color;
    } else {
      editorState.currentColor = color;
    }
  }

  let selectedColor = $derived(getSelectedColor());
  let rgb = $derived(hexToRgb(selectedColor));
  let hsl = $derived(rgbToHsl(rgb));

  function setFromHex(input: string) {
    const cleaned = input.startsWith("#") ? input : `#${input}`;
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
      setSelectedColor(cleaned.toLowerCase());
      hexInput = cleaned.toLowerCase();
    }
  }

  function setFromRgb(r: number, g: number, b: number) {
    const color = rgbToHex({
      r: clamp(r, 0, 255),
      g: clamp(g, 0, 255),
      b: clamp(b, 0, 255),
    });
    setSelectedColor(color);
    hexInput = color;
  }

  function setFromHsl(h: number, s: number, l: number) {
    const color = rgbToHex(
      hslToRgb({
        h: clamp(h, 0, 360),
        s: clamp(s, 0, 100),
        l: clamp(l, 0, 100),
      }),
    );
    setSelectedColor(color);
    hexInput = color;
  }

  function setFromHsv(h: number, s: number, v: number) {
    hue = clamp(h, 0, 360);
    saturation = clamp01(s);
    value = clamp01(v);
    const { r, g, b } = hsvToRgb({ h: hue, s: saturation, v: value });
    setFromRgb(r, g, b);
  }

  function selectPaletteColor(color: string) {
    setSelectedColor(color);
    hexInput = color;
    if (target === "current") {
      editorState.currentAlpha = 1;
    }
  }

  function updateMixerFromPointer(clientX: number, clientY: number) {
    if (!mixerEl) return;
    const rect = mixerEl.getBoundingClientRect();
    const nextSat =
      rect.width === 0 ? 0 : clamp01((clientX - rect.left) / rect.width);
    const nextVal =
      rect.height === 0 ? 0 : clamp01(1 - (clientY - rect.top) / rect.height);
    setFromHsv(hue, nextSat, nextVal);
  }

  function onMixerPointerDown(e: PointerEvent) {
    e.preventDefault();
    updateMixerFromPointer(e.clientX, e.clientY);
    isDraggingMixer = true;
  }

  $effect(() => {
    hexInput = selectedColor;
    const hsv = rgbToHsv(rgb);
    hue = hsv.h;
    saturation = hsv.s;
    value = hsv.v;
  });
</script>

<svelte:window
  onpointermove={(e) =>
    isDraggingMixer && updateMixerFromPointer(e.clientX, e.clientY)}
  onpointerup={() => (isDraggingMixer = false)}
  onpointercancel={() => (isDraggingMixer = false)}
/>

<div class="flex flex-col gap-3">
  <div class="flex items-center gap-3">
    <div
      class="w-10 h-10 border-2 border-border-bright shrink-0"
      style="background-color: {selectedColor}; opacity: {target === 'current'
        ? editorState.currentAlpha
        : 1};"
      aria-label="Selected color preview: {selectedColor}"
    ></div>
    <div class="flex-1 flex flex-col gap-2 min-w-0">
      <div
        bind:this={mixerEl}
        class="relative w-full aspect-square border border-border-bright cursor-crosshair select-none rounded"
        style="background-color: hsl({hue} 100% 50%);"
        onpointerdown={onMixerPointerDown}
        role="application"
        aria-label="Color mixer"
      >
        <div
          class="absolute inset-0"
          style="background: linear-gradient(to right, #fff 0%, rgba(255, 255, 255, 0) 100%);"
        ></div>
        <div
          class="absolute inset-0"
          style="background: linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0) 100%);"
        ></div>
        <div
          class="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-full pointer-events-none"
          style="left: {saturation * 100}%; top: {(1 - value) *
            100}%; box-shadow: 0 0 0 1px rgba(0,0,0,0.65);"
        ></div>
      </div>

      <div class="flex items-center gap-2 min-w-0">
        <span class="text-xs text-text-dim uppercase tracking-wider shrink-0"
          >Hue</span
        >
        <input
          type="range"
          min="0"
          max="360"
          value={hue}
          oninput={(e) =>
            setFromHsv(
              parseInt((e.target as HTMLInputElement).value),
              saturation,
              value,
            )}
          class="flex-1 min-w-0 accent-accent-secondary"
          aria-label="Hue"
        />
        <span class="text-xs text-text-dim w-8 text-right font-mono shrink-0"
          >{hue}</span
        >
      </div>
    </div>
  </div>

  <div class="flex gap-1">
    {#each ["hex", "rgb", "hsl"] as m}
      <button
        class="flex-1 px-2 py-1 text-xs uppercase tracking-wider border rounded {mode ===
        m
          ? 'border-accent bg-accent text-bg font-bold'
          : 'border-border text-text-dim hover:border-border-bright'}"
        onclick={() => (mode = m as Mode)}
        aria-pressed={mode === m}
      >
        {m}
      </button>
    {/each}
  </div>

  {#if mode === "hex"}
    <input
      type="text"
      value={hexInput}
      oninput={(e) => {
        const input = e.target as HTMLInputElement;
        hexInput = input.value;
        setFromHex(input.value);
      }}
      class="w-full px-2 py-1.5 bg-bg-input border border-border text-text text-sm font-mono rounded"
      placeholder="#ff3e3e"
      aria-label="Hex color value"
    />
  {:else if mode === "rgb"}
    <div class="grid grid-cols-3 gap-1">
      {#each [["R", rgb.r], ["G", rgb.g], ["B", rgb.b]] as [label, channel]}
        <div class="flex flex-col gap-0.5">
          <span class="text-xs text-text-dim uppercase">{label}</span>
          <input
            type="number"
            min="0"
            max="255"
            value={channel}
            oninput={(e) => {
              const v = parseInt((e.target as HTMLInputElement).value) || 0;
              if (label === "R") setFromRgb(v, rgb.g, rgb.b);
              else if (label === "G") setFromRgb(rgb.r, v, rgb.b);
              else setFromRgb(rgb.r, rgb.g, v);
            }}
            class="w-full px-1.5 py-1 bg-bg-input border border-border text-text text-sm font-mono rounded"
            aria-label="{label} value"
          />
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-3 gap-1">
      {#each [["H", hsl.h, 360], ["S", hsl.s, 100], ["L", hsl.l, 100]] as [label, channel, max]}
        <div class="flex flex-col gap-0.5">
          <span class="text-xs text-text-dim uppercase">{label}</span>
          <input
            type="number"
            min="0"
            {max}
            value={channel}
            oninput={(e) => {
              const v = parseInt((e.target as HTMLInputElement).value) || 0;
              if (label === "H") setFromHsl(v, hsl.s, hsl.l);
              else if (label === "S") setFromHsl(hsl.h, v, hsl.l);
              else setFromHsl(hsl.h, hsl.s, v);
            }}
            class="w-full px-1.5 py-1 bg-bg-input border border-border text-text text-sm font-mono rounded"
            aria-label="{label} value"
          />
        </div>
      {/each}
    </div>
  {/if}

  {#if target === "current"}
    <div class="flex flex-col gap-1">
      <span class="text-xs text-text-dim uppercase tracking-wider">Alpha</span>
      <div class="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={editorState.currentAlpha}
          oninput={(e) => {
            editorState.currentAlpha = parseFloat(
              (e.target as HTMLInputElement).value,
            );
          }}
          class="flex-1 accent-accent"
          aria-label="Alpha transparency"
        />
        <span class="text-xs text-text-dim w-8 text-right font-mono">
          {Math.round(editorState.currentAlpha * 100)}%
        </span>
      </div>
    </div>
  {/if}

  <div>
    <span class="text-xs text-text-dim uppercase tracking-wider block mb-1.5"
      >Palette</span
    >
    <div class="grid grid-cols-8 gap-1">
      {#each DEFAULT_PALETTE as color}
        <button
          class="w-full aspect-square border rounded-sm {selectedColor === color
            ? 'border-accent-secondary border-2'
            : 'border-border hover:border-border-bright'}"
          style="background-color: {color};"
          onclick={() => selectPaletteColor(color)}
          aria-label="Select color {color}"
          aria-pressed={selectedColor === color}
        ></button>
      {/each}
    </div>
  </div>
</div>
