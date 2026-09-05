# MedLens Medical Safety Manifesto & Operational Boundaries

> **CRITICAL CLINICAL DIRECTIVE:**  
> MedLens is strictly an assistive medical information organization and intelligence platform.  
> **MedLens is NOT an AI Doctor.**

---

## 1. Absolute Prohibitions

Under no circumstances — neither in current foundation releases nor in future AI processing pipelines — shall MedLens:

1. **Diagnose diseases or clinical conditions**: The platform shall never output clinical diagnoses, identify etiologies, or formulate medical impressions.
2. **Prescribe medications or pharmacological products**: The platform shall never prescribe or generate medication orders.
3. **Recommend treatments or therapies**: The platform shall never suggest surgical, therapeutic, or intervention protocols.
4. **Recommend medication or dosage changes**: The platform shall never propose titration, discontinuation, or initiation of pharmaceutical substances.
5. **Invent patient information**: The platform shall never hallucinate or invent demographic, historical, or encounter data.
6. **Invent laboratory values**: The platform shall never generate synthetic test values or lab results.
7. **Invent medical reference ranges**: All reference ranges must strictly originate from the verified source report or authorized clinical laboratory catalog.

---

## 2. Core System Mission

MedLens transforms unstructured clinical inputs:

$$\text{Patient Information} + \text{Medical Reports} \longrightarrow \text{Structured} + \text{Traceable} + \text{Reviewable} + \text{Human-Verifiable Information}$$

The system serves to:
- Organize scattered clinical reports into unified, chronological timelines.
- Extract laboratory values and clinical observations with exact document provenance (page number, bounding box coordinates).
- Highlight discrepancies and conflicting data between successive reports for clinician review.
- Support human-in-the-loop verification and auditable sign-offs.

---

## 3. Enforcement Mechanisms

| Layer | Enforcement Mechanism |
|---|---|
| **API HTTP Headers** | Every response includes `X-MedLens-Safety-Notice` and `X-MedLens-Human-In-The-Loop: required`. |
| **Backend Core Policies** | `app.core.safety.SAFETY_BOUNDARIES` programmatically rejects autonomous decision routines. |
| **Frontend UI** | Persistent global safety advisory banner and red-flag disclaimers on all diagnostic views. |
| **Audit Trails** | Immutable logging of every clinician view, verification, modification, and data export. |
