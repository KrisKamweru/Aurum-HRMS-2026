# Aurum HRMS: "Frosted Clarity" Design Language

## 1. Core Philosophy & Constraints
The Aurum HRMS design language, code-named "Frosted Clarity", brings a modern, lightweight, and engaging aesthetic to the enterprise software space. Moving away from rigid, boxy, and dense ERP layouts, this design language embraces **flat glassmorphism**, organic softness, and clear visual hierarchy.

**ABSOLUTE RULE:** We must ALWAYS use Tailwind CSS utility classes for styling. No custom CSS should be written to patch things. The entire design system is built strictly within the Tailwind framework ecosystem.

**Key Characteristics:**
- **Tailwind Strictness:** 100% utility-first styling.
- **UX-Driven Organization:** Dashboards follow F or Z scanning patterns, prioritizing key metrics at the top-left, minimizing cognitive load, and progressively disclosing data.
- **Glassmorphic Layers:** Translucent surfaces with background blurs (`backdrop-filter`) rather than solid opaque blocks.
- **Soft Geometry:** Highly rounded corners on cards and interactive elements.
- **Vibrant yet Professional:** Using rich, elegant background gradients that shine through frosted glass elements, anchored by the brand's primary color.

## 2. Design Tokens

### Color Palette

**Primary Brand Color (Immutable)**
The primary color is `#852022` (Deep Burgundy). We define a full 50-950 Tailwind palette for it to ensure maintainability and broad usage across states.
- `primary-50`: `#fdf3f4`
- `primary-100`: `#fbe5e6`
- `primary-200`: `#f6c4c7`
- `primary-300`: `#ef969a`
- `primary-400`: `#e45b61`
- `primary-500`: `#d43138`
- `primary-600`: `#bb1f25`
- `primary-700`: `#9d171d`
- **`primary-800`**: `#852022` *(Base Primary)*
- `primary-900`: `#701d1f`
- `primary-950`: `#3f0c0d`

*Usage Rules:*
- Default/Active: `primary-800` (Light Mode) or `primary-600` (Dark Mode - for better contrast).
- Hover States: `primary-900` (Light) or `primary-500` (Dark).
- Foreground (Text on primary): Always `#ffffff` (`text-white`) for both light and dark modes to maintain strict contrast.

**Backgrounds & Texture (The Organic Canvas)**
To elevate the UI beyond generic flat design and make the glassmorphism truly pop, the background must have atmosphere and depth.
*Light Mode:*
- `background`: `bg-slate-50` or a subtle `bg-gradient-to-br from-slate-50 to-slate-100`. **Crucially, overlay a very subtle SVG noise/grain texture** (e.g., opacity 2-3% fixed background) to give the canvas a premium, tactile feel.
- `surface`: `bg-white/60` (The frosted glass).
- `surface-hover`: `bg-white/80`

*Dark Mode:*
- `background`: `bg-slate-950` or a `bg-gradient-to-br from-slate-900 to-slate-950`, also incorporating the subtle noise texture overlay to create a deep, rich atmosphere.
- `surface`: `bg-black/40` or `bg-white/5`
- `surface-hover`: `bg-white/10`

**Accents & Semantic Colors**
We leverage standard Tailwind palettes for all secondary constraints to avoid custom hex-code soup.
- `accent`: `amber-500` / `amber-600` - *For warnings or secondary highlights.*
- `success`: `emerald-600` / `emerald-500` - *For positive trends.*
- `info`: `slate-600` / `slate-400` - *For neutral tags.*

### Typography (Premium & Distinctive via Google Fonts)
To avoid generic "SaaS" aesthetics while maintaining strict ERP data legibility, we pair a characterful display font with a tailored, modern geometric body font.
- **Display/Headers:** `Outfit` - Used for page titles, large metric numbers, and dashboard greetings. It provides a modern, slightly soft geometric feel that perfectly complements high border-radius glass cards.
- **Body/Data:** `Plus Jakarta Sans` - Replaces generic fallbacks like Inter. It offers exceptional clarity at small sizes and perfect tabular figure support for data tables, but brings a more refined, distinctive geometry that elevates the premium feel of the app.
- **Hierarchy Rules:** 
  - Use `Outfit` at Light/Regular/Medium weights for large numbers (`text-4xl font-light`).
  - Use `Plus Jakarta Sans` for all standard text, inputs, and dense data.
  - Rely heavily on text size and weight (e.g., `text-xs font-bold uppercase tracking-wider text-muted`) to create hierarchy without cluttering color.

### Shape & Structure (Radii)
- `rounded-2xl` (1rem): Standard widgets and inner cards.
- `rounded-3xl` (1.5rem): Large containers, main layout areas, floating sidebars.
- `rounded-full`: Buttons, avatars, small badges.

## 3. Implementation: Tailwind CSS Glassmorphism

The flat frosted glass effect relies on three tailwind utilities working together: transparency, blur, and subtle borders.

### The Formula:
1. **Backdrop Blur:** `backdrop-blur-md` or `backdrop-blur-xl`.
2. **Semi-transparent Background:** `bg-white/60` (Light) or `bg-white/5` (Dark). Opacity must be adjusted so text is readable but the blur is still visible.
3. **Subtle Edge:** `border border-white/40` (Light) or `border border-white/10` (Dark). Gives the "glass" a physical edge without looking like a harsh border line.
4. **Soft Shadows:** `shadow-sm` or `shadow-[0_8px_30px_rgb(0,0,0,0.04)]` (Light).

### Component Examples

**Glass Card (Light Mode base)**
```html
<div class="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm rounded-3xl p-6">
  <!-- Content -->
</div>
```

**Glass Button (Secondary Action)**
```html
<button class="bg-white/30 backdrop-blur-sm border border-white/50 text-primary-800 rounded-full px-6 py-2 hover:bg-white/50 transition-colors dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10">
  Cancel
</button>
```

## 4. Layout, Spacing & Organization

### Spacing Core Concept: High Padding, Low Margin
To create the immersive "widget" feel seen in modern UI concepts:
- **Internal Padding (High):** Give elements lots of breathing room inside their containers (`p-6`, `p-8`). Let the content sit comfortably.
- **External Margin/Gap (Low):** Keep the space *between* the glass cards closely packed (`gap-4` or `gap-3`). Because the cards are heavily padded and lack harsh borders, tight gaps create a cohesively knit dashboard rather than scattered floating islands.

### Dashboard UX Organization
- **Top-Left Priority:** Place the most critical, high-level KPIs here (F-pattern reading).
- **Progressive Flow:** Start with a high-level overview at the top (greeting, primary aggregated numbers) and drill down into details/tables as the user scrolls.
- **Visual Grouping:** Group related metrics logically into designated glassmorphism cards rather than scattering them.
- **Data-Ink Ratio:** Maximize whitespace (Empty space improves readability). Use the primary color sparingly to draw the eye to exactly what matters.

## 5. Color Distribution (The 60-30-10 Rule)

To maintain harmony and prevent the vibrant primary color from overwhelming the user (especially in an ERP context), all UI layouts MUST adhere to the 60-30-10 color distribution rule:

- **60% Dominant (The Canvas):** The frosted glass surfaces and the subtle ambient background gradients. This forms the vast majority of the UI footprint.
  - *Light Mode:* The `bg-white/60` cards and warm body background.
  - *Dark Mode:* The `bg-black/40` or `bg-white/5` cards and deep dark backgrounds.
- **30% Secondary (The Structure):** Text, subtle delineations, secondary glass buttons, and icons. This provides readability and structural hierarchy without demanding attention.
  - *Elements:* `text-main`, `text-muted`, `border-white/40` (the glass reflections), and secondary semantic flags.
- **10% Accent (The Focus):** The immutable primary brand color `#852022` (along with critical semantic accents like amber for warning/emerald for success). This is the "pop".
  - *Usage:* IT MUST BE USED STRATEGICALLY. Reserve it strictly for primary action buttons (CTAs), active sidebar/navigation links, critical data highlights in charts, and focus rings. If everything is `#852022`, nothing is.

## 6. Motion & Animation (The "Glass Fluidity" Principle)

In complex enterprise applications, animations must serve a purpose: reducing cognitive load, confirming actions, and establishing spatial relationships. We use **subtle, fast, and eased** animations.
*Crucial Accessibility Rule:* Always respect the user's OS motion preferences. Use Tailwind's `motion-safe:` prefix for structural transitions, or ensure standard CSS transitions don't block core usability if `motion-reduce` is active.

### Macro-Animations (Page & Layout)
- **Page/Widget Load:** Elements should never simply "pop" into existence. Use a subtle "Fade and Slip" entry.
  - *Tailwind:* `motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-500 ease-out`
- **Theme Switching:** The transition between Light and Dark mode must be animated smoothly so as not to jar the user.
  - *Tailwind (on body or main wrapper):* `transition-colors duration-500`
- **Staggered Reveals:** When loading a dashboard grid, stagger the entry of the widgets organically across the F-pattern.

### Micro-Interactions (Widgets & Controls)
- **Glass Card Hover:** Lift cards slightly on hover and increase surface opacity.
  - *Tailwind:* `motion-safe:transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:bg-white/80` (Light).
- **Button Press (Tactile Feedback):** Buttons depress slightly when clicked.
  - *Tailwind:* `motion-safe:transition-transform duration-200 active:scale-95`.
- **Text & Icon Color Shifts:** Never instantly swap colors on hover. Fade them.
  - *Tailwind:* `transition-colors duration-200` (e.g., `hover:text-primary-800 transition-colors duration-200`).

### Animation Constraints
- **Duration Limits:** Micro-interactions (hovers, shifts) between `150ms` and `300ms`. Macro-interactions max out at `500ms`.
- **Easing:** Almost always use `ease-out` for incoming elements and `ease-in` for exiting elements to mimic physical deceleration.

## 7. Enterprise UX/UI Patterns (HRMS/ERP Specifics)

Because we are building a data-dense HRMS/ERP, aesthetic beauty (Glassmorphism) must never compromise usability and data throughput.

### User Flows & Navigation
- **Single-Column Focus for complex tasks:** When users are completing workflows (onboarding, performance reviews), restrict layouts to a single central column to maintain focus and reduce cognitive load.
- **Progressive Disclosure:** Don't show every filter and option at once. Use "Advanced" toggles, side-drawers (glass panes sliding in), or step-by-step logic.

### Data Tables
- **Restraint in Columns:** Only display the most vital 5-7 columns. Secondary data belongs in a "View Details" side-panel or expansion row.
- **Alignment:** Left-align text strings. Right-align numeric values (for easy scanning of totals). Center-align icons/status badges.
- **Glassmorphic Rows:** Instead of harsh zebra striping, delineate rows with a very subtle bottom border (`border-b border-black/5` or `border-white/10`) and a slight `hover:bg-white/30` (Light) or `hover:bg-white/10` (Dark) to guide the eye horizontally without adding visual noise.
- **Frozen Context:** For wide or long tables, ensure headers and the primary identifier column (e.g., Employee Name) remain sticky.

### Forms & Inputs
- **Labels outside Inputs:** Never use placeholders as the sole label. Labels sit above inputs.
- **Input Length Context:** The physical width of a text input should hint at the expected length of the answer (e.g., zip codes get short inputs, addresses get full-width).
- **Glass Inputs:** Inputs should appear as recessed or distinct glass panes, distinct from cards.
  - *Tailwind Example:* `bg-white/40 border border-white/50 focus:border-primary focus:ring-1 focus:ring-primary/50 text-main` (Light) or `bg-black/20 border border-white/10` (Dark).
- **Logical Grouping:** Group related fields together visually, and use ample spacing between different groups inside a form.

## 8. Advanced Component Architecture

### Form Layouts & Progression
- **Single-Column by Default:** Always stack form fields vertically to reduce cognitive load and mimic natural reading patterns.
- **Multi-Column Exceptions:** ONLY use multi-column (side-by-side) for logically grouped, short inputs (e.g., `City, State, Zip` or `First Name, Last Name`). Never use masonry or scattered layouts for inputs.
- **Multi-Step (Wizards) vs. Long Scrolling:**
  - If a form requires more than 8-10 fields crossing different domains (e.g., Personal Info vs. Tax Info), break it into a **Multi-Step Form with a Stepper**.
  - Keep 4-5 fields max per step. The stepper provides a psychological anchor.

### Modals vs. On-Page Workflows
- **Modals (Overlays):** Use ONLY for quick, context-dependent actions (adding a row to an existing table, quick edits, or destructive confirmations). A modal should never require its own scrollbar.
  - *Glass Constraint:* Modals must use a heavily blurred backdrop (`backdrop-sm bg-black/40`) to maintain focus while peeking at the context behind.
- **On-Page Forms:** Use for heavy data entry (creating a new Employee from scratch, complex onboarding). If a modal requires scrolling, it belongs on a dedicated page workflow.

### Button Architecture
- **Text Buttons:** The default standard. Use for clear, explicit calls to action.
- **Hybrid (Icon + Text):** Use for Primary CTAs to increase scannability (e.g., `[+] Add Employee` or `[Save Icon] Save Changes`).
- **Icon-Only Buttons:** Use EXCLUSIVELY for universally recognized actions where space is tight (Search, Edit, Delete, Close). Always include a standard hover tooltip and `aria-label` for accessibility.

### Scrolling & Overflow Management
- **Custom Scrollbars Only:** Standard OS scrollbars ruin the glass illusion. Always use custom thin scrollbars (e.g., `scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent`) mapped to the light/dark themes so they blend into the background.
- **Vertical Scroll Traps (The "View All" Rule):** Avoid "scroll trapping" (scrollable widgets inside a universally scrollable page). Instead of internal scrollbars, display the top 5-7 items in a widget and use a "View All" link to navigate to a dedicated full-page view. If an internal scroll is absolutely unavoidable, use `overflow-y-auto` with a strict `max-h-[...]`.
- **Horizontal Scrolling:** Strictly prohibited for layout elements. The ONLY exception is wide Data Tables. When used, you MUST use `sticky left-0` on the primary identifier column (like Employee Name) so context isn't lost.
- **Text Overflow:** Protect the UI from user-generated content breaking cards. Use `truncate` (single line, `text-ellipsis whitespace-nowrap`) for constrained labels, or `line-clamp-2` / `line-clamp-3` for long descriptive text.

## 9. Summary of Rules
1. **Always Tailwind, No Custom CSS.** Period. Define the `primary` 50-950 palette in `tailwind.config`.
2. **Never use solid white or solid black backgrounds for cards.** Always use opacity + backdrop-blur.
3. **Never use `#000000` or `#ffffff` for borders.** Always use low-opacity white/black for the glass reflection edge.
4. **Primary Color `#852022` is Sacred.** Use `primary-800` (Light) or `primary-600` (Dark). Use `focus-visible:ring-2 focus-visible:ring-primary-500/50` for accessible keyboard focus states without excessive rings on mouse-click.
5. **High Internal Padding, Low External Gaps.** This is the secret to a dense yet breathable glassmorphic layout.
6. **Adhere strictly to the 60-30-10 color distribution.** Keep the primary color as the 10% pop.
7. **Accessible Motion.** 150-300ms durations. Respect `motion-safe` OS preferences. Always transition light/dark modes (`transition-colors duration-500`).
8. **Usability First for Data:** Left-align text, right-align numbers. Use progressive disclosure. Don't hide labels in placeholders.
9. **Form Restraint:** Single-column by default. Use modals for quick edits, dedicated pages for heavy entry. Icon-only buttons require extreme caution.
10. **Distinctive over Generic:** Discard overused defaults (e.g., replace Inter with Plus Jakarta Sans). Use subtle noise/grain overlays to give the canvas a premium, organic texture.
