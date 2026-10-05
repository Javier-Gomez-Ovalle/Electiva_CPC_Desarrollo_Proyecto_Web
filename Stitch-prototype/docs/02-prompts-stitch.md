# 02 · Prompts de Stitch

Skills aplicados: **`guia-diseno-prompts`** (estructura del prompt) y
**`diseno-web-pro`** (brief→prompt→validación).

Este documento registra **los prompts de especificación** que reproducen las seis
pantallas del prototipo en el proyecto Stitch `heraueba-mvp2`. Son la especificación
completa de cada vista: si se ejecutan de nuevo, generan la misma pantalla.

> **Nota de honestidad documental.** La API de Stitch no persiste el prompt con el
> que se generó una pantalla (`get_screen` devuelve título, dimensiones y archivos, no
> el prompt). Estos prompts son por tanto **reconstrucciones verificadas** contra los
> HTML descargados, no una transcripción literal del log de la sesión. Se presentan
> como especificación, no como registro. Lo que sí es literal y verificable son los
> identificadores de pantalla y de archivo de `designs/downloads.json`.

---

## 1. Estructura del prompt (de `guia-diseno-prompts`)

Todo prompt de pantalla sigue el mismo esqueleto de siete bloques, en este orden:

```
1. ROL Y PRODUCTO     — qué es esto, para quién, en qué contexto
2. USUARIO PRIMARIO   — la persona concreta que abre esta pantalla
3. JERARQUÍA VISUAL   — qué va primero, qué va segundo (orden explícito)
4. CONTENIDO EXACTO   — los datos literales, no "textos de ejemplo"
5. RESTRICCIONES      — qué NO debe aparecer
6. TOKENS             — hex explícitos; nunca "usa el azul de la marca"
7. FORMATO            — una sola pantalla, escritorio
```

Los bloques 3, 4 y 6 son los que hacen la diferencia. Stitch optimiza por estética;
sin un orden explícito y sin datos literales produce un dashboard genérico con
métricas inventadas, que es exactamente el failure mode que el brief prohíbe.

### 1.1 Regla de oro: hex explícito en el prompt

Stitch **no aplicó el design system de forma fiable** a las pantallas generadas. El
`designSystem` estaba correctamente pasado a `generate_screen_from_text`, y aun así
la mayoría de pantallas volvieron con su propia paleta.

Por eso el patrón que funcionó fue doble:

- **Pasada A** — generar con `designSystem` para fijar tipografía, radio y densidad.
- **Pasada B** — `edit_screens` con **los hexadecimales escritos dentro del prompt**:
  `usa exactamente #0F4C81 para el primario, #C53030 para el botón destructivo, #F5F7FA para el fondo`.

Dos pantallas (02 y 05) no respondieron ni a `edit_screens` y se regeneraron con
`generate_screen_from_text` **con la paleta completa embebida en el prompt de
generación**. Es más caro, pero es la vía que funciona cuando el edit se ignora.

## 2. Bloque común

Los seis prompts comparten este prefijo literal:

```text
Diseña UNA pantalla de escritorio (1440px de ancho) para "HeraUEBA", una plataforma
UEBA de ciberseguridad para el Centro de Operaciones de Seguridad (SOC) de un
hospital. El usuario es un analista o coordinador de SOC que trabaja en turnos de
12 horas mirando esta pantalla de forma continua.

PALETA — usa estos hexadecimales exactos, no aproximaciones:
  Primario / acción:  #0F4C81     hover: #0B3A63     container: #E3ECF5
  Fondo de página:    #F5F7FA     Superficie/tarjeta: #FFFFFF
  Texto primario:     #1A202C     Texto secundario: #4A5568    Texto terciario: #5F6B7D
  Borde decorativo:   #E2E8F0     Borde de control:  #8A94A6
  Crítico (relleno):  #C53030     Crítico (franja/icono): #E53E3E    fondo: #FFF5F5
  Media (relleno):    #B45309     Media (punto):  #DD6B20         fondo: #FFF4E8
  Seguro (relleno):   #2C7A4B     Seguro (punto): #38A169          fondo: #EFFAF3

TIPOGRAFÍA — Inter para todo el texto de interfaz. Fira Code, y sólo Fira Code,
para: direcciones IP, identificadores de incidente (INC-...), timestamps ISO,
rutas de árbol de decisión y logs JSON. Nada más en monoespaciado.

RESTRICCIONES DURAS:
  · UNA sola pantalla de escritorio. Sin móvil, sin tablet, sin variantes.
  · Sin gráficos de torta, barras, líneas o sparklines. Esta interfaz es una
    lista de eventos priorizados, no un panel de business intelligence.
  · Ninguna métrica decorativa sin acción asociada.
  · Radios de 4 a 8px máximo. Sombras mínimas: la jerarquía va con capas
    tonales, no con drop shadows.
  · Índice de contenido visual bajo: una sola acción primaria por pantalla.
```

## 3. Los seis prompts

### 3.1 View 1 · Dashboard Principal

```text
[ BLOQUE COMÚN ]

CONTENIDO EXACTO:

Cabecera: "Centro de Operaciones de Seguridad · Turno noche" a la izquierda;
"Operación en vivo" con punto verde a la derecha. Migas: SOC Salud › Monitoreo.

Barra de filtros: segmentado de ventana temporal con 1 h / 24 h / 7 d / 30 d,
con "24 h" seleccionado por defecto (es un requisito de negocio, no una
preferencia). A su derecha, un desplegable "Todas las severidades" y un campo de
texto "Buscar cuenta o IP".

KCPS — cuatro tarjetas en fila, sólo texto y cifras, sin gráficos:
  "Alertas críticas — 3"
  "Cuentas aisladas hoy — 1"
  "Eventos en ventana — 184.220"
  "Falsos positivos descartados — 27"

ZONA CRÍTICA — es el corazón de la pantalla y va PRIMERO, sin scroll a 1440×900:
tres tarjetas de alerta crítica, en este orden exacto:
  1. INC-2026-0417 · 0.94 · "Médica especialista · Neurología"
     "8 intentos fallidos en 2 min desde 3 IPs distintas · 185.220.101.47 (Alemania)"
  2. INC-2026-0418 · 0.88 · "Enfermera espectadora · Urgencias"
     "Acceso concurrente desde 2 países en 40 min · Países Bajos"
  3. INC-2026-0416 · 0.91 · "Administrador de sistemas · TI · Infraestructura"
     "Descarga de 2.4 GB en ventana de mantenimiento · Vietnam"
Cada tarjeta lleva: insignia "CRÍTICO" con triángulo, el score de riesgo en cifras
grandes con tabular-nums, la regla que disparó la alerta en texto legible, el
usuario y su unidad, y una fila de acción secundaria. La tarjeta crítica lleva
franja lateral de 4px #E53E3E y fondo #FFF5F5.

DEBAJO DE LA ZONA CRÍTICA, y sólo después: una franja de telemetría con cuatro
datos de texto (nodo, shard, retención, cobertura) y una tabla de "Otras
anomalías" con tres filas de severidad media y baja.

Cada fila de la tabla es clicable y lleva una insignia de unidad crítica
("UCI", "QUIRÓFANO") cuando el usuario pertenece a una unidad exceptuada.
```

### 3.2 View 2 · Detalle de Alerta con caja blanca

```text
[ BLOQUE COMÚN ]

CONTENIDO EXACTO:

Título: "INC-2026-0417" en monoespaciado. Subtítulo: "Intento de acceso con
credenciales comprometidas · Neurología". A la derecha, insignia "CRÍTICO".

Panel 1 — RESUMEN DEL INCIDENTE, dos columnas:
  Cuenta:       mg.ramirez
  Nombre:       Dra. María Gabriela Ramírez Peña
  Rol:          Médica especialista · Neurología
  Unidad:       Consulta externa      ← NO es unidad crítica
  IP origen:    185.220.101.47        (Fira Code)
  ASN / País:   AS60729 · Alemania    (Fira Code)
  Score:        0.94
  Regla:        RB-001 · Fuerza bruta distribuida
  Detectado:    2026-10-04T03:12:44Z  (Fira Code)
  Sesión:       3 sesiones activas

Panel 2 — CAJA BLANCA: "Por qué el modelo decidió alertar".
Este panel es el requisito normativo (Ley 1581): muestra el árbol de decisión
nodo por nodo, con la condición superada escrita en texto legible, no en notación
técnica. Cada nodo lleva un glifo de estado (check = superado, aspa = fallado,
círculo = no evaluado) y su regla en una línea:
  ✓ N1  origen_multi_ip            3 IPs distintas en la ventana     → superado
  ✓ N2  failed_attempts_gt_8       8 intentos fallidos en 120 s     → superado
  ✗ N3  known_geo_pair             par (Colombia→Alemania) no visto → fallado
  ✓ N4  off_hours_access            03:12 hora local, fuera de turno → superado
  ○ N5  impossible_travel           no evaluado (requiere Isolation Forest)
Debajo, una línea de "contribución al score": cada nodo con su peso en
porcentaje, y una barra de 4px por nodo. Esto NO es un gráfico de business
intelligence, es la explicación de una decisión individual.

Panel 3 — LÍNEA DE TIEMPO de 6 eventos, cada uno con hora en monoespaciado,
glifo de estado y descripción de una línea. Los eventos fallidos usan el punto
#DD6B20, el crítico #E53E3E, el correcto #38A169.

Panel 4 — ACCIONES. Un solo botón primario en toda la pantalla:
  "Aislar usuario" — relleno #C53030, glifo de advertencia, etiqueta completa
  (no "Aislar"). Junto a él, dos secundarios: "Escalar al CISO" y "Abrir ticket".
  Debajo, un aviso visible: "El aislamiento requiere confirmación en dos pasos
  y queda registrado en el expediente del incidente."
```

### 3.3 View 3 · Modal de Aislamiento, paso 1

```text
[ BLOQUE COMÚN, más: "Esta es la pantalla de un MODAL. Dibuja sólo el modal
centrado sobre un scrim oscuro rgba(26,32,44,0.55). No dibujes la página de
fondo." ]

CONTENIDO EXACTO:

Título:  "Aislar la cuenta mg.ramirez"
Paso:    Indicador "Paso 1 de 2" — un track de dos segmentos, el primero
         relleno #0F4C81, el segundo en #E2E8F0, con las etiquetas
         "Verificación" y "Confirmación" debajo.

aviso:   Bloque con borde izquierdo de 3px #C53030 y fondo #FFF5F5:
         "Esta acción interrumpe el acceso de la médica al sistema clínico.
          No es un bloqueo automático: queda registrado con tu usuario y hora."

Resumen del impacto, en lista de cuatro puntos con glifo:
  · Se revocarán 3 sesiones activas de mg.ramirez
  · La cuenta quedará en cuarentena hasta revisión del CISO
  · La paciente no verá ningún aviso: su historial clínico es inaccesible
    para el resto del personal hasta que el personal clínico levante la cuarentena
  · El historial forense de los últimos 180 días se conserva intacto

Justificación obligatoria — campo de texto multilínea, ya enfocado, con
contador de caracteres, placeholder que menciona el número de ticket y la
evidencia:
  "Ej. Ticket INC-2026-0417. Credencial filtrada en foro externo, verificación
   con lachefa de servicio en ticket SO-88214."

Casillas de verificación obligatorias, cada una con su glifo:
  ☐ Confirmé que la sesión es legítima con la Charge Nurse de la unidad
  ☐ Entiendo que mg.ramirez NO pertenece a una unidad crítica
  ☐ Entiendo que esta acción queda en el expediente del incidente

PIE DEL MODAL:
  Izquierda: texto terciario "Paso 1 de 2 · se requieren las 3 casillas"
  Derecha:   secundario "Cancelar" + primario "Continuar →" (relleno #0F4C81)
  El botón "Continuar" empieza deshabilitado (fondo #E2E8F0, texto #A0AEC0)
  hasta que las tres casillas estén marcadas.
```

### 3.4 View 4 · Gestión de Whitelist

```text
[ BLOQUE COMÚN ]

CONTENIDO EXACTO:

Título:  "Whitelist geográfica"
Subtítulo: "Excepciones de viaje para evitar falsos positivos de Isolation Forest."

Aviso de contexto, fondo #E3ECF5, borde izquierdo 3px #0F4C81:
  "Una whitelist sin vigencia es una puerta trasera. Toda entrada tiene fecha
   de expiración y justificación clínica registrada en bitácora."

TABLA DE ENTRADAS VIGENTES, 5 filas, columnas:
  Red / CIDR (Fira Code) | País | Ámbito | Vence | Registró | Estado | Acción
  190.24.0.0/16          | Colombia | Institucional | 2026-12-31 | Carla M. Restrepo | ACTIVA
  181.30.0.0/16          | Argentina | Todo el personal | 2026-11-15 | Carla M. Restrepo | ACTIVA
  200.115.0.0/16         | Panamá    | Telemedicina | 2026-10-28 | Diego A. Fuentes | POR VENCER
  41.90.0.0/16           | Kenia     | Chía · Satélite  | 2026-10-06 | Carla M. Restrepo | ACTIVA
  8.8.8.0/32             | Estados Unidos | NTP corporativo | 2027-01-31 | Carla M. Restrepo | ACTIVA
Cada fila termina en un icono de papelera con texto "Eliminar" — nunca un
icono suelto sin etiqueta.

PANEL DERECHO — "Nueva entrada". Formulario en una columna:
  · Red o dirección CIDR *   placeholder 190.24.0.0/16   (texto: esto es
    importante: la entrada se define por CIDR o IP, no por nombre de médico)
  · País *                     texto libre, placeholder "Colombia"
  · Ámbito de aplicación       desplegable: Institucional / Todos los usuarios /
                               Urgencias · Satélite / Proveedor externo
  · Vigencia *                 campo de fecha, OBLIGATORIO, con hint debajo:
                               "Las entradas permanentes requieren aprobación
                                del Comité de Ciberseguridad."
  · Justificación clínica *     área de texto de 4 líneas
  · Casilla: "Confirmo que esta entrada no amplía el acceso al historial
    clínico fuera de la justificación registrada."
  · Botón primario "Agregar entrada" con glifo de más.

Este es el único lugar del sistema donde el formulario y la tabla comparten
pantalla: el analista necesita ver lo que ya existe mientras decide qué añadir.
```

### 3.5 View 5 · Historial de Usuario

```text
[ BLOQUE COMÚN ]

CONTENIDO EXACTO:

Título:  "Historial forense"
Crumb de contexto: "mg.ramirez" con su estado actual.

Segmentado de cuentas — cinco chips: mg.ramirez (activo), enf.castillo,
adm.sistema, enf.mendoza, lab.tech. Debajo, un segundo segmentado de ventana:
24 h / 7 días / 30 días / Histórico completo.

Aviso de alcance, fondo #E3ECF5:
  "Esta vista ignora el filtro global de 24 h del dashboard y consulta el
   histórico completo forense. Alcance: 180 días de retención."

PANEL DE IDENTIDAD, a la izquierda, fijo al hacer scroll:
  Nombre, rol, unidad, insignia de estado de la cuenta.
  Si la cuenta está aislada, insignia roja "AISLADA" con la hora del aislamiento
  y quién lo ordenó.

LINEA DE TIEMPO FORENSE — tabla de 8 eventos, columnas:
  Timestamp (Fira Code) | Evento | Origen | Resultado | Geo | Dispositivo
  2026-10-04T03:12:44Z | Intento de login fallido  | 185.220.101.47 | FALLO  | Alemania | Windows 11
  2026-10-04T03:12:39Z | Intento de login fallido  | 185.220.101.47 | FALLO  | Alemania | Windows 11
  …
  2026-10-04T02:58:10Z | Sesión iniciada          | 190.24.88.14    | OK     | Colombia | macOS
  2026-10-03T18:22:03Z | Exportación de historial | 190.24.88.14    | OK     | Colombia | macOS
Cada fila lleva glifo de estado. Las fallidas usan el punto #DD6B20. La última
columna es "Acción": un botón secundario "Ver evidencia".

Pie de la tabla: "Mostrando 8 de 1.482 eventos · retención 180 días".

ACCIÓN PRINCIPAL de la pantalla, abajo a la derecha:
  "Exportar evidencia" con subtexto "STIX 2.1 + JSON".
```

### 3.6 View 6 · Error de unidad crítica (BR-002)

```text
[ BLOQUE COMÚN, más: "Esta es la pantalla de un MODAL. Dibuja sólo el modal
centrado sobre un scrim oscuro rgba(26,32,44,0.55)." ]

CONTENIDO EXACTO:

Título:  "No se puede aislar una cuenta de unidad crítica"
Insignia: "BR-002" en monoespaciado, con un candado.

Cuerpo:
  La cuenta enf.castillo pertenece a Urgencias, una unidad de soporte vital.
  Aislarla dejaría al paciente sin registro clínico durante el turno.

Identificación de la cuenta en una caja con fondo #FFF5F5:
  enf.castillo
  Elena Castillo Ríos · Enfermera espectadora
  Unidad: Urgencias · Punto norte          ← Insignia "URGENCIAS"

Explicación de la política, en texto de un párrafo:
  "HeraUEBA no bloquea al personal de unidades críticas (UCI, Quirófano,
   Urgencias). El aislamiento de estas cuentas requiere un plan de continuidad
   clínica aprobado por la dirección del hospital, no una decisión de SOC."

ACCIONES SUGERIDAS — tres opciones, cada una con su glifo, presentadas como
lista de botones terciarios y NO como botones primarios:
  · Revocar sólo la sesión sospechosa, sin tocar la cuenta
  · Escalar al director clínico y al CISO para un plan de continuidad
  · Registrar el incidente y esperar a la ventana de mantenimiento

PIE DEL MODAL:
  Sólo un botón primario: "Entendido" (relleno #0F4C81).
  Texto terciario: "El intento quedó registrado en bitácora con tu usuario."

IMPORTANTE — no pongas un botón "Aislar de todos modos" ni ningún equivalente.
La denegación tiene que ser un final de flujo, no una frase de advertencia
seguida de un bypass.
```

## 4. El prompt de corrección de color

Después de generar las seis pantallas se ejecutó un `edit_screens` con el bloque
siguiente. Es el que llevó los tokens de marca al resultado final en las pantallas
01, 03, 04 y 06:

```text
Corrige sólo la paleta de esta pantalla. No cambies la disposición, los textos,
los tamaños ni la jerarquía.

Sustituye los colores que aproximaste por estos hexadecimales exactos:
  · Todo azul de acción y todo texto de enlace: #0F4C81
  · Botón destructivo "Aislar usuario" y contador de alertas:
      relleno #C53030 con texto #FFFFFF
  · Franja lateral de la fila crítica, icono de triángulo y borde de la
      insignia: #E53E3E
  · Chip de anomalía media: relleno #B45309 con texto #FFFFFF
  · Chip de acceso seguro y punto "en vivo": #2C7A4B
  · Fondo general de página: #F5F7FA
  · Fondo de tarjeta y de modal: #FFFFFF
  · Texto de cuerpo: #1A202C    Texto secundario: #4A5568
  · Texto terciario y metadatos: #5F6B7D
  · Borde de tarjeta y divisor: #E2E8F0
  · Borde de input, select y botón secundario: #8A94A6
  · Fondo de fila crítica y de panel de alerta: #FFF5F5
  · Texto sobre ese fondo: #9B2C2C

Comprueba además:
  · Todo texto sobre un relleno de color debe tener al menos 4.5:1 de contraste
  · Ningún texto menor de 11px
  · Radios entre 4 y 8px
  · Una sola acción primaria en toda la pantalla
```

## 5. Lo que Stitch ignoreó

Registro honesto de las tres cosas que la herramienta no respetó:

1. **El design system no se aplicó.** `designSystem` se pasó correctamente a
   `generate_screen_from_text`, y aun así 4 de 6 pantallas volvieron con una paleta
   propia. Por eso existe el bloque de corrección de §4, y por eso 02 y 05 se
   regeneraron con la paleta dentro del prompt de origen.
2. **La restricción "sin gráficos" se eludió parcialmente.** Stitch tiende a añadir un
   donut o un sparkline aunque se le prohíba. Hubo que reiterar la prohibición en el
   prompt de corrección.
3. **El ancho de Stitch es 2560 px.** El prototipo está diseñado para 1440 px. Los PNG
   de `designs/` no son capturas a escala del prototipo: son el output nativo de Stitch,
   más ancho y con más aire vertical. Sirven como registro del proceso, no como
   referencia de layout.

## 6. Reproducir la generación

```ts
// Las 6 pantallas
for (const prompt of PROMPTS) {
  await tools.stitch.generate_screen_from_text({
    projectId: '17613471581774097288',      // heraueba-mvp2
    designSystem: 'assets/11805437672466652191',
    deviceType: 'DESKTOP',
    prompt,
  });
}

// La corrección de color (pantallas 01, 03, 04, 06)
await tools.stitch.edit_screens({
  projectId: '17613471581774097288',
  selectedScreenIds: ['a463578e59d247d8bc7b24815af7337f',
                      '8770084ac639451bb758b8093d832107',
                      '0953b1d002fd4d23a0becd96efc6b812',
                      '029deac3b91e4a5bb07d948d9877ac14'],
  prompt: PROMPT_CORRECCION_COLOR,
});
```

Los `screenId` y los `file` de cada pantalla están en `designs/downloads.json`. Las
URLs de descarga de Stitch son **efímeras y de un solo uso**: para re-descargar hay
que llamar `get_screen(name)` y consumir el `downloadUrl` inmediatamente.