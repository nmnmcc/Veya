# Samples

These examples are runnable from the repository root and import the core
orchestration package plus the concrete media packages:

```sh
yarn tsx samples/01-basic-sequence.ts
yarn tsx samples/02-combinators.ts
yarn tsx samples/03-anchors-and-timing.ts
yarn tsx samples/04-guards-and-inputs.ts
```

You can also run all samples with:

```sh
yarn smoke
```

## What Each Sample Covers

- `01-basic-sequence.ts`: sequences, tracks, gaps, videos, images, nested
  sequences, and JSON serialization.
- `02-combinators.ts`: data-last `pipe` usage, data-first combinators,
  immutable updates, track edits, sequence edits, and clip-specific options.
- `03-anchors-and-timing.ts`: `Anchor.frame`, `Anchor.time`, `Timing.make`,
  explicit `in`/`out` windows, and reusable timing options.
- `04-guards-and-inputs.ts`: namespace constructors, runtime guards, custom
  media construction, idempotent constructors, immutable copies, URL/byte media
  sources, and the error raised for plain object track items.
