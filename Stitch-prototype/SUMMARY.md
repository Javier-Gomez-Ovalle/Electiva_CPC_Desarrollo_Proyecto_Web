# HeraUEBA · Resumen ejecutivo

**Qué es.** Prototipo navegable del MVP de HeraUEBA, plataforma UEBA para el Centro de
Operaciones de Seguridad de un hospital. Seis vistas que cubren el recorrido completo:
detectar una anomalía, entender por qué el modelo gritó, y decidir si se aísla la cuenta.

**Dónde está.** Todo en `Stitch-prototype/`. Se abre `prototype/index.html` en un
navegador. Sin build, sin dependencias, sin servidor.

---

## 1 · Lo que se entregó

| Entregable | Cantidad | Ubicación |
|---|---|---|
| Pantallas generadas en Stitch | 6 HTML + 6 PNG | `designs/` |
| Prototipo navegable | 4 vistas + 3 modales + RBAC | `prototype/` |
| Sistema de diseño documentado | 1 | `DESIGN.md` |
| Tokens reusables | 1 | `tokens.css` |
| Documentos de análisis | 3 | `docs/01`, `docs/02`, `docs/03` |
| Verificación automatizada | 2 suites | `verificar.js` |
| Scripts de color ejecutables | 2 | `docs/contraste-wcag.py`, `docs/escalas-tonales.py` |

## 2 · Estado de la verificación

```
$ node verificar.js
=== 1 · COMPORTAMIENTO ===
  dashboard   primarios=1  overflowX=1440/1440
  alerta      primarios=0  overflowX=1440/1440
  whitelist   primarios=1  overflowX=1440/1440
  historial   primarios=1  overflowX=1440/1440
  br002       primarios=1  overflowX=1440/1440
  fold dashboard: {"n":3,"head":881,"viewport":900}
  paso1: {"open":true,"title":"Aislar la cuenta mg.ramirez"}
  paso2: {"confirm":true,"bloqueado":true}
  tras aislar: {"hash":"#/historial?u=mg.ramirez","aislada":true}
  br002: {"title":"No se puede aislar una cuenta de unidad crítica","insignia":"BR-002"}
  junior: {"disabled":true,"ayuda":"Bloqueado por rol: el aislamiento de cuentas exige el ro"}

=== 2 · PRESENTACIÓN ===
  15 combinaciones de breakpoint × vista → todas OK

=== RESULTADO ===
  ✓ sin problemas detectados
```

```
$ python3 docs/contraste-wcag.py
RESULTADO: la paleta final cumple WCAG AA en todos los pares auditados.
```

**Cobertura de requisitos: 8/8 funcionales, 4/4 no funcionales, 2/2 reglas de negocio,
6/6 historias de usuario.** El desglose requisito → archivo → método de verificación
está en [`docs/03-trazabilidad.md`](docs/03-trazabilidad.md).

## 3 · Hallazgos que cambiaron el diseño

Cinco cosas se encontraron midiendo, no opinando. Cada una está documentada con su
antes y su después:

| Hallazgo | Consecuencia |
|---|---|
| `#E53E3E`, `#DD6B20` y `#38A169` dan 4.13, 3.39 y 3.25:1 con texto blanco | Se separaron en tokens de *relleno* (`#C53030`, `#B45309`, `#2C7A4B`) y de *indicador*; el color del brief se conserva donde sí cumple |
| El texto terciario `#6B7688` daba 4.29:1 | Se oscureció a `#5F6B7D` (5.40:1) |
| `#E2E8F0` como borde de input daba 1.23:1 | Se partió en dos tokens: `#E2E8F0` decorativo y `#8A94A6` de control |
| `.chipset` con borde decorativo quedaba en 1.15:1: el segmentado era invisible | Fondo `#FFFFFF` + borde `#8A94A6`; el chip activo ganó borde propio |
| `#A0AEC0` sobre `#E2E8F0` daba 1.83:1 | `--disabled-fg` pasó a `#6B7688`. WCAG exonera componentes inactivos; aquí no se aceptó el atajo |

## 4 · Las tres reglas de negocio, en pantalla

**BR-001 · Cero tolerancia a bloqueos automáticos.** El umbral
`umbral_auto_bloqueo = 0.98` se muestra en la caja blanca de cada alerta y al copiar el
incidente. La alerta más alta del dataset es **0.94**: es imposible demostrar un
bloqueo automático porque no existen los datos. La decisión siempre es de una persona.

**BR-002 · Unidades críticas.** `['UCI', 'Quirófano', 'Urgencias']`. El modal de
denegación **no tiene bypass**: no hay «aislar de todos modos», ni botón avanzado, ni
texto que lo sugiera. Para anticiparlo, las filas de una cuenta protegida llevan su
etiqueta de unidad en la propia tabla.

**RBAC.** El botón «Aislar usuario» se renderiza deshabilitado para el Analista Junior,
con la línea que explica el motivo. Si se fuerza el clic, el modal responde con el
permiso denegado en lugar de abrir el flujo de aislamiento.

## 5 · Principio de diseño que ordena todo

> **El color nunca va solo.** Cada nivel de severidad lleva color, glifo, etiqueta en
> mayúsculas y posición. Un daltonismo deuteranópico lee los cuatro canales; un modo de
> alto contraste forzado lee los tres primeros; un lector de pantalla lee la etiqueta.

De ahí se derivan el resto de decisiones: por eso las insignias llevan glifo en vez de
pintarse, por eso la zona crítica usa una franja lateral y no sólo un fondo rojo, por
eso las gráficas están prohibidas y las cifras van en `tabular-nums`.

## 6 · Lo que falta, y por qué no está

Nada de esto está oculto: cada punto aparece marcado como simulado dentro de la propia
interfaz.

| Falta | Por qué |
|---|---|
| Backend y persistencia | El SRS define un MVP con dataset simulado |
| Motor de decisión ejecutándose | Los árboles están precargados en `data.js` |
| Exportación STIX 2.1 real | El endpoint de reporting no existe; hay un toast |
| Autenticación real | El conmutador de rol demuestra el RBAC, no lo implementa |
| Supresión de alertas por whitelist | Sin motor de Isolation Forest no es observable |

**Dos ambigüedades del SRS siguen abiertas y son decisión del cliente técnico**, no del
diseño:

- **AQ-01** · ¿de dónde salen los atributos de unidad crítica? El prototipo asume un CSV
  local precargado y lo muestra como el campo `unit` de los datos.
- **AQ-03** · ¿la whitelist acepta CIDR, ASN o sólo país? El prototipo implementa
  **CIDR** y lo declara explícitamente en el formulario, para que el supuesto sea visible
  en la demo y no se pierda al traducir a código.

## 7 · Cómo seguir

1. **Revisión visual.** `node verificar.js` deja 15 capturas en `capturas/`: 5 vistas ×
   3 breakpoints, más los 5 estados de flujo.
2. **Validar con el cliente técnico** AQ-01 y AQ-03 antes de construir el backend.
3. **Derivar los tokens al framework destino.** `tokens.css` está listo para traducirse;
   `DESIGN.md` tiene la especificación completa de cada componente.
4. **Conectar el motor.** Todo el escenario de datos está en `data.js` detrás de una
   interfaz de lectura: sustituirlo por un cliente HTTP es cambiar un archivo.