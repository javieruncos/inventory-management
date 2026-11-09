---
name: Inventory Login — Operational teal editorial split
colors:
  brand-background: '#082C2B'
  brand-deep: '#061F20'
  brand-ink: '#041718'
  brand-surface: '#12312F'
  brand-on-surface: '#F1F5F4'
  brand-on-surface-variant: '#D7E2DF'
  brand-on-surface-muted: '#A0B2AF'
  brand-on-surface-subtle: '#8FA6A1'
  brand-outline: '#263A3C'
  brand-outline-strong: '#34504D'
  background: '#FFFFFF'
  surface: '#F8FAFC'
  surface-raised: '#F1F5F9'
  on-surface: '#0B1C30'
  on-surface-strong: '#0B1C30'
  on-surface-variant: '#5E6F87'
  on-surface-muted: '#64748B'
  outline: '#E5E7EB'
  outline-strong: '#CBD5E1'
  outline-input: '#7A8AA3'
  accent-text: '#0F766E'
  primary: '#35B6A0'
  on-primary: '#061F20'
  primary-hover: '#45C4B0'
  error: '#B91C1C'
  error-container: '#FEF2F2'
  error-outline: '#EF4444'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 68px
    fontWeight: '700'
    lineHeight: 0.98
    letterSpacing: -0.035em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 1.05
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 1.1
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

Este documento define la identidad visual del Login de Inventory Management.

El Login es una **excepción deliberada y localizada** a la dirección clara del Dashboard. Reutiliza la misma marca, tipografía y contenido funcional, pero combina un panel de marca teal/grafito con un panel de formulario claro. No autoriza cambiar la identidad visual global ni los tokens compartidos de la aplicación.

La composición y la estética toman como referencia `src/assets/reference/screen.png`, adaptando únicamente el contenido real existente. No se copian métricas, funciones, marcas, estados ni certificaciones ficticias de la referencia.

## Brand & Style

- Azul petróleo profundo con gradiente tonal controlado.
- Iluminación ambiental teal, sutil y estática.
- Panel de formulario blanco con textos oscuros.
- Composición tipográfica protagonista.
- Superficies elevadas por tono y borde, no por sombras fuertes.
- Espacio negativo generoso.
- Precisión operativa, no decoración genérica.

No utilizar:

- fondos grises apagados como base del panel
- glassmorphism
- backdrop blur
- neón
- grids decorativos
- círculos flotantes
- ilustraciones o fotografías externas
- métricas, marcas, estados o funciones inventadas
- sombras negras fuertes
- animaciones constantes

## Colors

### Brand panel

- **Brand background (`#082C2B`)**: base del panel izquierdo.
- **Brand deep (`#061F20`)**: transición del gradiente y footer.
- **Brand ink (`#041718`)**: extremo profundo del gradiente.
- **Brand surface (`#12312F`)**: topbar, logo y card de capacidades.

### Form panel

- **Background (`#FFFFFF`)**: base del panel derecho.
- **Surface (`#F8FAFC`)**: inputs.
- **Surface raised (`#F1F5F9`)**: realces internos cuando sean necesarios.

### Boundaries

- **Brand border (`#263A3C`)**: separadores, cards y topbar del panel izquierdo.
- **Brand strong border (`#34504D`)**: logo y perímetros del panel izquierdo.
- **Form border (`#E5E7EB`)**: separadores del panel derecho.
- **Form strong border (`#CBD5E1`)**: perímetros de énfasis del panel derecho.
- **Input border (`#7A8AA3`)**: exclusivo de inputs; 3.35:1 sobre `#F8FAFC`.

### Text

- **Form strong (`#0B1C30`)**: títulos y valores de input del panel derecho.
- **Form default (`#334155`)**: labels y contenido principal del panel derecho.
- **Form muted (`#5E6F87`)**: párrafos y ayudas del panel derecho.
- **Form subtle (`#64748B`)**: placeholders y metadatos del panel derecho.
- **Brand strong (`#F1F5F4`)**: títulos del panel izquierdo.
- **Brand default (`#D7E2DF`)**: labels y contenido del panel izquierdo.
- **Brand muted (`#A0B2AF`)**: párrafos y ayudas del panel izquierdo.
- **Brand subtle (`#8FA6A1`)**: placeholders y metadatos del panel izquierdo.

### Accent

- **Primary (`#35B6A0`)**: fondo del CTA; se conserva exactamente.
- **Primary hover (`#45C4B0`)**: hover del CTA.
- **On primary (`#061F20`)**: texto e iconos sobre el CTA.
- **Accent text (`#0F766E`)**: eyebrow, asterisco requerido y foco sobre el panel claro.

`#F1F5F4` sobre `#35B6A0` tiene 2.29:1 y no debe usarse para texto de CTA. El CTA usa `#061F20` (6.82:1).

### Semantics

- **Error text (`#B91C1C`)**: mensajes de error sobre fondo claro; 5.91:1 sobre `#FEF2F2`.
- **Error background (`#FEF2F2`)**: alerta general.
- **Error border (`#EF4444`)**: borde de error.
- No comunicar errores solo por color.

### Focus

- Focus visible en el panel derecho: `#0F766E`, anillo de 2px, offset de 1–2px; 5.47:1 sobre blanco.
- El fallback dark de `AuthGate` conserva el foco teal `#35B6A0`.
- No utilizar azul de foco ajeno al Login.

## Layout

- Desktop y tablet (`md`, desde 768px): dos columnas 50/50.
- La columna izquierda es teal/grafito y contiene marca, propuesta de valor, card de capacidades y footer.
- La columna derecha es blanca y contiene únicamente el formulario, centrado verticalmente.
- El formulario no se envuelve en una card contenedora.
- Mobile: columna única; el panel de marca se compacta; card de capacidades y footer se ocultan.
- Mantener `w-full min-w-0` en la raíz del Login y en sus columnas para evitar que un padre flex/grid las encoja.
- No añadir `max-width` al contenedor de las columnas.
- Formulario: `max-w-[528px]`; no es un límite del layout.
- Estado normal: sin scroll en resoluciones soportadas.
- Alturas insuficientes o errores: scroll interno como fallback, sin ocultar contenido.
- Targets táctiles: inputs 44/48px, CTA 48px, toggle 44×44px.

## Components

### Brand panel

- Fondo: `.login-brand-panel` con gradiente teal y dos glows radiales de baja opacidad.
- Borde derecho `#263A3C` en desktop.
- Topbar y logo sobre `#12312F`, borde `#263A3C/#34504D`.
- H1 `Inventory Management`: `clamp(2.25rem, 4.2vw, 4.25rem)`, line-height `0.98`, tracking `-0.035em`, `text-balance`.
- Subtítulo máximo 560px, `text-pretty`.
- Card de capacidades: `.login-brand-surface`, borde `#263A3C`, radio 8px, brillo interno sutil.
- Chips de capacidades: `#082C2B`, borde `#263A3C`.
- Contenido real: Productos, Proveedores, Stock y Movimientos.
- Footer: “Acceso restringido a personal autorizado” e “Inventory Management”.

### Form

- Fondo: `.login-form-panel` blanco (`#FFFFFF`), sin gradiente ni card contenedora.
- Inputs `#F8FAFC`, borde `#7A8AA3`, texto `#0B1C30`, placeholder `#64748B`.
- Labels `#334155`; títulos `#0B1C30`; subtítulos `#5E6F87`.
- Focus `#0F766E`.
- CTA `#35B6A0` con texto `#061F20` y hover `#45C4B0`; se conserva exactamente.
- Toggle de contraseña `#5E6F87`, hover `#0B1C30`, focus `#0F766E`.
- Error de campo `#B91C1C`.
- Alerta general: fondo `#FEF2F2`, borde `#EF4444`, texto `#B91C1C`.
- No añadir SSO, recuperación de contraseña, “recordar dispositivo” ni estados de producto que no existan.

### Session fallback

- El fallback dark de `AuthGate` reutiliza los tokens `--login-*` y una sombra oscura sutil.
- Mantener los tamaños máximos actuales (420/460px); son estados de carga/error, no el Login.
- No reutilizar el fallback como contenedor del formulario.

### Elevation

- El panel izquierdo resuelve la profundidad con capas tonales, bordes y un highlight interno.
- El panel derecho no usa sombras: los inputs se separan por superficie y borde.
- No usar `shadow-card` sobre superficies dark.
- El fallback dark puede usar una sombra oscura muy difusa.

## Motion

- Una sola entrada orquestada: fade + translateY de 8–12px, 500–600ms, `cubic-bezier(0.16, 1, 0.3, 1)`.
- Sin animaciones constantes de glow, parallax ni hover excesivo.
- Respetar `prefers-reduced-motion`.

## Accessibility

- Mantener labels visibles y asociados.
- Mantener `aria-invalid` y `aria-describedby` en errores.
- Al fallar la validación, dirigir el foco al primer campo inválido; los errores generales de autenticación no mueven el foco.
- Mantener foco visible y navegación por teclado.
- Mantener contraste AA en textos y CTA.
- El panel derecho usa `color-scheme: light`; el shell izquierdo y el fallback de `AuthGate` conservan `color-scheme: dark`.
- Revisar autofill, scrollbars y controles nativos.
- Respetar `prefers-reduced-motion`.

## Restrictions

- No cambiar la familia tipográfica, los radios ni el comportamiento responsive definido en este documento.
- No cambiar lógica de autenticación, formularios, validaciones, API, rutas ni estados.
- No usar colores fuera de esta paleta en el Login.
- No modificar tokens globales del Dashboard.
- No crear componentes adicionales ni refactorizaciones generales.
- No usar estilos inline.
- No descargar ni introducir assets, fuentes o dependencias.
