---
name: ui-components
description: UI Component context — building, styling, and composing UI components with Tailwind v4, ShadCN (BaseUI), and clean semantic HTML in an Epic Stack React Router v7 app. Triggers for: "follows convention", "build a component", "add a component", "style this", "create a UI", "write a component", "add styles", "refactor component", "WithClassName", "add className prop", "className passthrough", "component props".
user-invocable: true
---

# UI Component Development — It's Our Money

This is an **Epic Stack** app (React Router v7, Express, Tailwind v4, Vitest) using **ShadCN with BaseUI** (not Radix) as the component primitive layer. Components live in `app/components/ui/`. Prefer **clean semantic HTML** — use the right element for the job before reaching for a generic `div`.

## Stack

| Layer                | Choice                                                                       |
| -------------------- | ---------------------------------------------------------------------------- |
| Framework            | React Router v7 (no Next.js — no `"use client"` needed)                      |
| Styling              | Tailwind v4 — CSS-variable-first, no `tailwind.config.js`                    |
| Component primitives | ShadCN default style, **BaseUI** (`@base-ui/react/*`)                        |
| Icons                | SVG spritesheet via `<Icon name="..." />` (`app/components/ui/icon.tsx`)     |
| Forms                | `conform` + Zod schemas                                                      |
| Path aliases         | `@/ui/*` → `app/components/ui/*` · `@/*` → `app/*` · `@/types/*` → `types/*` |
| CSS entry            | `app/styles/tailwind.css`                                                    |

## Simple, robust, and declarative

Don't skimp on descriptive variable names that help describe what they represent.
If a value represents a fiscal year, call it `fiscalYear`, not `fY`.

Name boolean conditions for what they **mean**, not how they're derived. Extract any non-obvious condition into a named `const` before the JSX — the name replaces the comment:

```tsx
// Forces the reader to trace the data model to understand the branch
{
  !categoryField && <Icon name="lock-closed" />;
}

// Self-evident
const isNetInterest = fnId === "net_interest";
{
  isNetInterest && <Icon name="lock-closed" />;
}
```

When two render paths share the same visual structure, prefer one function with an optional parameter over two parallel implementations. The absent parameter encodes the variant — no `type` prop needed.

New components should accept `className` via `WithClassName<T>` from `@/types/ui`:

```ts
import type { WithClassName } from "@/types/ui";

function MyComponent({ value, className }: WithClassName<{ value: number }>) {
```

Use `WithClassName<T>` when the component has a tight prop shape and just needs className passthrough. Use `React.ComponentPropsWithoutRef<'el'>` instead when the component _is_ the element and should forward all HTML attributes (event handlers, aria, etc.).

## Semantic HTML First

The user prefers semantic HTML. Prefer the right element over a styled `div`:

- `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>` for structure
- `<button>` (or ShadCN `Button`) for actions — never `<div onClick>`
- `<a>` for navigation — never `<button>` that pushes routes
- `<ul>` / `<ol>` / `<li>` for lists
- `<figure>` / `<figcaption>` for charts or labeled visuals
- `<dl>` / `<dt>` / `<dd>` for key-value data (budget breakdowns, stat cards)
- `<output>` for computed/live values (allocation totals, percentages)
- `<meter>` or `<progress>` for scalar values when not using a custom ShadCN component

## BaseUI vs Radix

This project uses **BaseUI** as the primitive layer. The API differs from Radix:

- Use `render` prop instead of `asChild`:

  ```tsx
  // Radix pattern (WRONG here)
  <Button asChild><Link to="/foo">Go</Link></Button>

  // BaseUI pattern (CORRECT)
  <Button render={<Link to="/foo" />}>Go</Button>
  ```

- Import from `@base-ui/react/<component>`, e.g. `@base-ui/react/button`
- Run `npx shadcn@latest docs <component>` to get BaseUI-specific docs before writing component code

## Tailwind v4 Rules

Tailwind v4 uses CSS-native configuration — no `tailwind.config.js`.

- Custom tokens live in `@theme` / `@theme inline` blocks inside `app/styles/tailwind.css`
- CSS variables are defined in `:root` / `.dark` and aliased into `@theme inline` as `--color-*`
- The `dark` variant is a custom variant: `@custom-variant dark (&:is(.dark *))` — apply as `dark:*` in class names as usual
- `@utility` block defines the `container` utility
- **Never** use `space-x-*` / `space-y-*` — use `flex gap-*` or `grid gap-*`
- Use `size-*` when width and height are equal (`size-10` not `w-10 h-10`)
- Use `cn()` from `@/utils/misc` for conditional class merging — never string template ternaries

### Dynamic colors in inline styles

**`@theme inline` tokens are build-time only** — `--color-chart-1` is never written to the browser as a real CSS custom property; only the underlying `:root` variables (e.g. `--chart-1`) are live. In `style` props or any JS-constructed `var(...)`, always use the `:root` name:

```ts
group.color.replace(/^text-/, "--"); // "text-chart-1" → "--chart-1" ✓
// not "--color-chart-1" — that resolves to empty string at runtime
```

**CSS relative color syntax** lets you derive lightness/chroma variants from a live token without hardcoding separate values:

```ts
`oklch(from var(--chart-1) 0.6 0.08 h)` // same hue, mid lightness
`oklch(from var(--chart-1) calc(l + 0.15) c h)`; // relative adjustment
```

## Semantic Color Tokens

Always use semantic tokens, never raw Tailwind palette values like `bg-blue-500`.

### Standard ShadCN tokens

- `bg-background` / `text-foreground`
- `bg-card` / `text-card-foreground`
- `bg-primary` / `text-primary-foreground`
- `bg-secondary` / `text-secondary-foreground`
- `bg-muted` / `text-muted-foreground`
- `bg-accent` / `text-accent-foreground`
- `bg-destructive` / `text-destructive-foreground`
- `border-border` · `border-input` · `ring-ring`

### Project-specific tokens (civic budget palette)

- `bg-surface-2`, `bg-surface-3` — elevated surface layers
- `border-line-strong` — prominent dividers
- `text-ink-2`, `text-ink-faint` — secondary/tertiary text
- `text-you` / `bg-you-bar` / `bg-you-soft` — participant allocation (ochre)
- `text-them` / `bg-them-bar` / `bg-them-soft` — OMB actual (slate-blue)
- `text-locked` / `bg-locked-soft` — mandatory/locked outlays (olive); use for non-allocatable items like Net Interest, not generic ink tokens
- `text-success` / `bg-success-soft` — balanced state (green)

## Typography Scale

Custom text utilities defined in `@theme` (use as `text-h1`, `text-body-sm`, etc.):

`text-mega` · `text-h1` · `text-h2` · `text-h3` · `text-h4` · `text-h5` · `text-h6`  
`text-body-2xl` · `text-body-xl` · `text-body-lg` · `text-body-md` · `text-body-sm` · `text-body-xs` · `text-body-2xs`  
`text-caption` (semibold) · `text-button` (bold, small)

## Icons

Use the `<Icon>` component — never import SVGs directly:

```tsx
import { Icon } from "@/ui/icon";

<Icon name="check" className="size-4" />;
```

Add new icons with `npx sly add`. See `docs/icons.md` for the full catalog.

## Forms

Forms use `conform` + Zod. The `ConformSlider` component (`app/components/ui/conform-slider.tsx`) wires a range input to conform field metadata. Do not build custom slider/form-field integrations from scratch.

## Installed UI Components

Located in `app/components/ui/`:

`badge` · `button` · `card` · `checkbox` · `collapsible` · `conform-slider` · `dropdown-menu` · `icon` · `input-otp` · `input` · `label` · `progress` · `slider` · `sonner` · `status-button` · `switch` · `textarea` · `tooltip`

Check this list before adding a new component via `npx shadcn@latest add`.

## Critical Rules (inherited from shadcn skill)

- **`className` for layout and semantic token application.** Don't hardcode raw palette values (`bg-blue-500`) via `className` — always use semantic tokens. Applying semantic tokens (`text-you`, `bg-them-soft`) via `className` is fine and expected.
- **No manual `dark:` color overrides.** Use semantic tokens.
- **No `z-index` on overlay components.** They handle their own stacking.
- **Dialog / Sheet / Drawer always need a Title** (use `className="sr-only"` if visually hidden).
- **Toast via sonner** — `import { toast } from "sonner"`.
- **`Separator`** instead of `<hr>` or `<div className="border-t">`.

## CSS Variables

Source of truth: [`app/styles/tailwind.css`](../../app/styles/tailwind.css). The blocks below are bounded by `/* BEGIN: CSS semantic color tokens */` / `/* END: */` comments in that file — update here when the palette changes.

```css
:root {
  --radius: 0.5rem;
  --site-max: 1280px;

  --background: oklch(93.82% 0.0144 84.58);
  --foreground: oklch(23.63% 0.012 84.56);

  --card: oklch(97.98% 0.0086 84.57);
  --card-foreground: oklch(23.63% 0.012 84.56);

  --popover: oklch(97.98% 0.0086 84.57);
  --popover-foreground: oklch(23.63% 0.012 84.56);

  /* near-black warm ink */
  --primary: oklch(23.63% 0.012 84.56);
  --primary-foreground: oklch(93.82% 0.0144 84.58);

  --secondary: oklch(95.3% 0.0156 86.43);
  --secondary-foreground: oklch(23.63% 0.012 84.56);

  --muted: oklch(95.3% 0.0156 86.43);
  --muted-foreground: oklch(45.66% 0.0243 81.66);

  /* subtle ochre tint + ochre ink — the brand accent */
  --accent: oklch(93.63% 0.0298 85.56);
  --accent-foreground: oklch(50.88% 0.1009 70.01);

  --border: oklch(82.93% 0.0294 84.59);
  --input: oklch(82.93% 0.0294 84.59);
  --input-invalid: oklch(49.45% 0.1316 36.24);

  --destructive: oklch(49.45% 0.1316 36.24);
  --destructive-foreground: oklch(97.98% 0.0086 84.57);
  --foreground-destructive: oklch(49.45% 0.1316 36.24);

  /* focus ring in brand ochre */
  --ring: oklch(50.88% 0.1009 70.01);

  /* ── brand / data-viz extension (civic budget palette) ── */
  --surface-2: oklch(95.3% 0.0156 86.43);
  --surface-3: oklch(92.36% 0.0202 84.59);
  --line-strong: oklch(74.46% 0.0373 85.39);
  --ink-2: oklch(35.55% 0.0236 82.9);
  --ink-faint: oklch(50.77% 0.0288 80.97);

  --you: oklch(50.88% 0.1009 70.01); /* "yours" — ochre */
  --you-bar: oklch(62.86% 0.114 75.78);
  --you-soft: oklch(93.63% 0.0298 85.56);

  --them: oklch(44.84% 0.0713 256.29); /* "Washington" — slate */
  --them-bar: oklch(52.17% 0.0709 256.03);
  --them-soft: oklch(91.16% 0.0134 262.38);

  --locked: oklch(46.92% 0.0454 109.64); /* mandatory — olive */
  --locked-soft: oklch(90.64% 0.0201 103.69);

  --success: oklch(48.47% 0.0762 149.29); /* balanced */
  --success-soft: oklch(91.73% 0.0182 142.82);

  --chart-1: oklch(50.88% 0.1009 70.01);
  --chart-2: oklch(44.84% 0.0713 256.29);
  --chart-3: oklch(46.92% 0.0454 109.64);
  --chart-4: oklch(48.47% 0.0762 149.29);
  --chart-5: oklch(49.45% 0.1316 36.24);
}

.dark {
  --background: oklch(20.98% 0.0083 84.59);
  --foreground: oklch(94.45% 0.0172 84.59);

  --card: oklch(24.9% 0.0119 84.57);
  --card-foreground: oklch(94.45% 0.0172 84.59);

  --popover: oklch(24.9% 0.0119 84.57);
  --popover-foreground: oklch(94.45% 0.0172 84.59);

  /* light ink on dark */
  --primary: oklch(94.45% 0.0172 84.59);
  --primary-foreground: oklch(20.98% 0.0083 84.59);

  --secondary: oklch(27.94% 0.0107 73.48);
  --secondary-foreground: oklch(94.45% 0.0172 84.59);

  --muted: oklch(27.94% 0.0107 73.48);
  --muted-foreground: oklch(70.25% 0.0293 83.51);

  --accent: oklch(30.87% 0.0392 81.61);
  --accent-foreground: oklch(74.55% 0.1241 76.22);

  --border: oklch(34.4% 0.0173 78.03);
  --input: oklch(34.4% 0.0173 78.03);
  --input-invalid: oklch(57.5% 0.154 36.72);

  --destructive: oklch(57.5% 0.154 36.72);
  --destructive-foreground: oklch(94.45% 0.0172 84.59);
  /* brighter coral that reads on dark --background */
  --foreground-destructive: oklch(71% 0.1204 42.53);

  --ring: oklch(74.55% 0.1241 76.22);

  /* ── brand / data-viz extension ── */
  --surface-2: oklch(27.94% 0.0107 73.48);
  --surface-3: oklch(31.21% 0.0141 76.36);
  --line-strong: oklch(42.81% 0.0219 78.03);
  --ink-2: oklch(83.86% 0.0252 83.41);
  --ink-faint: oklch(60.47% 0.024 76.41);

  --you: oklch(74.55% 0.1241 76.22);
  --you-bar: oklch(70.73% 0.1203 75.22);
  --you-soft: oklch(30.87% 0.0392 81.61);

  --them: oklch(74.87% 0.0734 255.75);
  --them-bar: oklch(65.3% 0.0854 256.7);
  --them-soft: oklch(28.24% 0.0334 257.67);

  --locked: oklch(75.9% 0.0686 106.03);
  --locked-soft: oklch(29.62% 0.0272 107.95);

  --success: oklch(72.17% 0.1133 149.37);
  --success-soft: oklch(30.81% 0.0268 155.34);

  --chart-1: oklch(74.55% 0.1241 76.22);
  --chart-2: oklch(74.87% 0.0734 255.75);
  --chart-3: oklch(75.9% 0.0686 106.03);
  --chart-4: oklch(72.17% 0.1133 149.37);
  --chart-5: oklch(71% 0.1204 42.53);
}
```
