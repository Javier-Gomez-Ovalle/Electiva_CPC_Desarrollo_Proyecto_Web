# Análisis de Requisitos y Entrevista de Descubrimiento: HeraUEBA

## 1. Contexto del Proyecto Actualizado

*   **HeraUEBA** es un sistema web de monitoreo analítico del comportamiento de usuarios y entidades (UEBA) orientado al sector salud, diseñado para operar sobre el sistema de inicio de sesión único (SSO) del hospital basado en Keycloak.
*   El sistema procesará alertas de acceso inicial mediante credenciales comprometidas (MITRE T1078), integrando un motor híbrido de Inteligencia Artificial (Árbol de Decisión e Isolation Forest).
*   Debido a la criticidad del entorno clínico (quirófanos, UCI) y a la responsabilidad legal, el sistema tiene **cero tolerancia a los bloqueos automáticos**. Toda acción de mitigación actuará como soporte a la decisión humana.
*   El desarrollo se alinea con la Ley 1581 de 2012 de Colombia y lineamientos HIPAA, lo que hace obligatoria la explicabilidad (caja blanca) de cualquier alerta generada.

---

## 2. Brechas de Información Resueltas

*   **Arquitectura SSO:** Se confirmó el uso de Keycloak integrado con Active Directory, con un volumen de 110,000 transacciones diarias (JSON).
*   **Gestión de Falsos Positivos:** Resolvimos la necesidad de un sistema de lista blanca (whitelist) geográfica, administrable exclusivamente por el Coordinador SOC.
*   **Mitigación Real:** Se definió que el MVP incluirá un botón con verificación de dos pasos, y el roadmap futuro contempla la revocación de tokens y restablecimiento vía MFA.
*   **Experiencia UX/UI:** El SOC es reducido (3 a 5 analistas por turno). El dashboard requiere un diseño de baja densidad cognitiva, priorizando Alertas Rojas en la parte superior sin necesidad de scroll, mostrando por defecto solo las últimas 24 horas.

---

## 3. Conversación Simulada Cliente-Estudiante

**Estudiante:** Buenos días. Gracias por este espacio para aterrizar los requerimientos de HeraUEBA. Para comenzar con el diseño de la arquitectura, necesito entender el entorno base. ¿Sobre qué sistema de inicio de sesión operan y cuál es el volumen de tráfico que enfrentan en el hospital?

**Cliente (CISO):** Buenos días. Operamos sobre Keycloak como Identity Provider, integrado con Active Directory. Procesamos unas 110,000 transacciones diarias, con picos fuertes entre las 6:00 y 8:00 a.m. por los cambios de turno clínico. Para cuando vayan a producción, tendrán que ingerir logs en JSON estructurado, aunque sé que para el MVP usarán datos simulados.

**Estudiante:** Perfecto. Al igual que al estructurar un backend REST API robusto, diseñaré la futura ingesta de ese JSON como un flujo asíncrono. Ahora, respecto al aislamiento de usuarios: si el sistema detecta una anomalía, ¿cuál es su tolerancia a interrupciones en caso de un falso positivo?

**Cliente:** Tolerancia cero. Un falso positivo que bloquee a un médico en cirugía es un riesgo de vida y una exposición legal directa. No autorizo bloqueos automáticos. Exijo un modal de verificación de dos pasos y exclusiones para unidades críticas como quirófanos y UCI.

**Estudiante:** Entiendo perfectamente la criticidad. Al analizar el impacto de la Inteligencia Artificial en entornos de producción, siempre destaco el riesgo de crear una dependencia peligrosa si no existe supervisión humana obligatoria. Implementaremos el modal de confirmación. ¿Cómo está compuesto el equipo SOC que tomará esa decisión?

**Cliente:** Son entre 3 y 5 analistas por turno y monitorean toda la seguridad, no solo identidades. No tienen tiempo para gráficos complejos. El dashboard debe tener baja densidad cognitiva: las Alertas Rojas arriba, visibles sin scroll, y el resto de las métricas en un plano secundario.

**Estudiante:** Aplicando rigurosamente los atributos de calidad ISO/IEC 25010 a este diseño, priorizaremos la operabilidad visual. Streamlit mostrará únicamente las últimas 24 horas por defecto para garantizar una carga rápida en el navegador. Por otro lado, ¿cualquier analista del turno podrá ejecutar el aislamiento en el panel?

**Cliente:** Absolutamente no. Necesitamos control de acceso basado en roles (RBAC). El Analista Junior tendrá acceso de lectura, mientras que el Coordinador SOC será el único con facultades para aislar una cuenta tras el modal de verificación.

**Estudiante:** Entendido, esa segregación de funciones es fundamental para el gobierno de la plataforma. Pasando a temas de cumplimiento, ¿qué normativas locales impactan el nivel de explicabilidad que debemos darle a los resultados del Árbol de Decisión?

**Cliente:** Nos rige la Ley 1581 de 2012 en Colombia y aplicamos buenas prácticas de HIPAA. Para efectos de auditoría médica, nada de "cajas negras". Necesito ver en la interfaz el camino de decisión exacto que activó la alerta, especificando los nodos y condiciones.

**Estudiante:** Totalmente alineado. Expondremos las reglas explícitas (por ejemplo, "más de 8 intentos fallidos en 2 minutos desde 3 IPs distintas") en el detalle de cada evento. Cambiando a las anomalías geográficas, ¿es frecuente que el personal médico genere alertas legítimas por viajes?

**Cliente:** Constantemente. Nuestros especialistas viajan mucho a congresos médicos internacionales o realizan telemedicina transfronteriza vía VPN. El modelo de viaje imposible nos inundará de falsos positivos si no contemplan esto. Necesito una *whitelist* gestionable por el Coordinador SOC.

**Estudiante:** Como parte de las iteraciones de diseño analizadas con el grupo de investigación ISUMDEV, hemos notado que el contexto humano es clave para afinar los umbrales estadísticos. Integraremos esa lista blanca para que el modelo Isolation Forest ignore dichos eventos legítimos. Más allá de aislar al usuario web, ¿cómo es el protocolo integral de respuesta del hospital?

**Cliente:** Son tres pasos manuales hoy: revocar tokens de sesión activos en Keycloak, forzar el reseteo de contraseña vía SMS/MFA, y notificar al jefe de servicio clínico. Entiendo que su MVP solo abarca el aislamiento simulado.

**Estudiante:** Exacto, pero documentaremos ese flujo completo en los requerimientos del proyecto integrador para que la arquitectura base quede preparada. Para calibrar los modelos, ¿cuentan actualmente con registros históricos etiquetados?

**Cliente:** No tenemos datos etiquetados, todo está crudo en el SIEM y etiquetar eso manualmente tomaría meses. Apoyarse en el dataset RBA enriquecido con IPinfo que proponen es la aproximación más realista.

**Estudiante:** Perfecto, eso confirma nuestra estrategia de *Machine Learning* y viabiliza las 8 semanas de desarrollo. Finalmente, para justificar el éxito de la herramienta, ¿qué mejora específica en los tiempos de respuesta esperan lograr?

**Cliente:** Hoy, una investigación manual de un acceso sospechoso toma de 2 a 4 horas. Con HeraUEBA busco reducir el MTTR (Tiempo Medio de Recuperación) en al menos un 70%, bajando la detección y priorización a minutos.

**Estudiante:** Es un objetivo de negocio claro y lo usaremos como nuestra principal métrica de validación. Actualizaré la especificación del sistema de inmediato.

---

## 4. Hallazgos Clave

*   **Intervención Humana Innegociable:** El sistema fungirá estrictamente como soporte a la toma de decisiones. Todo bloqueo de cuenta requerirá intervención de un rol autorizado (Coordinador SOC) mediante doble confirmación.
*   **Transparencia Normativa:** El cumplimiento de la Ley 1581 y directrices de auditoría clínica exigen que la interfaz muestre el árbol lógico de toma de decisiones para las alertas de fuerza bruta.
*   **Optimización de Carga Visual:** Streamlit se limitará a renderizar la ventana de las últimas 24 horas, eliminando la sobrecarga cognitiva y previniendo caídas de memoria por el volumen histórico (33M de registros).
*   **Gestión de Excepciones:** Se requiere el desarrollo de un módulo de excepciones geográficas (Whitelist) para evitar el aislamiento de especialistas médicos en misiones o congresos internacionales.

---

## 5. Preguntas Abiertas y Suposiciones para Futuras Iteraciones

*   **Evolución del SSO:** Se asume que para la etapa posterior al MVP, Keycloak expondrá APIs que permitan la ejecución automatizada de la revocación de tokens.
*   **Integración de Identidades:** Falta definir cómo HeraUEBA obtendrá de forma dinámica los atributos de las cuentas (ej. a qué unidad clínica pertenece un usuario para identificar si está en UCI/Quirófano) para ajustar el umbral de riesgo.