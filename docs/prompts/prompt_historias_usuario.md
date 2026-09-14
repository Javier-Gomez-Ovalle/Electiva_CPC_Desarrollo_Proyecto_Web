# Role

Act as a Senior Software Engineer, Business Analyst, Product Owner, and BDD (Behavior-Driven Development) Specialist with extensive experience in Agile software development, requirements engineering, and acceptance criteria definition.

Your responsibility is to transform a Markdown (`.md`) document containing Functional Requirements (FR/RF) and Non-Functional Requirements (NFR/RNF) into high-quality, structured, and actionable User Stories with acceptance criteria written in valid Gherkin syntax.

# Objective

Analyze the provided `srs_heraueba.md` file, which contains Functional Requirements (RF) and Non-Functional Requirements (RNF), and generate a comprehensive set of User Stories that accurately represent the documented system capabilities, user needs, and quality expectations.

Each User Story must include acceptance criteria expressed using the Gherkin language and follow the principles of Behavior-Driven Development (BDD).

The final deliverable must be suitable for Product Owners, Business Analysts, Software Engineers, QA Engineers, and stakeholders.

# Source Material

The Markdown file is the primary source of truth.

Before generating the User Stories:

1. Read and analyze the entire `srs_heraueba.md` document.
2. Identify all Functional Requirements (RF), Non-Functional Requirements (RNF), business rules, user roles, and relevant dependencies.
3. Determine which requirements represent user-facing capabilities and which represent system-wide quality attributes or constraints.
4. Identify ambiguities, contradictions, missing information, and requirements that need clarification.
5. Preserve traceability between the source requirements and the generated User Stories.

Do not invent requirements, user roles, business rules, system behavior, or acceptance criteria that are not supported by the source document.

# Requirements Classification

## Functional Requirements (RF)

Use Functional Requirements to derive User Stories that describe what users need to accomplish through the system.

Each User Story must represent a meaningful user goal, capability, or business outcome.

Do not create one User Story for every sentence or technical detail. Group related requirements when they serve the same user goal, and split overly broad requirements when necessary.

## Non-Functional Requirements (RNF)

Analyze Non-Functional Requirements and determine how they should be represented:

* If an RNF directly affects a user's interaction or a specific capability, associate it with the relevant User Story through its acceptance criteria.
* If an RNF applies across the entire system, document it as a cross-cutting quality requirement or a dedicated quality-focused User Story when appropriate.
* If an RNF cannot be meaningfully expressed as a user-facing User Story, document it separately as a Non-Functional Requirement Validation Scenario.
* Do not force every RNF into the standard User Story format if doing so would distort its meaning.

Preserve the original RNF intent, measurable targets, constraints, and validation conditions.

# User Story Format

Generate each User Story using the following structure:

## US-[ID]: [Descriptive Title]

**Epic / Feature:** [Related epic or feature]

**User Story:**

> Como [rol de usuario], quiero [objetivo o capacidad], para [beneficio o valor de negocio].

**Business Context:**

Explain the business context and why the user needs this capability. Base the explanation exclusively on the source document.

**User Experience:**

Describe the user's journey through the process, including:

* Starting point and trigger.
* User actions.
* Information or options presented.
* Decisions and alternative paths.
* System responses.
* Expected successful outcome.

**Related Requirements:**

* RF-[ID]: [Requirement reference]
* RNF-[ID]: [Related non-functional requirement, if applicable]

**Acceptance Criteria (Gherkin):**

Write the acceptance criteria using valid Gherkin syntax.

```gherkin
Feature: [Feature name]

  Scenario: [Scenario description]
    Given [initial context or precondition]
    And [additional context, if applicable]
    When [user action or event]
    And [additional action, if applicable]
    Then [expected observable outcome]
    And [additional expected outcome, if applicable]
```

**Business Rules and Constraints:**

List the applicable business rules and constraints supported by the source.

**Priority:** [High / Medium / Low / To be defined]

**Source Traceability:** [RF/RNF references and relevant source section]

**Open Questions:**

Identify any unresolved details or clarifications needed to finalize the User Story.

# Gherkin Standards

All acceptance criteria must follow valid Gherkin syntax and use the standard keywords:

* `Feature:`
* `Background:` (only when shared context is useful)
* `Scenario:`
* `Scenario Outline:` (when parameterized behavior is appropriate)
* `Examples:` (when used with a Scenario Outline)
* `Given`
* `When`
* `Then`
* `And`
* `But`

## Gherkin Quality Rules

1. Write scenarios from the user's or system behavior's perspective.
2. Use observable and testable behavior rather than implementation details.
3. Keep each scenario focused on one behavior or outcome.
4. Use clear, concise, and unambiguous language.
5. Include relevant preconditions, actions, and expected results.
6. Cover the happy path and relevant alternative or exception flows supported by the requirements.
7. Avoid implementation-specific details such as database tables, internal classes, APIs, or frameworks unless explicitly required.
8. Do not use vague assertions such as "the system works correctly" or "the process is easy."
9. Do not introduce unsupported validation rules, error messages, or business logic.
10. Use `Scenario Outline` only when multiple examples share the same behavior structure.
11. Ensure every `Then` describes an observable result that can be verified through testing.
12. Use consistent terminology for roles, entities, actions, and system responses across all scenarios.

# Language and Syntax Requirements

The explanatory content, User Stories, business context, user experience, priorities, traceability, and open questions must be written in **Spanish**.

The Gherkin keywords must remain in their standard English form (`Feature`, `Scenario`, `Given`, `When`, `Then`, etc.) to preserve compatibility with standard Gherkin tooling.

The descriptive text within Gherkin scenarios must be written in Spanish.

Example:

```gherkin
Feature: Gestión de asesorías

  Scenario: El coordinador agenda una asesoría para un emprendedor
    Given que el coordinador ha iniciado sesión
    And que el emprendedor tiene un proyecto registrado
    When el coordinador agenda una asesoría para el emprendedor
    Then el sistema debe registrar la asesoría
    And debe mostrar la asesoría en el historial del emprendedor
```

# Required Output Structure

## 1. Requirements Analysis

Summarize the RF and RNF identified in the Markdown document.

Include:

* Main functional areas.
* User roles.
* Business processes.
* Functional requirements.
* Non-functional requirements.
* Dependencies and constraints.
* Ambiguities and missing information.

## 2. Requirements-to-User-Stories Mapping

Create a traceability table:

| Requirement ID | Requirement Type | Description | User Story ID | Coverage Status | Notes |
| -------------- | ---------------- | ----------- | ------------- | --------------- | ----- |

Use the following coverage statuses:

* Covered.
* Partially covered.
* Requires clarification.
* Not directly expressible as a User Story.
* Unmapped.

## 3. User Stories

Generate all relevant User Stories using the specified structure.

Ensure that each User Story includes Gherkin acceptance criteria and references its source requirements.

## 4. Non-Functional Requirement Validation Scenarios

For RNF that cannot be adequately represented through user-facing User Stories, create separate validation scenarios.

Use the following structure:

### RNF-[ID]: [Requirement Title]

* **Category:** [Performance, Security, Usability, etc.]
* **Requirement:** [Original or accurately paraphrased requirement]
* **Validation Objective:** [What must be verified]
* **Gherkin Validation Scenario:**

```gherkin
Feature: Validación de [calidad o restricción]

  Scenario: [Scenario description]
    Given [initial context]
    When [event or action]
    Then [measurable or observable expected result]
```

Do not fabricate quantitative thresholds or testing methods that are not supported by the source.

## 5. Ambiguities and Open Questions

List all requirements that require clarification before implementation or acceptance testing.

Include:

* Missing acceptance conditions.
* Ambiguous user roles.
* Undefined business rules.
* Incomplete error handling.
* Unspecified data requirements.
* RNF without measurable targets.
* Conflicting requirements.
* Unclear priorities or dependencies.

## 6. Final Quality Review

Evaluate the generated User Stories against:

* INVEST principles: Independent, Negotiable, Valuable, Estimable, Small, and Testable.
* Gherkin syntax correctness.
* Acceptance criteria completeness.
* Requirement traceability.
* Functional and non-functional requirement coverage.
* Consistency of terminology.
* Absence of fabricated information.
* Clarity and testability.
* Appropriate story granularity.

Report any issues found and recommend improvements.

# Quality Standards

* Use professional software engineering and Agile terminology.
* Maintain a clear distinction between requirements, user stories, acceptance criteria, and validation scenarios.
* Ensure the stories describe user value rather than merely restating technical requirements.
* Avoid unnecessary duplication.
* Preserve all relevant requirements and their intent.
* Use unique, sequential identifiers.
* Do not omit requirements merely for brevity.
* Do not create unsupported features or assumptions.
* Make the output practical for development, QA, and stakeholder validation.

# Final Instruction

Read the complete Markdown file before generating the deliverable. Produce the full output in Spanish, except for the standard Gherkin keywords, which must remain in English.

Generate a comprehensive, traceable, and high-quality set of User Stories with valid Gherkin acceptance criteria, ensuring that the resulting documentation accurately reflects the Functional Requirements (RF) and Non-Functional Requirements (RNF) contained in the source document.

