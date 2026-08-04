# Greenways Standards Process

## Purpose

Greenways specifications define executable data formats, deterministic transformations, attribution records and publication protocols. The process keeps drafts easy to improve while making stable releases immutable and independently testable.

## Roles

- **Author** — contributes normative design, implementation, tests or documentation.
- **Editor** — maintains a specification document and resolves editorial issues.
- **Maintainer** — approves semantic changes and releases.
- **Reviewer** — evaluates correctness, interoperability, security or rights implications.
- **Implementer** — provides a conforming runtime or integration.

Publisher, author and rights-holder are distinct roles.

## Change process

Substantial changes begin as RFCs. Pull requests must identify whether they modify normative semantics, informative material, conformance cases or implementation code.

## Specification states

- `:draft`
- `:candidate`
- `:stable`
- `:deprecated`
- `:superseded`
- `:withdrawn`

## Candidate requirements

A candidate specification must include:

- canonical specification data;
- exact dependency references;
- defined valid and invalid cases;
- deterministic error behaviour;
- attribution for specification contributions;
- an implementation plan.

## Stable requirements

A stable specification must additionally include:

- an immutable semantic version;
- a conformance corpus;
- a reference implementation where executable behaviour is defined;
- parity evidence from independent runtimes where consensus execution is involved;
- a signed release manifest;
- a change log and migration guidance;
- no unresolved blocking normative issues.

## Immutability

Published stable version directories are never edited. Semantic corrections require a new version. Existing works continue to pin the exact version and hash under which they were created.

## Governance

During the bootstrap period, Greenways maintainers approve stable releases. The repository must preserve all proposals, reviews and release evidence so governance can become multi-party later without rewriting history.
