---
name: HeraUEBA Clinical SOC
colors:
  primary: '#0F4C81'
  on-primary: '#FFFFFF'
  primary-hover: '#0B3A63'
  primary-container: '#E3ECF5'
  on-primary-container: '#0B3A63'
  surface: '#FFFFFF'
  surface-dim: '#F5F7FA'
  background: '#F5F7FA'
  on-surface: '#1A202C'
  on-surface-variant: '#4A5568'
  on-surface-muted: '#5F6B7D'
  outline: '#E2E8F0'
  outline-strong: '#8A94A6'
  error: '#C53030'
  on-error: '#FFFFFF'
  error-container: '#FFF5F5'
  on-error-container: '#9B2C2C'
  error-indicator: '#E53E3E'
  tertiary: '#B45309'
  on-tertiary: '#FFFFFF'
  tertiary-container: '#FFF4E8'
  on-tertiary-container: '#9C4221'
  tertiary-indicator: '#DD6B20'
  secondary: '#2C7A4B'
  on-secondary: '#FFFFFF'
  secondary-container: '#EFFAF3'
  on-secondary-container: '#276749'
  secondary-indicator: '#38A169'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
  headline-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  headline-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
  label-caps:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.06em
  code-forensic:
    fontFamily: 'Fira Code'
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.375rem
rounded:
  sm: 0.25rem
  DEFAULT: 0.375rem
  md: 0.375rem
  lg: 0.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Marca y carácter

HeraUEBA es una plataforma B2B de ciberseguridad (UEBA) para Centros de Operaciones de
Seguridad del sector salud. El usuario es un analista que trabaja bajo presión de tiempo:
la sesión de un médico no puede ser interrumpida y el componente humano decide siempre.

Personalidad visual: **clínica, profesional, minimalista**. La interfaz se comporta como un
instrumento de laboratorio, no como un panel publicitario: sin degradados, sin sombras
difusas, sin emojis como iconografía, sin gráficos circulares decorativos. Todo el peso
visual se concentra en la severidad de la alerta y en la trazabilidad de la decisión.

Dos principios gobiernan cada pantalla:

1. **Visibilidad inmediata** — las amenazas críticas ocupan la parte superior absoluta del
   primer viewport, sin desplazamiento vertical.
2. **Fricción segura** — ninguna acción destructiva se ejecuta en un clic. Las mitigaciones
   exigen confirmación en dos pasos y quedan auditadas.

## Colores

Reparto 60-30-10. Los neutros dominan; el azul marca acción y navegación; el rojo se reserva
íntegramente para estado crítico. Ningún otro componente compite con el rojo.

| Rol | Valor | Uso |
|---|---|---|
| Fondo base (60%) | `#F5F7FA` | Lienzo de la página, cabeceras de tabla |
| Superficie | `#FFFFFF` | Tarjetas, paneles, modales, tablas |
| Primario / acción (30%) | `#0F4C81` | Botón primario, pestañas activas, enlaces de acción |
| Primario hover | `#0B3A63` | Estado hover del primario |
| Primario container | `#E3ECF5` | Fondos de-badge informativo, chip activo |
| Texto primario | `#1A202C` | Títulos, cuerpo, cifras |
| Texto secundario | `#4A5568` | Etiquetas, cabeceras de columna, metadatos |
| Texto terciario | `#5F6B7D` | Metadatos de 11px, separadores de migas |
| Borde / divisor | `#E2E8F0` | Separadores de fila, borde de tarjeta |
| Borde de control | `#8A94A6` | Borde de input y botón (cumple 3:1) |
| Error / crítico | `#C53030` | Relleno del botón destructivo y del contador de la navegación |
| Error indicador | `#E53E3E` | Franja lateral, borde de fila, icono |
| Error container | `#FFF5F5` | Fondo de fila y panel de alerta roja |
| Error texto | `#9B2C2C` | Texto sobre `#FFF5F5` |
| Advertencia | `#B45309` | Relleno del chip de anomalía media |
| Advertencia indicador | `#DD6B20` | Punto y borde de la línea de tiempo |
| Advertencia texto | `#9C4221` | Texto sobre `#FFF4E8` |
| Éxito | `#2C7A4B` | Relleno del chip de acceso seguro, borde de `notice--ok` |
| Éxito indicador | `#38A169` | Punto vivo del encabezado, anillo de foco |
| Éxito texto | `#276749` | Texto sobre `#EFFAF3` |
| Deshabilitado | `#E2E8F0` / `#6B7688` | Fondo y texto de control no accionable |

Contraste verificado con la fórmula de luminancia relativa WCAG 2.2:

| Par | Ratio | Nivel |
|---|---|---|
| `#1A202C` sobre `#F5F7FA` | 15.2:1 | AAA |
| `#4A5568` sobre `#FFFFFF` | 7.53:1 | AAA |
| `#5F6B7D` sobre `#FFFFFF` | 5.40:1 | AA |
| `#5F6B7D` sobre `#F5F7FA` | 5.04:1 | AA |
| `#FFFFFF` sobre `#0F4C81` | 8.86:1 | AAA |
| `#FFFFFF` sobre `#C53030` | 5.47:1 | AA |
| `#FFFFFF` sobre `#B45309` | 5.02:1 | AA |
| `#FFFFFF` sobre `#2C7A4B` | 5.26:1 | AA |
| `#9B2C2C` sobre `#FFF5F5` | 7.04:1 | AAA |
| `#9C4221` sobre `#FFF4E8` | 6.53:1 | AA |
| `#8A94A6` sobre `#FFFFFF` | 3.06:1 | UI (AA no textual) |

**Decisiones documentadas:**

1. `#E53E3E` con texto blanco sólo da 4.13:1 y no alcanza AA para texto normal. Por eso el
   botón destructivo y el contador de la navegación usan el relleno `#C53030`, y `#E53E3E`
   queda reservado para indicadores no textuales (franja, icono, borde). El estado nunca
   depende sólo del color: cada nivel lleva icono, etiqueta textual (`CRÍTICO`, `ALERTA`,
   `MEDIA`) y franja lateral.
2. `#DD6B20` (3.39:1 con blanco) y `#38A169` (3.25:1 con blanco) fallaban como relleno con
   texto. Se oscurecieron los rellenos a `#B45309` y `#2C7A4B` y los saturados se
   conservaron como indicadores (`--warning-indicator`, `--success-indicator`).
3. `#6B7688` daba 4.29:1 y fallaba AA para el texto terciario de 11px; se oscureció a
   `#5F6B7D` (5.40:1). `#8A94A6` sí se conserva: su función es el borde de control y ahí
   el umbral correcto es 3:1 (SC 1.4.11), no 4.5:1.

## Tipografía

Dos familias con oficios separados:

- **Inter** — toda la estructura de interfaz. Titulares en peso 600, cuerpo en 400.
- **Fira Code** — artefactos forenses: direcciones IP, rutas de decisión del árbol, logs
  JSON, identificadores de incidente, marcas de tiempo ISO.

Escala fija y baja: H1 24px/600 · H2 18px/600 · Subtítulo 16px/600 · Cuerpo 14px/400 ·
Etiqueta 12px/500 en mayúsculas con `letter-spacing: 0.06em` · Código 13px/400. Todas las
cifras de tabla usan `font-variant-numeric: tabular-nums` para que las columnas de riesgo y
tiempo queden alineadas durante el barrido vertical.

No hay escala fluida con `clamp()` en las vistas densas: un SOC lee la misma jerarquía
tipográfica a 13" y a 27". La consistencia prima sobre el efecto visual.

## Layout y espaciado

Rejilla de 12 columnas, contenedor máximo 1440px, gutter 16px, márgenes exteriores 24px.
Escalas de espaciado múltiplos de 4px: 4 · 8 · 12 · 16 · 24 · 32.

- **Desktop (≥1280px, principal):** rail de navegación fijo de 240px a la izquierda,
  contenido fluido a la derecha. El panel de caja blanca se acopla como columna derecha de
  420px dentro del detalle de alerta.
- **Tablet (768–1279px):** el rail colapsa a iconos de 72px; la tabla conserva cuatro
  columnas (riesgo, usuario, regla IA, hora) y el resto pasa a línea secundaria.
- **Móvil (<768px):** una sola columna; la tabla de alertas se transforma en tarjetas
  apilables con etiqueta y valor por campo; el panel de caja blanca se apila bajo el
  resumen del usuario. Áreas táctiles mínimas de 44×44px.

Densidad: fila de tabla de 44px en escritorio, 40px en el panel forense. Sin scroll
horizontal en ningún breakpoint; los identificadores largos se cortan con elipsis o
`overflow-wrap: anywhere`.

## Elevación y profundidad

La profundidad se construye con capas tonales y bordes de 1px, nunca con sombras suaves.

- **Nivel 0 — lienzo:** `#F5F7FA`.
- **Nivel 1 — panel y rejilla de datos:** `#FFFFFF` con borde `#E2E8F0` de 1px.
- **Nivel 2 — tarjeta interactiva, menú de filtro, cabecera flotante:** `#FFFFFF` con
  borde `#8A94A6` y `0 4px 6px rgba(0,0,0,0.1)`.
- **Nivel 3 — modal de verificación y bandeja forense:** `#FFFFFF` sobre un velo
  `rgba(26,32,44,0.55)`, borde `#E2E8F0`, radio 8px.
- **Anulación de nivel:** una fila o tarjeta crítica inyecta una franja lateral sólida de
  4px en `#E53E3E` más un tinte ambiental `#FFF5F5`, sin alterar el resto de la retícula.

## Formas

Geometría ortogonal con concavidad mínima: radios de 4px en botones, campos, chips y
filas; 6px en tarjetas y paneles; 8px en modales. Sólo los contadores de badge y el
indicador de ingesta en vivo usan radio completo. Sin biseles, sin sombras difusas, sin
esquinas redondeadas excesivas.

## Componentes

### Botones
- **Primario:** relleno `#0F4C81`, texto `#FFFFFF`, radio 4px, altura 40px, sin sombra.
  Hover `#0B3A63`. Foco: anillo exterior de 2px `#0F4C81` desplazado 2px.
- **Destructivo:** relleno `#C53030`, texto `#FFFFFF`, icono de advertencia SVG a la
  izquierda. Reservado en exclusiva para «Aislar Usuario». Nunca aparece junto a otro
  botón primario.
- **Secundario:** fondo `#FFFFFF`, borde 1px `#8A94A6`, texto `#0F4C81`.
- **Deshabilitado:** fondo `#E2E8F0`, texto `#6B7688` (3.73:1), `cursor: not-allowed`,
  acompañado de una línea de ayuda que explica el motivo del bloqueo (rol insuficiente
  o unidad crítica protegida). WCAG 1.4.3 exime el texto de un componente inactivo, pero
  una etiqueta ilegible no explica nada: el listón real del sistema es 3:1.

### Segmentado (chips de filtro)
Contenedor con fondo `#FFFFFF`, borde 1px `#8A94A6` y radio 4px; los chips miden 32px de
alto y envuelven en pantallas estrechas. Es un control, así que su borde necesita 3:1
(SC 1.4.11): con `#E2E8F0` sobre `#F5F7FA` quedaba en 1.15:1 y el grupo se perdía. El
chip activo usa relleno `#E3ECF5`, texto `#0B3A63` (9.77:1) y borde interior `#0F4C81`.

### Insignias de severidad
Píldora de 4px con `label-caps` en mayúsculas: relleno del color de estado, texto blanco
en el color oscuro equivalente, y glifo propio.

| Nivel | Relleno (texto blanco) | Glifo | Etiqueta |
|---|---|---|---|
| Crítico | `#C53030` | triángulo con exclamación | `CRÍTICO` |
| Media | `#B45309` | círculo con punto | `ALERTA` |
| Informativa | `#2C7A4B` | check | `SEGURO` |
| Contexto | `#E3ECF5` + `#0B3A63` | — | `UCI`, `QUIRÓFANO`, `WHITELIST` |

### Tablas de eventos
Cabecera pegajosa con relleno `#F5F7FA` y texto `#4A5568` en `label-caps`. Filas de 44px
con separador de 1px `#E2E8F0`. La fila crítica combina franja lateral de 4px `#E53E3E`
y relleno `#FFF5F5`. Toda la fila es clicable y muestra foco visible completo.

### Campos de entrada
Altura 40px, fondo `#FFFFFF`, borde 1px `#8A94A6`, relleno 12px. Etiqueta visible siempre
sobre el campo, nunca sólo como placeholder. Foco: borde `#0F4C81` más anillo de 2px
exterior. Error: borde `#C53030` con mensaje textual accionable bajo el campo.

### Panel de caja blanca
Bloque de código monoespaciado `#Fira Code` sobre `#FFFFFF` con borde `#E2E8F0` y sangría
izquierda de 4px en `#0F4C81`. Contiene la ruta de decisión del árbol leída línea a línea:
nodo, condición, valor observado, veredicto. Copiable con un solo clic y con confirmación
visual de estado. Es un componente de primer nivel, no un detalle técnico: la
transparencia algorítmica es un requisito normativo de auditoría.

### Modal de verificación de dos pasos
Centrado en el viewport sobre velo oscuro. Indicador de progreso `Paso 1 de 2` / `Paso 2
de 2`. Paso 1: resumen del objetivo y del usuario afectado, campo de motivo obligatorio y
campo de re-autenticación. Paso 2: palabra de confirmación en mayúsculas que el operador
debe escribir literalmente, con botón destructivo deshabilitado hasta que coincida. El
botón de salida es texto plano «Cancelar y volver», nunca otro botón destructivo.

### Modal de unidad crítica
Rechaza la operación con un motivo normativo explícito (BR-002), cita el rol y la unidad
del usuario, y ofrece una ruta alternativa: escalar al CISO y abrir incidente en vez de
bloquear. Nunca presenta un botón de bloqueo desactivado como única salida.

## Movimiento

Transiciones de 150ms con `cubic-bezier(0.2, 0.8, 0.2, 1)` sólo para hover, foco y
aparición de modales (escala 0.98→1 con fundido de 120ms). Nada de animación en los datos:
los números de riesgo no se interpolan, porque un valor que se mueve no es auditable.
`prefers-reduced-motion` elimina todas las transiciones.

## Iconografía

Un único trazo de 1.5px, esquinas redondeadas, 20px por defecto. SVG en línea, nunca emoji
ni pictogramas de sistema. El glifo de severidad acompaña siempre a la etiqueta textual para
no depender del color.