---
name: Obsidian Inventory Enterprise
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#00b2d0'
  on-tertiary-container: '#003f4b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  title-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.006em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system delivers a high-precision, executive-grade workspace engineered for mission-critical supply chains and multi-node inventory orchestration. Rooted in structured minimalism and technical elegance, it prioritizes rapid spatial parsing, zero eye fatigue across extended operational shifts, and absolute typographic fidelity. 

The aesthetic reflects deep obsidian architectural planes punctuated by laser-etched dividers and tactical status emissions. Rather than relying on decorative trends or skeuomorphic distraction, the UI presents an uncompromising cockpit feel: deliberate contrast, structural grid alignment, and micro-delight derived from precision transitions and instantaneous tactile feedback. It evokes absolute operational authority, quiet confidence, and clarity under stress.

## Colors

The palette operates on calibrated atmospheric tiers, anchoring data against obsidian depths to ensure telemetry and inventory health emerge effortlessly.

### Surface Tiers
- **Canvas Base (`#0B0F17`)**: Deep obsidian substrate establishing global viewport background.
- **Surface Level 1 (`#111827`)**: Primary card containers, structured tables, and persistent panels.
- **Surface Level 2 (`#161F30`)**: Hover states, embedded summary blocks, popovers, and elevated modal panels.
- **Surface Elevated (`#1E293B`)**: Dropdown overlays, tooltip substrates, and floating control bars.

### Boundary Architecture
- **Border Subtle (`#1E293B`)**: Baseline structural containment for cards, table cell divisions, and field perimeters.
- **Border Emphasis (`#334155`)**: Interactive perimeters, active states, focused containers, and column separators.

### Accents & Semantics
- **Primary Accent (`#10B981`)**: Tactical emerald reserved for primary commits, optimal stock thresholds, synced statuses, and system affirmations.
- **Secondary Accent (`#3B82F6`)**: Corporate slate-blue for system links, structural selections, and batch execution workflows.
- **Tertiary Accent (`#06B6D4`)**: Precision cyan used exclusively for active tracking paths, telemetry, and automated sync telemetry.
- **Alert Semantics**: Danger (`#EF4444`) for critical deficits/depletions; Warning (`#F59E0B`) for inventory thresholds nearing reorder points.

## Typography

The typographic hierarchy implements a high-efficiency dual sans-serif system paired with an auxiliary monospaced engine for SKU, lot, and timestamp integrity.

- **Plus Jakarta Sans** provides architectural presence for displays, page titles, and dashboard widget headers. Its modern geometric apertures maintain crisp readability in low-luminance settings.
- **Inter** handles high-density transactional data, tabular lists, parameter readouts, and global form interfaces. Tabular lining numbers (`tnum`) must be enforced across all inventory metrics, balances, and operational tallies.
- **JetBrains Mono** surfaces serial IDs, warehouse bay coordinates, hash tags, and payload manifests.

## Layout & Spacing

Layout geometry follows an 8pt structural rhythm, operating within a 12-column adaptive grid designed for high information density dashboards and operational workflows.

- **Desktop (1440px+)**: 12-column layout, `margin: 2rem`, `gutter: 1.5rem`. Side-nav collapses into an icon rail or full drawer with fixed widths (64px collapsed, 260px expanded).
- **Tablet (768px - 1439px)**: 8-column layout, `margin: 1.5rem`, `gutter: 1rem`. Tables adopt horizontal overflow containers with sticky primary identification columns.
- **Mobile (< 768px)**: 4-column layout, `margin: 1rem`, `gutter: 0.75rem`. Visual telemetry switches from side-by-side split panels to stacked linear execution views.

Vertical balance preserves deliberate whitespace inside operational pods to prevent cognitive fatigue while maintaining tightly packed data rows within primary tracking tables.

## Elevation & Depth

Depth is established strictly via calibrated planar luminances and hairline borders, avoiding fuzzy, unfocused dropshadows that dilute dark-mode precision.

- **Level 0 (Flat)**: Substrate base (`#0B0F17`). 0px offset, bordered solely by layout boundaries.
- **Level 1 (Card / Pod)**: Surface `#111827`, wrapped in a 1px continuous hairline border (`#1E293B`). Shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.45)`.
- **Level 2 (Hover / Context Panels)**: Surface `#161F30`, 1px border (`#334155`). Shadow: `0 4px 12px 0 rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.03)`.
- **Level 3 (Modals / Overlays)**: Surface `#1E293B`, 1px border (`#475569`). Shadow: `0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)`.
- **Active Focus Rings**: Replaced by a double-strike boundary: 1px inner buffer (`#0B0F17`) combined with an outer 2px radiant edge (`#10B981` or `#3B82F6` at 100% opacity, zero blur).

## Shapes

The design system uses a tailored structural radius (`roundedness: 1`). Corners are subtly softened to prevent pixel-harshness on modern displays, while remaining sharp enough to reinforce precision engineering.

- **Base Radius (`0.25rem` / 4px)**: Input fields, checkboxes, data chips, micro-badges, and inner cell buttons.
- **Container Radius (`0.5rem` / 8px)**: Primary operational cards, modal viewports, filter popovers, and table envelopes.
- **Structural Separation**: 1px crisp dividers with zero rounded terminal caps to sustain architectural rigor.

## Components

### Buttons
- **Primary**: Solid emerald base (`#10B981`), high-contrast dark text (`#052E16`), `font-weight: 600`. Hover brings brightness elevation (`#34D399`) with subtle translated depth.
- **Secondary**: Deep charcoal background (`#161F30`), 1px border (`#334155`), slate-100 text (`#F1F5F9`). Hover shifts background to `#1E293B` and border to `#475569`.
- **Ghost / Utility**: Transparent canvas, `#94A3B8` icon/label tone. Hover engages subtle `#111827` surface fill with `#FFFFFF` text.

### Inputs & Search Bars
- Background `#111827`, 1px border (`#1E293B`), text `#F8FAFC`. Placeholder configured in `#475569`.
- Integrated keyboard hints (`⌘K`) housed in a 4px-radius `#161F30` capsule with `#64748B` monospaced lettering.
- Active state transitions border to `#3B82F6` with zero soft focus halos.

### Data Chips & Status Badges
- Compact padding (`0.125rem 0.5rem`), uppercase tracking on labels (`label-sm`).
- **In-Stock**: Tinted surface (`rgba(16, 185, 129, 0.1)`), hairline border (`rgba(16, 185, 129, 0.3)`), emerald indicator text (`#34D399`).
- **Low Stock / Warning**: Tinted surface (`rgba(245, 158, 11, 0.1)`), border (`rgba(245, 158, 11, 0.3)`), amber text (`#FBBF24`).
- **Depleted**: Tinted surface (`rgba(239, 68, 68, 0.1)`), border (`rgba(239, 68, 68, 0.3)`), crimson text (`#F87171`).

### Data Tables & Grid Systems
- **Header**: `#0B0F17` base, bottom border 1px (`#1E293B`), labels set in `label-sm` (`#64748B`).
- **Rows**: Alternating striping is rejected in favor of high-performance hover rows (`#161F30` on pointer entry). Cell borders use `#1E293B` at 0.5px. Numeric values use `Inter` tabular figures aligned flush-right.

### Inventory KPI Metric Cards
- Background `#111827`, perimeter 1px (`#1E293B`).
- Top-line metadata set in `label-md` (`#94A3B8`). Core metric set in `headline-xl` (`#F8FAFC`).
- Baseline footer features localized sparklines (monochrome `#334155` background with primary accent stroke) alongside delta chips.

### Checkboxes & Segmented Selectors
- Checkbox squares measure 16x16px, background `#111827`, 1px border `#334155`, checked state filled with `#10B981` featuring an obsidian glyph tick.
- Segmented tab arrays encased in `#0B0F17` outer frame, 1px `#1E293B` border, with the selected item surfaced on `#1E293B` alongside bright white typography.