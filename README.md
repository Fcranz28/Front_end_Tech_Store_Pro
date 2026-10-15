# Tech Store Frontend

Aplicación Angular independiente de TechStore Pro. Incluye catálogo, carrito lateral y ampliado, autenticación, pedidos, administración y devoluciones.

## Producción y repositorios

- Frontend público: [techstorepro.vercel.app](https://techstorepro.vercel.app/).
- API HTTPS: [techstore-pro-backend.onrender.com](https://techstore-pro-backend.onrender.com).
- Backend y migraciones: [Tech-Store-Pro, rama codex/render-backend](https://github.com/Fcranz28/Tech-Store-Pro/tree/codex/render-backend).
- [Informe técnico y evidencias del 15/10/2026](https://github.com/Fcranz28/Tech-Store-Pro/blob/codex/render-backend/output/pdf/TechStore_Pro_Informe_Despliegue.pdf).
- [Anexos: capturas, Postman y resultados de pruebas](https://github.com/Fcranz28/Tech-Store-Pro/tree/codex/render-backend/output/pdf).

## Ejecutar

Requiere Node.js compatible con Angular 21 (Node 24 usado en verificación) y pnpm compatible con el lockfile (10.28.0 usado en CI). Clona este repositorio y ejecuta los comandos en su carpeta; la ruta siguiente es un ejemplo local.

```powershell
Set-Location 'C:\Users\Franz\Documents\Tech_Store_Frontend'
pnpm install --frozen-lockfile
pnpm start
```

Abre http://localhost:4200. El backend Spring Boot se ejecuta desde `C:\Users\Franz\IdeaProjects\TechStore-Pro` y la API local está en http://localhost:8080. El origen CORS del backend debe coincidir con http://localhost:4200.

## Compilar

```powershell
pnpm run verify
```

`verify` ejecuta las cuatro pruebas de persistencia del carrito y compila Angular para producción. La salida publicable está en `dist/frontend/browser`. El código está en `src/app`; los flujos están separados bajo `features`, incluido `features/devoluciones`. El logo y el favicon siguen en `public`; las imágenes de productos se referencian mediante URLs de Cloudinary guardadas por el backend.

El 15/10/2026 pasaron las cuatro pruebas y el build de producción. El workflow está publicado; la ejecución de GitHub Actions revisada quedó bloqueada por facturación de la cuenta. Esto no equivale a una ejecución exitosa de Actions ni a pruebas E2E automatizadas de todos los flujos.

## Carrito y autenticación

El invitado puede añadir productos al sidebar y abrir `/carrito` antes de iniciar sesión. Su selección se conserva mediante un JWT de invitado en `localStorage`; el backend valida firma y vigencia y transfiere el carrito después del login/registro. La autenticación se solicita al continuar al checkout simulado, sin cobros reales. El JWT de autenticación se guarda en `sessionStorage` y el interceptor lo adjunta solo a la API propia.

## Devoluciones

El cliente usa `/devoluciones` y solicita una devolución desde una compra entregada. El operador y el administrador usan `/gestion-devoluciones`. La documentación API y la colección Postman están en `TechStore-Pro/docs/devoluciones.md` y `TechStore-Pro/docs/postman/Devoluciones.postman_collection.json`.

El formulario usa Reactive Forms y valida cantidades disponibles. La gestión permite filtrar, paginar y aplicar transiciones válidas; el rechazo requiere observación. El historial muestra estado anterior/nuevo, actor, fecha y observación. La API vuelve a comprobar permisos, unidades e importe.
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

La configuración de producción en `src/environments/environment.ts` apunta a `https://techstore-pro-backend.onrender.com`. `ng serve` reemplaza ese archivo por `environment.development.ts`, que usa `http://localhost:8080`. Autenticación, catálogo e interceptor comparten la URL del entorno. En Render, `APP_FRONTEND_ORIGIN` debe coincidir con `https://techstorepro.vercel.app`. Las credenciales de BD, JWT y Cloudinary pertenecen al backend y no se incluyen en Angular.

Referencia: https://vercel.com/docs/cli
