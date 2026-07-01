# Documentación técnica — FFCore (Fast Food Core)

## Primera entrega: Frontend inicial con React

---

## 1. Descripción general

**FFCore** (*Fast Food Core*) es una plataforma web de delivery y gestión de restaurantes orientada al mercado de **Cúcuta**, Norte de Santander, Colombia.

La primera entrega corresponde al **frontend inicial**: interfaces funcionales, navegación por roles, formularios, validaciones y flujos de negocio simulados con **datos mock** y **estado local en React**.

El sistema contempla **cuatro perfiles de usuario**, cada uno con su panel y rutas protegidas:

| Rol | Panel | Ruta principal |
|-----|-------|----------------|
| Cliente | Catálogo, carrito y seguimiento | `/cliente` |
| Admin (restaurante) | Cocina, menú, reportes | `/admin` |
| Domiciliario | Entregas en ruta | `/domiciliario` |
| Superadmin | Gobernanza y aprobaciones | `/superadmin` |

---

## 2. Stack tecnológico

### 2.1 Núcleo

| Tecnología | Versión | Función en el proyecto |
|------------|---------|------------------------|
| **React** | 19.x | Librería UI basada en componentes |
| **TypeScript** | 5.8 | Tipado estático en todo el código |
| **Vite** | 8.x | Bundler y servidor de desarrollo |
| **TanStack Start** | 1.16x | Framework full-stack sobre React (SSR) |
| **TanStack Router** | 1.16x | Enrutamiento basado en archivos |
| **TanStack React Query** | 5.x | Gestión de estado y caché de datos en el cliente |

### 2.2 Estilos y componentes UI

| Tecnología | Función |
|------------|---------|
| **Tailwind CSS** v4 | Utilidades CSS y diseño responsive |
| **shadcn/ui** (estilo New York) | Componentes accesibles sobre Radix UI |
| **Radix UI** | Primitivos: Dialog, Sheet, Dropdown, Tabs, Select, etc. |
| **Lucide React** | Iconografía |
| **class-variance-authority (CVA)** | Variantes de componentes |
| **clsx + tailwind-merge** | Composición de clases CSS |

### 2.3 Formularios y validación

| Tecnología | Función |
|------------|---------|
| **React Hook Form** | Formularios controlados (donde aplica) |
| **Zod** | Esquemas de validación |
| **@hookform/resolvers** | Integración Zod ↔ React Hook Form |

### 2.4 Visualización de datos

| Tecnología | Función |
|------------|---------|
| **Recharts** | Gráficos en reportes de ventas |
| **date-fns** | Manejo de fechas en reportes |
| **react-day-picker** | Selector de fechas |

### 2.5 Herramientas de desarrollo

| Tecnología | Función |
|------------|---------|
| **Bun** | Gestor de paquetes y runtime de scripts |
| **ESLint + Prettier** | Linting y formato de código |
| **Nitro** | Build para despliegue en Vercel |
| **TanStack Router CLI** | Generación automática de `routeTree.gen.ts` |

---

## 3. Arquitectura del frontend

```
diplomado-frontend/
├── public/                 # Assets estáticos (favicon, etc.)
├── src/
│   ├── routes/             # Páginas (TanStack Router — file-based routing)
│   ├── components/
│   │   ├── ui/             # Componentes base shadcn/ui
│   │   ├── auth/           # Login, registro, layout de autenticación
│   │   ├── admin/          # Módulos del panel restaurante
│   │   ├── cliente/        # Módulos del panel cliente
│   │   ├── superadmin/     # Módulos de gobernanza
│   │   └── shared/         # Shell, guards, componentes reutilizables
│   ├── context/            # Estado global (Auth, Orders)
│   ├── hooks/              # Hooks personalizados
│   ├── lib/                # Utilidades y lógica de negocio en el cliente
│   ├── mocks/              # Datos simulados para la primera entrega
│   ├── styles.css          # Tokens de diseño y Tailwind
│   ├── router.tsx          # Configuración del router
│   ├── start.ts            # Middleware SSR
│   └── server.ts           # Entry point del servidor
├── vite.config.ts
├── components.json         # Configuración shadcn/ui
└── package.json
```

### Patrones de diseño utilizados

- **File-based routing** — cada archivo en `src/routes/` es una ruta.
- **Context API** — estado compartido (`AuthContext`, `OrderContext`).
- **Role-based access** — `RoleGuard` protege rutas según el rol del usuario.
- **Composición de componentes** — paneles modulares por dominio (admin, cliente, etc.).
- **Datos mock** — simulación de datos en `src/mocks/` para demostrar flujos completos en el navegador.

---

## 4. Sistema de rutas

### 4.1 Rutas públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Redirección automática según sesión o a login |
| `/login` | Redirige a `/login/cliente` |
| `/login/cliente` | Portal de acceso para clientes |
| `/login/equipo` | Portal operativo (restaurante + domiciliario) |
| `/login/gobernanza` | Portal superadmin |
| `/registro/cliente` | Alta de cuenta cliente |
| `/registro/restaurante` | Solicitud de registro de restaurante |
| `/registro/domiciliario` | Solicitud de registro de domiciliario |

### 4.2 Rutas protegidas (requieren sesión y rol)

| Ruta | Rol requerido |
|------|---------------|
| `/cliente` | `cliente` |
| `/admin` | `admin` |
| `/domiciliario` | `domiciliario` |
| `/superadmin` | `superadmin` |
| `/superadmin/aprobaciones` | `superadmin` |

### 4.3 Protección de rutas

El componente `RoleGuard` verifica:

1. Si hay sesión activa → si no, redirige al login del rol.
2. Si el rol coincide → si no, redirige al panel correcto del usuario.

---

## 5. Paneles implementados

### 5.1 Panel Cliente (`/cliente`)

Interfaz orientada al usuario final que pide comida.

**Módulos de navegación:**

| Módulo | Descripción |
|--------|-------------|
| **Inicio** | Catálogo de productos con filtros por categoría y restaurante |
| **Promociones** | Productos con descuento activo |
| **Rankin** | Ranking de restaurantes y domiciliarios (reseñas simuladas) |

**Pestañas principales:**

| Pestaña | Descripción |
|---------|-------------|
| **Menú** | Grid de productos, precios con promociones, botón agregar al carrito |
| **Estado del pedido** | Seguimiento visual del pedido activo (stepper de estados) |

**Componentes clave:**

- `CartSheet` — carrito lateral con resumen, datos de entrega y confirmación.
- `OrderTrackingPanel` — timeline del pedido (Recibido → En Cocina → Listo → En Camino → Entregado).
- `PromocionesPanel` — listado de ofertas.
- `RankinPanel` — tablas de valoraciones.
- Filtros por categoría (Hamburguesas, Bebidas, etc.) y por restaurante.

---

### 5.2 Panel Admin Restaurante (`/admin`)

Centro operativo de la sede. Navegación lateral con 7 módulos:

| Módulo | Componente | Funcionalidad |
|--------|------------|---------------|
| **Dashboard** | `RestaurantDashboard` | KPIs: ventas, pedidos activos, reseñas, promociones |
| **Reportes de ventas** | `SalesReportsPanel` | Gráficos, métricas financieras, exportación, filtro por rango de fechas |
| **Monitor de comandas** | `OrderCommandMonitor` | Vista Kanban por estado (Recibido, En Cocina, Listo, etc.) |
| **Gestor de menú** | CRUD visual | Listado con filtros, crear/editar productos y adiciones |
| **Promociones** | `PromotionsPanel` | Crear y editar promociones con modal |
| **Domicilios activos** | `ActiveDeliveriesPanel` | Pedidos en ruta, asignación de domiciliario |
| **Historial de despachos** | `HistoryPanel` | Registro histórico de entregas completadas |

**Modales de formulario:**

- `AddProductModal` — nuevo producto al menú.
- `EditProductModal` — editar precio, descripción, imagen, disponibilidad.
- `AddAdditionModal` — adiciones/extras.
- `AssignCourierModal` — asignar domiciliario a pedidos.
- `CreatePromotionModal` / `EditPromotionModal` — gestión de promociones.

**Filtros del menú (`MenuFilters`):**

- Por categoría, disponibilidad, rango de precio y búsqueda por texto.

---

### 5.3 Panel Domiciliario (`/domiciliario`)

Interfaz **mobile-first** para repartidores.

| Funcionalidad | Descripción |
|---------------|-------------|
| Buscador por código | Localizar pedido por ID |
| Lista de entregas activas | Pedidos asignados al domiciliario logueado |
| Ficha del pedido | Cliente, dirección, ítems, total, instrucciones especiales |
| Cambio de estado | Recogido → En Camino → Entregado |
| Auto-selección | Carga automática del primer pedido activo |

Estados logísticos soportados: `Recibido`, `En Cocina`, `Listo`, `Recogido`, `En Camino`, `Entregado`.

---

### 5.4 Panel Superadmin (`/superadmin`)

Consola de gobernanza del ecosistema.

**Vista principal (`/superadmin`):**

| Sección | Descripción |
|---------|-------------|
| Métricas globales | Ventas, usuarios por rol, pedidos del día |
| Gestión de usuarios | Tabla con búsqueda, filtro por rol, activar/suspender |
| Resumen de aprobaciones | Tarjeta con contador de pendientes |

**Módulo de aprobaciones (`/superadmin/aprobaciones`):**

| Funcionalidad | Descripción |
|---------------|-------------|
| Cola de pendientes | Restaurantes y domiciliarios en estado "Pendiente" |
| Filtros | Todos / Restaurantes / Domiciliarios |
| Aprobar | Cambia estado a "Activo" |
| Rechazar | Con motivo opcional |
| Actualizar lista | Botón de refresh manual |

---

## 6. Formularios implementados

### 6.1 Autenticación

Todos usan el layout compartido `AuthLayout` (diseño split: hero + formulario).

#### Login Cliente (`/login/cliente`)

- Email
- Contraseña (con toggle mostrar/ocultar)
- Enlaces a registro y otros portales

#### Login Equipo (`/login/equipo`)

- Selector de rol: **Restaurante** o **Domiciliario** (`AuthRolePicker`)
- Email
- Contraseña
- Validación de que el rol del usuario coincida con el portal

#### Login Gobernanza (`/login/gobernanza`)

- Email
- Contraseña
- Acceso restringido a superadmin
- Banner de advertencia de acceso corporativo

**Comportamiento común en login:**

- Mensajes de error por credenciales incorrectas, cuenta pendiente, suspendida o rechazada.
- Estados de carga (`submitting`, `isLoading`).
- Redirección automática al panel según rol tras inicio de sesión exitoso.

---

### 6.2 Registro

#### Registro Cliente (`/registro/cliente`)

| Campo | Validación |
|-------|------------|
| Nombre completo | Requerido |
| Email | Requerido |
| Contraseña | Mínimo 8 caracteres |
| Confirmar contraseña | Debe coincidir |
| Teléfono | Formato colombiano |

Tras registro exitoso → redirección al panel cliente.

#### Registro Restaurante (`/registro/restaurante`)

| Campo | Validación |
|-------|------------|
| Nombre del propietario | Requerido |
| Email | Requerido |
| Contraseña + confirmación | Mínimo 8 caracteres, deben coincidir |
| Teléfono | Formato colombiano |
| Nombre del restaurante | Requerido |
| Eslogan | Opcional |
| Ciudad | Selector (datos Colombia) |
| Zona / comuna | Dependiente de la ciudad |
| Dirección | Requerida |
| Tiempo de entrega estimado | Numérico (minutos) |

Muestra mensaje de éxito indicando que la solicitud queda **pendiente de aprobación**.

#### Registro Domiciliario (`/registro/domiciliario`)

| Campo | Validación |
|-------|------------|
| Nombre completo | Requerido |
| Email | Requerido |
| Contraseña + confirmación | Mínimo 8 caracteres |
| Teléfono | Formato colombiano |
| Documento de identidad | Requerido |
| Tipo de vehículo | Moto / Bici / Automóvil / Otro |
| Placa | Requerida |
| Descripción del vehículo | Opcional |

También queda en estado **pendiente de aprobación** por superadmin.

---

### 6.3 Formularios operativos (dentro de paneles)

| Formulario | Ubicación | Campos principales |
|------------|-----------|-------------------|
| Carrito / checkout | `CartSheet` | Nombre, dirección, teléfono del cliente |
| Nuevo producto | `AddProductModal` | Nombre, categoría, precio, descripción, imagen |
| Editar producto | `EditProductModal` | Precio, descripción, imagen, disponibilidad |
| Nueva adición | `AddAdditionModal` | Nombre, precio |
| Nueva promoción | `CreatePromotionModal` | Producto, % descuento, fechas inicio/fin |
| Asignar domiciliario | `AssignCourierModal` | Selección de domiciliario, pedidos en lote |
| Rechazo de solicitud | `ApprovalsPanel` | Motivo opcional de rechazo |
| Buscador de pedido | Panel domiciliario | Código/ID del pedido |

---

## 7. Gestión de estado

### 7.1 AuthContext

Gestiona la sesión del usuario en el navegador:

- Usuario logueado (`user`, `isAuthenticated`)
- Estados de carga (`isLoading`)
- Acciones: `login`, `logout`, `refreshUser`, `setSession`
- Persistencia de sesión en el navegador
- Rehidratación al recargar la página

### 7.2 OrderContext

Centro de datos operativos de la primera entrega (mock + estado React):

| Estado | Descripción |
|--------|-------------|
| `menu` | Catálogo de productos |
| `orders` | Pedidos activos e históricos |
| `promotions` | Promociones del restaurante |
| `dispatchHistory` | Historial de despachos |
| `cart` | Carrito del cliente |
| `clientTab` | Pestaña activa (menú / tracking) |
| `clientModule` | Módulo activo (inicio / promociones / rankin) |

**Acciones disponibles:**

- Carrito: `addToCart`, `removeFromCart`, `clearCart`, `confirmCart`
- Pedidos: `updateOrderStatus`, `findOrder`
- Domicilios: `assignDeliveryPerson`, `assignCourierOnlyBatch`, `dispatchOrderBatch`
- Menú: `toggleAvailability`, `updateMenuItem`, `addMenuItem`
- Promociones: `addPromotion`, `updatePromotion`

### 7.3 Datos mock (`src/mocks/`)

| Archivo | Contenido simulado |
|---------|-------------------|
| `menuMock.ts` | Productos del menú |
| `ordersMock.ts` | Pedidos con estados |
| `restaurantsMock.ts` | Restaurantes asociados |
| `promotionsMock.ts` | Promociones activas |
| `usersMock.ts` | Usuarios del sistema |
| `dispatchHistoryMock.ts` | Historial de despachos |
| `salesReportsMock.ts` | Datos para reportes |
| `courierReviewsMock.ts` | Reseñas de domiciliarios |
| `restaurantReviewsMock.ts` | Reseñas de restaurantes |

---

## 8. Sistema de diseño

### Identidad visual

- **Marca:** FFCore (Fast Food Core)
- **Paleta:** tonos crema (`bg-cream`), ink oscuro, amber-brand, primary azul
- **Tipografía display:** fuente personalizada para títulos (`font-display`)
- **Responsive:** mobile-first con breakpoints `sm`, `md`, `lg`

### Componentes UI base (shadcn/ui)

Más de 30 componentes en `src/components/ui/`, entre ellos:

`Button`, `Card`, `Dialog`, `Sheet`, `Dropdown`, `Tabs`, `Select`, `Input`, `Label`, `Badge`, `Avatar`, `Table`, `Chart`, `Calendar`, `Popover`, `Tooltip`, `Accordion`, `Checkbox`, `Switch`, `Slider`, etc.

### Layouts compartidos

| Componente | Función |
|------------|---------|
| `TopBar` | Cabecera sticky con logo, título, menú de perfil y cierre de sesión |
| `RoleGuard` | Protección de rutas por rol |
| `AuthLayout` | Layout de login/registro con hero lateral |
| `BrandLogo` | Logo de la marca con variantes |
| `UserAvatar` | Avatar con iniciales del usuario |

---

## 9. Lógica de negocio en el cliente

Módulos en `src/lib/` que implementan reglas de negocio en el frontend:

| Módulo | Responsabilidad |
|--------|-----------------|
| `promotions.ts` | Cálculo de precios con descuento |
| `kitchenSla.ts` | Tiempos SLA de cocina |
| `kitchenConsolidation.ts` | Consolidación de comandas |
| `activeDeliveries.ts` | Agrupación de entregas activas |
| `orderHistory.ts` | Ledger y resúmenes de despachos |
| `salesReports.ts` | Métricas y agregaciones de ventas |
| `deliveryLimits.ts` | Límites de asignación por domiciliario |
| `orderZones.ts` | Agrupación de pedidos por zona |
| `colombiaLocations.ts` | Ciudades y zonas de Colombia |
| `roleRoutes.ts` | Mapeo rol → ruta de panel y login |
| `courierRatings.ts` | Cálculo de ratings |

---

## 10. Cómo ejecutar el proyecto en local

### Requisitos

- [Bun](https://bun.sh) instalado (o Node.js 20+ con npm)

### Pasos

```bash
# 1. Clonar e instalar dependencias
cd diplomado-frontend
bun install          # genera routeTree.gen.ts automáticamente

# 2. Servidor de desarrollo
bun run dev
```

La app quedará disponible en `http://localhost:5173` (o el puerto que indique Vite).

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `bun run dev` | Servidor de desarrollo con HMR |
| `bun run build` | Build de producción |
| `bun run preview` | Preview del build |
| `bun run lint` | Análisis ESLint |
| `bun run format` | Formateo con Prettier |
| `bun run routes:gen` | Regenerar árbol de rutas |

---

## 11. Despliegue

El frontend se despliega en **Vercel** usando:

- Preset **Nitro** con target `vercel`
- Build command: `bun run build`
- Output: `.vercel/output`

Documentación detallada en `docs/DEPLOY-VERCEL.md`.

---

## 12. Resumen de la primera entrega

### Implementado

| Área | Estado |
|------|--------|
| 4 paneles por rol (cliente, admin, domiciliario, superadmin) | ✅ |
| 3 portales de login + 3 formularios de registro | ✅ |
| Protección de rutas por rol | ✅ |
| Carrito y flujo de pedido cliente | ✅ |
| Monitor Kanban de comandas | ✅ |
| CRUD visual de menú y promociones | ✅ |
| Reportes de ventas con gráficos | ✅ |
| Panel de domicilios y historial | ✅ |
| Módulo de aprobaciones superadmin | ✅ |
| Diseño responsive mobile-first | ✅ |
| Validación de formularios | ✅ |
| Datos mock para demostración completa | ✅ |
| Sistema de diseño shadcn/ui + Tailwind | ✅ |

---

## 13. Mapa visual de la aplicación

```
                    ┌─────────────────────────────────────┐
                    │         FFCore (Fast Food Core)      │
                    └─────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
    ┌─────▼─────┐              ┌──────▼──────┐             ┌──────▼──────┐
    │  Público  │              │   Auth UI   │             │  Protegido  │
    │    /      │              │   /login/*  │             │  RoleGuard  │
    │           │              │ /registro/* │             │             │
    └───────────┘              └─────────────┘             └──────┬──────┘
                                                                  │
         ┌────────────┬─────────────┬──────────────┬───────────────┘
         │            │             │              │
   ┌─────▼────┐ ┌─────▼────┐ ┌─────▼─────┐ ┌─────▼──────┐
   │ /cliente │ │  /admin  │ │/domiciliario│ │/superadmin │
   │ Catálogo │ │  Cocina  │ │  Entregas  │ │ Gobernanza │
   │ Carrito  │ │  Menú    │ │  Estados   │ │ Aprobaciones│
   │ Tracking │ │ Reportes │ │  Buscador  │ │  Usuarios  │
   └──────────┘ └──────────┘ └────────────┘ └────────────┘
```

---

*Última actualización: primera entrega frontend — diplomado-frontend (FFCore).*
