# Veya

Veya is a programmable video creation library for TypeScript.

It models media as composable Effect streams: video clips emit RGBA bitmaps,
audio clips emit planar floating-point buffers, and composites combine tracks
through pluggable runtime services. The workspace is split into small packages
for core media primitives, source adapters, generated clips, SVG rendering, and
encoding.

## Packages

| Package                    | Purpose                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `@veya/core`               | Media types, clips, tracks, composites, and compositor service contracts.          |
| `@veya/encoder`            | Encoder service contract shared by encoder implementations and consumers.          |
| `@veya/color`              | Solid-color video clips.                                                           |
| `@veya/video`              | Video source/probe service contracts, decoded video clips, and frame/time helpers. |
| `@veya/audio`              | Audio source/probe service contracts and decoded audio clips.                      |
| `@veya/image`              | Image source service contract and still-image clips.                               |
| `@veya/svg`                | SVG source service contract and SVG clips.                                         |
| `@veya/svg-resvg`          | Resvg-backed implementation of the SVG source service.                             |
| `@veya/encoder-mediabunny` | Mediabunny-backed implementation of the encoder service.                           |

## Requirements

- Node.js 24 or newer.
- Yarn 4.15.0. The repository declares this through `packageManager`, so
  Corepack can install the matching Yarn release.
- Optional: Nix with `devenv` if you want the checked-in development shell.

## Installation

Clone the repository and install workspace dependencies:

```sh
git clone https://github.com/nmnmcc/Veya.git
cd Veya
corepack enable
yarn install
```

If you use `devenv`, you can enter the project shell first:

```sh
devenv shell
yarn install
```

The root package is private, and the workspace packages do not currently declare
published package versions. Until a release is cut, consume Veya as local
workspace packages or from a package-manager link/workspace setup.

## Usage

This example creates a short composite from a solid-color video clip and a
silent audio clip. Composites require a `Compositor` service at runtime; the
sample support layer in `samples/support.ts` provides a small in-memory
implementation for local examples.

```ts
import { Effect, Stream } from "effect";
import { AudioTrack, Composite, Silence, VideoTrack } from "@veya/core";
import { Color } from "@veya/color";

const size = [1280, 720] as const;
const framerate = 24;
const samplerate = 48000;
const channels = 2;

const program = Effect.gen(function* () {
  const slate = Color.make(Effect.succeed([24, 32, 44, 255] as const), Effect.succeed(framerate * 2), {
    size: Effect.succeed(size),
  });

  const composite = Composite.make({
    video: {
      size: Effect.succeed(size),
      framerate: Effect.succeed(framerate),
      tracks: [VideoTrack.make([slate])],
    },
    audio: {
      samplerate: Effect.succeed(samplerate),
      channels: Effect.succeed(channels),
      tracks: [AudioTrack.make([Silence.make(Effect.succeed(samplerate * 2))])],
    },
  });

  return {
    videoFrames: yield* Stream.runCount(composite.video),
    audioChunks: yield* Stream.runCount(composite.audio),
  };
});
```

Use `@veya/encoder-mediabunny` when you need an `Encoder` implementation for
common containers such as `mp4`, `webm`, `mov`, `mkv`, `mp3`, `wav`, and `ogg`.

## Samples

Executable examples live in `samples/`.

```sh
yarn smoke
```

The smoke script is intended to run every sample. In the current checkout,
`samples/02-combinators.ts` still references a `@veya/modifier` workspace that
is not present in `packages/`, so restore that package or update those
references before relying on the full smoke suite.

You can also run individual samples directly:

```sh
yarn tsx samples/00-basic-composite.ts
yarn tsx samples/01-basic-sequence.ts
yarn tsx samples/03-anchors-and-timing.ts
yarn tsx samples/04-guards-and-inputs.ts
```

## Development

```sh
yarn build        # Build all workspace packages with tsdown.
yarn build:watch  # Rebuild on file changes.
yarn typecheck    # Type-check the project references.
yarn format       # Format the repository with Prettier.
yarn smoke        # Run the executable sample suite.
```

Public packages export TypeScript source in development and use `tsdown` to
produce ESM output and declaration files under `dist/`.

## Project Status

Veya is early-stage. The core abstractions are in place, but some runtime
integrations are still represented as service contracts or sample-only
implementations. Expect package boundaries and APIs to change while the first
release shape settles.

## Support

Open an issue in the GitHub repository:

https://github.com/nmnmcc/Veya/issues

## Contributing

Pull requests are welcome. For larger changes, open an issue first so the API
shape and package boundaries can be discussed before implementation.

Before submitting changes, run the relevant checks:

```sh
yarn format
yarn build
yarn typecheck
```

If your change affects samples, also run the affected sample files or the full
smoke suite once the missing modifier workspace is restored.

## License

No license file is included in this repository yet. Add a license before
publishing or accepting external contributions.
