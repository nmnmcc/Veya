import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { NodeServices } from "@effect/platform-node";
import { registerMediabunnyServer } from "@mediabunny/server";
import { Console, Duration, Effect, FileSystem, Stream } from "effect";
import { QUALITY_HIGH } from "mediabunny";

import { VideoClip, VideoColor, VideoContext, VideoTick } from "@veya/core";
import { Mediabunny } from "@veya/mediabunny";

registerMediabunnyServer();

const outputPath = fileURLToPath(new URL("../dist/gradient.mp4", import.meta.url));

const FRAMERATE = 30;
const DURATION = 60;
const WIDTH = 1920;
const HEIGHT = 1080;
const HUE_SPREAD = 60;
const SATURATION = 0.45;
const LIGHTNESS = 0.55;

const TOTAL_FRAMES = FRAMERATE * DURATION;
const ROW_CHANNELS = WIDTH * 4;
const FRAME_CHANNELS = WIDTH * HEIGHT * 4;
const HUE_OFFSETS = Float32Array.from({ length: WIDTH }, (_, x) => (x / (WIDTH - 1) - 0.5) * HUE_SPREAD);

const videoContext = VideoContext.of({
  framerate: FRAMERATE,
  size: [WIDTH, HEIGHT],
  colorSpace: "srgb",
});

const renderGradientFrame = (index: number): VideoClip.Bitmap => {
  const progress = index / TOTAL_FRAMES;
  const baseHue = progress * 360;
  const row = new Uint8ClampedArray(ROW_CHANNELS);

  for (let x = 0; x < WIDTH; x += 1) {
    const [red, green, blue, alpha] = VideoColor.hsl(baseHue + (HUE_OFFSETS[x] ?? 0), SATURATION, LIGHTNESS);
    const offset = x * 4;

    row[offset + 0] = Math.round(red * 255);
    row[offset + 1] = Math.round(green * 255);
    row[offset + 2] = Math.round(blue * 255);
    row[offset + 3] = Math.round(alpha * 255);
  }

  const channels = new Uint8ClampedArray(FRAME_CHANNELS);

  for (let offset = 0; offset < FRAME_CHANNELS; offset += ROW_CHANNELS) {
    channels.set(row, offset);
  }

  return VideoClip.Bitmap.fromChannelsUnsafe(channels);
};

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;

  const clip = yield* VideoClip.make((stream: VideoTick.Frames) =>
    stream.pipe(
      Stream.take(TOTAL_FRAMES),
      Stream.mapEffect((index) =>
        Effect.sync(() => renderGradientFrame(index)).pipe(
          Effect.timed,
          Effect.tap(([duration]) => Effect.log(`Rendered ${index}, took ${Duration.toSeconds(duration)}s`)),
          Effect.map(([, bitmap]) => bitmap),
        ),
      ),
    ),
  );

  const encodable = clip(VideoTick.frames());

  const result = yield* Mediabunny.encode({
    video: {
      encodable,
      encoding: {
        bitrate: QUALITY_HIGH,
        codec: "avc",
        hardwareAcceleration: "prefer-hardware",
      },
    },
  });

  yield* fs.makeDirectory(dirname(outputPath), { recursive: true });
  yield* fs.writeFile(outputPath, result.buffer);
  yield* Console.log(`Wrote ${outputPath}`);
});

Effect.runPromise(
  program.pipe(Effect.provideService(VideoContext, videoContext), Effect.provide(NodeServices.layer)),
).catch(console.error);
