import { Data, Effect, Stream } from "effect";
import { AudioTrack, Composite, Encoder, Silence, VideoTrack } from "@veya/core";
import type { RGBA } from "@veya/core";
import { Color } from "@veya/color";
import { Svg } from "@veya/svg";
import { decodeUtf8, runSample, sampleChannels, sampleFramerate, sampleSamplerate, sampleSize } from "./support";

class SampleInputError extends Data.TaggedError("SampleInputError")<{
  readonly reason: string;
}> {}

const parseHexColor = (hex: string): Effect.Effect<RGBA, SampleInputError> => {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (match === null) {
    return Effect.fail(new SampleInputError({ reason: `expected #rrggbb, got ${hex}` }));
  }

  return Effect.succeed([
    Number.parseInt(match[1] ?? "00", 16),
    Number.parseInt(match[2] ?? "00", 16),
    Number.parseInt(match[3] ?? "00", 16),
    255,
  ]);
};

const titleCard = `
<svg width="160" height="90" viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg">
  <rect width="160" height="90" fill="#101820"/>
  <circle cx="52" cy="45" r="28" fill="#50c878"/>
  <rect x="82" y="28" width="48" height="34" rx="6" fill="#f2aa4c"/>
</svg>
`;

export const program = Effect.gen(function* () {
  const svg = Svg.make(titleCard, {
    fitTo: Effect.succeed({ mode: "width", value: 8 } as const),
    background: Effect.succeed("#101820"),
  });
  const accent = Color.make(parseHexColor("#50c878"), Effect.succeed(3), { size: Effect.succeed(sampleSize) });
  const invalidColor = yield* Effect.match(parseHexColor("blue"), {
    onFailure: (error) => `rejected: ${error.reason}`,
    onSuccess: () => "accepted",
  });

  const composite = Composite.make({
    video: {
      framerate: Effect.succeed(sampleFramerate),
      size: Effect.succeed(sampleSize),
      tracks: [VideoTrack.make([svg, accent])],
    },
    audio: {
      samplerate: Effect.succeed(sampleSamplerate),
      channels: Effect.succeed(sampleChannels),
      tracks: [AudioTrack.make([Silence.make(Effect.succeed(sampleSamplerate / 8))])],
    },
  });

  const { encode } = yield* Encoder;
  const encoded = encode(composite, {
    container: "json",
    filename: "sample-04.json",
    video: { codec: "mock-rgba" },
    audio: { codec: "mock-f32" },
  });
  const chunks = yield* Stream.runCollect(encoded.data);

  return {
    sample: "guards-and-inputs",
    filename: encoded.filename,
    mimeType: encoded.mimeType,
    invalidColor,
    manifest: JSON.parse(decodeUtf8(chunks)) as unknown,
  };
});

const summary = await runSample(program);
console.log(summary);
