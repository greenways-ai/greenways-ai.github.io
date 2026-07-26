# Greenways Music Specifications

The music family is built on the Hara value and specification layers.

Planned modules:

- `time` — beats, bars, tempo maps and temporal positions;
- `notes` — pitches, durations, articulations and note sequences;
- `patterns` — reusable and generative musical structures;
- `arrangement` — tracks, sections, placements and automation;
- `assets` — samples, stems, manifests and derived content;
- `synthesis` — deterministic synthesis descriptions and renderer mappings;
- `work` — complete works, specification closures and publication roots;
- `attribution` — contribution roles, provenance links and claims.

Each module should remain independently versioned and hash-pinned. Cross-module behaviour belongs in an explicit integration specification rather than hidden implementation convention.
