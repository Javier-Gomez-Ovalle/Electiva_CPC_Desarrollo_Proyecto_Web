# HeraUEBA: Sistema Web de Monitoreo Analítico y Detección de Anomalías de Autenticación mediante IA

> **Materia:** Electiva CPC
> **Hito:** 1 — Definición de Idea, MVP y Rol del Proyecto
> **Autor:** Líder de Desarrollo e Integración de Sistemas de IA

---

## 1. Definición Clara de la Idea a Desarrollar

### 1.1 Descripción del Sistema

**HeraUEBA** es un sistema web de monitoreo analítico de comportamiento de usuarios y entidades (**UEBA**) para el Sector Salud, diseñado como capa de detección temprana sobre el sistema de inicio de sesión único (SSO) de un Hospital Clínico Privado. Analiza en tiempo cuasi real los eventos de autenticación para identificar patrones de acceso anómalos asociados a credenciales comprometidas.

### 1.2 Problema: Acceso Inicial mediante Credenciales Comprometidas (MITRE T1078)

**T1078 — Valid Accounts** (MITRE ATT&CK, táctica *Initial Access / Persistence*) describe el uso de credenciales legítimas robadas, filtradas o adivinadas para obtener acceso sin explotar vulnerabilidades de software.

Criticidad en contexto hospitalario:

- **Activos protegidos**: los sistemas hospitalarios almacenan PHI/PII, con alto valor en mercados ilícitos.
- **Invisibilidad perimetral**: al usar credenciales válidas, firewalls, antivirus e IDS basados en firmas no generan alertas — el atacante es indistinguible de un usuario autorizado.
- **Impacto**: interrupción de servicios clínicos, exposición de historiales médicos, sanciones regulatorias.

HeraUEBA desplaza el paradigma de seguridad de *"¿la contraseña es correcta?"* a *"¿este comportamiento es coherente con el patrón histórico del usuario?"*.

### 1.3 Justificación Técnica: IA Híbrida (Supervisada + No Supervisada)

**a) Árbol de Decisión (supervisado) — Fuerza Bruta / Credential Stuffing**
Clasificador entrenado con datos etiquetados (tasa de intentos fallidos, reincidencia por IP, RTT). Adecuado porque este ataque genera patrones estructurales bien definidos y documentables. Su interpretabilidad es clave para auditoría y cumplimiento normativo en salud.

**b) Isolation Forest (no supervisado) — Viaje Imposible**
Detecta anomalías geográficas (ej. login en Colombia seguido, minutos después, de login en otro continente) sin requerir etiquetas previas. Aísla observaciones atípicas en el espacio de características (geolocalización IP/ASN, velocidad de desplazamiento implícita), permitiendo detección autónoma de amenazas no vistas (*zero-day behavioral*).

**Complementariedad**: el Árbol de Decisión cubre amenazas conocidas de forma explicable; el Isolation Forest provee resiliencia adaptativa ante amenazas emergentes.

---

## 2. El MVP (Mínimo Producto Viable)

**Plazo:** 8 semanas | **Stack:** Python + Streamlit + Scikit-Learn

### Componente I — Interfaz Visual (Streamlit)

- **Dashboard principal**: KPIs de seguridad (volumen de intentos, tasa éxito/fracaso, distribución geográfica, anomalías detectadas por ventana temporal) mediante visualizaciones (Plotly/Altair).
- **Panel dinámico de Alertas Rojas**: listado priorizado de eventos de alto riesgo, con usuario afectado, timestamp, tipo de anomalía (fuerza bruta / viaje imposible), nivel de confianza y geolocalización de origen.

### Componente II — Motor de IA / Backend Analítico

- **Ingesta y preprocesamiento** del dataset *Login Data Set for Risk-Based Authentication*, enriquecido con las bases IP-to-ASN e IP-to-Country mediante `pd.merge_asof` (unión ordenada por rangos de IP) y estrategias de muestreo para manejar el volumen de +33M registros dentro de recursos de cómputo limitados.
- **Pipeline dual**: ejecución secuencial de Árbol de Decisión (fuerza bruta) e Isolation Forest (viaje imposible) sobre cada registro.
- **Score de riesgo consolidado** por evento, combinando ambas salidas, que determina el escalamiento a Alertas Rojas.

> Alcance delimitado: el motor opera sobre datos históricos/simulados (batch), sin integración productiva en vivo con el SSO real del hospital.

### Componente III — Acciones Interactivas de Mitigación (Simuladas)

- Botón **"Aislar Usuario Comprometido"** en cada Alerta Roja, que cambia el estado del usuario (`activo` → `bloqueado/cuarentena`) en la base de datos de la aplicación, reflejado inmediatamente en el dashboard vía `session_state` de Streamlit.

> Simulación controlada dentro del entorno de la aplicación; no constituye integración real con Active Directory / IAM.

---

## 3. Rol Dentro del Proyecto

**Rol asumido:** Líder de Desarrollo e Integración de Sistemas de IA (*Lead AI Systems Engineer*)

Responsabilidad integral y no delegable sobre el ciclo de vida completo del software:

- **Arquitectura de software**: diseño modular con separación entre interfaz (Streamlit), lógica de negocio y motor de ML.
- **Gobierno de datos**: selección, limpieza, transformación y enriquecimiento de fuentes (registros de autenticación + geolocalización IP-ASN).
- **Pipeline de Machine Learning**: entrenamiento, validación y despliegue de los modelos con Scikit-Learn; evaluación mediante precisión, recall, F1-score y matriz de confusión.
- **Diseño UX/UI**: construcción de la experiencia en Streamlit orientada a un usuario final no técnico (analista de seguridad hospitalario).

La ejecución individual se apoya en **metodologías ágiles asistidas por IA generativa** (copiloto de desarrollo, revisión de código y mentoría técnica), con *sprints* semanales y validación iterativa por componente. La IA acelera el desarrollo pero no sustituye la autoría intelectual ni el criterio técnico del estudiante, que mantiene control y decisión final sobre cada entregable.
