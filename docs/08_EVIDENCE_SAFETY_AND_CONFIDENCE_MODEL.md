# Evidence Safety and Confidence Model

## Approved labels

German:
- Höhere Evidenzsicherheit
- Mittlere Evidenzsicherheit
- Begrenzte Evidenzsicherheit
- Sehr unsichere Evidenz
- Nicht bewertet

English:
- Higher evidence confidence
- Moderate evidence confidence
- Limited evidence confidence
- Very uncertain evidence
- Not assessed

## Dimensions

- study design
- directness
- consistency
- precision
- sample size only when reported
- completeness
- population/context relevance
- risk indicators
- publication status
- funding/conflicts where available
- source-content depth

## Language

Use:
- “Die Studie berichtet …”
- “Die verfügbaren Studien legen nahe …”
- “In den untersuchten Populationen …”
- “Die Evidenz bleibt unsicher, weil …”

Avoid:
- proven
- guaranteed
- definitely effective
- universally best
- you should
- safe for you

## High-risk handling

Stricter rules for:
- cancer
- pregnancy
- prescription drugs
- vaccines
- mental-health crisis
- acute symptoms
- dosing
- pediatric treatment
- legal or financial high-stakes questions

The beta may exclude these entirely.

## AI extraction contract

- supplied source content only
- strict JSON schema
- exact numerical preservation
- null when absent
- no external knowledge
- provenance span/field
- invalid output rejected
- deterministic fallback

## Retractions and protocols

- protocols are not outcome studies
- retracted records are excluded or prominently flagged
- corrected records must show status
- animal evidence is indirect for human questions
