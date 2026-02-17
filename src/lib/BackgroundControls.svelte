<script lang="ts">
  let {
    autoCloseOnSelect = false,
    onClose,
  }: {
    autoCloseOnSelect?: boolean;
    onClose?: () => void;
  } = $props();

  import ColorPicker from "./ColorPicker.svelte";
  import { editorState } from "./stores.svelte";

  let isEditing = $state(false);

  function closeEditor() {
    isEditing = false;
  }

  function maybeCloseOverlay() {
    if (autoCloseOnSelect) onClose?.();
  }
</script>

<div class="flex flex-col gap-3">
  <span class="text-xs text-text-dim uppercase tracking-wider">Background</span>

  <button
    class="w-full flex items-center gap-3 px-3 py-2 border border-border text-left hover:border-border-bright"
    style="border-radius: 4px;"
    onclick={() => (isEditing = !isEditing)}
    aria-expanded={isEditing}
    aria-label="Edit background color"
  >
    <span
      class="w-8 h-8 border border-border-bright shrink-0"
      style="background-color: {editorState.bgColor === 'transparent'
        ? '#0a0a0f'
        : editorState.bgColor};"
    ></span>
    <span class="text-sm text-text-dim font-mono flex-1">
      {editorState.bgColor === "transparent"
        ? "transparent"
        : editorState.bgColor}
    </span>
    <span class="text-xs uppercase tracking-wider text-accent">
      {isEditing ? "Hide" : "Edit"}
    </span>
  </button>

  <div class="flex justify-end">
    <button
      class="text-sm text-text-dim border border-border px-3 py-1.5 hover:border-border-bright hover:text-text {editorState.bgColor ===
      'transparent'
        ? 'border-accent-secondary text-accent-secondary'
        : ''}"
      style="border-radius: 4px;"
      onclick={() => {
        editorState.bgColor =
          editorState.bgColor === "transparent" ? "#0a0a0f" : "transparent";
        closeEditor();
        maybeCloseOverlay();
      }}
    >
      {editorState.bgColor === "transparent" ? "Transparent" : "Clear"}
    </button>
  </div>

  {#if isEditing}
    <div
      class="mt-2 p-3 border border-border-bright"
      style="border-radius: 4px;"
    >
      <div class="flex justify-end mb-2">
        <button
          class="px-3 py-1 text-xs uppercase tracking-wider border border-border text-text-dim hover:border-border-bright hover:text-text"
          style="border-radius: 4px;"
          onclick={() => {
            closeEditor();
            maybeCloseOverlay();
          }}
        >
          Close
        </button>
      </div>
      <ColorPicker
        target="background"
        onClose={() => {
          closeEditor();
          maybeCloseOverlay();
        }}
        autoCloseOnSelect={false}
      />
    </div>
  {/if}
</div>
