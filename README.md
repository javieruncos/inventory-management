# Inventory Management

Aplicación full stack para administrar productos, categorías, proveedores, usuarios y movimientos de stock. El proyecto está construido con foco en tipado estricto, accesibilidad, estados de carga y error, y una interfaz consistente en mobile, tablet y desktop.

## Características

- Dashboard con indicadores de inventario, alertas de stock bajo y movimientos recientes.
- CRUD de productos, categorías y proveedores con búsqueda, filtros y confirmaciones.
- Registro de entradas y salidas de stock con historial por producto.
- Autenticación con JWT en cookie `HttpOnly` y autorización por roles.
- Gestión de usuarios administradores desde la aplicación.
- Eliminación lógica de productos para conservar el historial de movimientos.
- Componentes accesibles: navegación por teclado, focus visible, labels, `aria-*` y soporte para `prefers-reduced-motion`.
- Suite de más de 700 tests automatizados sobre lógica de dominio y Route Handlers.

## Stack

| Área | Tecnología |
| --- | --- |
| Framework | Next.js 16 con App Router |
| UI | React 19, Tailwind CSS 4 y Lucide |
| Estado del servidor | TanStack Query 5 |
| Formularios y validación | React Hook Form y Zod |
| Backend | Route Handlers de Next.js |
| Base de datos | MongoDB y Mongoose |
| Autenticación | JWT, bcrypt y cookies `HttpOnly` |
| Tests | Vitest |

## Arquitectura

```text
src/
├─ app/                 # App Router: páginas, layouts y Route Handlers
│  ├─ (app)/            # Área autenticada de la aplicación
│  ├─ (auth)/           # Inicio de sesión
│  └─ api/              # Endpoints REST
├─ components/          # UI base, shell, providers y componentes de dominio
├─ db/                  # Conexión y modelos de Mongoose
├─ lib/                 # Cliente API, queries, autenticación y lógica de dominio
├─ schemas/             # Esquemas de validación con Zod
└─ types/               # DTOs compartidos entre cliente y servidor
scripts/
└─ create-admin.mjs     # Alta inicial de un usuario administrador
```

La aplicación combina Server Components para la estructura de las páginas con Client Components para las interacciones. Las mutaciones se realizan contra Route Handlers y se invalidan mediante React Query. La autenticación se resuelve con un JWT firmado que viaja en una cookie `HttpOnly`, y las rutas protegidas aplican autorización por rol.

## Requisitos

- Node.js 20.12 o superior.
- pnpm 10 o superior.
- Una instancia de MongoDB accesible.

## Configuración local

1. Instalar dependencias:

   ```bash
   pnpm install
   ```

2. Crear el archivo de entorno a partir del ejemplo:

   ```bash
   cp .env.example .env
   ```

   En PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Completar las variables en `.env`:

   | Variable | Descripción |
   | --- | --- |
   | `MONGODB_URI` | Cadena de conexión a MongoDB. |
   | `JWT_SECRET` | Secreto de firma de al menos 32 caracteres. |

   Para generar un secreto seguro:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

4. Iniciar el servidor de desarrollo:

   ```bash
   pnpm dev
   ```

5. Crear el primer administrador:

   ```bash
   node scripts/create-admin.mjs
   ```

   El script solicita email y contraseña de forma interactiva. La contraseña debe tener al menos 12 caracteres y no superar los 72 bytes UTF-8.

La aplicación queda disponible en [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Inicia el servidor de desarrollo. |
| `pnpm build` | Genera el build de producción. |
| `pnpm start` | Ejecuta el build de producción. |
| `pnpm lint` | Ejecuta ESLint. |
| `pnpm typecheck` | Verifica los tipos con TypeScript. |
| `pnpm test` | Ejecuta la suite de Vitest. |

## Tests

La suite actual cubre lógica de dominio, validaciones y Route Handlers con Vitest:

```bash
pnpm test
```

Para validar el proyecto completo antes de integrar cambios:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Seguridad

- Contraseñas almacenadas con bcrypt (coste 12).
- Sesiones firmadas con JWT y almacenadas en cookies `HttpOnly` con `SameSite=Lax`.
- Autorización por roles para operaciones de catálogo y administración de usuarios.
- Validación de payloads con Zod antes de llegar a la base de datos.
- Variables sensibles fuera del repositorio mediante `.env`.
