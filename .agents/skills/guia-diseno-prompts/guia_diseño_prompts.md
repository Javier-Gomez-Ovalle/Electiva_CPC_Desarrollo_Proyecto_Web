# Guía de Diseño de Prompts Profesionales para Ingeniería de Software y Configuración Técnica

## 1. Propósito

Esta guía define una metodología para diseñar prompts profesionales,
consistentes y reutilizables destinados a tareas de:

-   Ingeniería de software.
-   Análisis de entrevistas.
-   Levantamiento y documentación de requisitos.
-   Generación de historias de usuario.
-   BDD y Gherkin.
-   Documentación de proyectos mediante README.
-   Análisis académico y técnico.
-   Configuración y personalización de entornos Linux.
-   Diagnóstico y resolución de problemas técnicos.

El objetivo principal es que un prompt no sea simplemente una
instrucción breve, sino una **especificación de trabajo para el
modelo**, donde se establezcan claramente el rol, el contexto, las
fuentes, el proceso de análisis, las restricciones, la estructura del
resultado y los criterios de calidad.

------------------------------------------------------------------------

# 2. Principio fundamental

Un prompt profesional debe responder, como mínimo, a estas preguntas:

1.  **¿Quién debe actuar?**
2.  **¿Qué debe hacer?**
3.  **¿Con qué información debe trabajar?**
4.  **¿Cuál es la fuente de verdad?**
5.  **¿Cómo debe analizar la información?**
6.  **¿Qué restricciones debe respetar?**
7.  **¿Qué estructura debe tener el resultado?**
8.  **¿En qué idioma debe estar el prompt?**
9.  **¿En qué idioma debe estar el resultado?**
10. **¿Cómo se debe verificar la calidad del resultado?**

Una estructura útil es:

> **Role → Objective → Context → Sources → Analysis → Rules → Output
> Structure → Quality Assurance → Final Language Requirement**

------------------------------------------------------------------------

# 3. Estructura base de un prompt experto

## 3.1 Role

El bloque `Role` define la experiencia que debe simular el modelo.

### Objetivo

Establecer las competencias necesarias para resolver la tarea.

### Ejemplo

``` text
# Role

Act as a Senior Software Engineer, Business Analyst, Product Owner, and
Requirements Engineering Specialist with extensive experience in software
requirements elicitation, analysis, documentation, and validation.
```

### Reglas

El rol debe:

-   Ser relevante para la tarea.
-   Especificar especialidades cuando sean importantes.
-   Evitar títulos innecesarios.
-   Definir conocimientos técnicos cuando la tarea los requiera.
-   No convertir el rol en una lista excesivamente genérica.

### Recomendación

No usar:

``` text
Act as an expert.
```

Es preferible:

``` text
Act as a Senior Software Engineer and Requirements Engineering Specialist
with extensive experience in Agile requirements analysis, software
documentation, and stakeholder interviews.
```

La segunda versión define **qué tipo de experto** es y **en qué áreas
debe tener experiencia**.

------------------------------------------------------------------------

# 4. Objective

El bloque `Objective` define el resultado que se pretende conseguir.

Debe explicar:

-   Qué información se analizará.
-   Qué transformación debe realizarse.
-   Para qué se utilizará el resultado.
-   Qué características debe tener el resultado final.

### Ejemplo

``` text
# Objective

Analyze the provided interview transcript and transform the information
into a structured set of functional and non-functional software requirements.

The resulting requirements must be clear, precise, testable, traceable,
and suitable for use by software engineers, QA engineers, Product Owners,
and project stakeholders.
```

## Regla

El objetivo debe describir el **resultado**, no únicamente la acción.

Débil:

``` text
Analyze the interview.
```

Profesional:

``` text
Analyze the interview transcript and transform the identified stakeholder
needs into clear, traceable, and testable software requirements.
```

------------------------------------------------------------------------

# 5. Context

El contexto explica el escenario en el que debe interpretarse la
información.

Puede incluir:

-   Dominio del proyecto.
-   Problema de negocio.
-   Tipo de usuarios.
-   Tecnología.
-   Estado actual del proyecto.
-   Documentos relacionados.
-   Restricciones conocidas.

### Ejemplo

``` text
# Context

The project is a web platform intended to improve the management,
traceability, and follow-up of entrepreneurship advisory processes.
```

El contexto debe ser suficientemente específico para reducir ambigüedad,
pero no debe contener información inventada.

------------------------------------------------------------------------

# 6. Source Material

Cuando el prompt trabaja con archivos, es fundamental definir las
fuentes.

Ejemplo:

``` text
# Source Material

The following documents may be provided:

- Interview transcript.
- Project README.
- Functional Requirements.
- Non-Functional Requirements.
- User Stories.
- Evaluation rubric.
```

## 6.1 Fuente de verdad

Cuando existen múltiples documentos, debe establecerse cuál tiene
prioridad.

Ejemplo:

``` text
Use the following priority order:

1. Official evaluation rubric.
2. Original requirements documentation.
3. Interview transcript.
4. User stories.
5. Existing README.
```

Esto evita que el modelo resuelva contradicciones de manera arbitraria.

------------------------------------------------------------------------

# 7. Regla de no invención

Todo prompt profesional que procese documentos debe contener una regla
explícita contra la fabricación de información.

### Regla recomendada

``` text
Do not invent requirements, business rules, technical details, stakeholders,
metrics, citations, sources, or system behavior that are not supported by
the provided material.
```

También debe indicar qué hacer cuando falta información:

``` text
If information is missing, ambiguous, contradictory, or insufficient,
identify it explicitly and mark it as requiring clarification.
```

Esto es especialmente importante para:

-   Requisitos.
-   Citas académicas.
-   Datos técnicos.
-   Configuración de Linux.
-   Métricas de rendimiento.
-   Reglas de negocio.
-   Información de seguridad.

------------------------------------------------------------------------

# 8. Analysis Process

Los prompts de alta calidad no deben indicar únicamente qué producir.
También deben definir **cómo analizar la información antes de
producirla**.

Una estructura habitual es:

``` text
# Analysis Process

Before generating the final output:

1. Understand the context.
2. Identify relevant entities and stakeholders.
3. Extract explicit information.
4. Identify implicit or ambiguous information.
5. Classify the information.
6. Establish relationships and dependencies.
7. Identify inconsistencies.
8. Validate the resulting information against the source.
```

## Regla

El análisis debe ser específico para el problema.

Por ejemplo, para requisitos:

``` text
Identify:
- User roles.
- Business processes.
- Business rules.
- Functional requirements.
- Non-functional requirements.
- Dependencies.
- Exceptions.
- Open questions.
```

Para Linux:

``` text
Identify:
- Distribution.
- ISO version.
- Kernel.
- Kernel headers.
- Bootloader.
- Initramfs generator.
- CPU.
- GPU.
- Filesystem.
- Desktop environment.
- DKMS modules.
```

------------------------------------------------------------------------

# 9. Clasificación de información

Cuando una tarea requiere interpretar información, es útil establecer
categorías.

Por ejemplo:

``` text
Classify findings as:

- Confirmed.
- Inferred.
- Proposed.
- Requires clarification.
- Unsupported.
```

Esto evita que una inferencia sea presentada como un hecho confirmado.

------------------------------------------------------------------------

# 10. Output Structure

El resultado debe tener una estructura explícita.

Un prompt profesional no debería depender de que el modelo "decida" cómo
organizar el resultado.

Ejemplo:

``` text
# Required Output Structure

## 1. Project Overview

## 2. Stakeholders

## 3. Business Processes

## 4. Functional Requirements

## 5. Non-Functional Requirements

## 6. Business Rules

## 7. Traceability Matrix

## 8. Open Questions

## 9. Quality Review
```

La estructura debe corresponder directamente al objetivo de la tarea.

------------------------------------------------------------------------

# 11. Reglas de lenguaje del prompt

## 11.1 Idioma de las instrucciones

Para esta metodología se recomienda escribir las instrucciones
principales en **inglés profesional**, especialmente cuando se pretende
crear prompts reutilizables para modelos de IA.

Ejemplo:

``` text
Analyze the complete document before generating the final output.
```

## 11.2 Idioma del resultado

El idioma del resultado debe establecerse explícitamente.

Ejemplo:

``` text
# Final Language Requirement

The prompt is written in English, but the entire expected output must be
generated in Spanish.
```

Esto evita que el modelo responda parcialmente en inglés.

## 11.3 Excepciones de lenguaje

Cuando un formato técnico exige palabras reservadas específicas, se debe
establecer una excepción.

Por ejemplo, para Gherkin:

``` text
The explanatory content must be written in Spanish.

Gherkin keywords must remain in their standard English form:
Feature, Scenario, Given, When, Then, And, But, Background, Examples.
```

Así se consigue:

``` gherkin
Feature: Gestión de asesorías

  Scenario: El coordinador registra una asesoría
    Given que el coordinador ha iniciado sesión
    When registra una nueva asesoría
    Then el sistema debe guardar la asesoría
```

------------------------------------------------------------------------

# 12. Calidad del lenguaje

Las instrucciones deben utilizar lenguaje:

-   Preciso.
-   Directo.
-   Profesional.
-   No ambiguo.
-   Consistente.
-   Verificable.

Evitar instrucciones como:

``` text
Make it good.
```

``` text
Make it professional.
```

``` text
Do a complete analysis.
```

Es preferible:

``` text
Ensure that every requirement is clear, testable, traceable, and supported
by the provided source material.
```

------------------------------------------------------------------------

# 13. Reglas para escribir requisitos

Cuando el prompt genere requisitos de software, debe exigir:

-   Una capacidad principal por requisito.
-   Identificadores únicos.
-   Lenguaje no ambiguo.
-   Trazabilidad.
-   Testabilidad.
-   Separación entre funcional y no funcional.
-   No introducir detalles técnicos innecesarios.
-   Identificar información faltante.

Una estructura recomendada:

``` text
FR-001: [Requirement Title]

Requirement Statement:
The system shall...

Description:
...

Preconditions:
...

Main Flow:
...

Alternative Flows:
...

Business Rules:
...

Expected Outcome:
...

Source Reference:
...

Open Questions:
...
```

En el resultado español:

``` text
RF-001: [Título del requerimiento]

Declaración:
El sistema deberá...

Descripción:
...

Precondiciones:
...

Flujo principal:
...

Flujos alternativos:
...

Reglas de negocio:
...

Resultado esperado:
...

Referencia de origen:
...

Preguntas abiertas:
...
```

------------------------------------------------------------------------

# 14. Reglas para historias de usuario

Una historia de usuario debe expresar:

> Como \[rol\], quiero [objetivo](#objetivo), para \[beneficio\].

Ejemplo:

``` text
Como coordinador,
quiero registrar las asesorías de los emprendedores,
para mantener un seguimiento centralizado de su proceso.
```

## La historia no debe limitarse a repetir un requisito

Debe representar:

-   Usuario.
-   Objetivo.
-   Valor.
-   Contexto.
-   Criterios de aceptación.

------------------------------------------------------------------------

# 15. Reglas para Gherkin

Los criterios de aceptación deben representar comportamiento observable.

Estructura:

``` gherkin
Feature: [Nombre de funcionalidad]

  Scenario: [Comportamiento esperado]
    Given [contexto inicial]
    When [acción]
    Then [resultado observable]
```

## Reglas

Cada escenario debe:

-   Ser verificable.
-   Tener un comportamiento concreto.
-   Evitar detalles de implementación.
-   Evitar afirmaciones ambiguas.
-   Cubrir flujos relevantes.
-   Incluir escenarios alternativos cuando estén respaldados por los
    requisitos.

No usar:

``` gherkin
Then the system works correctly
```

Preferir:

``` gherkin
Then el sistema debe mostrar la asesoría registrada en el historial del emprendedor
```

------------------------------------------------------------------------

# 16. Reglas para RF y RNF

## Requerimientos funcionales

Responden:

> ¿Qué debe hacer el sistema?

Ejemplos:

-   Registrar usuarios.
-   Crear proyectos.
-   Agendar asesorías.
-   Consultar historial.
-   Generar reportes.

## Requerimientos no funcionales

Responden:

> ¿Cómo debe comportarse el sistema o qué restricciones debe cumplir?

Ejemplos:

-   Seguridad.
-   Rendimiento.
-   Disponibilidad.
-   Usabilidad.
-   Accesibilidad.
-   Integridad.
-   Mantenibilidad.

## Regla crítica

No inventar métricas.

Si una entrevista dice:

``` text
La plataforma debe ser rápida.
```

No convertir automáticamente esto en:

``` text
El sistema debe responder en menos de 2 segundos.
```

La versión correcta debe identificar que falta una métrica:

``` text
El requisito de rendimiento requiere una métrica cuantificable.
```

------------------------------------------------------------------------

# 17. Trazabilidad

Los prompts profesionales deben intentar mantener una relación entre:

``` text
Fuente
   ↓
Necesidad
   ↓
Proceso
   ↓
Requisito
   ↓
Historia de usuario
   ↓
Criterio Gherkin
```

Una matriz puede utilizar:

  -------------------------------------------------------------------------
  Source ID   Finding     Requirement   User Story  Gherkin     Status
                                                    Scenario    
  ----------- ----------- ------------- ----------- ----------- -----------

  -------------------------------------------------------------------------

La trazabilidad permite determinar si una funcionalidad realmente
proviene de una necesidad documentada.

------------------------------------------------------------------------

# 18. Reglas para README

Cuando el objetivo sea mejorar un README, el prompt debe evitar
convertirlo en una copia completa de los requisitos.

El README debe funcionar como:

> **puerta de entrada al proyecto**

Debe explicar:

-   Qué es el proyecto.
-   Qué problema resuelve.
-   Quién lo utiliza.
-   Qué funcionalidades principales tiene.
-   Cuál es su alcance.
-   Cómo está estructurado.
-   Información técnica disponible.
-   Estado del proyecto.
-   Cómo contribuir o ejecutarlo, si esa información existe.

Los detalles exhaustivos pueden permanecer en:

-   Requisitos.
-   Historias de usuario.
-   Documentación técnica.
-   Documentación de arquitectura.
-   Documentación de QA.

------------------------------------------------------------------------

# 19. Reglas para documentos académicos

Cuando el prompt tenga como objetivo corregir un documento académico, se
debe separar:

1.  Contenido.
2.  Investigación.
3.  Estructura.
4.  Citas.
5.  Referencias.
6.  Formato.
7.  Verificación contra la rúbrica.

## Fuentes

Nunca inventar:

-   Autores.
-   Fechas.
-   DOI.
-   URLs.
-   Títulos.
-   Páginas.
-   Citas.

Si falta información:

``` text
The reference requires verification.
```

## Rúbrica

Cuando se proporcione una rúbrica en PDF:

1.  Leer la rúbrica completa.
2.  Extraer cada criterio.
3.  Identificar el estado actual.
4.  Detectar brechas.
5.  Corregir el documento.
6.  Verificar nuevamente cada criterio.

Matriz recomendada:

  -----------------------------------------------------------------------------
  Criterion   Requirement   Current     Gap         Correction   Verification
                            Status                               
  ----------- ------------- ----------- ----------- ------------ --------------

  -----------------------------------------------------------------------------

------------------------------------------------------------------------

# 20. Reglas para APA 7

Cuando el documento deba cumplir APA 7.ª edición, el prompt debe
especificar explícitamente:

-   Fuente.
-   Tamaño.
-   Márgenes.
-   Interlineado.
-   Sangría.
-   Alineación.
-   Numeración.
-   Encabezados.
-   Portada.
-   Tablas.
-   Figuras.
-   Citas.
-   Referencias.

Si el requisito institucional contradice una configuración estándar de
APA, debe darse prioridad a la normativa solicitada por la institución o
a la rúbrica proporcionada.

No asumir que todas las instituciones utilizan exactamente el mismo
formato de portada.

------------------------------------------------------------------------

# 21. Generación de documentos

Cuando el resultado solicitado sea un `.docx`, el prompt debe exigir que
el modelo:

-   Genere el documento completo.
-   No entregue únicamente recomendaciones.
-   Aplique estilos de Word.
-   Utilice encabezados correctamente.
-   Genere tabla de contenido automática cuando sea necesario.
-   Utilice numeración consistente.
-   Mantenga el formato durante toda la documentación.
-   Verifique el resultado final.

La instrucción debe diferenciar entre:

``` text
Analysis
```

y:

``` text
Final Deliverable
```

------------------------------------------------------------------------

# 22. Prompts para configuración técnica

Para tareas de infraestructura, Linux, redes o sistemas operativos, el
prompt debe utilizar un enfoque diferente al de generación documental.

La estructura recomendada es:

``` text
Observe
   ↓
Diagnose
   ↓
Explain
   ↓
Propose
   ↓
Validate
   ↓
Apply
   ↓
Verify
   ↓
Rollback
```

Esto evita que el modelo entregue comandos destructivos basados en
suposiciones.

------------------------------------------------------------------------

# 23. Ejemplo: entorno Linux

Para un entorno como CachyOS/Ryoku Linux con Linux LTS, el prompt debe
pedir primero:

-   ISO.
-   Versión del sistema.
-   Kernel.
-   Headers.
-   CPU.
-   GPU.
-   Bootloader.
-   Initramfs.
-   Filesystem.
-   Desktop Environment.
-   DKMS.
-   Secure Boot.
-   Servicios relevantes.

Nunca asumir:

``` text
The system uses GRUB.
```

si no se ha comprobado.

Debe utilizar:

``` text
Determine whether the system uses GRUB, systemd-boot, or another bootloader
before providing bootloader-specific commands.
```

------------------------------------------------------------------------

# 24. Regla para Linux LTS y headers

Los prompts que trabajen con kernels deben exigir compatibilidad entre:

``` text
Linux LTS
+
Linux LTS Headers
+
DKMS modules
+
Initramfs
+
Bootloader
```

Nunca asumir que cualquier versión de headers funciona con cualquier
kernel.

El prompt debe pedir:

``` bash
uname -r
```

y comprobar los paquetes instalados, cuando corresponda:

``` bash
pacman -Q | grep -E 'linux|headers|dkms'
```

------------------------------------------------------------------------

# 25. Seguridad y reversibilidad

Para cualquier cambio técnico, el prompt debe exigir:

### Objective

¿Qué se quiere conseguir?

### Current State

¿Qué existe actualmente?

### Why Change It

¿Por qué debe modificarse?

### Risk Level

¿Qué riesgo tiene?

### Prerequisites

¿Qué debe cumplirse antes?

### Commands

¿Qué comandos deben ejecutarse?

### Expected Result

¿Qué debe ocurrir?

### Verification

¿Cómo se comprueba?

### Rollback

¿Cómo se revierte?

### Impact

¿Qué puede afectar?

Esto es especialmente importante para:

-   Kernel.
-   Bootloader.
-   Drivers.
-   Particiones.
-   Filesystems.
-   Servicios.
-   Configuración de red.
-   Seguridad.

------------------------------------------------------------------------

# 26. Regla de evidencia

Cuando la información pueda cambiar con el tiempo, el prompt debe
indicar que se verifique la información actual.

Ejemplos:

-   Versiones de software.
-   Paquetes.
-   APIs.
-   Metodologías.
-   Documentación oficial.
-   Comandos.
-   Compatibilidad.
-   Requisitos de hardware.

Debe priorizar:

1.  Documentación oficial.
2.  Fuentes primarias.
3.  Documentación institucional.
4.  Fuentes técnicas confiables.
5.  Comunidad técnica como apoyo.

------------------------------------------------------------------------

# 27. Regla de no asumir

Una de las reglas más importantes de toda la metodología es:

> **Do not assume what can be verified.**

En español:

> **No asumir aquello que puede verificarse.**

Ejemplos:

Incorrecto:

``` text
Install the NVIDIA driver.
```

Correcto:

``` text
Identify the GPU model and current graphics driver before recommending
installation, removal, or replacement of any GPU driver.
```

Incorrecto:

``` text
Regenerate GRUB configuration.
```

Correcto:

``` text
Identify the bootloader before providing bootloader-specific instructions.
```

------------------------------------------------------------------------

# 28. Control de riesgos

Cada prompt debe indicar el nivel de riesgo cuando la tarea pueda
modificar sistemas o información.

Ejemplo:

  -----------------------------------------------------------------------
  Risk                                Meaning
  ----------------------------------- -----------------------------------
  Low                                 No significant system or data
                                      impact expected.

  Medium                              Configuration or compatibility
                                      risks exist.

  High                                Potential for data loss, boot
                                      failure, service interruption, or
                                      security impact.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 29. Verificación final

Todo prompt profesional debe terminar con un bloque de QA.

Ejemplo:

``` text
# Quality Assurance

Before delivering the final result, verify:

- Accuracy.
- Completeness.
- Consistency.
- Traceability.
- Clarity.
- Testability.
- Source compliance.
- Absence of fabricated information.
- Compliance with the requested format.
- Compliance with the required output language.
```

Para Linux:

``` text
Verify:

- System remains bootable.
- Kernel and headers are compatible.
- Required services remain operational.
- Configuration changes are effective.
- Rollback instructions are valid.
```

------------------------------------------------------------------------

# 30. Patrón maestro para diseñar prompts

La siguiente plantilla puede utilizarse como base para nuevos prompts:

``` text
# Role

Act as [EXPERT ROLES] with extensive experience in [RELEVANT AREAS].

# Objective

[DESCRIBE THE EXACT RESULT THAT MUST BE PRODUCED.]

# Context

[DESCRIBE THE PROJECT, ENVIRONMENT, OR PROBLEM.]

# Source Material

[List the files, documents, or information that will be provided.]

# Source Priority

[Define which source has priority when information conflicts.]

# Analysis Process

Before generating the final result:

1. [STEP]
2. [STEP]
3. [STEP]
4. [STEP]

# Classification Rules

Classify information as:

- Confirmed.
- Inferred.
- Proposed.
- Requires clarification.

# Requirements / Domain Rules

[DEFINE THE RULES SPECIFIC TO THE TASK.]

# Output Structure

## 1. [SECTION]
## 2. [SECTION]
## 3. [SECTION]

# Quality Standards

Ensure:

- Accuracy.
- Completeness.
- Consistency.
- Traceability.
- Testability.
- Professional quality.
- No fabricated information.

# Safety / Risk Rules

[ONLY WHEN RELEVANT.]

# Verification

Before delivering the result:

1. [CHECK]
2. [CHECK]
3. [CHECK]

# Final Language Requirement

The prompt is written in English, but the entire expected output must be generated in Spanish.

[DEFINE ANY EXCEPTIONS, SUCH AS GHERKIN KEYWORDS.]

# Final Instruction

[ONE CLEAR FINAL STATEMENT DEFINING THE EXPECTED DELIVERABLE.]
```

------------------------------------------------------------------------

# 31. Checklist para revisar un prompt antes de utilizarlo

## Estructura

-   [ ] Define un rol adecuado.
-   [ ] Tiene un objetivo claro.
-   [ ] Define el contexto.
-   [ ] Define las fuentes.
-   [ ] Establece prioridad entre fuentes.
-   [ ] Explica el proceso de análisis.
-   [ ] Define el formato de salida.
-   [ ] Incluye criterios de calidad.
-   [ ] Incluye reglas contra la invención.
-   [ ] Define el idioma del resultado.

## Lenguaje

-   [ ] El inglés es gramaticalmente correcto.
-   [ ] Utiliza terminología profesional.
-   [ ] No contiene instrucciones ambiguas.
-   [ ] No mezcla innecesariamente inglés y español.
-   [ ] Define explícitamente las excepciones de idioma.

## Resultado

-   [ ] El output está definido con suficiente detalle.
-   [ ] Las secciones tienen un orden lógico.
-   [ ] Los identificadores son consistentes.
-   [ ] Existe trazabilidad cuando es necesaria.
-   [ ] Los criterios son verificables.
-   [ ] El modelo sabe qué hacer ante información faltante.

## Seguridad y confiabilidad

-   [ ] No asume información que puede verificarse.
-   [ ] No inventa datos.
-   [ ] Identifica incertidumbres.
-   [ ] Incluye rollback cuando corresponde.
-   [ ] Incluye verificación posterior.
-   [ ] Evita acciones destructivas innecesarias.

------------------------------------------------------------------------

# 32. Errores frecuentes al diseñar prompts

## Error 1 --- Ser demasiado general

``` text
Analyze the document and make it better.
```

Problema: no define qué significa "better".

Solución:

``` text
Analyze the document for clarity, completeness, consistency, technical
accuracy, traceability, and compliance with the provided evaluation rubric.
```

## Error 2 --- No definir la fuente de verdad

Problema: el modelo puede mezclar información contradictoria.

Solución:

``` text
Use the official requirements document as the primary source of truth.
```

## Error 3 --- Pedir que invente información implícitamente

Problema:

``` text
Complete any missing information.
```

Esto puede provocar alucinaciones.

Mejor:

``` text
Identify missing information and mark it as requiring clarification.
Do not fabricate values or requirements.
```

## Error 4 --- No especificar idioma

Problema: un prompt en inglés puede producir un resultado en inglés.

Solución:

``` text
The prompt is written in English, but the entire expected output must be
generated in Spanish.
```

## Error 5 --- No definir el formato

Problema: el modelo decide arbitrariamente cómo responder.

Solución:

``` text
Use the following exact output structure...
```

## Error 6 --- No verificar el resultado

Problema: el modelo genera el contenido pero no comprueba si cumple las
reglas.

Solución:

``` text
Before delivering the final result, perform a quality review against all
requirements defined in this prompt.
```

------------------------------------------------------------------------

# 33. Filosofía general

Un prompt de alta calidad debe funcionar como una **especificación
técnica**, no como una simple pregunta.

La diferencia puede representarse así:

``` text
Prompt básico
     ↓
Pregunta
     ↓
Respuesta

Prompt profesional
     ↓
Rol
     ↓
Contexto
     ↓
Fuentes
     ↓
Análisis
     ↓
Reglas
     ↓
Transformación
     ↓
Formato
     ↓
Validación
     ↓
Resultado verificable
```

El objetivo no es escribir el prompt más largo posible.

El objetivo es eliminar ambigüedad suficiente para que el modelo pueda
producir un resultado:

-   Correcto.
-   Consistente.
-   Trazable.
-   Reproducible.
-   Verificable.
-   Adecuado al dominio.
-   En el formato solicitado.

------------------------------------------------------------------------

# 34. Regla final de diseño

Antes de considerar terminado un prompt, comprobar:

> **¿Podría otro modelo ejecutar este prompt sin tener que adivinar qué
> quiero?**

Si la respuesta es no, el prompt todavía necesita especificación
adicional.

Un buen prompt define claramente:

``` text
WHO
↓
WHAT
↓
WHY
↓
WITH WHAT INFORMATION
↓
HOW
↓
UNDER WHICH RULES
↓
IN WHAT FORMAT
↓
IN WHICH LANGUAGE
↓
HOW TO VERIFY THE RESULT
```

Esta estructura constituye la base para construir prompts profesionales,
reutilizables y orientados a resultados de calidad industrial.
