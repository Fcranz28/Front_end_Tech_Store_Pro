# Tech Store Frontend

Aplicación Angular independiente de TechStore Pro. Incluye catálogo, carrito lateral y ampliado, autenticación, pedidos, administración y devoluciones.

## Ejecutar

Requiere Node.js compatible con Angular 21 y pnpm.

```powershell
Set-Location 'C:\Users\Franz\Documents\Tech_Store_Frontend'
pnpm install --frozen-lockfile
pnpm start
```

Abre http://localhost:4200. El backend Spring Boot se ejecuta desde `C:\Users\Franz\IdeaProjects\TechStore-Pro` y la API local está en http://localhost:8080. El origen CORS del backend debe coincidir con http://localhost:4200.

## Compilar

```powershell
pnpm run build
```

La salida está en `dist/frontend`. El código está en `src/app`; los flujos están separados bajo `features`, incluido `features/devoluciones`. El logo y el favicon siguen en `public`.

## Devoluciones

El cliente usa `/devoluciones` y solicita una devolución desde una compra entregada. El operador y el administrador usan `/gestion-devoluciones`. La documentación API y la colección Postman están en `TechStore-Pro/docs/devoluciones.md` y `TechStore-Pro/docs/postman/Devoluciones.postman_collection.json`.
## Despliegue con Vercel

Vercel CLI está instalado como dependencia de desarrollo. Desde esta carpeta:

```powershell
pnpm exec vercel login
pnpm run deploy:preview
```

El primer despliegue vincula la carpeta con un proyecto de tu cuenta y devuelve una URL de vista previa. Para publicar en producción:

```powershell
pnpm run deploy:production
```

`vercel.json` configura Angular, el build, la salida `dist/frontend/browser` y el fallback a `index.html`, necesario para abrir rutas como `/productos` o `/devoluciones` directamente. `.vercel` contiene la vinculación local y está ignorado por Git.

El frontend todavía apunta a `http://localhost:8080`. Puedes desplegar su interfaz para verla, pero para usar catálogo, login, carrito y devoluciones desde Internet necesitas una API pública HTTPS: actualiza `API_URL` en `src/app/core/store-api.ts`, la URL de AuthService y el origen permitido por el interceptor; configura también `APP_FRONTEND_ORIGIN` del backend con el dominio de Vercel.

Referencia: https://vercel.com/docs/cli
