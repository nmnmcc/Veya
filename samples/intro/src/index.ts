import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { NodeServices } from "@effect/platform-node";
import { registerMediabunnyServer } from "@mediabunny/server";
import { Console, Duration, Effect, FileSystem, Layer } from "effect";
import { QUALITY_HIGH } from "mediabunny";
import * as PImage from "pureimage";

import { Canvas, CanvasRenderingContext, type CanvasRenderingContext2D } from "@veya/canvas";
import { VideoClip, VideoContext, VideoTick } from "@veya/core";
import { Mediabunny } from "@veya/mediabunny";

registerMediabunnyServer();

const outputPath = fileURLToPath(new URL("../dist/intro.mp4", import.meta.url));

const FRAMERATE = 24;
const DURATION_SECONDS = 8;
const TOTAL_FRAMES = FRAMERATE * DURATION_SECONDS;
const WIDTH = 1280;
const HEIGHT = 720;
const FONT_FAMILY = "VeyaSans";

const videoContext = VideoContext.of({
  framerate: FRAMERATE,
  size: [WIDTH, HEIGHT],
  colorSpace: "srgb",
});

const fontPath = findFontPath();

if (fontPath === undefined) {
  throw new Error("Could not find a TrueType font for PureImage text rendering.");
}

PImage.registerFont(fontPath, FONT_FAMILY).loadSync();

interface PureImageBitmap {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array | Uint8ClampedArray;
  readonly getContext: (type: "2d") => unknown;
}

const pureImageCanvasLayer = Layer.sync(CanvasRenderingContext, () => {
  const bitmaps = new WeakMap<object, PureImageBitmap>();

  return CanvasRenderingContext.of({
    make: ([width, height]) =>
      Effect.sync(() => {
        const bitmap = PImage.make(width, height) as PureImageBitmap;
        const context = bitmap.getContext("2d") as object;

        bitmaps.set(context, bitmap);

        return context as CanvasRenderingContext2D;
      }),
    snapshot: (context) => {
      const bitmap = bitmaps.get(context as object);

      if (bitmap === undefined) {
        throw new Error("PureImage context was not created by this sample.");
      }

      return VideoClip.Bitmap.fromChannelsUnsafe(bitmap.data);
    },
  });
});

const clip = Canvas.make<number, Record<string, never>>(
  Effect.succeed({}),
  (frame, state) =>
    Effect.gen(function* () {
      const context = yield* CanvasRenderingContext.Context2D;
      const ctx = context as CanvasRenderingContext2D;
      const t = frame / (TOTAL_FRAMES - 1);
      const pulse = 0.5 + Math.sin(t * Math.PI * 2) * 0.5;
      const orbit = easeInOut(Math.min(1, t * 1.25));
      const reveal = easeOut(Math.min(1, (t - 0.12) / 0.5));

      clear(ctx);
      drawBackground(ctx, t);
      drawOrbit(ctx, orbit, pulse);
      drawTitle(ctx, reveal);
      drawPackageMap(ctx, easeOut(Math.min(1, (t - 0.28) / 0.42)));
      drawTimeline(ctx, easeOut(Math.min(1, (t - 0.52) / 0.34)));

      return state;
    }),
  TOTAL_FRAMES,
);

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const intro = yield* clip;
  const encodable = intro(VideoTick.frames());
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

const clear = (ctx: CanvasRenderingContext2D): void => {
  ctx.fillStyle = "#fbfbf8";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
};

const drawBackground = (ctx: CanvasRenderingContext2D, t: number): void => {
  ctx.fillStyle = "#fbfbf8";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 15; i += 1) {
    const x = ((i * 173 + t * 70) % (WIDTH + 140)) - 70;
    const y = 94 + ((i * 83) % 560);
    const radius = 14 + (i % 4) * 6;

    ctx.globalAlpha = 0.11;
    ctx.fillStyle = i % 3 === 0 ? "#136f63" : i % 3 === 1 ? "#f3a712" : "#2f4858";
    circle(ctx, x, y, radius);
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#171717";
  ctx.fillRect(0, 0, WIDTH, 18);
  ctx.fillStyle = "#136f63";
  ctx.fillRect(0, HEIGHT - 18, WIDTH * (0.25 + t * 0.75), 18);
};

const drawOrbit = (ctx: CanvasRenderingContext2D, progress: number, pulse: number): void => {
  const centerX = 250;
  const centerY = 318;
  const radius = 126;
  const angle = progress * Math.PI * 2 - Math.PI / 2;
  const dotX = centerX + Math.cos(angle) * radius;
  const dotY = centerY + Math.sin(angle) * radius;

  ctx.strokeStyle = "#d8d8d2";
  ctx.lineWidth = 7;
  strokeArc(ctx, centerX, centerY, radius, 0, Math.PI * 2, 80);

  if (progress > 0.001) {
    ctx.strokeStyle = "#136f63";
    ctx.lineWidth = 10;
    strokeArc(ctx, centerX, centerY, radius, -Math.PI / 2, angle, Math.max(2, Math.ceil(80 * progress)));
  }

  ctx.fillStyle = "#171717";
  circle(ctx, centerX, centerY, 72 + pulse * 3);
  ctx.fillStyle = "#fbfbf8";
  ctx.fillRect(centerX - 40, centerY - 6, 80, 12);
  ctx.fillRect(centerX - 6, centerY - 40, 12, 80);

  ctx.fillStyle = "#f3a712";
  circle(ctx, dotX, dotY, 17);
};

const drawTitle = (ctx: CanvasRenderingContext2D, reveal: number): void => {
  const x = 430;
  const y = 150;

  ctx.globalAlpha = reveal;
  text(ctx, "Veya", x, y, 86, "#171717");
  text(ctx, "Programmable video creation for TypeScript", x, y + 70, 30, "#2f4858");

  ctx.fillStyle = "#136f63";
  ctx.fillRect(x, y + 105, 560 * reveal, 8);

  const lines = [
    "Compose clips, tracks, gaps, audio, images, SVG, video and Canvas.",
    "Keep rendering as code: typed, repeatable, scriptable.",
    "Encode the final result through the Mediabunny backend.",
  ];

  for (let i = 0; i < lines.length; i += 1) {
    text(ctx, lines[i] ?? "", x, y + 158 + i * 38, 24, "#343434");
  }

  ctx.globalAlpha = 1;
};

const drawPackageMap = (ctx: CanvasRenderingContext2D, reveal: number): void => {
  const packages = [
    ["core", "#171717", 17],
    ["canvas", "#136f63", 16],
    ["video", "#2f4858", 17],
    ["audio", "#8a4f14", 17],
    ["svg", "#7d5fff", 17],
    ["mediabunny", "#c2410c", 14],
  ] as const;
  const x = 128;
  const y = 500;
  const cardWidth = 154;
  const cardHeight = 66;
  const gap = 16;
  const trunkStart = x + cardWidth / 2;
  const trunkEnd = x + (packages.length - 1) * (cardWidth + gap) + cardWidth / 2;
  const trunkY = y - 42;

  for (let i = 0; i < packages.length; i += 1) {
    const [name, color, fontSize] = packages[i] ?? packages[0];
    const localReveal = clamp((reveal - i * 0.08) / 0.56);
    const cardX = x + i * (cardWidth + gap);

    ctx.globalAlpha = localReveal;
    ctx.fillStyle = "#ffffff";
    roundedRect(ctx, cardX, y, cardWidth, cardHeight, 8);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    roundedStroke(ctx, cardX, y, cardWidth, cardHeight, 8);
    text(ctx, `@veya/${name}`, cardX + 13, y + 41, fontSize, color);
  }

  ctx.globalAlpha = reveal;
  ctx.strokeStyle = "#b9bbb4";
  ctx.lineWidth = 3;
  line(ctx, trunkStart, trunkY, trunkEnd, trunkY);

  for (let i = 0; i < packages.length; i += 1) {
    const branchX = x + i * (cardWidth + gap) + cardWidth / 2;

    line(ctx, branchX, trunkY, branchX, y);
  }

  ctx.globalAlpha = 1;
};

const drawTimeline = (ctx: CanvasRenderingContext2D, reveal: number): void => {
  const x = 430;
  const y = 642;
  const width = 640;
  const steps = ["describe", "compose", "render", "encode"];

  ctx.globalAlpha = reveal;
  ctx.strokeStyle = "#171717";
  ctx.lineWidth = 5;
  line(ctx, x, y, x + width * reveal, y);

  for (let i = 0; i < steps.length; i += 1) {
    const stepX = x + (width / (steps.length - 1)) * i;
    const active = reveal >= i / steps.length;

    ctx.fillStyle = active ? "#f3a712" : "#d8d8d2";
    circle(ctx, stepX, y, 13);
    text(ctx, steps[i] ?? "", stepX - 40, y + 42, 18, "#343434");
  }

  ctx.globalAlpha = 1;
};

const text = (
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
): void => {
  ctx.fillStyle = color;
  ctx.font = `${size}px ${FONT_FAMILY}`;
  ctx.fillText(value, x, y);
};

const circle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void => {
  const segments = Math.max(12, Math.ceil(radius * 0.9));

  ctx.beginPath();
  ctx.moveTo(x + radius, y);

  for (let i = 1; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;

    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }

  ctx.closePath();
  ctx.fill();
};

const line = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void => {
  if (x1 === x2 && y1 === y2) return;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

const strokeArc = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  start: number,
  end: number,
  segments: number,
): void => {
  const span = end - start;

  if (Math.abs(span) < 0.001) return;

  ctx.beginPath();
  ctx.moveTo(x + Math.cos(start) * radius, y + Math.sin(start) * radius);

  for (let i = 1; i <= segments; i += 1) {
    const angle = start + (span * i) / segments;

    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }

  ctx.stroke();
};

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  roundedPath(ctx, x, y, width, height, radius);
  ctx.fill();
};

const roundedStroke = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  roundedPath(ctx, x, y, width, height, radius);
  ctx.stroke();
};

const roundedPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const easeOut = (value: number): number => 1 - Math.pow(1 - clamp(value), 3);

const easeInOut = (value: number): number =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

function findFontPath(): string | undefined {
  const candidates = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    "/Library/Fonts/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "C:\\Windows\\Fonts\\arial.ttf",
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  try {
    const matched = execFileSync("fc-match", ["-f", "%{file}", "DejaVu Sans"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    return matched.length > 0 && existsSync(matched) ? matched : undefined;
  } catch {
    return undefined;
  }
}

Effect.runPromise(
  program.pipe(
    Effect.provideService(VideoContext, videoContext),
    Effect.provide(pureImageCanvasLayer),
    Effect.provide(NodeServices.layer),
  ),
).catch(console.error);
