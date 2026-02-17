# 16px - Pixel Art Editor

A 100% client-side pixel art editor with a retro-future aesthetic.

## Features

- 16x16, 32x32, 64x64, 128x128 canvas sizes
- Drawing tools: Pen, Eraser, Fill, Eyedropper
- Color picker with RGB, Hex, HSL inputs + alpha/transparency
- 16-color default palette
- Undo/Redo (Cmd+Z / Cmd+Shift+Z)
- Keyboard shortcuts (B=Pen, E=Eraser, G=Fill, I=Eyedropper)
- Image import (PNG, JPG, GIF, SVG, HEIC, AVIF, WebP)
- Export as PNG, SVG, JPG, WebP, GIF with transparency/background options
- Canvas background preview color
- Touch support for mobile/tablet
- Dark mode, retro-future arcade aesthetic

## Tech Stack

- Astro + Svelte 5 + TypeScript
- TailwindCSS v4
- pnpm

## Commands

| Command        | Action                               |
| :------------- | :----------------------------------- |
| `pnpm install` | Install dependencies                 |
| `pnpm dev`     | Start dev server at `localhost:4321` |
| `pnpm build`   | Build to `./dist/`                   |
| `pnpm preview` | Preview production build             |
