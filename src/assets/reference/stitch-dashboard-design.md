---
name: Lumina Inventory
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464652'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777684'
  outline-variant: '#c7c5d4'
  surface-tint: '#4e52ba'
  primary: '#4246ad'
  on-primary: '#ffffff'
  primary-container: '#5b5fc7'
  on-primary-container: '#eceaff'
  inverse-primary: '#c0c1ff'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#005f40'
  on-tertiary: '#ffffff'
  tertiary-container: '#007a53'
  on-tertiary-container: '#a3ffd0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#05006d'
  on-primary-fixed-variant: '#3639a1'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  stat-counter:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

### Personality & Emotional Resonance
The design system embodies a modern, intelligent, and pristine operational canvas. Built for modern supply chain and inventory operators, it eliminates operational clutter through crisp negative space, quiet neutral backdrops, and focused visual accents. The aesthetic evokes control, precision, lightness, and modern software craft—transforming dense inventory spreadsheets into a human-friendly workspace.

### Design Movement
The design system draws from **Modern Minimalist SaaS** with subtle **Soft Neomorphic Ambient Tiers**:
- **Pure Surfaces on Cool Tinted Backdrops:** Crisp pure white surfaces float effortlessly above an ultra-light slate/periwinkle canvas (`#F6F8FC`).
- **Diffused Micro-Elevations:** Shadows are wide, feathered, and virtually weightless, avoiding heavy borders or drop shadows.
- **Intentional Focus Accents:** Functional iris and indigo tones guide user actions without cognitive overload. Status badges use delicate pastel pill surfaces paired with saturated status indicators.

## Colors

### Color Roles & Rationale
- **Primary (`#5B5FC7` / `#4F46E5`):** The signature Iris Indigo. Powers actionable CTA buttons, primary tab underlines, selected state badges, and primary key indicators.
- **Secondary (`#6366F1`):** Vibrancy shift for primary gradients, interactive hover states, and key metric icons.
- **Tertiary (`#10B981`):** Semantic success and inventory abundance indicator (e.g., In Stock, Reorder Fulfilled, Positive Throughput).
- **Neutral (`#64748B`):** Cool slate gray for secondary labels, table subheadings, breadcrumbs, and inactive nav icons.

### Surface & Border Hierarchy
- **Canvas Base:** `#F6F8FC` — creates soft contrast with surface cards without darkening the screen.
- **Surface Elevation 0 (Sidebar / Top Bar):** `#FAFBFE` with a right/bottom line `#EDF0F7`.
- **Surface Elevation 1 (Card & Containers):** `#FFFFFF` with a precise border `#EEF1F6`.
- **Sub-Surface Tier (Nested Stat Blocks):** `#F8FAFC` inside cards to demarcate secondary data points like reorder thresholds and current units.

### Semantic Status Tints
- **In Stock / Active:** Background `#ECFDF5`, text `#059669`, indicator dot `#10B981`.
- **Low Stock / Warning:** Background `#FFFBEB`, text `#D97706`, indicator dot `#F59E0B`.
- **Out of Stock / Inactive:** Background `#FEF2F2`, text `#E11D48`, indicator dot `#EF4444`.
- **Archived / Neutral:** Background `#F1F5F9`, text `#64748B`, indicator dot `#94A3B8`.

## Typography

### Character & Font Family
The typography leverages **Plus Jakarta Sans** across all levels. Its geometric proportions, balanced counters, and friendly character shapes create an interface that feels clean and modern without sacrificing numeric legibility in high-density tables.

### Tabular Numbers & Hierarchy
- **Tabular Figures:** All statistical numbers, stock counts, SKU identifiers, and currency values must utilize `font-feature-settings: 'tnum' on, 'cv05' on` to prevent column wobble across rows.
- **Heading Restraint:** Primary section titles use semi-bold (`600`) weights with slight negative tracking (`-0.015em`), avoiding aggressive heavy weights in favor of clean structure.
- **Secondary Data:** Subtitles, timestamps, and breadcrumb trails use `body-sm` (`13px`) or `caption` (`12px`) rendered in `#64748B` or `#94A3B8`.

## Layout & Spacing

### Layout Structure
- **Persistent App Shell:** Fixed or collapsible left sidebar at `250px` standard width (`76px` collapsed). Fixed top navigation header (`68px` height) with global search and notification badges.
- **Main Canvas:** A responsive fluid grid contained within a max viewport width of `1600px`, anchored with `margin` (`2rem` / `32px`) padding on desktop, collapsing to `1rem` on mobile screens.
- **Grid Density:** 
  - Desktop (>= 1200px): 12-column grid, 4-card metric strip (3 columns each) or 2-column inventory card split (6 columns each).
  - Tablet (768px - 1199px): 8-column layout, metric strip wraps to 2x2.
  - Mobile (< 768px): Single-column stacked cards with horizontal scroll for data tables.

## Elevation & Depth

### Ambient Shadow Strategy
Depth relies on ultra-soft, diffused shadows tinted with a cool slate-blue hue. Hard shadows and heavy borders are strictly avoided.

- **Level 0 (Flat Canvas):** No elevation (`#F6F8FC`).
- **Level 1 (Card & Content Blocks):** Pure `#FFFFFF` surface, framed by an ultra-subtle border `1px solid #EEF1F6` and an ambient shadow:
  `box-shadow: 0 4px 20px -2px rgba(99, 102, 241, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.04);`
- **Level 2 (Popovers, Dropdowns & Active Nav Pill):** Floating above cards:
  `box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03);`
- **Level 3 (Modal Dialogs & Drawers):** Heavy diffuse elevation:
  `box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.15);`

## Shapes

### Shape Language
The shape hierarchy emphasizes soft modern curvature (`roundedness: 2`), balancing friendliness with administrative utility:
- **Card Containers & Modules:** `16px` border-radius (`rounded-2xl`).
- **Sub-blocks & Inner Stat Wells:** `12px` border-radius (`rounded-xl`).
- **Input Fields & Action Controls:** `10px` border-radius.
- **Interactive Badges & Nav Item Highlights:** Fully rounded pills (`9999px` / `rounded-full`) for active navigation states, numeric indicators, and stock badges.

## Components

### Buttons
- **Primary Action (e.g., "+ Add Product", "+ New PO"):**
  - Gradient surface: `linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)`.
  - Radius: Pill (`9999px`) or `rounded-xl` (`12px`).
  - Height: `40px` with `px-5`, white text, bold `label-md` weight.
  - Hover: Subtle brightness lift (`brightness(1.05)`) with shadow `0 6px 16px -2px rgba(79, 70, 229, 0.35)`.
- **Secondary Action:**
  - Background `#FFFFFF`, border `1px solid #E2E8F0`, text `#334155`.
  - Hover: Background `#F8FAFC`, border `#CBD5E1`.
- **Icon Action Buttons (View, Edit, Delete):**
  - `32px × 32px` touch target, `#F8FAFC` background, icon stroke `#64748B`.
  - Hover: `#EEF2FF`, icon stroke `#4F46E5`.

### Status Badges & Pills
- **Pattern:** `height: 24px`, horizontal padding `10px`, `rounded-full`, flex alignment with `gap-1.5`.
- **Indicator Dot:** `6px × 6px` circular dot positioned before label.
- **Variants:**
  - **In Stock:** `#ECFDF5` background, `#059669` label, `#10B981` dot.
  - **Low Stock:** `#FFFBEB` background, `#D97706` label, `#F59E0B` dot.
  - **Out of Stock:** `#FEF2F2` background, `#DC2626` label, `#EF4444` dot.
  - **Pending Movement:** `#EEF2FF` background, `#4F46E5` label, `#6366F1` dot.

### Navigation Sidebar
- **Active Navigation Item:** Light periwinkle pill container (`#EEF2FF`), text `#4F46E5`, icon stroke `#4F46E5`.
- **Inactive Navigation Item:** Transparent container, `#64748B` text and icons. Hover brings `#F8FAFC` background with `#1E293B` text.
- **User Profile Anchor:** Positioned at sidebar footer; contains a `36px` circle avatar, user name, plan tag, and contextual chevron.

### KPI / Metric Summary Cards
- White `#FFFFFF` surface with `16px` border-radius and `1px solid #EEF1F6` boundary.
- Header row with icon badge, metric title (`body-sm`, `#64748B`), and kebab action menu.
- Value row with large tabular figure (`stat-counter`, `#0F172A`) paired with a trend pill badge (e.g., `+14%` in green badge).

### Inventory Data Cards & Table Rows
- **Card View:** Header presents product title, SKU code, status badge, and quick actions. Lower well (`#F8FAFC`, `rounded-xl`) neatly organizes "Quantity On Hand" and "Safety Stock Limit" side-by-side.
- **Table View:** Header row background `#FAFBFC`, uppercase `11px` bold headers. Data rows feature a `1px solid #F1F5F9` bottom divider, alternating clean whitespace hover effect (`#F8FAFC`).