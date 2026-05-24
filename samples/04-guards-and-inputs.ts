import { Data, Effect, Stream } from "effect";
import { AudioTrack, Composite, Encoder, Silence, VideoTrack } from "@veya/core";
import type { RGBA } from "@veya/core";
import { Color } from "@veya/source-color";
import { Svg } from "@veya/source-svg";
import { decodeUtf8, runSample, sampleChannels, sampleFramerate, sampleSamplerate, sampleSize } from "./support";

class SampleInputError extends Data.TaggedError("SampleInputError")<{
  readonly reason: string;
}> {}

const parseHexColor = Effect.fn("parseHexColor")(function* (hex: string): Effect.fn.Return<RGBA, SampleInputError> {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (match === null) {
    return yield* Effect.fail(new SampleInputError({ reason: `expected #rrggbb, got ${hex}` }));
  }

  return [
    Number.parseInt(match[1] ?? "00", 16),
    Number.parseInt(match[2] ?? "00", 16),
    Number.parseInt(match[3] ?? "00", 16),
    255,
  ];
});

const titleCard = `
<svg width="160" height="90" viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg">
  <rect width="160" height="90" fill="#101820"/>
  <circle cx="52" cy="45" r="28" fill="#50c878"/>
  <rect x="82" y="28" width="48" height="34" rx="6" fill="#f2aa4c"/>
</svg>
`;

export const program = Effect.gen(function* () {
  const svg = yield* Svg.make(titleCard, {
    fitTo: { mode: "width", value: 8 },
    background: "#101820",
  });
  const accent = yield* Color.make(yield* parseHexColor("#50c878"), 3, { size: sampleSize });
  const invalidColor = yield* Effect.match(parseHexColor("blue"), {
    onFailure: (error) => `rejected: ${error.reason}`,
    onSuccess: () => "accepted",
  });

  const composite = Composite.make({
    video: {
      framerate: sampleFramerate,
      size: sampleSize,
      tracks: [VideoTrack.make([svg, accent])],
    },
    audio: {
      samplerate: sampleSamplerate,
      channels: sampleChannels,
      tracks: [AudioTrack.make([Silence.make(sampleSamplerate / 8)])],
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
