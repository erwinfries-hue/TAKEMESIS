# Evidence Sources, Retrieval, and Eligibility

## Principle

TEKMESIS must route each question to suitable scholarly sources. One database is not sufficient for all life domains.

## Adapter interface

Each source adapter should support:
- capability metadata
- domain coverage
- query construction
- pagination
- rate-limit handling
- timeout/retry
- response validation
- normalized records
- source status
- test fixtures

## Normalized record

Include:
- source
- source ID
- DOI and other identifiers
- title
- authors
- journal/venue
- year/date
- publication type
- abstract
- open-access/full-text status
- retraction/correction status where available
- subject concepts
- source URL
- provenance
- data completeness

## Retrieval layers

### Broad discovery layer
Use an approved broad scholarly graph/search API.

### Metadata verification layer
Use DOI and publisher metadata sources such as Crossref.

### Domain enrichment layer
Use domain-specific official sources where beneficial.

### Content layer
Use abstracts and legally available open-access text only.

## Ranking signals

- semantic/title relevance
- directness to interpreted question
- publication type
- human/context relevance
- results availability
- abstract availability
- methodological relevance
- recency with modest weight
- source completeness
- retraction/correction status

Do not rank solely by recency or AI preference.

## Screening

Record:
- candidate count
- duplicates removed
- included count
- exclusion reasons
- screening version
- source status

Typical exclusion reasons:
- wrong topic
- wrong population/context
- no outcome result
- protocol only
- non-comparable intervention
- insufficient detail
- duplicate
- retracted
- unsupported language/content

## Eligibility dimensions

- researchability
- source coverage
- number of relevant studies
- study comparability
- result-information availability
- abstract/full-text support
- domain support
- risk level
- expected report depth
- confidence in source linkage

## Recommended minimum logic

Do not hard-code final thresholds before concept approval.

Initial principle:
- paid report must have enough source-supported content for the promised report
- multiple studies are preferred
- one high-quality review may support a limited report if clearly disclosed
- metadata-only records cannot support detailed findings
- unsupported or high-risk questions cannot be sold

## Coverage disclosure

Every report must state:
- sources searched
- sources unavailable
- search date
- metadata/abstract/full-text coverage
- known limitations
- no claim of exhaustive literature coverage
