import { Effect, Stream, pipe } from "effect";
import type { AudioClip } from "@veya/core";
import { AudioModifier, VideoModifier } from "@veya/modifier";
import { Color } from "@veya/color";
import { makeTone, mapBitmap, runSample, sampleSize } from "./support";

const warmFade = VideoModifier.chain(
  VideoModifier.make((frame) =>
    Effect.succeed(
      mapBitmap(frame, ([red, green, blue, alpha], x) => [
        Math.min(255, red + x * 8),
        Math.min(255, green + 12),
        blue,
        alpha,
      ]),
    ),
  ),
  VideoModifier.make((frame, { index }) =>
    Effect.succeed(
      mapBitmap(frame, ([red, green, blue, alpha]) => [red, green, blue, Math.max(0, alpha - index * 32)]),
    ),
  ),
);

const halfGain = AudioModifier.make((chunk) =>
  Effect.succeed({
    samplerate: chunk.samplerate,
    channels: chunk.channels.map((channel) => Float32Array.from(channel, (sample) => sample * 0.5)),
  }),
);

export const program = Effect.gen(function* () {
  const base = Color.make(Effect.succeed([36, 78, 132, 255] as const), Effect.succeed(5), {
    size: Effect.succeed(sampleSize),
  });
  const video = pipe(
    base,
    VideoModifier.apply(warmFade, { context: Effect.succeed({ size: sampleSize, framerate: 12 }) }),
  );
  const frames = yield* Stream.runCollect(video);

  const tone: AudioClip.AudioClip = Stream.make(makeTone(1200, 48000, 2, 440));
  const quieterTone = AudioModifier.apply(halfGain, {
    context: Effect.succeed({ samplerate: 48000, channels: 2 }),
  })(tone);
  const chunks = yield* Stream.runCollect(quieterTone);

  return {
    sample: "combinators",
    videoFrames: frames.length,
    firstPixel: frames[0]?.[0]?.[0] ?? null,
    lastPixel: frames.at(-1)?.[0]?.[0] ?? null,
    audioSamples: chunks[0]?.channels[0]?.length ?? 0,
  };
});

const summary = await runSample(program);
console.log(summary);
