# Capturas del prototipo

Generadas por `node verificar.js`. Se versionan para poder revisar el resultado del
prototipo sin abrir un navegador.

Todas a 1× de escala de dispositivo.

## Vistas por breakpoint

| Archivo | Viewport | Qué muestra |
|---|---|---|
| `desktop-dashboard.png` | 1440×900 | **Zona crítica completa sin scroll.** FR-001 y NFR-002 |
| `desktop-alerta.png` | 1440×900 | Caja blanca con los 5 nodos del árbol de decisión. FR-004 |
| `desktop-whitelist.png` | 1440×900 | Tabla + alta. Sólo 1 acción primaria en pantalla |
| `desktop-historial.png` | 1440×900 | Historial forense de `mg.ramirez`. FR-003 |
| `desktop-br002.png` | 1440×900 | Estado de denegación por unidad crítica. BR-002 |
| `tablet-*.png` | 1024×900 | Las mismas 5 vistas con el rail colapsado a iconos |
| `mobile-*.png` | 390×844 | Las mismas 5 vistas con el rail oculto |

## Estados de flujo

| Archivo | Qué demuestra |
|---|---|
| `flow-modal-paso1.png` | Modal de aislamiento abierto desde el detalle. FR-005 |
| `flow-modal-paso1-errores.png` | «Continuar» sin rellenar motivo ni re-autenticación **no avanza de paso**. FR-006 |
| `flow-modal-paso2.png` | Paso 2 con el botón destructivo bloqueado hasta escribir la palabra. FR-006 |
| `flow-rbac-junior.png` | Rol Analista Junior: botón deshabilitado + motivo. NFR-003 |
| `flow-br002.png` | Cuenta de Urgencias: denegación con insignia BR-002 y sin bypass |
| `flow-whitelist-alta.png` | Entrada válida ya añadida a la tabla. FR-008 |

## Dónde mirar primero

1. `desktop-dashboard.png` — las tres alertas críticas terminadas antes del borde
   inferior.
2. `flow-modal-paso1-errores.png` — la fricción segura: el sistema no deja avanzar.
3. `flow-br002.png` — la denegación es un final de flujo, no un aviso.
4. `flow-rbac-junior.png` — el permiso denegado se explica, no se esconde.