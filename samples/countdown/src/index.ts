import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { NodeServices } from "@effect/platform-node";
import { registerMediabunnyServer } from "@mediabunny/server";
import { Console, Effect, FileSystem, Stream } from "effect";
import { QUALITY_HIGH } from "mediabunny";

import { VideoClip, VideoContext, VideoTick, VideoTrack } from "@veya/core";
import { MediabunnyVideoEncoder } from "@veya/mediabunny";

import { type Digit, digits } from "./digits";

registerMediabunnyServer();

const outputPath = fileURLToPath(new URL("../dist/countdown.mp4", import.meta.url));
const videoContext: VideoContext.VideoContext = {
  framerate: 1,
  size: [640, 360],
};

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;

  const encodable = yield* VideoClip.toEncodable(VideoTick.frames(), makeCountdownTrack()).pipe(
    Effect.provideService(VideoContext, videoContext),
  );
  const result = yield* MediabunnyVideoEncoder.encode(encodable, {
    encoding: {
      alpha: "keep",
      bitrate: QUALITY_HIGH,
      codec: "av1",
      hardwareAcceleration: "prefer-software",
      keyFrameInterval: 2,
    },
  });

  yield* fs.makeDirectory(dirname(outputPath), { recursive: true });
  yield* fs.writeFile(outputPath, result.buffer);
  yield* Console.log(`Wrote ${outputPath}`);
});

const makeCountdownTrack = () => VideoTrack.make([...digits].reverse().map(makeDigitClip));

const makeDigitClip = (digit: Digit) =>
  VideoClip.make(() =>
    Stream.unwrap(
      Effect.gen(function* () {
        const { framerate, size } = yield* VideoContext;
        const frameCount = Math.max(1, Math.round(framerate));
        const bitmap = renderDigit(digit, size);

        return Stream.make(bitmap).pipe(Stream.forever, Stream.take(frameCount));
      }),
    ),
  );

const renderDigit = (digit: Digit, [width, height]: readonly [width: number, height: number]): VideoClip.Bitmap => {
  const cellSize = Math.max(1, Math.floor(Math.min(width / 5, height / 9)));
  const digitWidth = digit[0].length * cellSize;
  const digitHeight = digit.length * cellSize;
  const left = Math.floor((width - digitWidth) / 2);
  const top = Math.floor((height - digitHeight) / 2);
  const inset = Math.max(2, Math.floor(cellSize * 0.12));

  return globalThis.Array.from({ length: height }, (_, y) =>
    globalThis.Array.from({ length: width }, (_, x): VideoClip.RGBA => {
      const cellX = x - left;
      const cellY = y - top;
      const column = Math.floor(cellX / cellSize);
      const row = Math.floor(cellY / cellSize);
      const rowPattern = digit[row];
      const inGlyph =
        rowPattern?.[column] === 1 &&
        cellX % cellSize >= inset &&
        cellX % cellSize < cellSize - inset &&
        cellY % cellSize >= inset &&
        cellY % cellSize < cellSize - inset;

      return inGlyph ? [248, 250, 252, 1] : [10, 14, 20, 1];
    }),
  );
};

Effect.runPromise(program.pipe(Effect.provide(NodeServices.layer))).catch(console.error);
