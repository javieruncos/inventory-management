# DESIGN.md

## 1. Visual Source of Truth

La interfaz debe tomar como referencia visual principal:

`src/assets/reference/dashboard-reference.png`

La referencia visual define principalmente:

* dirección artística
* composición
* proporciones
* jerarquía
* tipografía
* escala
* spacing
* alineaciones
* contraste
* superficies
* bordes
* radios
* navegación
* componentes
* tratamiento de datos
* comportamiento responsive observable

La referencia debe reproducirse con alta fidelidad en su lógica visual.

No se debe crear una interfaz simplemente "parecida" utilizando convenciones genéricas de dashboards o SaaS.

Cuando una decisión visual pueda resolverse observando la referencia, la referencia tiene prioridad.

El objetivo es trasladar el lenguaje visual de la referencia a todas las pantallas del producto, adaptando únicamente el contenido necesario para el dominio de gestión de inventario.

---

# 2. Visual Fidelity Rules

No introducir elementos visuales que no estén justificados por:

1. la referencia visual
2. este `DESIGN.md`
3. requisitos explícitos del usuario
4. una necesidad funcional o técnica
5. accesibilidad

Evitar por defecto:

* patrones genéricos de SaaS
* dashboards genéricos
* exceso de tarjetas KPI
* glassmorphism
* neumorphism evidente
* grids decorativos
* nodos
* círculos decorativos
* gradientes llamativos
* neón
* estética cyberpunk
* exceso de pills
* sombras exageradas
* hover effects innecesarios
* animaciones decorativas
* elementos flotantes sin función
* contenido inventado
* métricas inventadas
* clientes inventados
* testimonios inventados
* datos ficticios presentados como información real

La interfaz debe transmitir:

* precisión
* claridad
* control
* orden
* eficiencia operativa
* ligereza visual

Los efectos visuales deben reforzar la jerarquía y nunca competir con el contenido.

---

# 3. Dirección Visual

La dirección visual combina:

* minimalismo moderno
* superficies claras
* contraste limpio
* acentos índigo
* jerarquía tipográfica fuerte
* espacios generosos
* elevación muy sutil
* componentes compactos para información operativa

La interfaz debe sentirse como un **canvas operacional limpio**, no como un dashboard financiero cargado de métricas.

Las superficies deben ser predominantemente claras.

Los bordes deben tener prioridad sobre las sombras para separar superficies.

La profundidad debe utilizarse de forma sutil y funcional.

No utilizar neumorphism de forma evidente aunque la referencia utilice micro-elevaciones suaves.

---

# 4. Design System

## 4.1 Tipografía

Familia principal:

`Plus Jakarta Sans`

Utilizar la tipografía de forma consistente en toda la aplicación.

Jerarquía:

| Token          | Tamaño | Line height | Peso |
| -------------- | -----: | ----------: | ---: |
| Display        |   32px |        40px |  700 |
| Heading Large  |   24px |        32px |  600 |
| Heading Medium |   20px |        28px |  600 |
| Heading Small  |   16px |        24px |  600 |
| Stat           |   24px |        32px |  700 |
| Body Large     |   16px |        24px |  400 |
| Body           |   14px |        20px |  400 |
| Body Small     |   13px |        18px |  400 |
| Label          |   13px |        18px |  600 |
| Caption        |   12px |        16px |  500 |
| Label Small    |   11px |        16px |  600 |

Los títulos deben utilizar pesos semibold/bold únicamente cuando la jerarquía lo requiera.

Los datos numéricos importantes deben utilizar cifras tabulares cuando sea apropiado.

---

# 5. Color System

## 5.1 Colores principales

Primary:

`#5B5FC7`

Primary alternative:

`#4F46E5`

Secondary:

`#6366F1`

Success:

`#10B981`

Neutral:

`#64748B`

Canvas:

`#F6F8FC`

Surface:

`#FFFFFF`

Nested surface:

`#F8FAFC`

Border:

`#EEF1F6`

Strong border:

`#E2E8F0`

Primary text:

`#0B1C30`

Secondary text:

`#64748B`

Muted text:

`#94A3B8`

---

## 5.2 Status Colors

### In Stock

Background:

`#ECFDF5`

Text:

`#059669`

Indicator:

`#10B981`

### Low Stock

Background:

`#FFFBEB`

Text:

`#D97706`

Indicator:

`#F59E0B`

### Out of Stock

Background:

`#FEF2F2`

Text:

`#DC2626`

Indicator:

`#EF4444`

### Archived / Inactive

Background:

`#F1F5F9`

Text:

`#64748B`

Indicator:

`#94A3B8`

Los colores de estado deben utilizarse únicamente para comunicar estados reales.

No utilizar colores de estado como decoración.

---

# 6. Surfaces and Elevation

## Canvas

El fondo general debe ser:

`#F6F8FC`

No utilizar sombras sobre el canvas.

## Level 1 — Cards

Las tarjetas principales utilizan:

* background: `#FFFFFF`
* border: `#EEF1F6`
* radius: `16px`

Sombra sutil:

```text
0 4px 20px -2px rgba(99, 102, 241, 0.03),
0 2px 6px -1px rgba(15, 23, 42, 0.04)
```

## Level 2 — Popovers

Para:

* dropdowns
* menus
* active navigation elements
* floating controls

Utilizar elevación moderada:

```text
0 10px 25px -5px rgba(15, 23, 42, 0.08),
0 4px 10px -2px rgba(15, 23, 42, 0.03)
```

## Level 3 — Dialogs

Para:

* dialogs
* modals
* drawers

Utilizar:

```text
0 25px 50px -12px rgba(15, 23, 42, 0.15)
```

No aumentar las sombras para crear una sensación de profundidad innecesaria.

---

# 7. Border Radius

Sistema:

| Uso         | Radius |
| ----------- | -----: |
| Small       |    4px |
| Default     |    8px |
| Medium      |   12px |
| Large       |   16px |
| Extra Large |   24px |
| Pill        | 9999px |

Aplicación:

* cards: `16px`
* nested blocks: `12px`
* inputs: `10px`
* buttons: `10px` o pill cuando la referencia lo justifique
* badges: pill
* navegación activa: pill o forma equivalente observada en la referencia

No utilizar radios grandes indiscriminadamente.

---

# 8. Spacing

Base:

```text
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
```

Gutter estándar:

`20px`

Margen principal desktop:

`32px`

Mobile:

`16px`

El spacing debe utilizarse para reforzar la jerarquía.

No reducir espacios únicamente para introducir más contenido en pantalla.

---

# 9. Application Layout

## Sidebar

Desktop:

`250px`

Collapsed:

`76px`

La sidebar debe permanecer visualmente limpia y funcional.

La navegación activa utiliza un tratamiento visual claro basado en la referencia:

* fondo índigo/periwinkle suave
* texto índigo
* icono índigo
* forma compacta
* contraste suficiente

Navegación inactiva:

* fondo transparente
* texto slate
* iconos slate

Hover:

* superficie ligeramente diferenciada
* cambio de color sutil

No utilizar efectos exagerados.

---

## Topbar

Altura aproximada:

`68px`

Debe mantener:

* jerarquía clara
* controles funcionales
* suficiente espacio
* alineación consistente

No llenar el topbar con acciones innecesarias.

---

## Main Content

Desktop:

* padding aproximado de `32px`
* ancho máximo aproximado de `1600px`

Grid desktop:

`12 columnas`

Tablet:

`8 columnas`

Mobile:

`1 columna`

La composición debe conservar la jerarquía de la referencia independientemente del viewport.

---

# 10. Responsive

Breakpoints y comportamiento deben determinarse por necesidades reales del layout.

## Desktop

Prioridad:

* sidebar completa
* navegación completa
* grids de contenido
* tablas
* acciones visibles

## Tablet

Adaptar:

* columnas
* spacing
* ancho de cards
* navegación
* acciones

Evitar simplemente reducir tamaños.

## Mobile

Prioridad:

* contenido principal
* acciones esenciales
* lectura clara
* controles accesibles

El layout debe convertirse en una sola columna cuando sea necesario.

Las tablas de datos pueden utilizar desplazamiento horizontal cuando transformar la tabla destruiría su legibilidad.

No permitir:

* overflow horizontal accidental de la página
* textos cortados
* botones fuera del viewport
* inputs que excedan el contenedor
* cards con contenido desbordado

---

# 11. Buttons

## Primary

* background: índigo
* texto: blanco
* font weight: 600
* altura aproximada: `40px`
* radius: `10px` o pill según contexto
* padding horizontal aproximado: `20px`

Puede utilizarse un gradiente índigo muy sutil únicamente cuando sea necesario para reproducir la referencia.

No utilizar gradientes como elemento decorativo.

## Secondary

* background: blanco
* border: `#E2E8F0`
* texto: `#334155`

## Icon Action

* aproximadamente `32px × 32px`
* background: `#F8FAFC`
* icono: `#64748B`

Hover:

`#EEF2FF`

con icono índigo.

Los botones deben comunicar claramente su prioridad.

---

# 12. Badges and Status Indicators

Los badges deben ser compactos.

Altura aproximada:

`24px`

Padding horizontal aproximado:

`10px`

Radius:

`9999px`

Utilizar un pequeño indicador circular cuando esté presente en la referencia.

Los estados de inventario deben ser:

* In Stock
* Low Stock
* Out of Stock
* Archived

No crear estados visuales que no existan en el dominio.

---

# 13. Cards

Las cards deben utilizar:

* background blanco
* border sutil
* radius `16px`
* padding consistente
* sombra mínima

Las cards no deben convertirse en contenedores innecesarios.

En información de inventario puede utilizarse una superficie interna:

`#F8FAFC`

con:

* radius `12px`
* padding interno consistente

Ejemplo de contenido:

* Quantity on Hand
* Minimum Stock
* SKU
* Supplier
* Category

La card debe priorizar información relevante antes que decoración.

---

# 14. Tables

Las tablas deben priorizar:

* legibilidad
* alineación
* densidad controlada
* jerarquía
* acciones claras

Header:

* superficie muy clara
* texto uppercase cuando corresponda
* aproximadamente `11px`
* peso `600`

Rows:

* divider `#F1F5F9`
* hover sutil
* altura consistente

No introducir columnas únicamente para llenar espacio.

En mobile, permitir scroll horizontal controlado cuando sea necesario.

---

# 15. Forms

Los formularios deben ser claros y compactos.

Inputs:

* background blanco
* border `#E2E8F0`
* radius `10px`
* altura consistente
* label visible
* focus claramente identificable

Los errores deben mostrarse próximos al campo correspondiente.

No depender únicamente del color para comunicar errores.

Los campos relacionados deben agruparse visualmente.

No crear formularios visualmente complejos cuando una estructura simple sea suficiente.

---

# 16. Domain Screens

El sistema visual debe extenderse de forma consistente a:

### Dashboard

Debe proporcionar una visión operacional del inventario.

Priorizar:

* stock
* productos
* alertas de stock bajo
* movimientos recientes
* información útil para tomar decisiones

No llenar el dashboard de KPIs decorativos.

### Products

Debe permitir:

* visualizar productos
* buscar
* filtrar cuando sea necesario
* crear
* editar
* eliminar/archivar

La información principal debe ser inmediatamente identificable.

### Categories

Debe permitir:

* listar
* crear
* editar
* eliminar cuando corresponda

### Suppliers

Debe permitir:

* listar
* crear
* editar
* eliminar cuando corresponda

### Stock Movements

Debe diferenciar claramente:

* entrada
* salida
* cantidad
* producto
* motivo
* fecha

### Stock Entry / Exit

Los movimientos deben sentirse como acciones operativas claras.

La salida de stock debe comunicar adecuadamente cuando el stock disponible sea insuficiente.

No utilizar efectos visuales para ocultar estados funcionales.

---

# 17. Navigation

La navegación debe reflejar la estructura real del producto.

Secciones principales:

* Dashboard
* Products
* Categories
* Suppliers
* Stock Movements

No agregar secciones que no formen parte del producto.

La navegación activa debe proporcionar una señal visual clara de ubicación.

La navegación debe funcionar correctamente en:

* desktop
* tablet
* mobile

---

# 18. Icons

Utilizar iconografía consistente.

Preferencia:

`lucide-react`

Los iconos deben:

* comunicar función
* mantener un tamaño consistente
* respetar el peso visual de la tipografía
* utilizarse únicamente cuando aporten claridad

No utilizar iconos como decoración.

---

# 19. Motion

La animación debe ser:

* sutil
* funcional
* rápida
* consistente

Priorizar:

* cambios de estado
* apertura/cierre de elementos
* feedback de interacción
* navegación
* aparición de contenido cuando aporte claridad

Evitar:

* animaciones permanentes
* elementos flotantes
* parallax innecesario
* efectos llamativos
* transiciones decorativas

Curva preferida:

```text
[0.16, 1, 0.3, 1]
```

Debe respetarse:

`prefers-reduced-motion`

Las animaciones nunca deben dificultar la interacción ni la lectura.

---

# 20. Accessibility

La implementación debe mantener como mínimo:

* contraste suficiente
* foco visible
* navegación mediante teclado
* labels asociados a inputs
* botones con nombres accesibles
* estados no comunicados únicamente mediante color
* targets táctiles adecuados
* estructura semántica
* soporte para reduced motion

La accesibilidad no debe utilizarse como excusa para alterar innecesariamente la dirección visual de la referencia.

Cuando exista conflicto, buscar una adaptación que conserve la intención visual.

---

# 21. Content Rules

No inventar:

* métricas
* cantidades
* clientes
* proveedores
* productos
* testimonios
* estadísticas
* actividad
* estados de negocio

Los datos de ejemplo utilizados durante desarrollo deben identificarse claramente como datos de prueba cuando corresponda.

El contenido debe reflejar el dominio real de gestión de inventario.

---

# 22. Implementation Rules

Los cambios visuales importantes requieren el siguiente flujo.

## 1. Inspección

Realizar una inspección READ-ONLY del proyecto.

Revisar:

* componentes
* estilos
* assets
* estructura
* configuración
* `DESIGN.md`
* referencia visual
* implementación existente

No modificar archivos durante esta etapa.

## 2. Auditoría

Comparar la implementación existente con la referencia.

Identificar diferencias concretas en:

* layout
* tipografía
* colores
* spacing
* escala
* proporciones
* imágenes
* componentes
* navegación
* responsive
* accesibilidad

## 3. Propuesta

Presentar:

* problemas encontrados
* cambios propuestos
* archivos afectados
* componentes afectados
* elementos que se mantienen
* elementos que se eliminan
* elementos nuevos necesarios

No implementar todavía.

## 4. Aprobación

Esperar autorización explícita del usuario.

## 5. Implementación

Implementar únicamente los cambios aprobados.

No introducir cambios visuales adicionales fuera del alcance aprobado.

## 6. Validación

Validar:

* desktop
* tablet
* mobile
* overflow horizontal
* jerarquía visual
* tipografía
* spacing
* contraste
* accesibilidad básica
* estados
* navegación
* fidelidad respecto a la referencia

Si se detectan diferencias importantes, reportarlas antes de realizar cambios adicionales.

---

# 23. Design System Priority

Cuando existan contradicciones, interpretar las decisiones visuales en este orden:

1. referencia visual
2. requisitos explícitos del usuario
3. reglas de este `DESIGN.md`
4. tokens y especificaciones del sistema visual
5. necesidades funcionales
6. accesibilidad
7. convenciones generales de UI

Las convenciones genéricas de diseño nunca deben reemplazar una decisión visual explícita de la referencia.

La ausencia de una decisión en la referencia no autoriza al agente a introducir patrones genéricos de SaaS.

Cuando una decisión no esté definida, el agente debe elegir la solución más simple y coherente con el lenguaje visual existente.
