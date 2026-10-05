# 01 · Análisis de color

Skill aplicado: **`analisis-color-stitch`** (fase previa al prompt). Este documento es el
registro de las decisiones de color: qué llegó en el brief, qué falló y por qué, y qué se
construyó finally. El script `docs/contraste-wcag.py` reproduce cada cifra de aquí.

```bash
python3 docs/contraste-wcag.py     # exit 0 = paleta final conforme
```

---

## 1. Punto de partida

El brief traía una paleta clínica explícita y bem ejecutada:

| Rol | Valor | HSL |
|---|---|---|
| Primario | `#0F4C81` | `hsl(208, 79%, 28%)` |
| Primario hover | `#0B3A63` | `hsl(208, 80%, 22%)` |
| Fondo base | `#F5F7FA` | `hsl(216, 33%, 97%)` |
| Superficie | `#FFFFFF` | — |
| Texto primario | `#1A202C` | `hsl(220, 26%, 14%)` |
| Texto secundario | `#4A5568` | `hsl(218, 17%, 35%)` |
| Borde | `#E2E8F0` | `hsl(214, 32%, 91%)` |
| Peligro | `#E53E3E` | `hsl(0, 76%, 57%)` |
| Advertencia | `#DD6B20` | `hsl(24, 75%, 50%)` |
| Éxito | `#38A169` | `hsl(148, 48%, 43%)` |

Dos observaciones de partida que condicionan todo lo demás:

1. **El azul primario es correcto y no se tocó.** `hsl(208, 79%, 28%)` es un azul
   institucional legible, con saturación suficiente para leerse como "acción" y
   luminancia baja suficiente para sostener texto blanco encima (8.86:1). Es el color
   con mejor comportamiento de la paleta completa.
2. **Los tres colores de severidad sonickle FATAL para texto blanco.** No es un
   defecto de saturación, es una consecuencia geométrica: en HSL, los tres viven por
   encima de L=43%, y cualquier color con luminancia alta flipa a "no apto para
   texto blanco" en cuanto le pones el blanco encima.

## 2. Auditoría WCAG 2.2 del brief

Con la fórmula de luminancia relativa de WCAG 2.2 (`docs/contraste-wcag.py` §2):

| Par | Ratio | Veredicto |
|---|---|---|
| `#1A202C` sobre `#F5F7FA` | 15.20:1 | AAA |
| `#4A5568` sobre `#FFFFFF` | 7.53:1 | AAA |
| `#0F4C81` sobre `#FFFFFF` | 8.86:1 | AAA |
| **`#E53E3E` sobre `#FFFFFF`** | **4.13:1** | **Falla AA en texto** |
| **`#DD6B20` sobre `#FFFFFF`** | **3.39:1** | **Falla AA en texto** |
| **`#38A169` sobre `#FFFFFF`** | **3.25:1** | **Falla AA en texto** |
| **`#E53E3E` sobre `#FFF5F5`** | **3.86:1** | **Falla AA en texto** |
| **`#E2E8F0` sobre `#FFFFFF`** | **1.23:1** | **Falla SC 1.4.11 (borde)** |
| **`#A0AEC0` sobre `#FFFFFF`** | **2.26:1** | **Falla SC 1.4.11 (control deshabilitado)** |

Y un fallo que el brief no declaraba: para el texto terciario de 11 px se usó `#6B7688`,
que da **4.29:1** — insufficient por 0.21.

### 2.1 Interpretación de los fallos

La distinción que gobierna todas las decisiones siguientes:

- **`#E53E3E`, `#DD6B20`, `#38A169` fallan como *relleno con texto encima*, pero
  aprobarían el umbral correcto de 3:1 que la WCAG exige para indicadores no
  textuales** (SC 1.4.11). Es decir: no son colores wrongly elegidos, son colores
  mal *asignados*. Un chip de severidad no tiene por qué ser relleno sólido.
- **`#E2E8F0` sí es un fallo real de elección.** Como borde decorativo de tarjeta es
  correcto y sobrio. Como borde de `<input>` es invisible (1.23:1): el analysta no
  puede saber dónde termina el campo. Son dos usos distintos del mismo color y no
  pueden compartir token.
- **`#6B7688` falla por poco**, pero falla. Los 11 px son el tamaño más frágil del
  sistema y el que más se repite en la interfaz (metadatos de tarjeta, unidad
  clínica, país, shard de telemetría). No valía la pena accepting el margen.

## 3. Escalas tonales

`docs/escalas-tonales.py` genera los ramp 50→900 de los cuatro colores base conservando
el tono HSL y ajustando sólo luminosidad y saturación. Los tres colores de severidad
comparten un problema: **su rampa no tiene un 500 apto para texto blanco**, porque el
punto de partida ya está demasiado claro.

Rampas resultantes (los escalones relevantes):

| Rampa | 300 | 500 (base) | 600 | 700 |
|---|---|---|---|---|
| Rojo `#E53E3E` | `#FEB2B2` | `#E53E3E` | `#C53030` | `#9B2C2C` |
| Naranja `#DD6B20` | `#F6AD55` | `#DD6B20` | `#B45309` | `#9C4221` |
| Verde `#38A169` | `#68D391` | `#38A169` | `#2F855A` | `#276749` |

**Conclusión operativa:** para los tres, el primer escalón que pasa 4.5:1 con texto
blanco es el **600** (rojo), el **600** (naranja) o el **600** (verde). El sistema
adoptó el 600 como "relleno con texto" y mantuvo el 500 como "indicador".

## 4. Decisiones

Regla que gobierna el sistema, y que es la que hace que las dos familias de color
coexistan sin conflicto:

> **El color saturado vive en la capa no textual. El texto va sobre el relleno oscuro
> o sobre su container teñido.**

Es decir, `#E53E3E` no se "*corrige*": se le asigna el trabajo que sí puede hacer bien
—franja lateral de la fila crítica, borde de la fila, icono de triángulo, punto de la
línea de tiempo— y para el trabajo que hacía mal se introduce un token nuevo.

### 4.1 Separación relleno / indicador

| Token | Valor | Uso | Razón |
|---|---|---|---|
| `--error` | `#C53030` | Botón destructivo, contador de navegación, foco de error | 5.47:1 con blanco |
| `--error-indicator` | `#E53E3E` | Franja lateral, borde de fila, icono | 4.13:1 → cumple 3:1 |
| `--error-container` | `#FFF5F5` | Fondo de fila crítica, panel de alerta | — |
| `--on-error-container` | `#9B2C2C` | Texto sobre `#FFF5F5` | 7.04:1 |
| `--warning` | `#B45309` | Relleno del chip de anomalía media | 5.02:1 con blanco |
| `--warning-indicator` | `#DD6B20` | Punto y borde de línea de tiempo | 3.39:1 → cumple 3:1 |
| `--warning-container` | `#FFF4E8` | Fondo de aviso ámbar | — |
| `--on-warning-container` | `#9C4221` | Texto sobre `#FFF4E8` | 6.02:1 |
| `--success` | `#2C7A4B` | Relleno del chip de acceso seguro, borde de `notice--ok` | 5.26:1 con blanco |
| `--success-indicator` | `#38A169` | Punto vivo, anillo de foco | 3.25:1 → cumple 3:1 |
| `--success-container` | `#EFFAF3` | Fondo de aviso verde | — |
| `--on-success-container` | `#276749` | Texto sobre `#EFFAF3` | 6.29:1 |

Los tokens `*-indicator` son la prueba documental de que el color del brief no se
descartó: se conservó exactamente donde la WCAG lo permite.

### 4.2 Texto terciario

`--on-surface-muted` pasó de `#6B7688` (4.29:1) a **`#5F6B7D`** (5.40:1 sobre blanco,
5.04:1 sobre `#F5F7FA`). El salto de tono es imperceptible —same HSL family, 216°→218°—
pero convierte un incumplimiento en margen cómodo para el texto más repetido del
sistema.

### 4.3 Borde: dos tokens donde había uno

| Token | Valor | Uso | Ratio sobre blanco |
|---|---|---|---|
| `--outline` | `#E2E8F0` | Divisores, borde de tarjeta, separador de fila | 1.23:1 (decorativo) |
| `--outline-strong` | `#8A94A6` | Borde de `<input>`, `<select>`, `<textarea>`, botón secundario, chipset | 3.06:1 |

La tarjeta keeps su filete de 1 px: es un borde decorativo y el componente se
identifica por su título, no por su contorno. El control de formulario no tiene esa
excusa, así que sube a `#8A94A6`.

### 4.4 Un hallazgo de la segunda vuelta

La segunda vuelta auditó el DOM renderizado y encontró que `.chipset` —el
segmentado de filtro— usaba `--surface-dim` + `--outline`. Resultado real: borde a
**1.15:1** sobre su propio fondo, y los chips sin seleccionar no tenían ninguna
pista de límite. El control era invisible. Corrección: `.chipset` pasó a fondo
`--surface` con borde `--outline-strong` (3.06:1), y el chip activo pasó a
`--primary-container` + `--on-primary-container` (9.77:1) con borde `--primary`
en lugar de una sombra casi imperceptible.

## 5. Verificación final

`docs/contraste-wcag.py` §4 audita la paleta que realmente shippea en `tokens.css`:

- 33 pares texto/fondo → todos AA o AAA.
- 4 pares de texto blanco sobre relleno de estado → todos AA.
- 3 pares de texto de estado sobre su container → todos AA.
- 9 pares no textuales contra el umbral 3:1 → todos OK.

**Resultado: 0 incumplimientos.** El script sale con código 1 si alguien cambia un
token y rompe el contrato.

## 6. Consecuencia de diseño: el color nunca va solo

Un SOC no puede permitirse leer "rojo" y deducir "grave". Todo nivel de severidad en
HeraUEBA transporta **cuatro canales redundantes**:

1. **Color** — `#C53030` / `#B45309` / `#2C7A4B`.
2. **Glifo** — triángulo con exclamación, círculo con punto, check.
3. **Etiqueta en mayúsculas** — `CRÍTICO` / `ALERTA` / `SEGURO`.
4. **Posición y peso** — franja lateral de 4 px y orden de prioridad.

Un daltonismo deuteranópico lee los cuatro. Un modo de alto contraste forced por el
SO lee los tres primeros. Un lector de pantalla lee el tercero vía `aria-label`.

## 7. Nota sobre el uso del rojo

El rojo de marca `#E53E3E` aparece en el prototipo **sólo** en siete sitios, todos no
textuales: la franja lateral de la fila crítica, su `box-shadow` inset equivalente en
móvil, el borde de la insignia de contador, el borde de `notice--block`, el punto de
la línea de tiempo crítica, y el borde punteado del bloque de evidencia. En ninguno
lleva texto. Es una decisión, no un descuido: la razón está en §4.1.