// Configuración de entorno para despliegue separado del frontend.
// En despliegue unificado (Docker/Caddy) o con proxy reverso, dejar vacío ('').
// En despliegue separado (Netlify/Vercel/GitHub Pages + Render/Koyeb), definir:
// window.HERA_API_BASE = 'https://heraueba-api.onrender.com';
window.HERA_API_BASE = window.HERA_API_BASE || 'https://electiva-cpc-desarrollo-proyecto-web.onrender.com';
