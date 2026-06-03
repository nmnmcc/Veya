import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { NodeServices } from "@effect/platform-node";
import { registerMediabunnyServer } from "@mediabunny/server";
import { Console, Duration, Effect, FileSystem, Stream } from "effect";
import { QUALITY_HIGH } from "mediabunny";

import { VideoClip, VideoColor, VideoComposite, VideoContext, VideoFrame, VideoTick } from "@veya/core";
import { Mediabunny } from "@veya/mediabunny";

registerMediabunnyServer();

const outputPath = fileURLToPath(new URL("../dist/dvd-veya.mp4", import.meta.url));

const FRAMERATE = 24;
const DEFAULT_DURATION_SECONDS = 10 * 60;
const DURATION_SECONDS = durationSeconds();
const TOTAL_FRAMES = Math.round(FRAMERATE * DURATION_SECONDS);
const WIDTH = 1280;
const HEIGHT = 720;
const SIZE = [WIDTH, HEIGHT] as const;

const CELL_SIZE = 16;
const CELL_RADIUS = 3;
const CELL_INSET = 1;
const GLYPH_COLUMNS = 5;
const GLYPH_ROWS = 7;
const LETTER_GAP_COLUMNS = 1;
const LOGO_PADDING_X = 12;
const LOGO_PADDING_Y = 14;
const UNDERLINE_Y = 136;
const UNDERLINE_HEIGHT = 14;
const LOGO_WIDTH = LOGO_PADDING_X * 2 + (GLYPH_COLUMNS * 4 + LETTER_GAP_COLUMNS * 3) * CELL_SIZE;
const LOGO_HEIGHT = 164;
const START_X = 96;
const START_Y = 72;
const SPEED_X = 318;
const SPEED_Y = 221;

const COLORS = [
  VideoColor.rgba(0x13, 0xc6, 0xa3),
  VideoColor.rgba(0xf4, 0x5d, 0x48),
  VideoColor.rgba(0xff, 0xe1, 0x56),
  VideoColor.rgba(0x5d, 0x9c, 0xec),
  VideoColor.rgba(0xc7, 0x7d, 0xff),
  VideoColor.rgba(0x73, 0xd1, 0x3d),
  VideoColor.rgba(0xff, 0x8f, 0x3d),
] as const satisfies readonly VideoColor.RGBA[];

const GLYPHS = [
  ["10001", "10001", "10001", "01010", "01010", "00100", "00100"],
  ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  ["00100", "01010", "10001", "11111", "10001", "10001", "10001"],
] as const satisfies readonly Glyph[];

type Glyph = readonly [string, string, string, string, string, string, string];

type Position = {
  readonly x: number;
  readonly y: number;
};

type LogoState = Position & {
  readonly color: VideoColor.RGBA;
};

const videoContext = VideoContext.of({
  framerate: FRAMERATE,
  size: SIZE,
  colorSpace: "srgb",
});

const renderBackgroundFrame = (frame: number): VideoFrame => {
  const background = invertColor(logoColorAt(frame));

  return VideoFrame.fn(SIZE, () => background);
};

const renderLogoFrame = (frame: number): VideoFrame => {
  const state = logoStateAt(frame);

  return VideoFrame.fn(SIZE, (x, y) => logoColorAtPosition(state, x, y));
};

const logoColorAtPosition = (state: LogoState, x: number, y: number): VideoColor.RGBA =>
  isLogoPixel(x - state.x, y - state.y) ? state.color : VideoColor.Transparent;

const logoStateAt = (frame: number): LogoState => {
  const color = logoColorAt(frame);

  return {
    ...logoPositionAt(frame),
    color,
  };
};

const logoColorAt = (frame: number): VideoColor.RGBA => {
  const time = frame / FRAMERATE;
  const hits =
    hitCount(time, START_X, SPEED_X, WIDTH - LOGO_WIDTH) + hitCount(time, START_Y, SPEED_Y, HEIGHT - LOGO_HEIGHT);

  return COLORS[hits % COLORS.length] ?? COLORS[0];
};

const logoPositionAt = (frame: number): Position => {
  const time = frame / FRAMERATE;

  return {
    x: bounce(time, START_X, SPEED_X, WIDTH - LOGO_WIDTH),
    y: bounce(time, START_Y, SPEED_Y, HEIGHT - LOGO_HEIGHT),
  };
};

const isLogoPixel = (x: number, y: number): boolean =>
  isWithinLogoBounds(x, y) && (isGlyphPixel(x, y) || isUnderlinePixel(x, y));

const isWithinLogoBounds = (x: number, y: number): boolean => x >= 0 && x < LOGO_WIDTH && y >= 0 && y < LOGO_HEIGHT;

const isGlyphPixel = (x: number, y: number): boolean => {
  const glyphX = x - LOGO_PADDING_X;
  const glyphY = y - LOGO_PADDING_Y;

  if (glyphX < 0 || glyphY < 0 || glyphY >= GLYPH_ROWS * CELL_SIZE) return false;

  return GLYPHS.some((glyph, index) => isGlyphActiveAt(glyph, glyphX - glyphOffset(index), glyphY));
};

const isGlyphActiveAt = (glyph: Glyph, x: number, y: number): boolean => {
  if (x < 0 || y < 0 || x >= GLYPH_COLUMNS * CELL_SIZE || y >= GLYPH_ROWS * CELL_SIZE) return false;

  const cellX = Math.floor(x / CELL_SIZE);
  const cellY = Math.floor(y / CELL_SIZE);
  const row = glyph[cellY];

  return (row?.[cellX] ?? "0") === "1" && isRoundedCellPixel(mod(x, CELL_SIZE), mod(y, CELL_SIZE));
};

const isRoundedCellPixel = (x: number, y: number): boolean => {
  const innerX = x - CELL_INSET;
  const innerY = y - CELL_INSET;
  const size = CELL_SIZE - CELL_INSET * 2;

  if (innerX < 0 || innerY < 0 || innerX >= size || innerY >= size) return false;

  const cornerX = innerX < CELL_RADIUS ? CELL_RADIUS : innerX >= size - CELL_RADIUS ? size - CELL_RADIUS - 1 : innerX;
  const cornerY = innerY < CELL_RADIUS ? CELL_RADIUS : innerY >= size - CELL_RADIUS ? size - CELL_RADIUS - 1 : innerY;
  const dx = innerX - cornerX;
  const dy = innerY - cornerY;

  return dx * dx + dy * dy <= CELL_RADIUS * CELL_RADIUS;
};

const isUnderlinePixel = (x: number, y: number): boolean =>
  x >= LOGO_PADDING_X &&
  x < LOGO_WIDTH - LOGO_PADDING_X &&
  y >= UNDERLINE_Y &&
  y < UNDERLINE_Y + UNDERLINE_HEIGHT &&
  isRoundedRectPixel(x - LOGO_PADDING_X, y - UNDERLINE_Y, LOGO_WIDTH - LOGO_PADDING_X * 2, UNDERLINE_HEIGHT, 6);

const isRoundedRectPixel = (x: number, y: number, width: number, height: number, radius: number): boolean => {
  const cornerX = x < radius ? radius : x >= width - radius ? width - radius - 1 : x;
  const cornerY = y < radius ? radius : y >= height - radius ? height - radius - 1 : y;
  const dx = x - cornerX;
  const dy = y - cornerY;

  return dx * dx + dy * dy <= radius * radius;
};

const glyphOffset = (index: number): number => index * (GLYPH_COLUMNS + LETTER_GAP_COLUMNS) * CELL_SIZE;

const bounce = (time: number, start: number, speed: number, limit: number): number => {
  const period = limit * 2;
  const wrapped = mod(start + speed * time, period);

  return wrapped <= limit ? wrapped : period - wrapped;
};

const hitCount = (time: number, start: number, speed: number, limit: number): number =>
  Math.floor((start + speed * time) / limit);

const invertColor = ([red, green, blue, alpha]: VideoColor.RGBA): VideoColor.RGBA => [
  255 - red,
  255 - green,
  255 - blue,
  alpha,
];

const mod = (value: number, divisor: number): number => ((value % divisor) + divisor) % divisor;

function durationSeconds(): number {
  const value = Number(process.env["VEYA_DVD_DURATION_SECONDS"] ?? DEFAULT_DURATION_SECONDS);

  return Number.isFinite(value) && value > 0 ? value : DEFAULT_DURATION_SECONDS;
}

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const backgroundClip = yield* VideoClip.make((stream: VideoTick.Frames) =>
    stream.pipe(
      Stream.take(TOTAL_FRAMES),
      Stream.mapEffect((frame) => Effect.sync(() => renderBackgroundFrame(frame))),
    ),
  );
  const logoClip = yield* VideoClip.make((stream: VideoTick.Frames) =>
    stream.pipe(
      Stream.take(TOTAL_FRAMES),
      Stream.mapEffect((frame) => Effect.sync(() => renderLogoFrame(frame))),
    ),
  );
  const composite = yield* VideoComposite.make([backgroundClip, logoClip]);
  const encodable = composite(VideoTick.frames());
  const [duration, result] = yield* Mediabunny.encode({
    video: {
      encodable,
      encoding: {
        bitrate: QUALITY_HIGH,
        codec: "avc",
        hardwareAcceleration: "prefer-software",
      },
    },
  }).pipe(Effect.timed);

  yield* fs.makeDirectory(dirname(outputPath), { recursive: true });
  yield* fs.writeFile(outputPath, result.buffer);
  yield* Console.log(`Wrote ${outputPath}, took ${Duration.toSeconds(duration)}s`);
});

Effect.runPromise(
  program.pipe(Effect.provideService(VideoContext, videoContext), Effect.provide(NodeServices.layer)),
).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
