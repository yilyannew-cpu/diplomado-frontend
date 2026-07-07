# FFCore Frontend - Fast Food Core

FFCore es una plataforma web de delivery y gestión de restaurantes orientada al mercado de Cúcuta, Norte de Santander. Este directorio contiene la primera entrega del frontend inicial, incluyendo interfaces, navegación por roles, y flujos simulados con datos mock.

## 🛠️ Stack Tecnológico

- **Framework:** React 19 + TanStack Start (SSR) + TanStack Router
- **Lenguaje:** TypeScript 5.8
- **Estilos:** Tailwind CSS v4 + shadcn/ui
- **Gestión de estado:** TanStack React Query + Context API
- **Formularios:** React Hook Form + Zod
- **Entorno:** Vite + Bun

## 🚀 Cómo ejecutar en local

1. Asegúrate de tener instalado [Bun](https://bun.sh/) (o Node.js 20+ con npm).
2. Instala las dependencias:
   ```bash
   bun install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   bun run dev
   ```
4. Abre [http://localhost:8080](http://localhost:8080) en tu navegador.

## 🔑 Usuarios de Prueba

Para probar la aplicación localmente, puedes iniciar sesión utilizando las siguientes credenciales configuradas en `src/mocks/usersMock.ts` (todas usan la misma contraseña).

**Contraseña general para todos los usuarios:** `demo`

### Portales y Usuarios

**Portal Cliente (`/login/cliente`):**
* `cliente@ffcore.co`
* `jp@ffcore.co`

**Portal Domiciliario (`/login/equipo`):**
* `domi@ffcore.co`
* `andres@ffcore.co`

**Portal Administrador de Restaurante (`/login/equipo`):**
* `admin@ffcore.co`

**Portal Superadmin (`/login/gobernanza`):**
* `super@ffcore.co`

## 📚 Documentación Completa

Para conocer todos los detalles de la arquitectura, estructura de archivos, módulos y componentes, consulta el archivo [DOCUMENTACION-FRONTEND.md](./docs/DOCUMENTACION-FRONTEND.md) en la carpeta `docs/`.
