# 03 · Matriz de trazabilidad

Fuentes: [`../../docs/srs_heraueba.md`](../../docs/srs_heraueba.md) y
[`../../docs/historias_usuario.md`](../../docs/historias_usuario.md).

Cada fila dice **dónde está implementado** dentro de `Stitch-prototype/` y **cómo se
comprobó**. La columna de verificación distingue tres estados:

| Símbolo | Significado |
|---|---|
| ● | Comprobado automáticamente por `test-prototype.js` (Puppeteer, aserción real) |
| ◐ | Comprobado automáticamente por `audit.js` (render en 3 breakpoints) |
| ○ | Comprobado por inspección del código; no automatizado |

---

## 1. Requisitos funcionales

| ID | Requisito | Vista / archivo | Verificación | Estado |
|---|---|---|---|---|
| **FR-001** | Alertas rojas arriba, visibles sin scroll | `views.js` → `dashboard()`; zona crítica antes de telemetría y tabla | ● `head` del bloque crítico < `viewport` a 1440×900 | **Cubierto** |
| **FR-002** | Filtro de 24 h por defecto | `data.js` + `state.window = 24`; chips 1 h / 24 h / 7 d / 30 d | ○ chip `24 h` marcado con `aria-pressed="true"` al cargar | **Cubierto** |
| **FR-003** | Filtro histórico por usuario | `views.js` → `history()`; chips de cuenta + ventana | ● ruta `#/historial?u=<cuenta>` | **Cubierto** |
| **FR-004** | Caja blanca: camino de decisión | `ui.js` → `whitebox()`; `data.js` → `TREES` | ○ nodos N1–N5 con condición en texto legible | **Cubierto** |
| **FR-005** | Botón "Aislar Usuario" en el detalle | `views.js` → `alertDetail()`, `data-action="try-isolate"` | ● botón localizado y accionado en el flujo de aislamiento | **Cubierto** |
| **FR-006** | Modal de verificación de dos pasos | `modals.js` → `isolationStep1()` / `isolationStep2()` | ● paso 1 abre; paso 2 exige palabra de confirmación | **Cubierto** |
| **FR-007** | Impedir aislamiento en unidad crítica | `modals.js` → `criticalUnit()`; `data.js` → `CRITICAL_UNITS` | ● modal BR-002 para `enf.castillo` | **Cubierto** |
| **FR-008** | Alta / edición / baja de whitelist | `views.js` → `whitelist()`; `app.js` → `submitWhitelist()`, `deleteWhitelist()` | ● alta válida añade fila; CIDR inválido muestra error | **Cubierto** |

## 2. Requisitos no funcionales

| ID | Requisito | Cómo se satisface | Verificación | Estado |
|---|---|---|---|---|
| **NFR-001** | MTTR a minutos | Alertas priorizadas arriba, caja blanca a un clic, aislamiento en 2 pasos sin salir de la vista | ○ diseño (métrica transversal, no automatizable en un prototipo) | **Cubierto por diseño** |
| **NFR-002** | Baja densidad cognitiva | Sin gráficos de torta/barras/líneas; 4 KPIs de texto; una acción primaria por pantalla | ● ≤ 1 `.btn--primary` por vista; ● zona crítica sin scroll; ◐ sin desborde en 3 breakpoints | **Cubierto** |
| **NFR-003** | RBAC (Junior no aísla) | `data.js` → `ROLES[].canIsolate`; `views.js` y `app.js` aplican el flag | ● con rol junior el botón está `disabled` y el modal explica el permiso | **Cubierto** |
| **NFR-004** | Trazabilidad normativa | Caja blanca por incidente + bitácora de aislamiento + `aria-label` en cada severidad | ○ nodos, pesos y condición por alerta | **Cubierto** |

## 3. Reglas de negocio

### BR-001 · Cero tolerancia a bloqueos automáticos

| Aspecto | Implementación |
|---|---|
| Umbral declarado | `data.js:146` → `THRESHOLD = 0.98`, comentado como regla de negocio |
| El motor nunca bloquea | Ningún `render()` ni evento dispara aislamiento sin dos clics humanos |
| Evidencia en pantalla | `ui.js:163` muestra `umbral_auto_bloqueo 0.98` en el panel de caja blanca |
| Evidencia al copiar | `ui.js:192` añade `BR-001: umbral_auto_bloqueo 0.98 → ESCALAR A HUMANO` al portapapeles |
| Dato coherente | La alerta más alta del dataset es **0.94** < 0.98, así que ningún incidente del MVP supera el umbral |

La última fila es la prueba más fuerte de BR-001 en un prototipo: **es imposible
demostrar el bloqueo automático porque la herramienta no tiene datos que lo
permitan.** El escenario más alto se queda a cuatro centésimas del umbral.

### BR-002 · Exención de unidades críticas

| Aspecto | Implementación |
|---|---|
| Unidades exceptuadas | `data.js:50` → `['UCI', 'Quirófano', 'Urgencias']` |
| Cuenta protegida de demo | `enf.castillo` (Urgencias) y `adm.sistema` (Quirófano) |
| Denegación | `modals.js:208` → `criticalUnit()` con insignia `BR-002` y el listado de unidades protegidas |
| Guarnición del modelo | `data.js:224` inyecta `UNIT_CRITICAL_GUARD` en las heurísticas de toda alerta de cuenta crítica |
| Sin bypass | El modal **no ofrece** "aislar de todos modos". La denegación es final |
| Insignia preventiva | Las filas de tabla de una unidad crítica llevan etiqueta `UCI` / `QUIRÓFANO` / `URGENCIAS`, para que el analista sepa la restricción *antes* de hacer clic |
| Verificación | ● el flujo BR-002 se ejecuta y el título y la insignia son los esperados |

## 4. Historias de usuario

| US | Historia | Criterio de aceptación Gherkin | Verificación |
|---|---|---|---|
| **US-001** | Ver alertas rojas arriba sin distractions | *Given* hay alertas críticas, *when* el analista entra, *then* están en la parte superior del viewport, *and* no requiere scroll | ● `fold dashboard: head < viewport` |
| **US-002** | Carga limitada a 24 h | *Given* millones de registros, *when* carga la vista por defecto, *then* sólo 24 h | ○ el chip 24 h viene activo; el dataset del prototipo tiene 5 alertas, no 33 M |
| **US-003** | Búsqueda histórica por usuario | *Given* un acceso anómalo, *when* busca la cuenta, *then* ve sólo sus eventos | ● ruta `#/historial?u=…` + tabla filtrada |
| **US-004** | Caja blanca explicable | *Given* una alerta roja, *when* expande, *then* ve las reglas en texto legible | ○ nodos N1–N5 con condición humana |
| **US-005** | Aislamiento seguro | 3 escenarios: sin permisos / aislamiento correcto / unidad crítica | ● los 3 casos probados por separado |
| **US-006** | Whitelist geográfica | *Given* rol coordinador, *when* registra una excepción, *then* no hay falsa alerta | ◐ alta validada; el efecto sobre el modelo **no** es observable en el MVP |

### Desviación documentada en US-006

El criterio de aceptación termina en *"el sistema no debe generar una Alerta Roja por
viaje imposible"*. El prototipo **no lo simula**: no hay motor de Isolation Forest,
así que no se puede demostrar la supresión de la alerta. Lo que sí hace es la mitad
controlable —alta con validación de CIDR, vigencia obligatoria, justificación
clínica y checkbox de auditoría— y lo declara explícitamente en la propia interfaz:
una entrada sin fecha se rechaza con el mensaje *"Una whitelist sin vigencia es una
puerta trasera: fija una fecha."*

## 5. Requisitos de rol

| ID | Rol | Permisos en el prototipo | Verificación |
|---|---|---|---|
| **R-01** | CISO | Patrocinador. No tiene vista propia en el MVP; aparece como destinatario de "Escalar al CISO" | ○ |
| **R-02** | Coordinador SOC | Puede aislar, gestionar whitelist, ver todo | ● rol por defecto; el flujo BR-002 se ejecuta desde este rol |
| **R-03** | Analista Junior SOC | Monitorea, filtra, exporta. **No** puede aislar | ● botón deshabilitado + modal de permiso denegado |

El conmutador de rol del panel lateral es una **herramienta de demostración** del
RBAC, no un selector real de sesión. Está etiquetado como tal.

## 6. Cobertura de los criterios de aceptación

| Criterio (Gherkin) | Verificado por |
|---|---|
| Alerta crítica en el primer viewport sin scroll | ● `test-prototype.js` |
| Métricas y gráficos secundarios debajo del panel de alertas | ○ inspección del orden en `views.js` |
| Sólo 24 h por defecto | ○ chip activo en el markup |
| Historial filtrado por cuenta | ● navegación con query param |
| Reglas del árbol en texto legible | ○ `data.js` → `TREES` |
| Junior no puede aislar | ● botón `disabled` + modal explicativo |
| Modal de 2 pasos | ● paso 1 abre, paso 2 bloquea sin la palabra |
| Estado cambia a bloqueado | ● `AISLADA` + redirección al historial |
| Unidad crítica deniega el aislamiento | ● modal `BR-002` |
| Alta de whitelist | ● fila añadida + error de CIDR inválido |
| Validación de entrada con CIDR | ● `#eCidr` visible al enviar vacío |
| Una acción primaria por pantalla | ● conteo de `.btn--primary` en las 5 vistas |
| Sin desborde horizontal | ◐ `audit.js` en 1440 / 834 / 390 px |
| Contraste WCAG AA | ◐ `audit.js` + `docs/contraste-wcag.py` |

## 7. Ambigüedades del SRS y cómo las trata el prototipo

| ID | Ambigüedad del SRS | Decisión del prototipo | Estado |
|---|---|---|---|
| **AQ-01** | ¿De dónde salen los atributos de unidad crítica? (CSV local vs. API de Active Directory) | Se asume **CSV local precargado** — el campo `unit` de `data.js`. El prototipo muestra el atributo como dato ya resuelto | **Resuelta por suposición**, coherente con la recomendación del SRS |
| **AQ-02** | ¿Keycloak enviará logs reales post-MVP? | Los datos viven en un único módulo (`data.js`) con una interfaz de lectura. Sustituirlo por un cliente HTTP es cambiar un archivo | **Deuda técnica consciente** |
| **AQ-03** | ¿La whitelist acepta CIDR, ASN o sólo país? | Se implementa **CIDR**, que es másSpecific que país y más simple que ASN. El formulario lo dice explícitamente y el formulario no tiene campo ASN | **Parcialmente resuelta** |

AQ-01 y AQ-03 requieren una decisión del cliente técnico que el prototipo no puede
tomar por sí mismo. Lo que sí hace el prototipo es **no cerrarlas en falso**: la
interfaz muestra el supuesto que está usando (`CIDR`, no ASN) para que sea visible en
la demo y no se pierda en la traducción a código.

## 8. Lo que el prototipo NO cubre

Declarado explícitamente para que la cobertura de §1–§6 no se lea como completa:

| Fuera de alcance | Motivo |
|---|---|
| Backend, persistencia, autenticación real | El SRS define un MVP con dataset simulado y base local |
| Motor de Árbol de Decisión e Isolation Forest | Los datos de caja blanca están precargados en `TREES`, no calculados |
| Descarga real de STIX 2.1 / JSON | El botón de exportación muestra un toast; el endpoint de reporting no existe |
| Envío real de correo al CISO | Igual: toast de confirmación |
| Revocación real de sesión en Keycloak | El aislamiento cambia estado en memoria y lo registra en pantalla |
| Streaming de telemetría en vivo | El punto "en vivo" es estático |
| Multi-tenant / varios hospitales | El SRS no lo pide |

Ninguna de estas carencias oculta un requisito. Todas están explícitamente marcadas
como *simulado* en la propia interfaz, que es el comportamiento que exige BR-001: la
persona que usa el prototipo nunca puede confundir una simulación con una mitigación
aplicada.