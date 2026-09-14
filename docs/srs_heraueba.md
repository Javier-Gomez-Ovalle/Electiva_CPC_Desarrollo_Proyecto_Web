# Especificación de Requisitos de Software: HeraUEBA

## 1. Resumen del Proyecto

*   **Propósito del proyecto:** HeraUEBA es un sistema web de monitoreo analítico del comportamiento de usuarios y entidades (UEBA) diseñado específicamente para el sector salud[cite: 4].
*   **Problema a resolver:** El sistema busca mitigar el acceso inicial a los sistemas hospitalarios mediante credenciales comprometidas (táctica MITRE T1078), un riesgo crítico debido al alto valor de la información de salud[cite: 4].
*   **Usuarios y partes interesadas:** El equipo del Centro de Operaciones de Seguridad (SOC) del hospital, incluyendo Analistas Junior, Coordinadores SOC y el CISO (Director de TI)[cite: 4].
*   **Procesos de negocio principales:** Monitoreo de autenticaciones anómalas, mitigación/aislamiento de cuentas comprometidas y gestión de excepciones geográficas para personal médico[cite: 4].
*   **Solución propuesta:** Una plataforma web que opera sobre el sistema SSO (Keycloak) utilizando un motor híbrido de IA (Árbol de Decisión para fuerza bruta e Isolation Forest para viajes imposibles)[cite: 4].
*   **Alcance y limitaciones conocidas:** El Producto Mínimo Viable (MVP) utilizará datos simulados (dataset RBA enriquecido) y ejecutará aislamientos de cuentas de forma simulada en la base de datos local[cite: 4]. Existe cero tolerancia a los bloqueos automáticos sin intervención humana[cite: 4].

---

## 2. Partes Interesadas y Roles de Usuario

| ID | Rol / Parte Interesada | Descripción | Responsabilidades | Necesidades y Objetivos | Referencia |
| :--- | :--- | :--- | :--- | :--- | :--- |
| R-01 | CISO / Director TI | Patrocinador del proyecto y responsable de la seguridad del hospital. | Definir las políticas de seguridad y aprobar los requerimientos del sistema. | Proteger datos (PHI/PII), cumplir normativas (Ley 1581) y evitar interrupciones operativas (riesgo de vida). |[cite: 4] |
| R-02 | Coordinador SOC | Usuario administrador del sistema con facultades resolutivas. | Gestionar excepciones, revisar casos escalados y ejecutar el aislamiento de cuentas. | Reducir el MTTR en un 70% y tener un flujo seguro (modal 2 pasos) para aislar usuarios. |[cite: 4] |
| R-03 | Analista Junior SOC | Operador principal del sistema durante los turnos. | Monitorear alertas en tiempo real, filtrar y exportar datos para investigación. | Contar con un panel de baja densidad cognitiva, sin necesidad de hacer scroll para ver alertas críticas. |[cite: 4] |

---

## 3. Análisis de Procesos de Negocio

### BP-001: Monitoreo Analítico de Accesos Anómalos
*   **Propósito:** Identificar rápidamente accesos mediante credenciales comprometidas para priorizar la respuesta del SOC[cite: 4].
*   **Desencadenante:** Ingesta y análisis de un nuevo evento de inicio de sesión por el motor de IA[cite: 4].
*   **Actores:** Analista Junior, Coordinador SOC[cite: 4].
*   **Flujo Actual:** Los analistas revisan manualmente alertas genéricas en el SIEM, requiriendo entre 2 y 4 horas para investigar un incidente cruzando IP, horario e historial[cite: 4].
*   **Experiencia del Usuario:** El analista observa el dashboard; identifica una Alerta Roja priorizada en la parte superior, revisa el camino de decisión de la IA y determina si requiere escalamiento[cite: 4].
*   **Puntos de Dolor:** Exceso de alertas falsas (ej. contraseñas olvidadas) e interfaces saturadas que dificultan la reacción rápida[cite: 4].
*   **Resultado Deseado:** Reducción del Tiempo Medio de Recuperación (MTTR) en un 70%[cite: 4].
*   **Reglas de Negocio:** El panel debe mostrar por defecto únicamente las últimas 24 horas[cite: 4]. Toda decisión algorítmica debe ser explicable[cite: 4].
*   **Requisitos Relacionados:** FR-001, FR-002, FR-003, NFR-001, NFR-002[cite: 4].
*   **Referencia:** Sección "Flujo Operativo de Analistas" y "Métricas de Éxito"[cite: 4].

### BP-002: Aislamiento de Cuentas Comprometidas
*   **Propósito:** Bloquear el acceso de un usuario malicioso para prevenir la exfiltración de información o daños a los sistemas clínicos[cite: 4].
*   **Desencadenante:** El analista verifica la veracidad de una Alerta Roja y decide ejecutar el bloqueo[cite: 4].
*   **Actores:** Coordinador SOC[cite: 4].
*   **Flujo Actual:** Proceso manual (revocar tokens en Keycloak, forzar reseteo vía SMS/MFA, notificar al jefe clínico) que toma aproximadamente 40 minutos[cite: 4].
*   **Experiencia del Usuario:** El Coordinador SOC hace clic en "Aislar Usuario", el sistema presenta un modal de confirmación de dos pasos, el coordinador aprueba y el sistema simula el bloqueo[cite: 4].
*   **Puntos de Dolor:** Un bloqueo erróneo en cirugía o UCI representa un riesgo de vida y legal[cite: 4].
*   **Resultado Deseado:** Un mecanismo rápido pero seguro (a prueba de errores) para aislar cuentas confirmadas[cite: 4].
*   **Reglas de Negocio:** Prohibido el bloqueo automático[cite: 4]. Exige verificación de dos pasos[cite: 4]. Exige exclusión de unidades críticas (UCI, quirófanos)[cite: 4].
*   **Requisitos Relacionados:** FR-005, FR-006, FR-007, BR-001[cite: 4].
*   **Referencia:** Sección "Tolerancia a Interrupciones" y "Acciones de Respuesta"[cite: 4].

### BP-003: Gestión de Excepciones Geográficas (Whitelist)
*   **Propósito:** Prevenir falsos positivos generados por el modelo de IA ante viajes legítimos del personal médico[cite: 4].
*   **Desencadenante:** Notificación de un viaje internacional, asistencia a congreso o uso de VPN por parte de un especialista[cite: 4].
*   **Actores:** Coordinador SOC[cite: 4].
*   **Flujo Actual:** Inexistente; actualmente el personal superior genera falsas alarmas que deben descartarse manualmente[cite: 4].
*   **Experiencia del Usuario:** El Coordinador SOC ingresa al módulo de excepciones, registra el usuario, la ubicación permitida y el rango de fechas[cite: 4].
*   **Puntos de Dolor:** Inundación de falsos positivos en modelos de "viaje imposible"[cite: 4].
*   **Resultado Deseado:** Reducción drástica del ruido en las Alertas Rojas manteniendo la sensibilidad ante verdaderos ataques[cite: 4].
*   **Reglas de Negocio:** Solo el Coordinador SOC puede administrar la whitelist[cite: 4].
*   **Requisitos Relacionados:** FR-008, BR-002[cite: 4].
*   **Referencia:** Sección "Excepciones de Viaje"[cite: 4].

---

## 4. Requisitos Funcionales

### FR-001: Visualización Priorizada de Alertas Rojas
*   **Declaración:** El sistema deberá renderizar un dashboard donde las "Alertas Rojas" (alta prioridad) se ubiquen en la parte superior, visibles sin necesidad de desplazamiento vertical (scroll)[cite: 4].
*   **Descripción:** Garantiza que los analistas vean las amenazas críticas inmediatamente al abrir el sistema[cite: 4].
*   **Rol Relacionado:** Analista Junior, Coordinador SOC[cite: 4].
*   **Reglas de Negocio:** Baja densidad cognitiva; gráficos y métricas secundarias deben ir debajo de las alertas[cite: 4].
*   **Resultado Esperado:** Alertas críticas visibles instantáneamente[cite: 4].
*   **Prioridad:** Alta[cite: 4].
*   **Referencia:** Sección "Flujo Operativo de Analistas"[cite: 4].

### FR-002: Filtro Temporal por Defecto
*   **Declaración:** El sistema deberá cargar y mostrar por defecto únicamente los datos y alertas correspondientes a las últimas 24 horas[cite: 4].
*   **Descripción:** Previene la caída de la interfaz (Streamlit) por sobrecarga de memoria al intentar renderizar el histórico completo[cite: 4].
*   **Rol Relacionado:** Analista Junior, Coordinador SOC[cite: 4].
*   **Resultado Esperado:** Interfaz fluida y rápida en su carga inicial[cite: 4].
*   **Prioridad:** Alta[cite: 4].
*   **Referencia:** Sección "Escalabilidad de la Interfaz"[cite: 4].

### FR-003: Filtro Histórico por Usuario
*   **Declaración:** El sistema deberá permitir al usuario aplicar un filtro histórico para buscar eventos pasados de un usuario específico[cite: 4].
*   **Descripción:** Permite la investigación forense de casos puntuales extrayendo datos de la base de datos backend[cite: 4].
*   **Prioridad:** Media[cite: 4].
*   **Referencia:** Sección "Escalabilidad de la Interfaz"[cite: 4].

### FR-004: Explicabilidad del Modelo (Caja Blanca)
*   **Declaración:** El sistema deberá mostrar en el detalle de cada Alerta Roja el camino de decisión exacto (nodos y condiciones) que generó la alerta[cite: 4].
*   **Descripción:** Esencial para auditorías médicas y normatividad. Ej: "más de 8 intentos fallidos en 2 min desde 3 IPs distintas"[cite: 4].
*   **Alternativas y Excepciones:** Aplica primariamente al modelo de Árbol de Decisión[cite: 4].
*   **Prioridad:** Alta[cite: 4].
*   **Referencia:** Sección "Regulaciones Locales"[cite: 4].

### FR-005: Interfaz de Aislamiento Simulado
*   **Declaración:** El sistema deberá proveer un botón de "Aislar Usuario" en el detalle de las alertas para simular el bloqueo de la cuenta[cite: 4].
*   **Rol Relacionado:** Coordinador SOC[cite: 4].
*   **Reglas de Negocio:** Solo disponible para el rol de Coordinador SOC[cite: 4].
*   **Prioridad:** Alta[cite: 4].
*   **Referencia:** Sección "Mitigación Real" / "Acciones de Respuesta"[cite: 4].

### FR-006: Verificación de Dos Pasos para Aislamiento
*   **Declaración:** El sistema deberá requerir una confirmación explícita mediante un modal interactivo (dos pasos) antes de ejecutar la acción de aislamiento[cite: 4].
*   **Descripción:** Previene clics accidentales que puedan afectar la operación hospitalaria crítica[cite: 4].
*   **Prioridad:** Alta[cite: 4].
*   **Referencia:** Sección "Tolerancia a Interrupciones"[cite: 4].

### FR-007: Restricción de Bloqueo por Unidad Crítica
*   **Declaración:** El sistema deberá impedir el aislamiento de cuentas de usuarios que pertenezcan a unidades clínicas exceptuadas (ej. Quirófanos, UCI)[cite: 4].
*   **Descripción:** Protege la vida del paciente asegurando disponibilidad de sistemas médicos[cite: 4].
*   **Prioridad:** Alta[cite: 4].
*   **Preguntas Abiertas:** ¿Cómo recibirá el sistema los atributos del usuario para saber si está en UCI/Quirófano?[cite: 4].

### FR-008: Gestión de Whitelist Geográfica
*   **Declaración:** El sistema deberá permitir al Coordinador SOC crear, editar y eliminar excepciones geográficas (Whitelist) por usuario y rango de fechas[cite: 4].
*   **Descripción:** Evita falsos positivos para médicos en congresos internacionales[cite: 4].
*   **Rol Relacionado:** Coordinador SOC[cite: 4].
*   **Prioridad:** Alta[cite: 4].
*   **Referencia:** Sección "Excepciones de Viaje"[cite: 4].

---

## 5. Requisitos No Funcionales

### NFR-001: Eficiencia y Tiempo de Respuesta (MTTR)
*   **Categoría:** Rendimiento (Performance)
*   **Declaración:** El sistema deberá contribuir a reducir el Tiempo Medio de Recuperación (MTTR) de incidentes de acceso en al menos un 70% frente a la base actual (2 a 4 horas)[cite: 4].
*   **Medición:** El tiempo desde la generación de la alerta hasta la decisión del analista debe tomar minutos (estimado < 45 minutos para lograr la meta)[cite: 4].
*   **Prioridad:** Alta[cite: 4].
*   **Referencia:** Sección "Métricas de Éxito"[cite: 4].

### NFR-002: Usabilidad de Baja Densidad Cognitiva
*   **Categoría:** Usabilidad (Usability)
*   **Declaración:** El dashboard principal deberá tener una baja densidad cognitiva, eliminando gráficos decorativos innecesarios[cite: 4].
*   **Medición:** Revisión de experto UX; los elementos visuales críticos deben cargar en el primer viewport (sin scroll)[cite: 4].
*   **Prioridad:** Alta[cite: 4].
*   **Referencia:** Sección "Flujo Operativo de Analistas"[cite: 4].

### NFR-003: Control de Acceso Basado en Roles (RBAC)
*   **Categoría:** Seguridad (Security)
*   **Declaración:** El sistema deberá implementar autenticación y autorización basadas en roles (Mínimo: Analista Junior y Coordinador SOC)[cite: 4].
*   **Medición:** Pruebas de seguridad que validen que el rol de Analista Junior no puede activar el endpoint/botón de aislamiento[cite: 4].
*   **Prioridad:** Alta[cite: 4].
*   **Referencia:** Sección "Roles y Permisos"[cite: 4].

### NFR-004: Trazabilidad y Cumplimiento Normativo
*   **Categoría:** Auditoría (Auditability)
*   **Declaración:** El sistema deberá cumplir con los principios de explicabilidad referenciados por la Ley 1581 de 2012 (Colombia) y lineamientos HIPAA[cite: 4].
*   **Medición:** Toda alerta clasificada por IA debe almacenar y presentar su registro lógico (nodos de decisión)[cite: 4].
*   **Prioridad:** Alta[cite: 4].
*   **Referencia:** Sección "Regulaciones Locales"[cite: 4].

---

## 6. Reglas de Negocio

### BR-001: Cero Tolerancia a Bloqueos Automáticos
*   **Regla:** Ningún modelo de Inteligencia Artificial podrá ejecutar una acción de bloqueo o aislamiento de cuenta de forma autónoma[cite: 4].
*   **Descripción:** El sistema actúa única y exclusivamente como soporte a la toma de decisiones. Toda mitigación requiere intervención humana explícita[cite: 4].
*   **Procesos Afectados:** BP-002[cite: 4].
*   **Referencia:** Sección "Tolerancia a Interrupciones"[cite: 4].

### BR-002: Exención de Unidades Críticas
*   **Regla:** El personal asignado a unidades de soporte vital (UCI, Urgencias, Quirófanos) posee un umbral de riesgo elevado que impide su bloqueo operativo estándar[cite: 4].
*   **Procesos Afectados:** BP-002[cite: 4].
*   **Referencia:** Sección "Tolerancia a Interrupciones"[cite: 4].

---

## 7. Experiencia de Usuario y Recorrido (User Journey)

**Journey: Respuesta ante Alerta Crítica (Coordinador SOC)**
1.  **Inicio:** El usuario inicia sesión en la plataforma y aterriza en el dashboard[cite: 4].
2.  **Objetivo:** Revisar incidentes de seguridad y proteger la infraestructura[cite: 4].
3.  **Acciones:** Observa inmediatamente una "Alerta Roja" en la zona superior de la pantalla sin hacer scroll[cite: 4].
4.  **Información del Sistema:** El sistema presenta los detalles del evento: ubicación IP anómala y la regla exacta del Árbol de Decisión que saltó (ej. múltiples intentos fallidos)[cite: 4].
5.  **Decisión:** El Coordinador SOC cruza información y hace clic en "Aislar Usuario"[cite: 4].
6.  **Respuesta del Sistema:** Emerge un modal de verificación de dos pasos advirtiendo la criticidad de la acción[cite: 4].
7.  **Resultado:** El Coordinador confirma; el sistema ejecuta la simulación de cuarentena en base de datos y actualiza el estado en pantalla[cite: 4].

---

## 8. Matriz de Trazabilidad

| ID Fuente | Hallazgo de la Entrevista | Proceso Relacionado | ID Requisito(s) | Tipo | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
|[cite: 4] | Alertas visibles sin scroll | BP-001 | FR-001, NFR-002 | FR / NFR | Confirmado |
|[cite: 4] | Dashboard lento por exceso de datos | BP-001 | FR-002 | FR | Confirmado |
|[cite: 4] | Investigar casos puntuales | BP-001 | FR-003 | FR | Confirmado |
|[cite: 4] | No se aceptan modelos de caja negra | BP-001 | FR-004, NFR-004 | FR / NFR | Confirmado |
|[cite: 4] | Aislamiento requiere validación humana doble | BP-002 | FR-005, FR-006, BR-001 | FR / BR | Confirmado |
|[cite: 4] | No bloquear médicos de UCI/Quirófano | BP-002 | FR-007, BR-002 | FR / BR | Requiere Clarificación |
|[cite: 4] | Médicos viajan a congresos/VPN | BP-003 | FR-008 | FR | Confirmado |
|[cite: 4] | Solo el Coordinador puede aislar | BP-002 | FR-005, NFR-003 | FR / NFR | Confirmado |
|[cite: 4] | Reducir investigación manual a minutos | BP-001 | NFR-001 | NFR | Confirmado |

---

## 9. Ambigüedades, Suposiciones y Preguntas Abiertas

| ID | Tipo | Descripción | Requisito Relacionado | Impacto | Recomendación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AQ-01 | Ambigüedad | Integración de Identidades: No se detalla cómo el sistema obtendrá atributos del usuario para saber si pertenece a UCI o Quirófano[cite: 4]. | FR-007 | Alto | Definir si los metadatos vendrán pre-cargados en un archivo CSV/Base de datos local durante el MVP o si se consumirán de la API de Active Directory. |
| AQ-02 | Suposición | Ingesta de Datos: Se asume que en producción (post-MVP) Keycloak enviará logs JSON directamente al sistema[cite: 4]. | NFR-004 | Medio | Diseñar el backend con una arquitectura modular (ej. API REST asíncrona) que facilite el reemplazo de los datos simulados por webhooks. |
| AQ-03 | Pregunta Abierta | Diferenciación de VPN: ¿Cómo discrimina la IA una VPN comercial legítima (usada por un médico en congreso) de un ataque vía proxy?[cite: 4]. | FR-008 | Alto | Definir si la Whitelist debe aceptar rangos de IP enteros, ASN específicos o únicamente configuraciones a nivel de usuario. |

---

## 10. Revisión de Calidad de Requisitos

*   **Completitud y Correctitud:** Los requisitos extraídos cubren totalmente las directrices operativas (roles, aislamiento manual, whitelists) definidas por el cliente en la entrevista[cite: 4]. No se han inventado normativas ni procesos.
*   **Claridad y Falta de Ambigüedad:** La separación estricta entre la interfaz (Streamlit) y las reglas de bloqueo crítico reduce la ambigüedad en el diseño de la experiencia.
*   **Viabilidad:** Los requisitos, especialmente la limitación temporal a 24 horas por defecto (FR-002)[cite: 4], garantizan la viabilidad técnica al evitar que el framework Streamlit colapse por exceso de memoria.
*   **Debilidades Identificadas:** La principal debilidad recae en FR-007 (exclusión de unidades críticas)[cite: 4], dado que requiere cruce de datos con recursos humanos o Active Directory, lo cual no está contemplado explícitamente en el stack actual (dataset RBA).

---

## 11. Resumen Ejecutivo de Requisitos

*   **Total de Requisitos Funcionales:** 8
*   **Total de Requisitos No Funcionales:** 4
*   **Áreas Funcionales Principales:** Visualización y priorización de alertas (Dashboard), Respuesta ante incidentes de identidad, y Gestión de falsos positivos (Excepciones).
*   **Procesos de Negocio Críticos:** La ejecución controlada de mitigaciones (BP-002) es vital, dado el riesgo de responsabilidad legal por bloqueos erróneos en el sector clínico[cite: 4].
*   **Requisitos de Mayor Prioridad:** FR-001 (Visibilidad Inmediata), FR-004 (Explicabilidad Caja Blanca para Auditoría) y FR-006 (Confirmación de dos pasos para aislamiento)[cite: 4].
*   **Principales Riesgos:** Fallar en la integración de los metadatos organizacionales del usuario (saber qué usuario está en un servicio de soporte vital) podría derivar en el incumplimiento de BR-002[cite: 4].
*   **Próximos Pasos Recomendados:** Validar con el cliente técnico el formato exacto en el que Active Directory compartirá los departamentos a los que pertenece cada usuario, para implementar adecuadamente la restricción de bloqueo (FR-007)[cite: 4].