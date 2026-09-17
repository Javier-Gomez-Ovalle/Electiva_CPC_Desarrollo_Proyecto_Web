# HeraUEBA - Sistema de Monitoreo Analítico (UEBA) para el Sector Salud

## 1. Resumen del Proyecto
HeraUEBA es un sistema web de monitoreo analítico del comportamiento de usuarios y entidades (UEBA) diseñado específicamente para el sector salud. El sistema busca mitigar el acceso inicial a los sistemas hospitalarios mediante credenciales comprometidas (táctica MITRE T1078), un riesgo crítico debido al alto valor de la información de salud. La plataforma web opera sobre el sistema SSO (Keycloak) utilizando un motor híbrido de IA (Árbol de Decisión e Isolation Forest) para priorizar alertas y facilitar la toma de decisiones del Centro de Operaciones de Seguridad (SOC).

## 2. Declaración del Problema
* Actualmente, los analistas revisan manualmente alertas genéricas en el SIEM.
* Este proceso requiere entre 2 y 4 un horas para investigar un incidente cruzando IP, horario e historial.
* Existe una inundación de falsos positivos en modelos de "viaje imposible" debido a especialistas médicos que asisten a congresos o usan VPNs.
* Un bloqueo erróneo a un médico en cirugía genera un riesgo de vida y responsabilidad legal institucional.

## 3. Objetivos del Proyecto
* Contribuir a reducir el Tiempo Medio de Recuperación (MTTR) de incidentes de acceso en al menos un 70%, bajando la detección de 2-4 horas a menos de 45 minutos.
* Proveer una plataforma con baja densidad cognitiva que prevenga la fatiga de alertas.
* Cumplir con las normativas locales (Ley 1581 de 2012) y lineamientos HIPAA garantizando la explicabilidad (caja blanca) de las decisiones de IA

## 4. Usuarios Objetivo y Partes Interesadas
* **CISO / Director TI:** Patrocinador del proyecto y responsable de la seguridad del hospital. Busca proteger datos, cumplir normativas y evitar interrupciones operativas.
* **Coordinador SOC:** Usuario administrador del sistema con facultades resolutivas. Es el único rol autorizado para ejecutar el aislamiento de cuentas y gestionar excepciones.
* **Analista Junior SOC:** Operador principal del sistema durante los turnos. Requiere un panel de baja densidad cognitiva para monitorear alertas en tiempo real sin necesidad de hacer *scroll* para ver información crítica

## 5. Alcance
**En Alcance (MVP):**
* Uso de datos simulados (dataset RBA enriquecido)
* Panel de control (Dashboard) en Streamlit con filtro por defecto de 24 horas.
* Simulación de aislamiento de cuentas en la base de datos local mediante verificación de dos pasos.
* Gestión de lista blanca (Whitelist) geográfica.
* Visualización del camino de decisión del modelo (Árbol de Decisión).

**Fuera de Alcance (MVP):**
* Revocación real de tokens en Keycloak y forzado de reseteo vía SMS/MFA (planeado para futuras iteraciones).
* Ejecución de bloqueos de cuenta automáticos por parte de la IA (estrictamente prohibido por reglas de negocio).

## 6. Funcionalidades Principales y Capacidades
* **Dashboard Priorizado:** Muestra las "Alertas Rojas" en la parte superior del *viewport* sin requerir desplazamiento, optimizando la visibilidad de amenazas críticas. (Beneficia a: Analista Junior, Coordinador SOC).
* **Optimización de Carga Temporal:** Aplica automáticamente un filtro de 24 horas al inicio para asegurar una carga fluida de la interfaz gráfica. (Beneficia a: Analista Junior, Coordinador SOC).
* **Explicabilidad Normativa:** Muestra explícitamente las reglas lógicas cumplidas que generaron una alerta algorítmica para cumplir con auditorías[cite: 1, 2, 3]. (Beneficia a: Coordinador SOC, CISO).
* **Aislamiento Seguro:** Permite aislar una cuenta sospechosa tras una confirmación de dos pasos, denegando la acción si el usuario pertenece a una unidad crítica (ej. UCI)[cite: 1, 2]. (Beneficia a: Coordinador SOC).
* **Whitelist Geográfica:** Administración de excepciones por usuario, país y fecha para evitar falsos positivos por viajes legítimos o uso de VPN[cite: 1, 2, 3]. (Beneficia a: Coordinador SOC).

## 7. Procesos de Negocio y Experiencia de Usuario
**BP-001: Monitoreo Analítico de Accesos Anómalos**
* **Inicio:** El motor de IA ingesta y analiza un nuevo evento de inicio de sesión.
* **Interacción:** El Analista Junior accede al dashboard y observa inmediatamente las "Alertas Rojas". Revisa el camino de decisión de la IA (caja blanca) para determinar si la anomalía es real.
* **Resultado:** Decisión rápida de escalar o ignorar la alerta, reduciendo el MTTR[cite: 2].

**BP-002: Aislamiento de Cuentas Comprometidas**
* **Inicio:** El Coordinador SOC verifica la veracidad de una Alerta Roja.
* **Interacción:** Hace clic en "Aislar Usuario". El sistema verifica que el usuario no sea personal de unidad crítica. Se presenta un modal de confirmación de dos pasos.
* **Resultado:** Si se aprueba, el sistema simula el bloqueo en la base de datos.

## 8. Resumen de Requisitos Funcionales
| ID | Requisito | Relación | Prioridad | Estado |
| :--- | :--- | :--- | :--- | :--- |
| FR-001 | Visualización Priorizada de Alertas Rojas | Dashboard | Alta | Confirmado |
| FR-002 | Filtro Temporal por Defecto (24 hrs) | Rendimiento UI | Alta | Confirmado |
| FR-003 | Filtro Histórico por Usuario | Búsqueda | Media | Confirmado |
| FR-004 | Explicabilidad del Modelo (Caja Blanca) | IA / Auditoría | Alta | Confirmado |
| FR-005 | Interfaz de Aislamiento Simulado | Mitigación | Alta | Confirmado |
| FR-006 | Verificación de Dos Pasos para Aislamiento | Mitigación | Alta | Confirmado |
| FR-007 | Restricción de Bloqueo por Unidad Crítica | Mitigación | Alta | Requiere Clarificación |
| FR-008 | Gestión de Whitelist Geográfica | Excepciones | Alta | Confirmado |

## 9. Resumen de Requisitos No Funcionales
| ID | Categoría | Requisito | Medición | Estado |
| :--- | :--- | :--- | :--- | :--- |
| NFR-001 | Rendimiento | Reducción del MTTR en 70% | Tiempo < 45 minutos | Confirmado |
| NFR-002 | Usabilidad | Baja Densidad Cognitiva | Sin scroll para alertas críticas | Confirmado |
| NFR-003 | Seguridad | RBAC (Analista vs Coordinador) | Pruebas de acceso a endpoints | Confirmado |
| NFR-004 | Auditoría | Trazabilidad Normativa (Ley 1581) | Registro lógico guardado por alerta | Confirmado |

## 10. Reglas de Negocio y Restricciones Operativas
* **BR-001 (Cero Tolerancia a Bloqueos Automáticos):** Ningún modelo de IA podrá ejecutar un bloqueo de cuenta de forma autónoma. Toda mitigación exige intervención humana explícita (Coordinador SOC).
* **BR-002 (Exención de Unidades Críticas):** Queda estrictamente prohibido el aislamiento operativo estándar para personal médico asignado a unidades de soporte vital (UCI, Quirófanos, Urgencias).

## 11. Resumen Técnico
* **Autenticación (SSO):** Keycloak integrado con Active Directory.
* **Volumen Esperado:** ~110,000 transacciones diarias en JSON (Post-MVP).
* **Frontend:** Dashboard desarrollado en Streamlit.
* **Modelos de IA:** Árbol de Decisión (Fuerza bruta) e Isolation Forest (Viajes imposibles).
* **Datos (MVP):** Dataset RBA enriquecido con IPinfo.

## 12. Limitaciones Conocidas y Preguntas Abiertas
| ID | Tipo | Descripción | Impacto |
| :--- | :--- | :--- | :--- |
| AQ-01 | Ambigüedad | Identificación de Unidades: No se detalla cómo el sistema obtendrá los atributos para saber si un usuario pertenece a UCI/Quirófanos. | Alto |
| AQ-02 | Suposición | Ingesta de Datos: Se asume que en producción Keycloak enviará logs JSON de forma directa. | Medio |
| AQ-03 | Pregunta Abierta | Granularidad VPN: ¿La exclusión aceptará ASN específicos o únicamente país/región?. | Alto |

## 13. Estado del Proyecto
* **Fase Actual:** Análisis de Requisitos y Definición del MVP.
* **Próximos Pasos:** Desarrollo del Producto Mínimo Viable (MVP) utilizando datos simulados.

