# Veya Samples

Run all executable samples with:

```sh
yarn smoke
```

- `00-basic-composite.ts` builds the smallest executable video and audio composite.
- `01-basic-sequence.ts` builds a small color and silence sequence.
- `02-combinators.ts` applies video and audio modifiers.
- `03-anchors-and-timing.ts` converts time inputs into frame offsets and renders a memory-backed video source.
- `04-guards-and-inputs.ts` validates user input, renders an SVG source, and sends a composite through the mock encoder.

`support.ts` provides tiny in-memory services so the samples can run without external media assets.
