# AGENTS.md

## 1. PROPÓSITO

Este archivo establece las reglas generales que deben seguir los agentes de IA al trabajar en este proyecto.

Estas reglas tienen prioridad sobre decisiones implícitas del agente. El agente debe respetarlas durante todo el trabajo, especialmente antes de modificar archivos, instalar dependencias, ejecutar comandos o alterar la arquitectura.

---

# 2. REGLAS CRÍTICAS — NO NEGOCIABLES

## 2.1 Dependencias e instalaciones

El agente **NO debe instalar, actualizar, eliminar ni modificar dependencias por iniciativa propia**.

Está prohibido ejecutar cualquiera de los siguientes comandos sin autorización explícita del usuario:

```bash
pnpm install
npm install
yarn install
npm ci
pnpm add
npm install <package>
pnpm remove
npm uninstall
pnpm update
npm update
yarn add
yarn remove
```

También está prohibido:

* Instalar paquetes globalmente.
* Ejecutar `npm install -g`.
* Ejecutar `pnpm add -g`.
* Instalar herramientas fuera del proyecto.
* Modificar el `package.json` para agregar dependencias sin autorización.
* Modificar el lockfile como consecuencia de una instalación no autorizada.
* Descargar binarios, CLI, SDKs o herramientas adicionales sin autorización.
* Utilizar `npx` para descargar o ejecutar paquetes que no estén previamente disponibles en el proyecto sin autorización.
* Utilizar `pnpm dlx` para descargar herramientas sin autorización.

### Regla fundamental

Si una solución requiere una dependencia que no está instalada:

1. NO instalarla.
2. Informar al usuario qué dependencia sería necesaria.
3. Explicar brevemente para qué se necesita.
4. Esperar autorización explícita.
5. Solo después de recibir autorización, instalarla.

El agente debe preferir siempre resolver el problema utilizando las dependencias existentes.

---

# 3. EJECUCIÓN DE COMANDOS

El agente puede ejecutar comandos necesarios para inspeccionar, desarrollar, validar o construir el proyecto siempre que no impliquen cambios externos no autorizados.

Ejemplos normalmente permitidos:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
git status
git diff
git log
```

Sin embargo, antes de ejecutar cualquier comando debe considerar si puede:

* Descargar contenido.
* Instalar dependencias.
* Modificar archivos fuera del proyecto.
* Modificar configuraciones globales.
* Crear servicios externos.
* Realizar acciones irreversibles.

Si existe riesgo, debe solicitar autorización.

---

# 4. NO DESCARGAR CONTENIDO DE INTERNET

El agente **NO debe descargar contenido desde Internet sin autorización explícita del usuario**.

Esto incluye:

* Imágenes.
* Videos.
* Fuentes.
* Iconos.
* Assets.
* Plantillas.
* Repositorios.
* Librerías.
* Archivos.
* Modelos.
* Datos.
* APIs externas.
* Scripts.
* Recursos desde CDN.
* Assets desde URLs.
* Contenido obtenido mediante scraping.

No utilizar Internet para completar automáticamente recursos faltantes.

Si se necesita un recurso externo:

1. Informar qué recurso se necesita.
2. Indicar de dónde provendría.
3. Esperar autorización explícita.
4. Descargarlo únicamente después de la autorización.

El agente puede utilizar herramientas de consulta o documentación cuando estén disponibles para analizar información, pero no debe descargar recursos al proyecto ni modificar el proyecto basándose en contenido externo sin autorización.

---

# 5. NO CREAR BACKEND SIN AUTORIZACIÓN

El agente **NO debe crear backend, API, servidor, base de datos ni infraestructura backend sin autorización explícita**.

Está prohibido crear por iniciativa propia:

* Express.
* Fastify.
* NestJS.
* API Routes.
* Server Actions.
* Endpoints.
* Bases de datos.
* ORM.
* Prisma.
* Mongoose.
* PostgreSQL.
* MongoDB.
* Firebase.
* Supabase.
* Autenticación.
* Autorización.
* Servicios backend.
* WebSockets.
* Servidores adicionales.
* Variables de entorno relacionadas con servicios backend.

Si una funcionalidad parece necesitar backend:

1. No implementarla automáticamente.
2. Informar que requiere backend.
3. Explicar qué parte necesitaría backend.
4. Proponer una alternativa frontend/mock si resulta apropiado.
5. Esperar autorización antes de crear infraestructura backend.

---

# 6. RESPETAR LA ARQUITECTURA EXISTENTE

Antes de modificar el proyecto, el agente debe inspeccionar:

* `package.json`
* estructura de carpetas
* configuración del framework
* configuración de Tailwind
* archivos de estilos globales
* componentes existentes
* sistema de rutas
* assets existentes
* configuración de lint
* configuración de build
* `AGENTS.md`
* documentación existente
* archivos de diseño existentes

No reemplazar arquitectura existente sin una razón técnica clara.

No introducir una nueva librería o patrón simplemente porque el agente lo prefiera.

Preferir siempre:

> reutilizar → refactorizar → simplificar → crear

antes que introducir nuevas dependencias.

---

# 7. USO DE SKILLS

El agente debe utilizar las **skills disponibles** cuando sean relevantes para la tarea.

Antes de implementar una tarea importante:

1. Revisar las skills disponibles.
2. Identificar cuáles son relevantes.
3. Utilizar las skills correspondientes.
4. Aplicar sus recomendaciones al proyecto.
5. Evitar ignorar una skill relevante simplemente porque la solución parece sencilla.

Para trabajos de frontend y diseño, deben considerarse especialmente las skills relacionadas con:

* frontend design
* design systems
* UI/UX
* responsive design
* accessibility
* typography
* visual hierarchy
* motion
* Tailwind
* performance
* code quality
* React
* arquitectura frontend

### Regla importante

Las skills deben utilizarse como herramientas de análisis y criterio, no como excusa para introducir dependencias nuevas.

Si una skill recomienda una librería que no está instalada:

> NO instalarla automáticamente.

Seguir la regla de dependencias de este documento.

---

# 8. INSTRUCCIONES DE DISEÑO

El agente debe respetar todas las instrucciones de diseño establecidas por el proyecto.

Antes de diseñar o modificar una interfaz debe buscar y respetar:

* `DESIGN.md`
* `PRODUCT.md`
* documentación visual
* tokens de diseño
* `tailwind.config.*` si existe
* CSS global
* configuración de diseño
* instrucciones específicas del proyecto
* referencias visuales proporcionadas por el usuario
* decisiones de diseño tomadas anteriormente

Las instrucciones específicas del proyecto tienen prioridad sobre preferencias genéricas del agente.

---

# 9. NO CAMBIAR LA DIRECCIÓN VISUAL SIN AUTORIZACIÓN

El agente no debe cambiar arbitrariamente:

* Paleta de colores.
* Tipografía.
* Escala tipográfica.
* Sistema de spacing.
* Border radius.
* Estilo de botones.
* Estilo de cards.
* Sistema de sombras.
* Tratamiento de imágenes.
* Dirección artística.
* Estilo fotográfico.
* Animaciones.
* Layout general.
* Densidad visual.
* Identidad de marca.

Si detecta un problema visual:

1. Identificarlo.
2. Explicar el problema.
3. Proponer una solución.
4. Esperar autorización si el cambio modifica significativamente la dirección visual.

---

# 10. EVITAR DISEÑOS GENÉRICOS

No utilizar automáticamente patrones genéricos de UI.

Evitar especialmente:

* Dashboards genéricos.
* SaaS genérico.
* Cards repetitivas sin propósito.
* Gradientes utilizados como decoración automática.
* Glassmorphism innecesario.
* Neumorphism.
* Exceso de bordes redondeados.
* Hero genérico con texto centrado.
* Secciones visualmente idénticas.
* "AI slop".
* Layouts de plantilla.
* Componentes innecesariamente complejos.

El diseño debe responder al concepto específico del proyecto.

---

# 11. RESPONSIVE DESIGN

Toda interfaz debe ser evaluada en:

* Mobile.
* Tablet.
* Desktop.
* Pantallas grandes.

No asumir que un layout desktop se adapta correctamente a mobile.

Revisar especialmente:

* overflow horizontal
* alturas excesivas
* espacios vacíos
* tipografía
* imágenes
* navegación
* botones
* grids
* sticky elements
* contenido cortado
* viewport height
* orientación portrait/landscape

Si el proyecto establece que el desktop existente debe permanecer intacto, esa regla debe respetarse estrictamente.

No modificar desktop para solucionar un problema exclusivamente mobile si existe una solución específica mediante breakpoints.

---

# 12. ACCESIBILIDAD

Toda implementación debe considerar:

* HTML semántico.
* `alt` apropiado.
* `aria-*` cuando sea necesario.
* navegación mediante teclado.
* focus visible.
* contraste suficiente.
* botones y enlaces correctamente identificables.
* estados disabled.
* `prefers-reduced-motion`.

No utilizar ARIA innecesariamente.

---

# 13. MOTION Y ANIMACIONES

Las animaciones deben tener un propósito.

Evitar:

* animaciones constantes sin necesidad
* efectos exagerados
* entradas repetitivas
* parallax innecesario
* movimiento excesivo
* animaciones que dificulten la lectura

Respetar:

```css
prefers-reduced-motion
```

Si el proyecto utiliza Motion/Framer Motion, reutilizar la configuración y patrones existentes antes de crear nuevos sistemas de animación.

---

# 14. ESTILOS

No utilizar estilos inline salvo autorización explícita.

Evitar:

```jsx
style={{ ... }}
```

Preferir el sistema de estilos ya utilizado por el proyecto.

Si utiliza Tailwind:

* utilizar las clases existentes
* respetar los tokens
* reutilizar patrones
* evitar valores arbitrarios innecesarios
* no crear una segunda metodología de estilos

No introducir CSS global innecesario.

---

# 15. COMPONENTES

Antes de crear un componente nuevo, comprobar si ya existe uno reutilizable.

Evitar:

* duplicación
* abstracciones prematuras
* componentes gigantes
* componentes excesivamente genéricos
* props innecesarias
* lógica duplicada

Crear componentes cuando exista una responsabilidad clara.

No abstraer simplemente para reducir algunas líneas de código.

---

# 16. DATOS Y CONTENIDO

No inventar información importante del producto, empresa, negocio o proyecto sin indicarlo.

No crear:

* direcciones ficticias
* teléfonos ficticios
* estadísticas ficticias
* testimonios ficticios
* clientes ficticios
* certificaciones ficticias
* precios ficticios
* información empresarial falsa

Si el proyecto necesita contenido temporal:

* marcarlo claramente como placeholder
* informar al usuario
* no presentarlo como información real

---

# 17. PLACEHOLDERS Y TODO

No dejar accidentalmente:

```text
TODO
TBD
Lorem ipsum
Coming soon
Your company
Example text
href="#"
```

en una implementación final, salvo que el usuario lo haya solicitado explícitamente.

Antes de finalizar una tarea, buscar placeholders y enlaces vacíos.

---

# 18. NO MODIFICAR COSAS NO RELACIONADAS

El agente debe limitar los cambios al alcance de la tarea.

No modificar archivos no relacionados solo para:

* "mejorar" el código
* aplicar preferencias personales
* reorganizar carpetas
* cambiar nombres
* actualizar dependencias
* cambiar configuración
* refactorizar código que no forma parte de la tarea

Si detecta una mejora independiente:

1. Informarla.
2. No implementarla automáticamente.

---

# 19. PLANIFICACIÓN ANTES DE IMPLEMENTAR

Para tareas importantes, seguir este flujo:

### Paso 1 — Inspección

Analizar el proyecto existente.

### Paso 2 — Auditoría

Identificar:

* estructura
* arquitectura
* dependencias
* componentes
* diseño
* responsive
* posibles problemas

### Paso 3 — Plan

Proponer cambios concretos.

### Paso 4 — Autorización

Si la tarea implica decisiones importantes, esperar confirmación del usuario.

### Paso 5 — Implementación

Realizar únicamente los cambios aprobados.

### Paso 6 — Validación

Ejecutar las comprobaciones disponibles:

```bash
pnpm build
pnpm lint
```

o las equivalentes ya configuradas en el proyecto.

### Paso 7 — Resumen

Informar:

* qué se modificó
* qué archivos cambiaron
* qué se validó
* posibles problemas restantes

---

# 20. SI EXISTE INCERTIDUMBRE

Cuando el agente no esté seguro de una decisión importante, no debe asumir.

Debe preguntar.

Especialmente cuando la decisión afecta:

* arquitectura
* dependencias
* backend
* diseño
* contenido
* estructura de navegación
* eliminación de código
* cambios destructivos
* configuración del proyecto

---

# 21. ACCIONES DESTRUCTIVAS

No ejecutar sin autorización:

```bash
rm
rmdir
del
git reset --hard
git clean
```

ni comandos equivalentes que puedan eliminar trabajo del usuario.

No eliminar archivos, componentes o dependencias simplemente porque parecen innecesarios.

Primero informar y solicitar autorización.

---

# 22. GIT

No realizar operaciones destructivas de Git sin autorización.

No ejecutar automáticamente:

```bash
git reset --hard
git clean -fd
git push --force
git rebase
```

No crear commits automáticamente salvo que el usuario lo solicite.

Cuando el usuario solicite un commit, utilizar Conventional Commits cuando corresponda:

```text
feat:
fix:
refactor:
style:
chore:
docs:
perf:
```

---

# 23. PRIORIDAD DE LAS INSTRUCCIONES

Cuando existan múltiples fuentes de instrucciones, respetar este orden:

1. Instrucciones explícitas del usuario.
2. `AGENTS.md` del proyecto.
3. Documentación y decisiones específicas del proyecto.
4. Skills relevantes.
5. Convenciones existentes del código.
6. Buenas prácticas generales.

Nunca utilizar una preferencia genérica del agente para contradecir una decisión explícita del usuario.

---

# 24. REGLA DE AUTORIZACIÓN EXPLÍCITA

Las siguientes acciones requieren autorización explícita del usuario:

* Instalar dependencias.
* Eliminar dependencias.
* Actualizar dependencias.
* Crear backend.
* Crear base de datos.
* Crear API.
* Descargar recursos desde Internet.
* Descargar assets.
* Instalar herramientas globales.
* Modificar configuración global del sistema.
* Realizar acciones destructivas.
* Cambiar significativamente la dirección visual.
* Cambiar la arquitectura principal.
* Crear servicios externos.
* Crear cuentas o integrar servicios externos.

"Creo que sería necesario" NO equivale a autorización.

---

# 25. PRINCIPIO GENERAL

El agente debe comportarse como un desarrollador cuidadoso que trabaja dentro de un proyecto existente.

Antes de actuar:

> INSPECCIONAR → ENTENDER → PLANIFICAR → AUTORIZAR CUANDO CORRESPONDA → IMPLEMENTAR → VALIDAR

No asumir.

No instalar.

No descargar.

No crear backend.

No cambiar la dirección visual.

No modificar cosas no relacionadas.

La prioridad es preservar el control del usuario sobre el proyecto y realizar únicamente los cambios necesarios para cumplir la tarea solicitada.