# FFCore Frontend - Fast Food Core

FFCore es una plataforma web de delivery y gestión de restaurantes orientada al mercado de Cúcuta, Norte de Santander. Este directorio contiene el frontend del proyecto, que provee una interfaz robusta y multi-rol para clientes, domiciliarios, restaurantes y superadministradores.

---

## 🔑 Credenciales de Prueba (Login)

La aplicación tiene dos formas de iniciar sesión: mediante los botones rápidos en la pantalla principal (que no piden clave) o mediante el formulario de `/login/gobernanza` u otras rutas protegidas.

Si decides usar el formulario manual, aquí tienes los usuarios predeterminados (Mock):

- **Cliente Regular:** `cliente1@ffcore.co`, `cliente2@ffcore.co`, `cliente3@ffcore.co` | Clave: `demo`
- **Admin Restaurante:** `admin1@ffcore.co`, `admin2@ffcore.co`, `admin3@ffcore.co` | Clave: `demo`
- **Superadmin (Gobernanza):** `super@ffcore.co` | Clave: `demo`
- **Domiciliario:** `domi1@ffcore.co`, `domi2@ffcore.co`, `domi3@ffcore.co` | Clave: `demo`

*(Todos los usuarios utilizan la contraseña `demo`).*

---

## ☁️ Notas sobre la Base de Datos en la Nube (Neon)

El backend de este proyecto utiliza una base de datos PostgreSQL alojada gratuitamente en **Neon.tech**. Si estás probando la conexión real con el backend y experimentas lentitud extrema o el error `P1001: Can't reach database server`, ten en cuenta lo siguiente:

1. **El "Cold Start":** Neon pausa (duerme) la base de datos tras 5 minutos de inactividad. La primera petición que hagas tardará varios segundos (hasta 15s) mientras el servidor despierta.
2. **Error de Conexión:** Si el servidor no despierta a tiempo o tu red bloquea el puerto `5432`, la conexión fallará.
3. **¿Cómo solucionarlo?** 
   - Puedes ir a [neon.tech](https://neon.tech), iniciar sesión y entrar al "Salpicadero" para despertar la base de datos manualmente.
   - Si creaste un proyecto nuevo en Neon, asegúrate de **copiar la nueva Connection String** del salpicadero y pegarla en la variable `DATABASE_URL` de tu archivo `.env` en el backend.
   - Si tu red bloquea conexiones a bases de datos, te recomendamos levantar una base de datos local (usando PostgreSQL local o el `docker-compose.yml` provisto).

## 🛠️ Stack Tecnológico

El proyecto está construido sobre las herramientas más modernas del ecosistema React para garantizar escalabilidad, velocidad y una excelente experiencia de desarrollo:

- **Framework Core:** React 19 + TanStack Start (Server-Side Rendering)
- **Enrutamiento:** TanStack Router (Type-safe routing basado en archivos)
- **Lenguaje:** TypeScript 5.8 estricto
- **Estilos e Interfaz:** Tailwind CSS v4 + Componentes de shadcn/ui
- **Gestión de Estado Servidor:** TanStack React Query (caché, re-fetching automático)
- **Manejo de Formularios:** React Hook Form + validaciones con Zod
- **Entorno de Ejecución/Desarrollo:** Vite + Bun (Altísimo rendimiento)
- **Gráficos y Métricas:** Recharts para los dashboards interactivos.

---

## 🏗️ Arquitectura y Estructura del Proyecto

El código está organizado siguiendo buenas prácticas de mantenibilidad y escalabilidad modular:

```text
src/
├── components/       # Componentes visuales y lógicos agrupados por dominio
│   ├── admin/        # Vistas exclusivas del "Admin Restaurante" (Dashboard, Cocina)
│   ├── cliente/      # Vistas del "Cliente" (Catálogo, carrito)
│   ├── domiciliario/ # Vistas del "Domiciliario" (Entregas activas, ingresos)
│   ├── superadmin/   # Vistas de "Gobernanza" (Aprobaciones, métricas globales)
│   ├── shared/       # Componentes compartidos (TopBar, Guardias, Botones)
│   └── ui/           # Componentes base de diseño (shadcn/ui adaptado)
├── context/          # Estados globales compartidos (Context API)
│   ├── AuthContext   # Gestión de sesión e inyección de perfiles
│   └── OrderContext  # Gestión de carritos y comandas en vivo
├── lib/              # Utilidades puras, lógica de negocio y llamadas a la API
│   └── api/          # Configuración del cliente HTTP (Axios/Fetch) para el backend real
├── types/            # Tipos de dominio del frontend (menú, pedidos, restaurantes, etc.)
└── routes/           # Sistema de rutas basado en archivos (TanStack Router)
```

---

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

---

## ⚡ Flujo de Desarrollo (Auto-Switch de Roles)

Para facilitar la construcción visual sin depender del backend y evitar pantallas de carga lentas, el `AuthContext` actual incluye una función de **"Auto-Switch"**. 

**¿Cómo funciona?**
No necesitas pasar por los formularios de `/login`. Al estar en modo desarrollo:
1. Si vas directamente a la página inicial (`/`), verás un panel de 4 botones. Al hacer clic en cualquiera de ellos, el sistema **inyecta instantáneamente** en memoria el perfil mock correspondiente y te da acceso.
2. Si escribes manualmente en la URL una ruta protegida (ej: `http://localhost:8080/admin`), el `RoleGuard` detecta que quieres entrar ahí e **inyecta la sesión correspondiente automáticamente** en vez de bloquearte.
3. Puedes hacer clic en "Cerrar Sesión" en cualquier momento para regresar de forma limpia al inicio.

> **Nota para Producción:** Esta lógica síncrona utiliza un sistema de tokens prefijados con `mock-token-`. Al momento de integrar la autenticación con la base de datos real y conectar el login, estos tokens falsos dejarán de usarse a favor del flujo JWT estándar definido en el backend.



## 📚 Documentación Técnica Detallada

Para conocer en profundidad las convenciones de estilo, cómo crear nuevas rutas en TanStack Router, y cómo está aislado cada módulo, consulta el archivo oficial del frontend: 
[DOCUMENTACION-FRONTEND.md](./docs/DOCUMENTACION-FRONTEND.md) en la carpeta `docs/`.
