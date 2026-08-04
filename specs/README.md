# Greenways Specifications

This directory is the working and publication source for Greenways standards.

## Namespaces

- `hara/` — canonical values, specification model, language, AST and ledger protocols.
- `music/` — time, notes, patterns, arrangement, assets, synthesis and work formats.
- `integrations/` — mappings to external systems such as MIDI, DAWproject and SuperSonic.

## Status lifecycle

1. **Draft** — active design; may change without compatibility guarantees.
2. **Candidate** — semantics are stabilising and implementations are requested.
3. **Stable** — immutable release with conformance evidence.
4. **Deprecated** — preserved for existing works but discouraged for new work.

Every stable release must have an immutable version directory and an exact content hash. Convenience links such as `latest` are never valid consensus references.

## Specification identity

A specification is referenced by its logical ID, exact version and canonical hash:

```clojure
{:spec/id greenways.music/notes
 :spec/version "0.1.0"
 :spec/hash "blake3:..."}
```

The ID aids discovery. The hash determines exact identity.

## Publication

GitHub is the source, review and release system. A future Greenways Ledger may register stable package roots, but it does not replace this repository as the human-readable standards workspace.
