import { Effect, Stream } from "effect";

import { Canvas, type CanvasRenderingContext2D, CanvasRenderingContext } from "@veya/canvas";
import { VideoContext, VideoTick } from "@veya/core";

const countdownDurationSeconds = 7;
const framerate = 24;
const frames = countdownDurationSeconds * framerate;
const backgroundColor = "#050816";
const inactiveColor = "#1b2440";
const activeColor = "#80ff72";

const digits = {
  1: ["010", "110", "010", "010", "010", "010", "111"],
  2: ["111", "001", "001", "111", "100", "100", "111"],
  3: ["111", "001", "001", "111", "001", "001", "111"],
  4: ["101", "101", "101", "111", "001", "001", "001"],
  5: ["111", "100", "100", "111", "001", "001", "111"],
  6: ["111", "100", "100", "111", "101", "101", "111"],
  7: ["111", "001", "001", "001", "001", "001", "001"],
} as const satisfies Record<number, readonly string[]>;

type CountdownDigit = keyof typeof digits;

const countdown = Canvas.make(
  Effect.void,
  (index, state, options) =>
    Effect.gen(function* () {
      const context = yield* CanvasRenderingContext.Context2D;
      const digit = currentDigit(index);

      context.clearRect(0, 0, ...options.size);
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, ...options.size);

      drawDigit(context, digits[digit], options.size);

      return state;
    }),
  frames,
);

const drawDigit = (
  context: CanvasRenderingContext2D,
  glyph: readonly string[],
  [width, height]: readonly [number, number],
) => {
  const rows = glyph.length;
  const columns = glyph[0]?.length ?? 0;
  if (rows === 0 || columns === 0) return;
  const spacing = Math.max(8, Math.floor(Math.min(width, height) * 0.02));
  const cell = Math.max(
    1,
    Math.floor(
      Math.min(
        (width - spacing * (columns - 1)) / columns,
        (height - spacing * (rows - 1)) / rows,
      ) * 0.7,
    ),
  );
  const digitWidth = columns * cell + spacing * (columns - 1);
  const digitHeight = rows * cell + spacing * (rows - 1);
  const originX = Math.floor((width - digitWidth) / 2);
  const originY = Math.floor((height - digitHeight) / 2);

  context.fillStyle = inactiveColor;
  context.fillRect(originX - spacing, originY - spacing, digitWidth + spacing * 2, digitHeight + spacing * 2);

  for (const [row, line] of glyph.entries()) {
    for (const [column, value] of [...line].entries()) {
      context.fillStyle = value === "1" ? activeColor : backgroundColor;
      context.fillRect(originX + column * (cell + spacing), originY + row * (cell + spacing), cell, cell);
    }
  }
};

const currentDigit = (frame: number): CountdownDigit => {
  const elapsedSeconds = Math.floor(frame / framerate);

  return Math.max(1, countdownDurationSeconds - elapsedSeconds) as CountdownDigit;
};

const encodable = countdown(VideoTick.frames()).pipe(
  Stream.provideService(VideoContext, {
    framerate,
    size: [1080, 1920],
  }),
  Stream.provide(CanvasRenderingContext.layer),
);

export default encodable;
