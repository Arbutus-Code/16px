<script lang="ts">
  import { editorState, DEFAULT_PALETTE } from "./stores.svelte";

  type ColorTarget = "current" | "background";
  let {
    target = "current",
    autoCloseOnSelect = false,
    onClose,
  }: {
    target?: ColorTarget;
    autoCloseOnSelect?: boolean;
    onClose?: () => void;
  } = $props();

  let hexInput = $state(editorState.currentColor);
  let mode = $state<"hex" | "rgb" | "hsl">("hex");
  let mixerEl: HTMLDivElement;
  let isDraggingMixer = false;
  let hue = $state(0);
  let saturation = $state(1);
  let value = $state(1);

  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  function rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  function rgbToHsl(
    r: number,
    g: number,
    b: number,
  ): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  function hslToRgb(
    h: number,
    s: number,
    l: number,
  ): { r: number; g: number; b: number } {
    h /= 360;
    s /= 100;
    l /= 100;
    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  function rgbToHsv(
    r: number,
    g: number,
    b: number,
  ): { h: number; s: number; v: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (d !== 0) {
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
          break;
        case g:
          h = ((b - r) / d + 2) * 60;
          break;
        case b:
          h = ((r - g) / d + 4) * 60;
          break;
      }
    }

    return {
      h: Math.round(h),
      s,
      v,
    };
  }

  function hsvToRgb(
    h: number,
    s: number,
    v: number,
  ): { r: number; g: number; b: number } {
    const c = v * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0;
    let g = 0;
    let b = 0;

    if (hp >= 0 && hp < 1) {
      r = c;
      g = x;
    } else if (hp >= 1 && hp < 2) {
      r = x;
      g = c;
    } else if (hp >= 2 && hp < 3) {
      g = c;
      b = x;
    } else if (hp >= 3 && hp < 4) {
      g = x;
      b = c;
    } else if (hp >= 4 && hp < 5) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }

    const m = v - c;
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  function clamp01(num: number): number {
    return Math.max(0, Math.min(1, num));
  }

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
      return;
    }
    editorState.currentColor = color;
  }

  function maybeClosePicker() {
    if (autoCloseOnSelect) onClose?.();
  }

  let selectedColor = $derived(getSelectedColor());
  let rgb = $derived(hexToRgb(selectedColor));
  let hsl = $derived(rgbToHsl(rgb.r, rgb.g, rgb.b));

  function setFromHex(value: string) {
    const cleaned = value.startsWith("#") ? value : `#${value}`;
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
      setSelectedColor(cleaned.toLowerCase());
      hexInput = cleaned.toLowerCase();
    }
  }

  function setFromRgb(r: number, g: number, b: number) {
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    const color = rgbToHex(r, g, b);
    setSelectedColor(color);
    hexInput = color;
  }

  function setFromHsl(h: number, s: number, l: number) {
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    l = Math.max(0, Math.min(100, l));
    const { r, g, b } = hslToRgb(h, s, l);
    const color = rgbToHex(r, g, b);
    setSelectedColor(color);
    hexInput = color;
  }

  function selectPaletteColor(color: string) {
    setSelectedColor(color);
    hexInput = color;
    if (target === "current") {
      editorState.currentAlpha = 1;
    }
    maybeClosePicker();
  }

  function setFromHsv(h: number, s: number, v: number) {
    const nextHue = Math.max(0, Math.min(360, h));
    const nextSat = clamp01(s);
    const nextVal = clamp01(v);
    const { r, g, b } = hsvToRgb(nextHue, nextSat, nextVal);
    hue = nextHue;
    saturation = nextSat;
    value = nextVal;
    setFromRgb(r, g, b);
  }

  function updateMixerFromPointer(clientX: number, clientY: number) {
    if (!mixerEl) return;
    const rect = mixerEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const nextSat = rect.width === 0 ? 0 : x / rect.width;
    const nextVal = rect.height === 0 ? 0 : 1 - y / rect.height;
    setFromHsv(hue, nextSat, nextVal);
  }

  function onMixerPointerDown(e: PointerEvent) {
    e.preventDefault();
    updateMixerFromPointer(e.clientX, e.clientY);
    if (autoCloseOnSelect) {
      maybeClosePicker();
      return;
    }
    isDraggingMixer = true;
  }

  function onWindowPointerMove(e: PointerEvent) {
    if (!isDraggingMixer) return;
    updateMixerFromPointer(e.clientX, e.clientY);
  }

  function onWindowPointerUp() {
    isDraggingMixer = false;
  }

  $effect(() => {
    hexInput = selectedColor;
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    hue = hsv.h;
    saturation = hsv.s;
    value = hsv.v;
  });
</script>

<svelte:window
  onpointermove={onWindowPointerMove}
  onpointerup={onWindowPointerUp}
  onpointercancel={onWindowPointerUp}
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
        class="relative w-full aspect-square border border-border-bright cursor-crosshair select-none"
        style="background-color: hsl({hue} 100% 50%); border-radius: 4px;"
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
          oninput={(e) => {
            setFromHsv(
              parseInt((e.target as HTMLInputElement).value),
              saturation,
              value,
            );
            maybeClosePicker();
          }}
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
        class="flex-1 px-2 py-1 text-xs uppercase tracking-wider border {mode ===
        m
          ? 'border-accent bg-accent text-bg font-bold'
          : 'border-border text-text-dim hover:border-border-bright'}"
        style="border-radius: 4px;"
        onclick={() => (mode = m as "hex" | "rgb" | "hsl")}
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
        const target = e.target as HTMLInputElement;
        hexInput = target.value;
        setFromHex(target.value);
      }}
      class="w-full px-2 py-1.5 bg-bg-input border border-border text-text text-sm font-mono"
      style="border-radius: 4px;"
      placeholder="#ff3e3e"
      aria-label="Hex color value"
    />
  {:else if mode === "rgb"}
    <div class="grid grid-cols-3 gap-1">
      {#each [["R", rgb.r], ["G", rgb.g], ["B", rgb.b]] as [label, value]}
        <div class="flex flex-col gap-0.5">
          <span class="text-xs text-text-dim uppercase">{label}</span>
          <input
            type="number"
            min="0"
            max="255"
            {value}
            oninput={(e) => {
              const target = e.target as HTMLInputElement;
              const v = parseInt(target.value) || 0;
              if (label === "R") setFromRgb(v, rgb.g, rgb.b);
              else if (label === "G") setFromRgb(rgb.r, v, rgb.b);
              else setFromRgb(rgb.r, rgb.g, v);
            }}
            class="w-full px-1.5 py-1 bg-bg-input border border-border text-text text-sm font-mono"
            style="border-radius: 4px;"
            aria-label="{label} value"
          />
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-3 gap-1">
      {#each [["H", hsl.h, 360], ["S", hsl.s, 100], ["L", hsl.l, 100]] as [label, value, max]}
        <div class="flex flex-col gap-0.5">
          <span class="text-xs text-text-dim uppercase">{label}</span>
          <input
            type="number"
            min="0"
            {max}
            {value}
            oninput={(e) => {
              const target = e.target as HTMLInputElement;
              const v = parseInt(target.value) || 0;
              if (label === "H") setFromHsl(v, hsl.s, hsl.l);
              else if (label === "S") setFromHsl(hsl.h, v, hsl.l);
              else setFromHsl(hsl.h, hsl.s, v);
            }}
            class="w-full px-1.5 py-1 bg-bg-input border border-border text-text text-sm font-mono"
            style="border-radius: 4px;"
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
          class="w-full aspect-square border {selectedColor === color
            ? 'border-accent-secondary border-2'
            : 'border-border hover:border-border-bright'}"
          style="background-color: {color}; border-radius: 2px;"
          onclick={() => selectPaletteColor(color)}
          aria-label="Select color {color}"
          aria-pressed={selectedColor === color}
        ></button>
      {/each}
    </div>
  </div>
</div>
