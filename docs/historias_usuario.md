# Historias de Usuario y Criterios de Aceptación: HeraUEBA

## 1. Análisis de Requisitos

El documento base describe a HeraUEBA como un sistema web orientado al sector salud para monitorear anomalías de autenticación.
*   **Roles de Usuario:** CISO (Director TI), Coordinador SOC y Analista Junior SOC.
*   **Procesos de Negocio:** Monitoreo analítico de accesos anómalos (BP-001), Aislamiento de cuentas comprometidas (BP-002) y Gestión de excepciones geográficas (BP-003).
*   **Requisitos Funcionales (RF):** Abarcan desde la visualización priorizada de alertas en el dashboard, filtros temporales e históricos, explicabilidad del modelo de IA, hasta la interfaz de aislamiento con verificación de dos pasos y listas blancas.
*   **Requisitos No Funcionales (RNF):** Se enfocan en la eficiencia del MTTR (reducción del 70%), usabilidad de baja densidad cognitiva, control de acceso basado en roles (RBAC) y trazabilidad para auditorías normativas.
*   **Restricciones Clave:** Cero tolerancia a bloqueos automáticos (BR-001) y la restricción obligatoria de bloquear personal de unidades críticas como UCI o quirófanos (BR-002).

---

## 2. Mapeo de Requisitos a Historias de Usuario

| ID Requisito | Tipo | Descripción | ID Historia | Estado de Cobertura | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| FR-001 | RF | Visualización Priorizada de Alertas Rojas | US-001 | Cubierto | |
| FR-002 | RF | Filtro Temporal por Defecto (24 horas) | US-002 | Cubierto | |
| FR-003 | RF | Filtro Histórico por Usuario | US-003 | Cubierto | |
| FR-004 | RF | Explicabilidad del Modelo (Caja Blanca) | US-004 | Cubierto | |
| FR-005 | RF | Interfaz de Aislamiento Simulado | US-005 | Cubierto | |
| FR-006 | RF | Verificación de Dos Pasos para Aislamiento | US-005 | Cubierto | |
| FR-007 | RF | Restricción de Bloqueo por Unidad Crítica | US-005 | Cubierto | |
| FR-008 | RF | Gestión de Whitelist Geográfica | US-006 | Cubierto | |
| NFR-001 | RNF | Eficiencia y Tiempo de Respuesta (MTTR) | Valid-001 | No expresable como US | Métrica transversal |
| NFR-002 | RNF | Usabilidad de Baja Densidad Cognitiva | US-001 | Cubierto | Se integra a la US-001 |
| NFR-003 | RNF | Control de Acceso Basado en Roles (RBAC) | US-005 | Cubierto | Restricción en US-005 |
| NFR-004 | RNF | Trazabilidad y Cumplimiento Normativo | US-004 | Cubierto | Validado en US-004 |

---

## 3. Historias de Usuario

### US-001: Visualización Priorizada de Alertas Rojas

**Epic / Feature:** Monitoreo Analítico de Accesos Anómalos

**User Story:**
> Como Analista Junior SOC o Coordinador SOC, quiero visualizar las "Alertas Rojas" priorizadas en la parte superior del dashboard principal, para poder identificar y reaccionar ante amenazas críticas de manera inmediata sin distracciones.

**Business Context:**
Los analistas sufren fatiga de alertas y saturación visual en las herramientas actuales. Se requiere priorizar las amenazas críticas inmediatamente al abrir el sistema para agilizar la detección.

**User Experience:**
El usuario inicia sesión en la plataforma y es dirigido al dashboard. Inmediatamente observa en la parte superior las "Alertas Rojas" sin necesidad de desplazarse verticalmente (scroll). Las gráficas secundarias quedan ubicadas debajo de esta información crítica.

**Related Requirements:**
*   RF-FR-001: Visualización Priorizada de Alertas Rojas
*   RNF-NFR-002: Usabilidad de Baja Densidad Cognitiva

**Acceptance Criteria (Gherkin):**
```gherkin
Feature: Visualización Priorizada de Alertas Rojas

  Scenario: Carga inicial del dashboard con alertas críticas
    Given que existen alertas de riesgo crítico generadas por el motor de IA
    When el analista accede al dashboard principal
    Then el sistema debe mostrar las "Alertas Rojas" en la parte superior del viewport
    And el analista no debe requerir usar scroll vertical para visualizar la primera alerta crítica
    And las métricas y gráficos secundarios deben posicionarse debajo del panel de alertas
Business Rules and Constraints:El dashboard debe mantener una baja densidad cognitiva, eliminando gráficos decorativos.  Priority: Alta
Source Traceability: BP-001, FR-001, NFR-002
Open Questions: Ninguna.  US-002: Carga de Datos Limitada a 24 HorasEpic / Feature: Monitoreo Analítico de Accesos AnómalosUser Story:Como Analista Junior SOC o Coordinador SOC, quiero que el sistema cargue por defecto únicamente las alertas y datos de las últimas 24 horas, para asegurar que la plataforma web sea rápida y no colapse la memoria del navegador.  Business Context:
El motor de IA procesa más de 33 millones de registros históricos. Renderizar este volumen completo bloquearía el dashboard desarrollado en Streamlit, impidiendo la operación fluida del analista durante un incidente.  User Experience:
Al abrir el dashboard, el sistema aplica automáticamente un filtro temporal de 24 horas. La interfaz responde fluidamente mostrando solo los eventos recientes.  Related Requirements:RF-FR-002: Filtro Temporal por Defecto  Acceptance Criteria (Gherkin):GherkinFeature: Filtro Temporal por Defecto

  Scenario: Aplicación automática de la ventana de 24 horas
    Given que el sistema posee millones de registros históricos en la base de datos
    When el usuario carga la vista por defecto del dashboard
    Then el sistema debe renderizar únicamente los eventos ocurridos en las últimas 24 horas
    And la carga inicial de la interfaz no debe colapsar por sobrecarga de memoria
Priority: Alta
Source Traceability: BP-001, FR-002  US-003: Búsqueda Histórica de Eventos por UsuarioEpic / Feature: Monitoreo Analítico de Accesos AnómalosUser Story:Como Analista Junior SOC o Coordinador SOC, quiero filtrar el historial completo de eventos de un usuario específico, para investigar a fondo casos forenses o anomalías recurrentes.  Business Context:
Aunque la vista por defecto es de 24 horas para optimizar el rendimiento, las investigaciones de credenciales comprometidas frecuentemente requieren analizar el historial de inicio de sesión de un usuario puntual.  User Experience:
El analista utiliza un componente de búsqueda, ingresa el identificador del usuario y solicita el historial. El sistema consulta la base de datos y presenta los eventos pasados exclusivamente para dicho usuario.  Related Requirements:RF-FR-003: Filtro Histórico por Usuario  Acceptance Criteria (Gherkin):GherkinFeature: Búsqueda Histórica de Eventos por Usuario

  Scenario: Búsqueda exitosa del historial de un usuario
    Given que el analista requiere investigar un acceso anómalo
    When el analista ingresa el nombre de usuario "dr.perez" en el filtro de búsqueda histórica
    And ejecuta la consulta
    Then el sistema debe recuperar y mostrar los eventos históricos asociados únicamente a "dr.perez"
Priority: Media
Source Traceability: BP-001, FR-003  US-004: Detalle Explicable de Decisión Algorítmica (Caja Blanca)Epic / Feature: Trazabilidad y Explicabilidad NormativaUser Story:Como Coordinador SOC, quiero visualizar el camino de decisión exacto que generó una alerta algorítmica, para cumplir con las auditorías médicas (Ley 1581) y justificar cualquier investigación.  Business Context:
El hospital está sujeto a normativas que prohíben la toma de decisiones mediante modelos de "caja negra". Toda alerta debe ser explicable en caso de auditorías internas o legales.  User Experience:
El usuario despliega los detalles de una Alerta Roja y el sistema muestra claramente el conjunto de reglas que el Árbol de Decisión activó, como "más de 8 intentos fallidos en 2 minutos desde 3 IPs distintas".  Related Requirements:RF-FR-004: Explicabilidad del Modelo (Caja Blanca)  RNF-NFR-004: Trazabilidad y Cumplimiento Normativo  Acceptance Criteria (Gherkin):GherkinFeature: Explicabilidad del Modelo de IA

  Scenario: Visualización del árbol lógico en una alerta de fuerza bruta
    Given que el modelo de Árbol de Decisión ha generado una Alerta Roja
    When el analista expande los detalles de la alerta en el dashboard
    Then el sistema debe mostrar explícitamente las reglas lógicas cumplidas
    And las reglas deben expresarse en texto legible indicando las condiciones superadas
Priority: Alta
Source Traceability: BP-001, FR-004, NFR-004  US-005: Aislamiento Seguro de Cuentas ComprometidasEpic / Feature: Mitigación y AislamientoUser Story:Como Coordinador SOC, quiero poder aislar una cuenta sospechosa tras una confirmación de dos pasos, para evitar exfiltraciones de datos garantizando que no se interrumpa accidentalmente el trabajo en unidades clínicas críticas.  Business Context:
Un bloqueo erróneo a un médico en cirugía genera un riesgo de vida y responsabilidad legal institucional. Por ello, se prohíbe el bloqueo automático (BR-001) y la interrupción de personal en unidades exceptuadas (BR-002).  User Experience:
El Coordinador revisa una alerta y hace clic en "Aislar Usuario". Si el usuario pertenece a UCI, el sistema bloquea la acción[cite: 6]. Si no pertenece, despliega un modal de confirmación[cite: 6]. Al confirmar, el estado en base de datos cambia a cuarentena simulada[cite: 6].  Related Requirements:RF-FR-005, FR-006, FR-007[cite: 6]RNF-NFR-003: Control de Acceso Basado en Roles (RBAC)[cite: 6]Acceptance Criteria (Gherkin):GherkinFeature: Aislamiento Seguro de Cuentas Comprometidas

  Background:
    Given que existe una Alerta Roja validada por el operador

  Scenario: Intentar aislar sin tener permisos de Coordinador
    Given que el usuario actual tiene el rol de Analista Junior SOC
    When el analista visualiza el detalle de la alerta
    Then el sistema no debe permitir la acción de aislar la cuenta comprometida

  Scenario: Aislar usuario exitosamente tras verificación
    Given que el usuario actual tiene el rol de Coordinador SOC
    And el usuario afectado NO pertenece a una unidad crítica (ej. Quirófano)
    When el coordinador hace clic en "Aislar Usuario"
    Then el sistema debe mostrar un modal de confirmación de dos pasos advirtiendo la acción
    When el coordinador aprueba el segundo paso
    Then el sistema debe cambiar el estado del usuario afectado a bloqueado en la base de datos

  Scenario: Restricción de bloqueo para personal de unidades críticas
    Given que el usuario actual tiene el rol de Coordinador SOC
    And el usuario afectado pertenece a una unidad exceptuada (ej. UCI)
    When el coordinador intenta ejecutar el aislamiento
    Then el sistema debe denegar el aislamiento basándose en la política de unidad crítica
Business Rules and Constraints:BR-001: Cero tolerancia a bloqueos automáticos (siempre requiere clic y confirmación)[cite: 6].BR-002: Exención estricta de bloqueo para personal de UCI, Quirófanos y Urgencias[cite: 6].Priority: Alta[cite: 6]
Source Traceability: BP-002, FR-005, FR-006, FR-007, BR-001, BR-002, NFR-003[cite: 6]
Open Questions: AQ-01: ¿Cómo se inyectarán o validarán los atributos del usuario para determinar su pertenencia a UCI/Quirófanos en el MVP?[cite: 6]US-006: Gestión de Excepciones Geográficas (Whitelist)Epic / Feature: Gestión de ExcepcionesUser Story:Como Coordinador SOC, quiero administrar una lista blanca de excepciones geográficas por usuario y fechas, para evitar falsos positivos cuando el personal médico viaje a congresos o utilice VPNs legítimas[cite: 6].Business Context:
El modelo Isolation Forest identifica "viajes imposibles". Sin un mecanismo de exclusión, los médicos en telemedicina transfronteriza o congresos internacionales generarán falsos positivos constantes, saturando al equipo[cite: 6].User Experience:
El Coordinador SOC accede al módulo de excepciones y registra el nombre del médico, el país del congreso y la fecha de inicio/fin[cite: 6]. Durante ese periodo, las conexiones desde dicha ubicación no disparan alertas de viaje imposible[cite: 6].Related Requirements:RF-FR-008: Gestión de Whitelist Geográfica[cite: 6]Acceptance Criteria (Gherkin):GherkinFeature: Gestión de Excepciones Geográficas

  Scenario: Creación de una excepción para un médico en congreso
    Given que el usuario actual tiene el rol de Coordinador SOC
    When el coordinador registra una excepción para el usuario "dr.lopez" en "España" del 10 al 15 de octubre
    And el modelo detecta un inicio de sesión desde España el día 12 de octubre para "dr.lopez"
    Then el sistema no debe generar una Alerta Roja por viaje imposible
Priority: Alta[cite: 6]
Source Traceability: BP-003, FR-008[cite: 6]
Open Questions: AQ-03: ¿La Whitelist aceptará exclusiones por ASN específicos (para VPNs comerciales) o únicamente por nivel de país/región?[cite: 6]4. Escenarios de Validación de Requisitos No Funcionales (RNF)El requerimiento de reducción de tiempo no puede representarse como una funcionalidad operada por el usuario en el software, por lo que requiere un escenario de validación de calidad.Valid-001: Eficiencia y Tiempo de Respuesta (MTTR)Categoría: Rendimiento (Performance)[cite: 6]Requirement: NFR-001 - El sistema deberá contribuir a reducir el MTTR en al menos un 70% frente a la base actual, bajando de 2-4 horas a minutos (< 45 min)[cite: 6].Validation Objective: Verificar estadísticamente que el uso del dashboard y las alertas priorizadas permite a los analistas emitir un juicio rápido sin depender de la recolección manual de logs cruzados.Gherkin Validation Scenario:GherkinFeature: Validación de Rendimiento (MTTR)

  Scenario: Reducción del tiempo de investigación de incidentes
    Given un conjunto de alertas reales o simuladas en el nuevo dashboard
    When el analista de seguridad evalúa una alerta mediante la interfaz de HeraUEBA
    Then el tiempo transcurrido desde la lectura de la alerta hasta la decisión (aislar o ignorar) debe ser inferior a 45 minutos
# 5. Ambigüedades y Preguntas Abiertas

A partir del análisis del SRS, se listan los siguientes puntos pendientes de clarificación:Identificación de Personal de Unidades Críticas (AQ-01): La regla BR-002 exige exceptuar bloqueos en quirófanos y UCI, pero no está definido técnicamente si estos atributos ("Departamento" o "Unidad") estarán precargados en un archivo plano para el MVP o si se requiere consumir la API del Active Directory[cite: 6].Granularidad de las Whitelists (AQ-03): El requerimiento de las VPNs comerciales no precisa si la exclusión geográfica debe permitir configurar un ASN (Autonomous System Number) o si basta con el país[cite: 6]. Esto impacta el diseño técnico de la interfaz y de la base de datos (FR-008)[cite: 6].6. Revisión Final de CalidadIndependencia y Tamaño (INVEST): Las historias generadas abordan capacidades unitarias (filtros, aislamiento, visualización), lo que permite que el equipo de desarrollo las estime e implemente por separado.Cobertura: El 100% de los requisitos funcionales documentados en el documento fuente (RF-001 a RF-008)[cite: 6] fueron mapeados y traducidos a Historias de Usuario con valor directo al negocio.Sintaxis BDD (Gherkin): Se mantuvieron las palabras clave en inglés (Feature, Scenario, Given, When, Then, And) logrando compatibilidad con frameworks de automatización.Trazabilidad Garantizada: Se respetaron los identificadores del documento original y se documentaron estrictamente las reglas de negocio críticas, garantizando un flujo centrado en el paciente y la operación segura del hospital (BR-001, BR-002).
