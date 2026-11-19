# Plan de Despliegue 100% Gratuito — HeraUEBA

## 1. ¿Es posible desplegar todo el proyecto gratis?

**Sí, 100% gratuito sin tarjeta de crédito.** Ninguna librería del stack (`FastAPI`, `PostgreSQL 17`, `HTML/CSS/JS`) requiere licencia. Para eliminar el costo de un servidor VPS de pago, se reemplaza la infraestructura auto-hospedada por servicios gestionados en capa gratuita:

| Componente | Plan Tradicional (de pago) | Reemplazo 100% Gratuito | Rama Git |
| :--- | :--- | :--- | :--- |
| **Base de Datos (PostgreSQL 17)** | VPS + disco administrado | **Neon.tech** (Free Tier: 500 MB, SSL, sin vencimiento) o **Supabase** | `prod/backend` (`database/`) |
| **Backend API (FastAPI)** | VPS + Uvicorn/Gunicorn | **Render.com** (Free Web Service Docker) o **Koyeb** | `prod/backend` |
| **Frontend + HTTPS/CDN** | VPS + Caddy TLS | **Netlify / Vercel / Cloudflare Pages / GitHub Pages** (HTTPS gratis) | `prod/frontend` |
| **Integración Completa (Local/Docker)** | — | **Docker Compose** (`make up`) | `production` |

---

## 2. Estrategia de Ramas de Producción

- **`production`**: Rama integrada de producción (backend + frontend + database + Docker Compose + documentación).
- **`prod/backend`**: Rama aislada lista para **Render / Koyeb**, contiene únicamente `backend/`, `database/`, `render.yaml`, `README.md` y `.gitignore`.
- **`prod/frontend`**: Rama aislada lista para **Netlify / Vercel / Cloudflare Pages / GitHub Pages**, con `index.html`, `config.js`, `assets/`, `netlify.toml` y `vercel.json` en la raíz.

---

## 3. Pasos de Despliegue Gratuito en la Nube

### Paso 1: Base de Datos PostgreSQL 17 en Neon (Gratis)
1. Crear un proyecto gratuito en [neon.tech](https://neon.tech) (PostgreSQL 17).
2. Copiar la cadena de conexión `DATABASE_URL` (`postgresql://user:pass@host/neondb?sslmode=require`).
3. El backend ejecuta automáticamente `ensure_database_seeded` al arrancar (`schema.sql` + `seed.sql`), o puedes aplicarlos manualmente con `psql "$DATABASE_URL" -f database/schema.sql -f database/seed.sql`.

### Paso 2: Backend FastAPI en Render (Gratis)
1. En [render.com](https://render.com) → **New → Web Service** (o **Blueprint** usando `render.yaml`).
2. Conectar el repositorio y seleccionar la rama **`prod/backend`**.
3. Configurar variables de entorno:
   - `DATABASE_URL`: cadena de conexión de Neon.
   - `JWT_SECRET_KEY`: secreto aleatorio de 32+ caracteres.
   - `ENVIRONMENT`: `production`.
4. Verificar despliegue en `https://<tu-backend>.onrender.com/health`.

### Paso 3: Frontend Estático en Netlify / Vercel / GitHub Pages (Gratis)
1. En [netlify.com](https://www.netlify.com) o [vercel.com](https://vercel.com) → **Import from Git** → seleccionar la rama **`prod/frontend`**.
2. En `config.js` (en la rama `prod/frontend`), configurar la URL pública del backend:
   ```js
   window.HERA_API_BASE = 'https://<tu-backend>.onrender.com';
   ```
3. Publicar (Publish directory: `.`, sin paso de build). HTTPS/TLS 1.3 se provisiona automáticamente.

---

## 4. Despliegue Local Gratuito (Docker Compose)

Desde la rama `production`:
```bash
make up      # Levanta PostgreSQL 17 + FastAPI + Caddy
make test    # Ejecuta pruebas Pytest
make verify  # Verificación E2E del frontend
```
