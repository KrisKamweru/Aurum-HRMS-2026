# Aurum HRMS — Design System

> **Visual north star**: Showcase Design 6 ("Dark Precision")
> **Scope**: App-wide. Every component, layout, and page.
> **Status**: Living document. Update as the system evolves.

---

## 1. Design Ethos

**"Dark precision with glass clarity."**

The Aurum design language is built on three pillars:

1. **Structured confidence** — Swiss-grid discipline. Clean columns, consistent gutters, clear visual hierarchy. Data-dense screens should feel organized, not overwhelming. Grids are sharp and angular, with a focus on clarity and precision. They contrast with the flowing nature of glasmorphism in a consistent beautiful way
2. **Glass surfaces** — Frosted, translucent card surfaces with subtle borders. Creates depth without noise. Backdrop-blur gives a premium, layered feel.
3. **Brand red as a focused weapon** — `#861821` is the hero. It appears in CTAs, active states, highlighted metrics, and section accents. It is *never* spread thin across backgrounds or large surfaces (except intentional banner sections). When the eye hits red, it should mean something.

**Tone**: Corporate-premium. Not playful, not cold. Think: *"the finance team trusts it, the CEO is impressed by it."*

**What we are NOT**:
- Generic SaaS with purple gradients
- Flat and lifeless "enterprise gray"
- Overly decorative or illustrative

---

## 2. Color System

### 2.1 Brand Primary — Burgundy (rebuilt around `#861821`)

The user-specified brand color is `#861821`. The current app uses a burgundy palette centered on `#8b1e3f`. These need to converge. The new palette is generated from `#861821` as the 700 anchor:

| Token          | Hex       | Usage                                           |
| -------------- | --------- | ----------------------------------------------- |
| `burgundy-50`  | `#fef2f3` | Tinted backgrounds, hover fills (light mode)    |
| `burgundy-100` | `#fce7ea` | Badge backgrounds, soft highlights              |
| `burgundy-200` | `#f9ced6` | Selection background, focus rings (light mode)  |
| `burgundy-300` | `#f4a3b4` | Muted accents, icon tints                       |
| `burgundy-400` | `#ec6e8a` | Secondary accent in charts/graphs               |
| `burgundy-500` | `#df4168` | Focus ring color, active indicators             |
| `burgundy-600` | `#c92a52` | Hover state for primary buttons                 |
| `burgundy-700` | `#861821` | **THE brand color.** Primary buttons, nav active, CTA fills. |
| `burgundy-800` | `#741530` | Pressed/active button states                    |
| `burgundy-900` | `#631530` | Dark-mode text accent, gradient endpoints       |
| `burgundy-950` | `#380816` | Deepest tint for gradients                      |

**CSS variable update** (`styles.css :root`):

```css
:root {
  --burgundy-700: #861821;
  /* regenerate full scale around this anchor */
}
```

**Tailwind usage**: `bg-burgundy-700`, `text-burgundy-700`, `border-burgundy-700`, etc.

### 2.2 Accent — Gold

Unchanged. Gold (`gold-400` → `#fbbf24`) is used sparingly for:
- Logo shimmer / decorative accents
- "Premium" badge variants
- Heading underline accents

### 2.3 Neutrals — Stone

The existing warm stone palette is correct. Key usage:

| Context            | Light mode     | Dark mode       |
| ------------------ | -------------- | --------------- |
| Page background    | `stone-50`     | `stone-900` / near-black (`#0b0b0b`) |
| Card surface       | `white`        | `stone-800`     |
| Primary text       | `stone-800`    | `stone-100`     |
| Secondary text     | `stone-500`    | `stone-400`     |
| Muted text         | `stone-400`    | `stone-500`     |
| Borders            | `stone-200`    | `stone-700`     |
| Dividers           | `stone-100`    | `stone-800`     |

### 2.4 Semantic Colors

| Token     | Light       | Dark        |
| --------- | ----------- | ----------- |
| Success   | `#059669`   | `#34d399`   |
| Warning   | `#d97706`   | `#fbbf24`   |
| Error     | `#dc2626`   | `#f87171`   |
| Info      | `#2563eb`   | `#60a5fa`   |

### 2.5 Glass Tokens (dark mode specific)

These are used for the glassmorphic card surfaces in dark mode. In light mode, standard opaque white cards are used.

```css
/* Dark mode glass surfaces */
--glass: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.08);
--glass-hover: rgba(255, 255, 255, 0.08);
```

**Tailwind equivalents**:
- `bg-white/5` (glass surface)
- `border-white/8` (glass border)
- `backdrop-blur-xl` (frosted effect)

In light mode, cards use:
- `bg-white` with `border border-stone-200` and `shadow-sm`

---

## 3. Typography

### 3.1 Font Family

**Change**: Replace `Inter` with `Outfit` app-wide.

Outfit is a geometric sans-serif with clean proportions that reads well at all sizes while having more character than Inter. It aligns with the "structured but not sterile" ethos.

**Implementation**:

1. Update `index.html`: Replace the Inter import with Outfit (weights 300–700).
2. Update `styles.css`:
   ```css
   :root {
     --font-display: 'Outfit', system-ui, sans-serif;
     --font-body: 'Outfit', system-ui, sans-serif;
   }
   ```
3. Update `@theme` block if font tokens are exposed there.

### 3.2 Type Scale (explicit targets)

All sizes are in `rem`. Base is `16px` (`1rem`).

| Role                    | Size        | Weight   | Tailwind class            | Notes                              |
| ----------------------- | ----------- | -------- | ------------------------- | ---------------------------------- |
| **Page title (h1)**     | `1.875rem`  | 700      | `text-3xl font-bold`      | Dashboard titles, page headers     |
| **Section heading (h2)**| `1.5rem`    | 600      | `text-2xl font-semibold`  | Card group titles, section breaks  |
| **Card heading (h3)**   | `1.125rem`  | 600      | `text-lg font-semibold`   | Individual card titles             |
| **Body text**           | `0.9375rem` | 400      | `text-[15px]`             | Paragraphs, descriptions           |
| **Table cell**          | `0.875rem`  | 400      | `text-sm`                 | Data in table rows                 |
| **Table header**        | `0.75rem`   | 600      | `text-xs font-semibold`   | Column headers, uppercase          |
| **Label / caption**     | `0.8125rem` | 500      | `text-[13px] font-medium` | Form labels, stat labels, metadata |
| **Badge / tag**         | `0.75rem`   | 600      | `text-xs font-semibold`   | Status chips, count badges         |
| **Small / fine print**  | `0.75rem`   | 400      | `text-xs`                 | Timestamps, footer text            |
| **Button text**         | `0.875rem`  | 600      | `text-sm font-semibold`   | All button variants                |
| **Nav link**             | `0.875rem`  | 500      | `text-sm font-medium`     | Sidebar and top-bar navigation     |

**Key accessibility rules**:
- **No text smaller than `0.75rem` (12px)**. This is the absolute floor.
- Body text and table cells should never go below `0.875rem` (14px).
- Use `font-medium` (500) or `font-semibold` (600) for labels — never `font-light` (300) on small text.
- Line height: body text at `leading-relaxed` (1.625) or `leading-normal` (1.5). Never `leading-tight` for multi-line body copy.

### 3.3 Letter Spacing

- Headings: `tracking-tight` (-0.02em) — keeps large text compact.
- Uppercase labels (table headers, section numbers): `tracking-wide` (0.05em) — aids readability of all-caps.
- Body: default tracking.

---

## 4. Spacing & Layout

### 4.1 Grid System

- **Max content width**: `max-w-7xl` (1280px) for main content areas.
- **Page padding**: `px-4 sm:px-6 lg:px-8` — progressive padding by breakpoint.
- **Section spacing**: `py-8 sm:py-12` between major page sections.
- **Card grid gaps**: `gap-4 sm:gap-6` — consistent across all card grids.

### 4.2 Card Spacing

- **Card padding**: `p-5 sm:p-6` for standard cards.
- **Compact cards** (stats, metric tiles): `p-4`.
- **Internal element spacing**: `space-y-4` for stacked content within a card.

### 4.3 Border Radius

| Element          | Radius            | Tailwind         |
| ---------------- | ----------------- | ---------------- |
| Page-level cards | `1rem`            | `rounded-2xl`    |
| Inner cards      | `0.75rem`         | `rounded-xl`     |
| Buttons          | `0.625rem`        | `rounded-[10px]` |
| Inputs           | `0.5rem`          | `rounded-lg`     |
| Badges / chips   | `9999px`          | `rounded-full`   |
| Avatars          | `0.5rem`          | `rounded-lg`     |

---

## 5. Surfaces & Elevation

### 5.1 Light Mode

Cards are opaque white with subtle shadows and stone borders:

```html
<div class="bg-white border border-stone-200 rounded-2xl shadow-sm">
```

Hover state (interactive cards):
```html
<div class="bg-white border border-stone-200 rounded-2xl shadow-sm
            hover:shadow-md hover:-translate-y-0.5 transition-all">
```

### 5.2 Dark Mode — Glass Surfaces

This is the signature look from Design 6. Cards become translucent with backdrop blur:

```html
<div class="bg-white border border-stone-200 rounded-2xl shadow-sm
            dark:bg-white/5 dark:border-white/8 dark:backdrop-blur-xl dark:shadow-none">
```

**Highlighted card** (e.g., a stat card with the brand accent):
```html
<div class="bg-burgundy-50 border-burgundy-200
            dark:bg-burgundy-700/12 dark:border-burgundy-700/20">
```

### 5.3 Shadows

Light mode uses the existing warm burgundy-tinted shadows (`--shadow-sm` through `--shadow-xl`).

Dark mode uses minimal shadows — the glass borders and backdrop blur provide enough depth. Set shadows to near-transparent black in `:root.dark`.

---

## 6. Component Patterns

All patterns below use Tailwind classes only. No component-level CSS except for keyframe animations.

### 6.1 Stat Card

```html
<div class="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm
            dark:bg-white/5 dark:border-white/8 dark:backdrop-blur-xl dark:shadow-none">
  <p class="text-[13px] font-medium text-stone-500 dark:text-stone-400 tracking-wide uppercase">
    Total Employees
  </p>
  <p class="text-2xl font-bold text-stone-900 dark:text-white mt-1">
    251
  </p>
  <p class="text-xs text-stone-400 dark:text-stone-500 mt-1">
    +12 this month
  </p>
</div>
```

**Highlighted variant** (brand accent):
```html
<div class="bg-burgundy-50 border border-burgundy-200 rounded-2xl p-5
            dark:bg-burgundy-700/12 dark:border-burgundy-700/20 dark:backdrop-blur-xl">
  <p class="text-[13px] font-medium text-burgundy-600 dark:text-burgundy-300 tracking-wide uppercase">
    Present Today
  </p>
  <p class="text-2xl font-bold text-burgundy-700 dark:text-burgundy-300 mt-1">
    87%
  </p>
  <p class="text-xs text-burgundy-400 dark:text-burgundy-400 mt-1">
    218 of 251
  </p>
</div>
```

### 6.2 Data Table

```html
<!-- Table header -->
<div class="grid grid-cols-[1.5fr_1fr_0.8fr_0.7fr] px-5 py-3
            border-b border-stone-100 dark:border-white/5">
  <span class="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide">
    Employee
  </span>
  <!-- ...more columns -->
</div>

<!-- Table row -->
<div class="grid grid-cols-[1.5fr_1fr_0.8fr_0.7fr] px-5 py-3 items-center
            border-b border-stone-50 dark:border-white/[0.03]
            hover:bg-burgundy-50/50 dark:hover:bg-burgundy-700/[0.06]
            transition-colors">
  <span class="flex items-center gap-3">
    <span class="w-8 h-8 rounded-lg bg-burgundy-700 text-white
                 flex items-center justify-center text-xs font-bold">
      AH
    </span>
    <span class="text-sm font-semibold text-stone-800 dark:text-white">
      Amina Hassan
    </span>
  </span>
  <span class="text-sm text-stone-600 dark:text-stone-300">Engineering</span>
  <span class="text-sm text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
    Present
  </span>
  <span class="text-sm text-stone-500 dark:text-stone-400 text-right">08:02</span>
</div>
```

### 6.3 Primary Button

```html
<button class="px-6 py-3 rounded-[10px] bg-burgundy-700 text-white text-sm font-semibold
               shadow-[0_4px_20px_rgba(134,24,33,0.35)]
               hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(134,24,33,0.35)]
               transition-all cursor-pointer">
  Start Free Trial
</button>
```

### 6.4 Glass / Secondary Button

```html
<button class="px-6 py-3 rounded-[10px] text-sm font-semibold cursor-pointer transition-all
               bg-stone-100 text-stone-700 hover:bg-stone-200
               dark:bg-white/5 dark:border dark:border-white/8 dark:text-white
               dark:hover:bg-white/8 dark:backdrop-blur-lg">
  Book Demo
</button>
```

### 6.5 Leave Request Card

```html
<div class="p-4 border-b border-stone-50 dark:border-white/[0.03]">
  <div class="flex items-center gap-3 mb-3">
    <span class="w-8 h-8 rounded-lg bg-burgundy-700 text-white
                 flex items-center justify-center text-xs font-bold">AH</span>
    <div>
      <p class="text-sm font-semibold text-stone-800 dark:text-white">Amina Hassan</p>
      <p class="text-xs text-stone-400 dark:text-stone-500">Feb 10–14</p>
    </div>
  </div>
  <div class="flex justify-between items-center ml-11">
    <span class="text-xs font-medium text-burgundy-600 dark:text-burgundy-400">Annual Leave</span>
    <div class="flex gap-2">
      <button class="px-3 py-1.5 rounded-lg bg-burgundy-700 text-white text-xs font-semibold">
        Approve
      </button>
      <button class="px-3 py-1.5 rounded-lg text-xs font-semibold
                     border border-stone-200 text-stone-500
                     dark:border-white/8 dark:text-stone-400">
        Deny
      </button>
    </div>
  </div>
</div>
```

### 6.6 Section Number (Swiss accent)

Used for marketing/landing sections. Optional in the admin dashboard.

```html
<span class="block text-xs font-semibold text-burgundy-700 dark:text-burgundy-400
             tracking-widest uppercase mb-3">
  01
</span>
```

### 6.7 Navigation (Sidebar)

Active item uses a brand-red left border and tinted background:

```html
<!-- Active -->
<a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold
          bg-burgundy-50 text-burgundy-700 border-l-3 border-burgundy-700
          dark:bg-burgundy-700/12 dark:text-burgundy-300 dark:border-burgundy-400">
  <ui-icon name="dashboard" />
  Dashboard
</a>

<!-- Inactive -->
<a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
          text-stone-500 hover:bg-stone-50 hover:text-stone-700
          dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-200
          transition-colors">
  <ui-icon name="employees" />
  Employees
</a>
```

### 6.8 Form Inputs

```html
<label class="block text-[13px] font-medium text-stone-700 dark:text-stone-300 mb-1.5">
  Email address
</label>
<input type="email"
       class="w-full px-4 py-2.5 rounded-lg text-sm
              bg-white border border-stone-200
              dark:bg-white/5 dark:border-white/8 dark:text-white
              placeholder:text-stone-400 dark:placeholder:text-stone-500
              focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20
              transition-all" />
```

### 6.9 Payroll Slip Card

```html
<div class="rounded-2xl overflow-hidden border border-stone-200 dark:border-white/8
            bg-white dark:bg-white/5 dark:backdrop-blur-xl">
  <!-- Red banner -->
  <div class="bg-burgundy-700 px-5 py-3">
    <span class="text-xs font-bold tracking-[0.2em] text-white">SALARY SLIP</span>
  </div>
  <!-- Employee row -->
  <div class="flex items-center gap-3 px-5 py-4 border-b border-stone-100 dark:border-white/5">
    <span class="w-10 h-10 rounded-lg bg-burgundy-100 dark:bg-burgundy-700/25
                 text-burgundy-700 dark:text-burgundy-300
                 flex items-center justify-center text-sm font-bold">JD</span>
    <div>
      <p class="text-sm font-semibold text-stone-800 dark:text-white">James Doe</p>
      <p class="text-xs text-stone-400 dark:text-stone-500">Senior Engineer</p>
    </div>
  </div>
  <!-- Two-column breakdown -->
  <div class="grid grid-cols-2">
    <div class="p-5 border-r border-stone-100 dark:border-white/5">
      <p class="text-xs font-semibold tracking-widest uppercase text-stone-400
                dark:text-stone-500 mb-3">Earnings</p>
      <div class="flex justify-between py-1.5 text-sm text-stone-600 dark:text-stone-300">
        <span>Basic Salary</span><span>KES 180,000</span>
      </div>
      <!-- ...more rows... -->
      <div class="flex justify-between py-1.5 text-sm font-bold text-stone-900 dark:text-white
                  border-t border-stone-100 dark:border-white/5 mt-2 pt-3">
        <span>Gross Pay</span><span>KES 225,000</span>
      </div>
    </div>
    <!-- Deductions column mirrors structure -->
  </div>
</div>
```

---

## 7. Dark Mode & Light Mode Strategy

### 7.1 Mechanism (unchanged)

- `ThemeService` manages `.dark` class on `<html>`.
- Tailwind `dark:` variants applied in templates.
- CSS variables in `:root` vs `:root.dark` for non-Tailwind overrides (shadows, scrollbar, autofill).

### 7.2 Dark Mode Specifics

- **Background**: Near-black (`#0b0b0b` or `stone-900`) — NOT pure `#000`.
- **Surfaces**: Glass (`bg-white/5 backdrop-blur-xl border-white/8`).
- **Text**: `stone-100` primary, `stone-400` secondary, `stone-500` muted.
- **Glow**: Subtle radial glow (`rgba(134,24,33,0.35)`) behind hero sections and CTAs.
- **Shadows**: Minimal. Glass borders provide depth. Disable most box-shadows.

### 7.3 Light Mode Specifics

- **Background**: Warm off-white gradient (`stone-50` → `stone-100`).
- **Surfaces**: Opaque `bg-white` with `border-stone-200` and `shadow-sm`.
- **Text**: `stone-800` primary, `stone-500` secondary, `stone-400` muted.
- **Brand red**: Same `burgundy-700` everywhere. No lightening.
- **Shadows**: Warm burgundy-tinted shadows (existing `--shadow-*` tokens).

### 7.4 Light Mode Glass Alternative

In light mode, instead of `backdrop-blur` glass, use:
- Solid white backgrounds with borders and shadows.
- On interactive elements (e.g., metric strip), a subtle `bg-stone-50` or `bg-white` with `shadow-sm` instead of transparency.

---

## 8. Motion & Animation

### 8.1 Page Load

- Shell fades in with `opacity 0 → 1` over 500ms.
- Hero content staggers in with `translateY(20px) → 0` using CSS `transition-delay` via `style="--d:0.2s"`.

### 8.2 Scroll Reveals

Use `IntersectionObserver` (threshold `0.08`) to add `.visible` class:

```css
.reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
.reveal.visible { opacity: 1; transform: none; }
```

This is primarily for marketing/landing pages. Admin dashboard pages should NOT have scroll reveals — content should be immediately visible.

### 8.3 Micro-interactions

- **Buttons**: `hover:-translate-y-0.5 transition-all` (subtle lift).
- **Table rows**: `hover:bg-burgundy-50/50 dark:hover:bg-burgundy-700/[0.06] transition-colors`.
- **Cards (interactive)**: `hover:shadow-md hover:-translate-y-0.5 transition-all`.
- **Nav items**: `transition-colors` on background and text.

### 8.4 Reduced Motion

Existing `@media (prefers-reduced-motion: reduce)` in `styles.css` already disables animations. Ensure all new transitions use Tailwind's `transition-*` utilities, which are affected by this media query.

---

## 9. Applying to the Current App

### 9.1 What changes globally

| Area                    | Current                                        | Target                                              |
| ----------------------- | ---------------------------------------------- | --------------------------------------------------- |
| **Font**                | Inter (all weights)                            | Outfit (300–700)                                    |
| **Brand primary**       | `#8b1e3f` (burgundy-800)                       | `#861821` (burgundy-700, the new anchor)            |
| **Dark bg**             | `stone-900` (`#1c1917`)                        | Near-black `#0b0b0b` for page, `stone-800` for cards |
| **Card style (dark)**   | Opaque `stone-800`                             | Glass: `bg-white/5 backdrop-blur-xl border-white/8` |
| **Card style (light)**  | `bg-white shadow-md` (mostly unchanged)        | `bg-white shadow-sm border-stone-200` (softer)      |
| **Min font size**       | Some text at `0.5rem` (8px)                    | Floor of `0.75rem` (12px), body min `0.875rem`      |
| **Button radius**       | Mixed (`rounded-md`, `rounded-lg`)             | Consistent `rounded-[10px]`                         |
| **Card radius**         | `rounded-xl`                                   | `rounded-2xl` for page-level, `rounded-xl` for inner|

### 9.2 File-by-file migration checklist

#### `src/index.html`
- Replace the Google Fonts link. Strip out all showcase-specific fonts (Syne, Space Mono, Fraunces, etc.). Keep only Outfit:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  ```

#### `src/styles.css`
1. Replace `@import url(...)` for Inter with nothing (font loaded via `<link>` in HTML).
2. Update `:root` font tokens:
   ```css
   --font-display: 'Outfit', system-ui, sans-serif;
   --font-body: 'Outfit', system-ui, sans-serif;
   ```
3. Regenerate `--burgundy-*` palette around `#861821` as the 700 value.
4. Update `:root.dark body` background to `#0b0b0b`.
5. Update `.card-glass` dark override to use `bg-white/5 backdrop-blur-xl`.
6. Audit all global utility classes for font sizes below `0.75rem` — bump them up.

#### `src/app/layouts/main-layout/main-layout.component.ts`
- Update sidebar nav items to match Section 6.7 patterns.
- Update dark mode background classes on the main content area.
- Ensure the sidebar uses glass surface in dark mode.

#### Shared components (`src/app/shared/components/`)

- **`ui-button`**: Update `getClasses()` to use `rounded-[10px]`, `text-sm font-semibold`, and the new `burgundy-700` based colors. Ensure minimum `py-2.5` for touch targets.
- **`ui-card`**: Update the `glass` variant to use `dark:bg-white/5 dark:border-white/8 dark:backdrop-blur-xl`. Default variant: `bg-white border-stone-200 shadow-sm rounded-2xl`.
- **`ui-modal`**: Ensure backdrop uses `backdrop-blur-sm` and modal panel uses the glass surface in dark mode.
- **`ui-data-table`**: Apply Section 6.2 table patterns. Minimum `text-sm` for cells, `text-xs` for headers.
- **`ui-form-field`**: Update label to `text-[13px] font-medium`.
- **`ui-badge`**: Ensure `text-xs font-semibold` minimum.

#### Feature components (dashboard, attendance, payroll, etc.)
- Replace any inline `text-[#8b1e3f]` with `text-burgundy-700`.
- Replace any inline `bg-[#8b1e3f]` with `bg-burgundy-700`.
- Audit for font sizes below the floor.
- Apply glass card pattern in dark mode where cards are currently `dark:bg-stone-800`.

### 9.3 General migration rules

1. **No custom CSS for colors or spacing.** Use Tailwind utilities. The only custom CSS should be keyframe animations and complex pseudo-element decorations (e.g., shimmer, gradient-shift).
2. **No `:host` color declarations in components.** Theme colors come from Tailwind utilities referencing the global `@theme` tokens. `:host { display: block; }` is fine for layout.
3. **Dark mode is always `dark:` prefixed.** Never use `:host-context(.dark)`. It doesn't compose well with Tailwind and creates specificity issues.
4. **Prefer Tailwind arbitrary values over custom classes.** Example: `shadow-[0_4px_20px_rgba(134,24,33,0.35)]` instead of a custom `.shadow-glow-red` class.
5. **Glass surfaces are dark-mode only.** Don't apply `backdrop-blur` in light mode — it tanks performance for no visual benefit on opaque backgrounds.
6. **Scroll boundaries are internal, never page-level.** App shell uses fixed viewport (`h-dvh`/`overflow-hidden`), while feature containers, modal bodies, and table wrappers own their own `overflow-y-auto`/`overflow-x-auto` behavior.

---

## 10. Accessibility Checklist

| Requirement                    | Target                                                       |
| ------------------------------ | ------------------------------------------------------------ |
| **Minimum font size**          | `0.75rem` (12px) absolute floor. Body: `0.875rem`+.         |
| **Contrast (normal text)**     | ≥ 4.5:1 against background (WCAG AA).                       |
| **Contrast (large text/bold)** | ≥ 3:1 against background.                                   |
| **Touch targets**              | Minimum `40px` height for all interactive elements.          |
| **Focus indicators**           | `focus-visible:ring-2 ring-burgundy-500 ring-offset-2`.     |
| **Reduced motion**             | All animations disabled via `prefers-reduced-motion: reduce`.|
| **Color not sole indicator**   | Status uses color + text label (e.g., green dot + "Present").|
| **Keyboard navigation**        | All interactive elements reachable via Tab.                  |

---

## 11. Reference: Design 6 Showcase

The showcase component at `/6` (`ShowcaseSixComponent`) is the living reference implementation. It demonstrates:

- Glass card surfaces with data tables
- Brand-red stat highlighting
- Leave approval queue layout
- Payroll slip card
- Module grid
- Scroll-reveal animations
- Responsive breakpoints

When implementing new features, compare against `/6` for visual consistency.

> **Note**: The showcase uses custom CSS because it's a self-contained demo page. Production app components should use Tailwind classes as described in this document. The showcase is the *what it looks like* reference; this document is the *how to build it* reference.
