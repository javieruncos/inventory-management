---
name: Inventory Login — Dashboard-aligned
colors:
  background: '#f6f8fc'
  surface: '#ffffff'
  surface-container-low: '#f8fafc'
  surface-container: '#fafbfe'
  on-surface: '#0b1c30'
  on-surface-variant: '#5e6f87'
  outline: '#eef1f6'
  outline-variant: '#e2e8f0'
  primary: '#5b5fc7'
  on-primary: '#ffffff'
  primary-container: '#eef2ff'
  on-primary-container: '#4f46e5'
  success: '#10b981'
  success-text: '#047857'
  success-container: '#ecfdf5'
  warning: '#f59e0b'
  warning-text: '#b45309'
  warning-container: '#fffbeb'
  error: '#ef4444'
  error-text: '#b91c1c'
  error-container: '#fef2f2'
  neutral: '#94a3b8'
  neutral-text: '#475569'
  neutral-container: '#f1f5f9'
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
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.025em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
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
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.25rem
  lg: 0.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 2.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
---

## Purpose

Este documento describe la identidad visual del Login de Inventory Management. El Login **no es una marca separada**: reutiliza la identidad cromática real del Dashboard.

La fuente de verdad es el sistema implementado del Dashboard:

- `src/app/globals.css`
- `DESIGN.md`
- `src/assets/reference/dashboard-reference.png`

Este documento no autoriza colores, superficies, sombras ni acentos fuera de esa identidad.

## Brand & Style

El Login comparte el lenguaje del Dashboard:

- canvas operacional claro
- superficies blancas
- bordes sutiles
- acento índigo
- jerarquía tipográfica fuerte
- elevación muy sutil

No utilizar:

- tema oscuro
- estética obsidiana
- acento esmeralda como color de marca
- azul de foco ajeno al sistema
- glassmorphism, neumorphism o gradientes decorativos
- métricas, marcas o estados inventados

## Colors

### Surfaces

- **Canvas base (`#F6F8FC`)**: fondo general del Login y de la columna de formulario.
- **Panel de marca (`#FAFBFE`)**: fondo de la columna izquierda; coincide con `surface-shell` del Dashboard.
- **Surface (`#FFFFFF`)**: card de capacidades, topbar pill, logo e inputs.
- **Nested surface (`#F8FAFC`)**: chips internos de capacidades y estados de hover.

### Boundaries

- **Border (`#EEF1F6`)**: separadores, cards y panel.
- **Strong border (`#E2E8F0`)**: inputs, logo y perímetros interactivos.
- **Divider (`#F1F5F9`)**: divisiones internas finas.

### Text

- **Primary text (`#0B1C30`)**: títulos, valores de input y contenido principal.
- **Labels / strong secondary (`#334155`)**: labels de formulario, subtítulos de marca y capacidades.
- **Secondary (`#5E6F87`)**: párrafos, ayudas y footer sobre canvas.
- **Placeholder (`#5E6F87`)**: placeholders sobre superficies blancas.
- No utilizar `#94A3B8` como texto significativo: su contraste sobre blanco es insuficiente.

### Accent

- **Primary (`#5B5FC7`)**: CTA, foco, iconos de marca, dot del portal y estados activos.
- **Primary hover (`#4F46E5`)**: hover del CTA y del acento.
- **Primary soft (`#EEF2FF`)**: fondos de selección o información.
- **On primary (`#FFFFFF`)**: texto e iconos sobre el CTA.

### Semantics

- **Success**: background `#ECFDF5`, text `#047857`, indicator `#10B981`.
- **Warning**: background `#FFFBEB`, text `#B45309`, indicator `#F59E0B`.
- **Error**: background `#FEF2F2`, text `#B91C1C`, indicator `#EF4444`.
- **Archived / neutral**: background `#F1F5F9`, text `#475569`, indicator `#94A3B8`.
- **Information**: no dedicated token. Reutilizar `primary-soft` + `primary`.

`#10B981` es éxito, no marca. No debe utilizarse como color principal del CTA.

### Focus

- Focus visible: `#5B5FC7`, anillo de 2px, offset de 1–2px según componente.
- No utilizar `#3B82F6`.

## Layout

- Desktop y tablet: dos columnas 50/50.
- La columna izquierda contiene marca, propuesta de valor, card de capacidades y footer.
- La columna derecha contiene el formulario.
- Mobile: columna única; el panel de marca se compacta y se oculta el caption redundante.
- Mantener las alturas, spacing, tipografía y breakpoints existentes.
- Estado normal: sin scroll en las resoluciones soportadas.
- Alturas insuficientes o errores: scroll interno como fallback, sin ocultar contenido.
- Targets táctiles: inputs 44/48px, CTA 48px, toggle 44×44px.

## Components

### Brand panel

- Background `surface-container` (`#FAFBFE`).
- Borde derecho `#EEF1F6`.
- Card de capacidades blanca, borde `#EEF1F6`, sombra `shadow-card`.
- Chips internos `#F8FAFC`.
- Iconos y dot en `#5B5FC7`.
- Texto principal `#0B1C30`; secundario `#5E6F87`.

### Form

- Panel derecho sobre canvas `#F6F8FC`.
- Inputs blancos, borde `#E2E8F0`, texto `#0B1C30`, placeholder `#5E6F87`.
- Focus `#5B5FC7`.
- CTA `#5B5FC7` con texto blanco y hover `#4F46E5`.
- Toggle de contraseña `#5E6F87`, hover `#0B1C30`, focus `#5B5FC7`.
- Error de campo `#B91C1C`.
- Alerta general: fondo `#FEF2F2`, borde rojo derivado, texto `#B91C1C`.

### Elevation

- Cards: `shadow-card`.
- No utilizar sombras negras fuertes de dark mode.
- No introducir nuevas sombras.

## Accessibility

- Mantener labels visibles y asociados.
- Mantener `aria-invalid` y `aria-describedby` en errores.
- No comunicar errores solo por color.
- Mantener foco visible y navegación por teclado.
- Mantener contraste AA en textos y CTA.
- Respetar `prefers-reduced-motion`.

## Restrictions

- No cambiar tipografía, dimensiones, spacing, radios, composición ni comportamiento responsive.
- No cambiar lógica de autenticación, formularios, validaciones, API ni estados.
- No usar colores fuera de la paleta del Dashboard.
- No usar el Login para introducir una segunda identidad visual.
