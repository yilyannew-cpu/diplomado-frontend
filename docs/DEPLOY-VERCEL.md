# Despliegue en Vercel

Este proyecto usa **TanStack Start** (React 19 + SSR). No es una SPA estática con `index.html` en la raíz: necesita **Nitro** con preset `vercel` para que Vercel genere funciones serverless y sirva las rutas correctamente.

## Problema que se corrige

Sin la configuración de Nitro, el build produce `dist/client/` y `dist/server/` pero **no** `.vercel/output/`. Vercel no encuentra archivos ni funciones en la raíz y devuelve:

```
404: NOT_FOUND
Code: 'NOT_FOUND'
```

## Archivos de configuración

### `vite.config.ts`

Se activa Nitro con preset de Vercel:

```ts
nitro: {
  preset: "vercel",
  vercel: {
    entryFormat: "node",
  },
},
```

- `preset: "vercel"` — genera salida en formato Build Output API de Vercel (`.vercel/output/`).
- `entryFormat: "node"` — evita errores SSR conocidos entre TanStack Start y el handler web de Nitro.

### `vercel.json`

Indica a Vercel dónde está la salida del build:

| Campo | Valor | Motivo |
|-------|--------|--------|
| `buildCommand` | `bun run build` | Script de build del proyecto |
| `installCommand` | `bun install` | Gestor de paquetes usado en el repo |
| `outputDirectory` | `.vercel/output` | Carpeta generada por Nitro (no usar `dist` ni `dist/client`) |
| `framework` | `null` | Evita que Vercel trate el proyecto como Vite SPA estático |

Si en Vercel no tienes Bun habilitado, cambia a npm:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install"
}
```

## Panel de Vercel (Settings → Build & Development)

Confirma que coincida con `vercel.json`:

| Setting | Valor |
|---------|--------|
| Root Directory | `.` (raíz del repositorio) |
| Framework Preset | Other (o dejar que `vercel.json` mande) |
| Build Command | `bun run build` |
| Output Directory | `.vercel/output` |
| Install Command | `bun install` |

**No uses** `dist` o `dist/client` como Output Directory.

## Verificación local

Antes de hacer push:

```bash
bun run build
```

Comprueba que exista la carpeta de salida:

```bash
# Windows PowerShell
Get-ChildItem .vercel/output

# Linux / macOS / Git Bash
ls .vercel/output
```

Deberías ver algo como:

```
config.json
functions/
static/
nitro.json
```

Si `.vercel/output` no aparece, el deploy en Vercel seguirá fallando.

## Desplegar

1. Haz commit de `vite.config.ts`, `vercel.json` y esta documentación.
2. Push a la rama conectada con Vercel.
3. Si ya falló antes: **Deployments → Redeploy → Redeploy without Build Cache**.

## Variables de entorno

Si en el futuro agregas variables `VITE_*` en el código, créalas en:

**Vercel → Project → Settings → Environment Variables**

## Qué no hacer

| Incorrecto | Por qué |
|------------|---------|
| Output Directory = `dist` | No contiene el formato que Vercel espera para SSR |
| Output Directory = `dist/client` | Solo assets; no hay `index.html` ni servidor |
| Framework Preset = Vite | Trata la app como sitio estático |
| Rewrites manuales a `/index.html` | La app usa SSR, no routing SPA clásico |
| Agregar plugins duplicados en `vite.config.ts` | Lovable ya incluye tanstackStart, react, tailwind, etc. |

## Referencias

- [TanStack Start on Vercel](https://vercel.com/docs/frameworks/full-stack/tanstack-start)
- [Deploy a TanStack Start app to Vercel](https://vercel.com/kb/guide/deploy-a-tanstack-start-app-to-vercel)
