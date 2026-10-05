# HeraUEBA · Prototipo MVP

Prototipo navegable del MVP de **HeraUEBA**, plataforma UEBA (User and Entity Behavior
Analytics) para el Centro de Operaciones de Seguridad de un hospital.

Todo lo que se entrega está en esta carpeta. No hay dependencias de build: se abre
`prototype/index.html` en un navegador y funciona.

---

## Abrir el prototipo

```bash
# Opción 1 · abrir el archivo
xdg-open prototype/index.html      # o simplemente abrirlo con doble clic

# Opción 2 · servirlo (recomendado si el navegador restringe file://)
python3 -m http.server 8080 --directory prototype
# → http://localhost:8080
```

## Recorrido recomendado

Se entra por el rol de **Coordinadora SOC** (que puede aislar). Los seis estados del
brief se alcanzan así:

| # | Vista | Cómo llegar |
|---|---|---|
| 1 | **Dashboard Principal** | Abrir la raíz |
| 2 | **Detalle de Alerta** | Clic en la primera alerta crítica (`INC-2026-0417`) |
| 3 | **Modal de aislamiento, paso 1** | «Aislar usuario» en el detalle |
| 4 | **Modal de aislamiento, paso 2** | Rellenar motivo + re-autenticación + notificar, luego «Continuar» |
| 5 | **Gestión de Whitelist** | Enlace «Whitelist» del panel lateral |
| 6 | **Historial de Usuario** | Enlace «Historial» del panel lateral, o el resultado del aislamiento |
| 7 | **Error de unidad crítica (BR-002)** | Detalle de `INC-2026-0418` (Urgencias) → «Aislar usuario» |

**Para ver el RBAC**: en la parte baja del panel lateral hay un conmutador
«Simular rol». Ponlo en *Analista Junior* y vuelve al detalle de una alerta: el botón
«Aislar usuario» aparece deshabilitado con la explicación del motivo.

## Verificación

```bash
npm install          # sólo puppeteer-core
node verificar.js    # o: npm run verificar
```

Dos suites sobre el prototipo real en Chromium headless:

- **Comportamiento** — flujo de aislamiento en 2 pasos, RBAC, BR-001, BR-002, alta de
  whitelist con validación, densidad de acciones primarias, zona crítica sin scroll.
- **Presentación** — contraste WCAG sobre el DOM renderizado, tamaño de objetivos
  táctiles, texto por debajo de 11px, contenido cortado, desbordes horizontales.

Sale con código 1 si algo falla. Las capturas se escriben en `capturas/`.

```bash
python3 docs/contraste-wcag.py   # auditoría de la paleta, exit 0 = conforme
```

## Estructura

```
Stitch-prototype/
├── DESIGN.md               Sistema de diseño completo. Fuente de verdad.
├── tokens.css              Los tokens sueltos, para reusar en otro proyecto.
├── verificar.js            Suite de verificación automatizada.
├── package.json
│
├── prototype/              LA ENTREGABLE NAVEGABLE
│   ├── index.html          Shell: rail, topbar, punto de montaje
│   └── assets/
│       ├── tokens.css      Tokens CSS (copia idéntica a ../tokens.css)
│       ├── app.css         Layout y componentes
│       ├── data.js         Datos del escenario: usuarios, alertas, árboles, roles
│       ├── ui.js           Primitivas de presentación (caja blanca, avisos, tablas)
│       ├── views.js        Los cuatro renderizadores de vista
│       ├── modals.js       Modal de 2 pasos, modal BR-002, confirmaciones
│       └── app.js          Estado, router por hash, delegación de eventos
│
├── designs/                Las 6 pantallas generadas en Stitch
│   ├── 0N-*.html           HTML original de cada pantalla
│   ├── 0N-*.png            Captura nativa (Stitch renderiza a 2560px)
│   └── downloads.json      IDs de pantalla y archivo (las URLs son efímeras)
│
├── capturas/               Registro visual del prototipo (ver su README)
│
└── docs/
    ├── 01-analisis-color.md      Auditoría de color y decisiones derivadas
    ├── 02-prompts-stitch.md      Los prompts de especificación de las 6 vistas
    ├── 03-trazabilidad.md        Matriz FR / NFR / BR / US → dónde y cómo se verifica
    ├── contraste-wcag.py         Script de contraste (autoverificable)
    └── escalas-tonales.py        Generador de rampas 50→900
```

## Las seis decisiones que definen el prototipo

### 1 · El color nunca va solo

Todo nivel de severidad transporta cuatro canales redundantes: color, glifo, etiqueta
en mayúsculas y posición. Un daltonismo deuteranópico lee los cuatro; un modo de alto
contraste forzado lee los tres primeros; un lector de pantalla lee la etiqueta.

Detalle en [`docs/01-analisis-color.md`](docs/01-analisis-color.md).

### 2 · El color saturado es indicador; el texto va sobre relleno oscuro

El rojo de marca `#E53E3E` con texto blanco da 4.13:1 y falla AA. No se descartó: se
asignó al trabajo que sí puede hacer bien —franja lateral, borde de fila, icono— y para
el trabajo que hacía mal se introdujeron rellenos oscuros (`#C53030`, `#B45309`,
`#2C7A4B`), todos ≥ 5:1 con texto blanco.

### 3 · Las alertas críticas están antes del scroll

Es un requisito (FR-001) y se verifica automáticamente: a 1440×900 la zona crítica
completa termina en el píxel 881 de 900. El resto —telemetría y tablas secundarias— va
debajo. No hay ni un gráfico de torta, barras o líneas en todo el sistema.

### 4 · Cero tolerancia al bloqueo automático (BR-001)

El umbral `umbral_auto_bloqueo = 0.98` aparece en la caja blanca de cada alerta y en el
portapapeles al copiar el incidente. **La alerta más alta del dataset es 0.94**: en el
MVP es literalmente imposible demostrar un bloqueo automático, porque no hay datos que
lo permitan.

### 5 · Denegar es un final de flujo, no una advertencia (BR-002)

El modal de unidad crítica **no ofrece** «aislar de todos modos». No hay bypass, ni
opción avanzada, ni texto que lo sugiera. Para que el analista sepa la restricción
*antes* de hacer clic, las filas de una cuenta de UCI, Quirófano o Urgencias llevan su
etiqueta en la propia tabla.

### 6 · Un botón deshabilitado tiene que explicar por qué

WCAG exime el contraste del texto en componentes inactivos. Aquí se aplica un listón
propio de 3:1, porque una etiqueta ilegible no explica nada. `--disabled-fg` es
`#6B7688` (3.73:1), no el `#A0AEC0` del brief (1.83:1), y siempre acompaña a una línea
que dice *rol insuficiente* o *unidad crítica protegida*.

## Lo que este prototipo NO es

- **No tiene backend.** Todo el estado vive en memoria JS. El aislamiento cambia un
  objeto, no una fila en una base de datos.
- **No calcula el riesgo.** Los árboles de decisión están precargados en `data.js`; no
  hay Árbol de Decisión ni Isolation Forest corriendo.
- **No exporta de verdad.** Los botones de STIX 2.1 y de ticket muestran un toast.
- **No autentica.** El conmutador de rol es una herramienta de demostración del RBAC.

La interfaz marca cada simulación como tal en el propio texto. Es el comportamiento que
exige BR-001: quien usa el prototipo nunca puede confundir una simulación con una
mitigación aplicada.

## Créditos

- **Diseño de interfaz**: skills `diseno-web-pro`, `guia-diseno-prompts` y
  `analisis-color-stitch`; generación con Google Stitch.
- **Origen de los requisitos**: [`../docs/srs_heraueba.md`](../docs/srs_heraueba.md) y
  [`../docs/historias_usuario.md`](../docs/historias_usuario.md).
- **Trazabilidad requisito → vista → verificación**:
  [`docs/03-trazabilidad.md`](docs/03-trazabilidad.md).

## Nota sobre las fuentes

Inter y Fira Code se cargan desde Google Fonts. Sin conexión, el sistema cae a
`system-ui` y a la monoespaciada del sistema. **Los tokens no cambian**, así que el
contraste se mantiene; lo único que se degrada es la métrica tipográfica.