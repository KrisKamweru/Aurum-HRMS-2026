# Design Six Showcase vs Current Dashboard — Bones Analysis

Comparison of the **structural and visual “bones”** of the Design Six reference (`/6`) vs the live Admin Dashboard, based on full-page scroll screenshots of both.

---

## 1. What Was Captured

**Design Six (`/6`)** — 5 screenshots from top to bottom:
1. **Hero** — Nav, “Precision meets elegance”, CTAs, metrics strip (10,000+, 99.9%, 150+, &lt;50ms).
2. **Dashboard mock (section 01)** — Single glass frame: topbar (logo, “Dashboard”, time, avatar), 4 stat cells (one highlighted “Present Today”), “Today’s Attendance” table + “Pending Leave” panel side by side.
3. **Payroll (section 02)** — “Payroll, demystified” copy + Salary Slip card.
4. **Platform modules (section 03)** — 6 cards in a grid + CTA card “Ready to modernize your HR?”.
5. **CTA + footer** — “Start Free Trial”, Aurum HRMS, © 2026.

**Current Admin Dashboard** — 1 full-page screenshot:
- Sidebar (nav, profile, theme/settings/sign out) + main area: “Admin Dashboard” title, welcome line, date badge, 4 stat cards (Total Employees highlighted), 2 action cards (Pending Leave Requests, Pending Resignations).

---

## 2. Structural Bones — Side-by-Side

| Bone | Design Six (showcase) | Current dashboard |
|------|------------------------|-------------------|
| **Page type** | Marketing/landing: nav → hero → strip → sections → CTA → footer. | App screen: sidebar + single main content area. |
| **Sectioning** | Numbered sections (“01”, “02”, “03”) + h2 + short description. | One page title + welcome line; no section numbers or section descriptions. |
| **Content width** | Nav ~1100px; strip/dash-frame ~1000px; hero copy ~620px. | Main content: `max-w-7xl` (1280px) with `px-4 sm:px-6 lg:px-8`, `py-8 sm:py-12`. |
| **Dashboard “container”** | One **unified glass frame** (topbar + stats row + table + leave panel). | **Separate cards**: stats grid + two action cards; no single wrapping frame. |
| **Stats** | 4 cells **inside** the frame, same row, borders between; one cell with burgundy highlight (`.hl`). | 4 **standalone** cards in a grid; first card (Total Employees) uses highlighted burgundy variant. |
| **Data density** | Table (“Today’s Attendance”) + leave list in one view; “control room” feel. | No table on dashboard; two lists (pending leave, pending resignations) in two cards. |
| **Topbar** | Inside the mock: logo, “Dashboard”, time, avatar. | No content topbar; date lives in a badge in the header; avatar in sidebar. |

---

## 3. Typography & Hierarchy

| Element | Design Six (in-component CSS) | Design doc (SHOWCASE-6-DESIGN) | Current dashboard |
|--------|-------------------------------|--------------------------------|--------------------|
| **Page/section title** | Hero h1 large; section h2 with `.sec-num` above. | Page title `text-3xl font-bold`; section h2 `text-2xl font-semibold`. | “Admin Dashboard” `text-3xl font-bold` ✓. |
| **Stat label** | Very small (e.g. `.55rem`, `.65rem`) in showcase. | `text-[13px] font-medium` (no smaller than 0.75rem in app). | `text-[13px] font-medium` uppercase ✓. |
| **Stat value** | Large, bold (e.g. `1.25rem` in frame). | `text-2xl font-bold`. | `text-2xl font-bold` ✓. |
| **Table header** | Tiny caps (e.g. `.5rem`) in showcase. | `text-xs font-semibold` (0.75rem floor). | N/A on dashboard (no table). |

**Takeaway:** The **dashboard implementation** matches the **design doc** (0.75rem floor, correct roles). The **showcase** uses some smaller sizes for dramatic effect; the app correctly follows the doc rather than those one-off values.

---

## 4. Spacing & Layout

| Rule | Design Six | Current dashboard |
|------|------------|--------------------|
| **Section spacing** | Large blocks (e.g. `3rem 2rem 5rem` for dashboard section). | `space-y-10 sm:space-y-12` between header, stats, action cards ✓. |
| **Card grid gap** | Consistent gaps in strip and mod-grid. | `gap-4 sm:gap-6` for stats and action cards ✓. |
| **Card padding** | Frame internal padding (e.g. `1.25rem` stat cells). | Stat cards `p-5`; action cards use `px-5 py-4` header, `px-5 py-3` rows ✓. |
| **Border radius** | Frame `14px`; buttons `10px`. | Cards `rounded-2xl`; design doc specifies `rounded-2xl` for page-level cards ✓. |

The dashboard aligns with the design doc’s spacing and radius; the showcase is in the same spirit with slightly different numbers.

---

## 5. Surfaces & Glass

| Surface | Design Six | Current dashboard |
|---------|------------|--------------------|
| **Background** | Near-black `#0b0b0b`; CSS vars for glass. | Dark main area; sidebar and cards use `dark:bg-white/5`, `dark:border-white/8`, `dark:backdrop-blur-xl` ✓. |
| **Highlighted stat** | One cell with `rgba(134,24,33,0.12)` and accent value color. | First stat card: `dark:bg-burgundy-700/12 dark:border-burgundy-700/20` ✓. |
| **Cards** | Single frame = one glass panel; module cards = glass blocks. | Each stat and action card is its own glass card ✓. |

Both use the same **glass + burgundy highlight** idea; dashboard uses it per card instead of one big frame.

---

## 6. Gaps (Dashboard vs Showcase “Ideal”)

1. **No single “dashboard frame”**  
   The showcase presents the dashboard as **one** glass panel (topbar + stats + table + leave). The app uses separate cards. Unifying the main content into one frame (with optional topbar) would bring the “control room” feel closer to the reference.

2. **No “Today’s Attendance” table on dashboard**  
   The showcase mock includes a table in the main view. The live dashboard only has stat cards and two list cards. Adding a compact “Today’s Attendance” (or similar) table would align structure and density with Design Six.

3. **No section numbering**  
   The showcase uses “01”, “02”, “03” and short section descriptions. The dashboard is a single block. If we add more sections later (e.g. “Reports”, “Alerts”), reusing numbered sections + descriptions would reinforce the Design Six hierarchy.

4. **Content max-width**  
   Showcase uses ~1000–1100px for the main content; app uses `max-w-7xl` (1280px). Both are constrained; 1280px is doc-compliant and gives more room for data. No change required unless we want a tighter “showcase” width.

5. **Topbar (logo, time, avatar)**  
   The mock has a small topbar inside the frame. The app uses the sidebar for identity and a date badge in the header. Matching the showcase would mean adding an optional in-content topbar; current approach is consistent with a sidebar-first app layout.

---

## 7. Summary

| Aspect | Match | Notes |
|--------|--------|--------|
| **Colors & glass** | ✓ | Burgundy, glass, highlighted stat. |
| **Typography (doc)** | ✓ | Dashboard follows doc; showcase has smaller “hero” sizes. |
| **Spacing (doc)** | ✓ | Section spacing, card gaps, padding. |
| **Stats pattern** | ✓ | 4 metrics, first highlighted. |
| **Containment** | ✗ | Showcase = one frame; app = separate cards. |
| **Data density** | ✗ | No attendance table on dashboard. |
| **Section hierarchy** | ✗ | No “01” style numbering/descriptions. |

**Bottom line:** The **visual language** (colors, glass, typography, spacing) of the current dashboard matches the design doc and the feel of Design Six. The main **structural** differences are: (1) one unified dashboard frame vs separate cards, (2) no in-dashboard table, and (3) no numbered section pattern. Closing those would align the “bones” of the dashboard with the Design Six reference while keeping the doc as the single source of truth for tokens and typography.
